import {
  faArrowLeft,
  faEdit,
  faSearch,
  faTrashAlt
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  NavigationProp,
  useFocusEffect,
  useNavigation
} from '@react-navigation/native';
import axios, { isAxiosError } from 'axios';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';

// Definindo as cores do tema
const COLORS = {
  primary: '#0E2A5C', 
  secondary: '#FDCB01', 
  white: '#FFFFFF',
  textPrimary: '#333333', 
  textSecondary: '#555555', 
  danger: '#DC3545', 
  background: '#F0F2F5', 
  cardBackground: '#FFFFFF',
  borderColor: '#E0E0E0',
  headerColor: '#1c348e', 
};

const STATUS_BAR_HEIGHT = Platform.OS === 'android' ? StatusBar.currentHeight || 20 : 0;
const HEADER_HEIGHT = Platform.OS === 'web' ? 70 : 60 + STATUS_BAR_HEIGHT; 

const API_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

// Opções disponíveis para as roles dos funcionários
const ROLES_OPTIONS = [
  { label: 'Técnico', value: 'TECNICO' },
  { label: 'Supervisor', value: 'SUPERVISOR' },
  { label: 'Coordenador', value: 'COORDENADOR' },
];

type Funcionarios = {
  id: number;
  cpf: string;
  nome: string;
  email: string;
  dataNascimento: string;
  telefone: string;
  roles: string;
  uniqueId: string;
};

// Tipagem correta para a navegação
type RootStackParamList = {
    ListaFuncionarios: undefined;
    // Adicione outras telas se houver links de navegação para elas
};
type ListaFuncionariosNavigationProp = NavigationProp<RootStackParamList, 'ListaFuncionarios'>;


const ListaFuncionarios = () => {
  const navigation = useNavigation<ListaFuncionariosNavigationProp>();
  const flatListRef = useRef<FlatList<Funcionarios>>(null);
  const modalScrollViewRef = useRef<ScrollView>(null);
  const [funcionario, setFuncionario] = useState<Funcionarios[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [selectedFuncionario, setSelectedFuncionario] = useState<Funcionarios | null>(null);
  const [editForm, setEditForm] = useState<Partial<Funcionarios>>({});
  const [editLoading, setEditLoading] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [openRolesPicker, setOpenRolesPicker] = useState<boolean>(false); 
  const [focusIndex, setFocusIndex] = useState<number>(-1);

  // --- REFACTOR 1: Usa useMemo para Filtragem Otimizada ---
  const filteredData = useMemo(() => {
    if (!searchTerm) {
      return funcionario;
    }
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    return funcionario.filter((func: Funcionarios) =>
      func.nome.toLowerCase().includes(lowerCaseSearchTerm)
    );
  }, [funcionario, searchTerm]);

  // Função para buscar funcionário na API
  const fetchFuncionarios = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('jwtToken');
      const response = await axios.get<Funcionarios[]>(`${API_URL}/api/funcionarios/listarfuncionarios`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFuncionario(response.data);
      setFocusIndex(0);
    } catch (error) {
      console.error('Erro ao carregar lista de funcionários:', error);
      if (Platform.OS === 'web') {
        window.alert('Não foi possível carregar a lista de contatos.');
      } else {
        Alert.alert('Erro', 'Não foi possível carregar a lista de contatos.');
      }
      setFuncionario([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchFuncionarios();
    }, [])
  );

  // Manipulador para atualização da lista (pull-to-refresh)
  const handleRefresh = () => {
    setRefreshing(true);
    fetchFuncionarios();
  };


  const handleEditAtleta = (funcionario: Funcionarios) => {
    setSelectedFuncionario(funcionario);
    const dataNascimentoFormatada = funcionario.dataNascimento?.split('T')[0] || funcionario.dataNascimento;
    
    setEditForm({
      nome: funcionario.nome,
      email: funcionario.email,
      dataNascimento: dataNascimentoFormatada,
      cpf: funcionario.cpf,
      telefone: funcionario.telefone,
      roles: funcionario.roles,
    });
    setOpenRolesPicker(false);
    setModalVisible(true);
  };

  // Manipulador para salvar as edições
  const handleSaveEdit = async () => {
    if (!selectedFuncionario || !editForm.nome || !editForm.roles) {
      if (Platform.OS === 'web') {
        window.alert('Nome e tipo (roles) são obrigatórios.');
      } else {
        Alert.alert('Erro', 'Nome e tipo (roles) são obrigatórios.');
      }
      return;
    }

    try {
      setEditLoading(true);
      const token = await AsyncStorage.getItem('jwtToken');
      
      const url = `${API_URL}/api/funcionarios/${selectedFuncionario.id}`;

      const updateDTO = {
        ...editForm,
        id: selectedFuncionario.id,
        roles: editForm.roles,
        dataNascimento: editForm.dataNascimento?.split('T')[0] || editForm.dataNascimento,
      };
      
      await axios.put(url, updateDTO, {
        headers: { Authorization: `Bearer ${token}` },
      });

      await fetchFuncionarios();

      if (Platform.OS === 'web') {
        window.alert('Perfil do funcionário atualizado com sucesso!');
      } else {
        Alert.alert('Sucesso', 'Perfil do funcionário atualizado com sucesso!');
      }
      setOpenRolesPicker(false);
      setModalVisible(false);
    } catch (error) {
        console.error('Erro ao salvar edições:', error);
        let errorMessage = 'Não foi possível atualizar o perfil do funcionário.';
        if (isAxiosError(error) && error.response?.data?.message) {
            errorMessage = error.response.data.message;
        }
        if (Platform.OS === 'web') {
          window.alert(errorMessage);
        } else {
          Alert.alert('Erro', errorMessage);
        }
    } finally {
      setEditLoading(false);
    }
  };

  // Manipulador para excluir
  const handleDelete = (funcionarioId: number, funcionarioRole: string) => {
    const executeDelete = async () => {
      try {
        const token = await AsyncStorage.getItem('jwtToken');
        const url = `${API_URL}/api/funcionarios/${funcionarioId}`;
        
        await axios.delete(url, {
          headers: { Authorization: `Bearer ${token}` },
          params: { roles: funcionarioRole }
        });

        await fetchFuncionarios();

        if (Platform.OS === 'web') {
          window.alert('Funcionário excluído com sucesso!');
        } else {
          Alert.alert('Sucesso', 'Funcionário excluído com sucesso!');
        }
      } catch (error) {
        console.error('Erro ao excluir funcionário:', error);
        let errorMessage = 'Não foi possível excluir o funcionário.';
        if (isAxiosError(error) && error.response?.data?.message) {
          errorMessage = error.response.data.message;
        }
        if (Platform.OS === 'web') {
          window.alert(errorMessage);
        } else {
          Alert.alert('Erro', errorMessage);
        }
      }
    };

    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Tem certeza que deseja excluir este funcionário? Esta ação não pode ser desfeita.');
      if (confirmed) {
        executeDelete();
      }
    } else {
      Alert.alert(
        'Confirmar Exclusão',
        'Tem certeza que deseja excluir este funcionário? Esta ação não pode ser desfeita.',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Excluir',
            onPress: executeDelete,
            style: 'destructive',
          },
        ]
      );
    }
  };


  // --- REFACTOR 2: Implementação da Navegação por Teclado na Web (Aprimorada) ---
  const scrollItemToView = useCallback((index: number) => {
    if (flatListRef.current) {
      flatListRef.current.scrollToIndex({ index, animated: true, viewPosition: 0.5 });
    }
  }, []);

  useEffect(() => {
    if (Platform.OS === 'web' && focusIndex >= 0) {
      scrollItemToView(focusIndex);
    }
  }, [focusIndex, scrollItemToView]);

  useEffect(() => {
    if (Platform.OS === 'web') {
      const handleKeyDown = (event: KeyboardEvent) => {
        if (modalVisible) {
          if (event.key === 'Escape') {
            setOpenRolesPicker(false);
            setModalVisible(false);
          }
          return; 
        }

        const listLength = filteredData.length;
        if (listLength === 0) return;

        let newIndex = focusIndex;

        switch (event.key) {
          case 'ArrowDown':
            event.preventDefault();
            newIndex = Math.min(focusIndex + 1, listLength - 1);
            break;
          case 'ArrowUp':
            event.preventDefault();
            newIndex = Math.max(focusIndex - 1, 0);
            break;
          case 'Enter':
            if (focusIndex >= 0 && focusIndex < listLength) {
              event.preventDefault();
              handleEditAtleta(filteredData[focusIndex]);
            }
            return;
          default:
            return;
        }

        setFocusIndex(newIndex);
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [modalVisible, focusIndex, filteredData]);
  // --- FIM REFACTOR 2 ---


  // Função para renderizar cada item da lista
  const renderFuncionarioItem = ({ item, index }: { item: Funcionarios, index: number }) => {
    const isFocused = Platform.OS === 'web' && focusIndex === index;
    
    return (
      <TouchableOpacity 
        style={[styles.atletaCard, isFocused && styles.atletaCardFocused]} 
        onPress={() => {
          setFocusIndex(index);
          handleEditAtleta(item);
        }}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={`Funcionário ${item.nome}, Cargo ${item.roles}. Pressione para editar.`}
      >
        <View style={styles.atletaInfo}>
          <Text style={styles.atletaName} numberOfLines={1} ellipsizeMode="tail">{item.nome}</Text>
          <Text style={styles.atletaDetail}>Cargo: {item.roles ? item.roles : 'Não informado'}</Text>
          <Text style={styles.atletaDetail}>Email: {item.email}</Text>
          <Text style={styles.atletaDetail}>Tel: {item.telefone}</Text>
        </View>
        <View style={styles.atletaActions}>
          <TouchableOpacity 
            onPress={() => handleEditAtleta(item)}
            style={styles.editButton}
            accessibilityLabel={`Editar ${item.nome}`}
          >
            <FontAwesomeIcon icon={faEdit} size={20} color={COLORS.primary} />
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => handleDelete(item.id, item.roles)} 
            style={styles.deleteButton}
            accessibilityLabel={`Excluir ${item.nome}`}
          >
            <FontAwesomeIcon icon={faTrashAlt} size={20} color={COLORS.danger} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };
  
  if (loading && funcionario.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={{ color: COLORS.textPrimary }}>Carregando...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header Fixo (Responsivo) */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()} 
          style={styles.btnVoltar}
          accessibilityLabel="Voltar"
        >
          <FontAwesomeIcon icon={faArrowLeft} size={20} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Funcionários</Text>
      </View>

      {/* Conteúdo Principal (Compensa o header fixo) */}
      <View style={styles.contentWrapper}>
        
        {/* Campo de busca */}
        <View style={styles.searchContainer}>
          <FontAwesomeIcon icon={faSearch} size={20} color={COLORS.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar funcionário por nome..." 
            placeholderTextColor={COLORS.textSecondary}
            value={searchTerm}
            onChangeText={(text) => {
              setSearchTerm(text);
              setFocusIndex(0);
            }} 
            accessibilityRole="search"
          />
        </View>

        {/* Exibição da lista */}
        {filteredData.length === 0 ? (
          <View style={styles.emptyListContainer}>
            <Text style={styles.emptyListText}>
              {searchTerm ? 'Nenhum funcionário encontrado com este nome.' : 'Nenhum funcionário encontrado.'}
            </Text>
            {!searchTerm && (
                <TouchableOpacity style={styles.reloadButton} onPress={handleRefresh}>
                    <Text style={styles.reloadButtonText}>Recarregar</Text>
                </TouchableOpacity>
            )}
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={filteredData}
            keyExtractor={(item) => item.uniqueId}
            renderItem={renderFuncionarioItem}
            contentContainerStyle={styles.listContent}
            onRefresh={handleRefresh}
            refreshing={refreshing}
            showsVerticalScrollIndicator={Platform.OS === 'web'}
            scrollEnabled={true}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled={Platform.OS === 'web'}
            bounces={Platform.OS !== 'web'}
            initialNumToRender={15} // Otimização de performance
          />
        )}
      </View>

      {/* Modal de Edição */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setOpenRolesPicker(false);
          setModalVisible(false);
        }}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>Editar Funcionário</Text>
            {selectedFuncionario && (
              <ScrollView 
                ref={modalScrollViewRef}
                style={styles.modalScrollView}
                showsVerticalScrollIndicator={Platform.OS === 'web'}
                keyboardShouldPersistTaps="handled"
                nestedScrollEnabled={Platform.OS === 'web'}
                bounces={Platform.OS !== 'web'}
              >
                <Text style={styles.inputLabel}>Nome:</Text>
                <TextInput
                  style={styles.input}
                  value={editForm.nome}
                  onChangeText={(text) => setEditForm({ ...editForm, nome: text })}
                  placeholder="Nome completo"
                  placeholderTextColor={COLORS.textSecondary}
                />
                
                <Text style={styles.inputLabel}>Email:</Text>
                <TextInput
                  style={styles.input}
                  value={editForm.email}
                  onChangeText={(text) => setEditForm({ ...editForm, email: text })}
                  placeholder="email@example.com"
                  placeholderTextColor={COLORS.textSecondary}
                  keyboardType="email-address"
                />
                <Text style={styles.inputLabel}>Data de Nascimento (AAAA-MM-DD):</Text>
                <TextInput
                  style={styles.input}
                  value={editForm.dataNascimento}
                  onChangeText={(text) => setEditForm({ ...editForm, dataNascimento: text })}
                  placeholder="AAAA-MM-DD"
                  placeholderTextColor={COLORS.textSecondary}
                  keyboardType="numeric"
                />
                <Text style={styles.inputLabel}>CPF:</Text>
                <TextInput
                  style={styles.input}
                  value={editForm.cpf}
                  onChangeText={(text) => setEditForm({ ...editForm, cpf: text })}
                  placeholder="000.000.000-00"
                  placeholderTextColor={COLORS.textSecondary}
                  keyboardType="numeric"
                />
                <Text style={styles.inputLabel}>Telefone:</Text>
                <TextInput
                  style={styles.input}
                  value={editForm.telefone}
                  onChangeText={(text) => setEditForm({ ...editForm, telefone: text })}
                  placeholder="(XX) XXXXX-XXXX"
                  placeholderTextColor={COLORS.textSecondary}
                  keyboardType="numeric"
                />

                <Text style={styles.inputLabel}>Tipo:</Text>
                <View style={styles.dropdownContainer}>
                  <DropDownPicker
                    open={openRolesPicker}
                    value={editForm.roles ?? null}
                    items={ROLES_OPTIONS}
                    setOpen={setOpenRolesPicker}
                    setValue={(callback) => {
                      const value = typeof callback === 'function' ? callback(editForm.roles ?? null) : callback;
                      setEditForm({ ...editForm, roles: value });
                    }}
                    placeholder="Selecione o tipo de funcionário"
                    style={styles.dropdown}
                    dropDownContainerStyle={styles.dropdownList}
                    textStyle={styles.dropdownText}
                    placeholderStyle={styles.dropdownPlaceholder}
                    zIndex={3000} 
                    listMode="SCROLLVIEW"
                    scrollViewProps={{ nestedScrollEnabled: true }}
                  />
                </View>

              </ScrollView>
            )}
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.buttonClose]}
                onPress={() => {
                  setOpenRolesPicker(false);
                  setModalVisible(false);
                }}
                accessibilityLabel="Cancelar edição"
              >
                <Text style={styles.textStyle}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.buttonSave]}
                onPress={handleSaveEdit}
                disabled={editLoading}
                accessibilityLabel="Salvar alterações"
              >
                {editLoading ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <Text style={styles.textStyle}>Salvar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// --- REFACTOR 3: Estilos Otimizados para Responsividade ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: COLORS.headerColor,
    paddingHorizontal: 10,
    minHeight: HEADER_HEIGHT, 
    ...Platform.select({
      web: {
        position: 'fixed',
        top: 0,
        width: '100%',
        zIndex: 10,
        paddingTop: 15, // Padrão Web
      },
      default: { 
        paddingTop: STATUS_BAR_HEIGHT + 12,
      },
    }),
  },
  btnVoltar: {
    position: 'absolute',
    left: 10,
    top: Platform.select({
      web: 15,
      default: STATUS_BAR_HEIGHT + 10,
    }),
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 11,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.white,
    textAlign: 'center',
  },
  contentWrapper: {
    flex: 1,
    paddingHorizontal: 10,
    // Compensação da altura do header fixo para Web e Mobile
    marginTop: Platform.OS === 'web' ? HEADER_HEIGHT : 0, 
    width: '100%',
    maxWidth: 1200, 
    alignSelf: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  emptyListContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyListText: {
    fontSize: 18,
    color: COLORS.textSecondary,
    marginBottom: 15,
    textAlign: 'center',
  },
  reloadButton: {
      backgroundColor: COLORS.primary,
      padding: 10,
      borderRadius: 8,
  },
  reloadButtonText: {
      color: COLORS.white,
      fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBackground,
    borderRadius: 8,
    marginTop: 10,
    marginBottom: 10,
    paddingHorizontal: 10,
    shadowColor: COLORS.textPrimary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 8,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
    color: COLORS.textPrimary,
    ...(Platform.OS === 'web' && { outline: 'none' as any }),
  },
  listContent: {
    paddingBottom: 20, 
  },
  atletaCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.cardBackground,
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    shadowColor: COLORS.textPrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
    alignItems: 'center',
    justifyContent: 'space-between',
    borderLeftWidth: 5,
    borderLeftColor: COLORS.primary, 
  },
  atletaCardFocused: {
    borderColor: COLORS.secondary,
    borderWidth: 1,
    borderLeftWidth: 5, 
    shadowOpacity: 0.3,
    elevation: 6,
  },
  atletaInfo: {
    flex: 1,
    marginRight: 10, 
    overflow: 'hidden',
  },
  atletaActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
  },
  atletaName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary, 
    marginBottom: 5,
  },
  atletaDetail: {
    fontSize: 14,
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  editButton: {
      padding: 8,
  },
  deleteButton: {
    padding: 8,
    backgroundColor: "transparent",
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)', 
    ...Platform.select({ web: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, overflowY: 'auto' } }),
  },
  modalView: {
    margin: 20,
    backgroundColor: COLORS.white,
    borderRadius: 15, 
    padding: 25,
    alignItems: 'center',
    shadowColor: COLORS.textPrimary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
    width: '90%',
    maxWidth: 600,
    maxHeight: '90%', 
    minHeight: 300,
    zIndex: 20,
    ...Platform.select({ web: { marginVertical: 40 } }),
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: COLORS.primary,
  },
  modalScrollView: {
    width: '100%',
    paddingHorizontal: 5,
    ...Platform.select({ web: { maxHeight: 400, overflowY: 'auto' } }),
  },
  inputLabel: {
    alignSelf: 'flex-start',
    marginBottom: 5,
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.textPrimary,
  },
  input: {
    width: '100%',
    height: 45, 
    borderColor: COLORS.borderColor,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 15,
    fontSize: 16,
    color: COLORS.textPrimary,
    ...(Platform.OS === 'web' && { outline: 'none' as any }),
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 25, 
  },
  button: {
    borderRadius: 10,
    paddingVertical: 12, 
    elevation: 2,
    flex: 1,
    marginHorizontal: 8, 
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({ web: { cursor: 'pointer' } }),
  },
  buttonClose: {
    backgroundColor: COLORS.textSecondary, 
  },
  buttonSave: {
    backgroundColor: COLORS.primary, 
  },
  textStyle: {
    color: COLORS.white,
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 16,
  },
  dropdownContainer: {
    width: '100%',
    marginBottom: 15,
    // ZIndex alto para garantir que o dropdown do Picker apareça sobre outros campos no modal
    zIndex: 3000, 
  },
  dropdown: {
    borderColor: COLORS.borderColor,
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: COLORS.white,
    minHeight: 45,
    ...(Platform.OS === 'web' && { outline: 'none' as any }),
  },
  dropdownList: {
    borderColor: COLORS.borderColor,
    backgroundColor: COLORS.white,
    borderRadius: 8,
    maxHeight: 150,
  },
  dropdownText: {
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  dropdownPlaceholder: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
});

export default ListaFuncionarios;