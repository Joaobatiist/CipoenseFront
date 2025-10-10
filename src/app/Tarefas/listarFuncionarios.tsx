import { faArrowLeft, faSearch, faTrashAlt } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import axios from 'axios';
import React, { useCallback, useEffect, useRef, useState } from 'react';

import {
  ActivityIndicator,
  Alert,
  Button,
  FlatList,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';

// Definindo as cores do tema com base no logo da Cipoense
const COLORS = {
  primary: '#0E2A5C', // Azul Escuro (base do escudo)
  secondary: '#FDCB01', // Amarelo Ouro (destaques)
  white: '#FFFFFF',
  textPrimary: '#333333', // Texto principal
  textSecondary: '#555555', // Texto secundário
  success: '#28a745', // Verde para sucesso
  danger: '#DC3545', // Vermelho para perigo/excluir
  info: '#007BFF', // Azul para ações informativas/botões
  background: '#F0F2F5', // Um cinza claro para o fundo geral
  cardBackground: '#FFFFFF',
  borderColor: '#E0E0E0', // Cor de borda leve
  // Adicionando um tom de azul para bordas/separadores se necessário
  blueBorder: '#1E4E8A', 
};

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

const ListaFuncionarios = () => {
  const navigation = useNavigation();
  const flatListRef = useRef<FlatList>(null);
  const modalScrollViewRef = useRef<ScrollView>(null);
  const [funcionario, setFuncionario] = useState<Funcionarios[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [selectedFuncionario, setSelectedFuncionario] = useState<Funcionarios | null>(null);
  const [editForm, setEditForm] = useState<Partial<Funcionarios>>({
  });
  const [editLoading, setEditLoading] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>(''); // Novo estado para o termo de busca
  const [openRolesPicker, setOpenRolesPicker] = useState<boolean>(false); // Estado para o dropdown de roles

  // Implementar navegação por teclado para web
  useEffect(() => {
    if (Platform.OS === 'web') {
      let currentScrollPosition = 0;
      let modalScrollPosition = 0;

      const handleKeyDown = (event: KeyboardEvent) => {
        if (modalVisible) {
          // Navegação no modal com ESC e scroll
          if (event.key === 'Escape') {
            setOpenRolesPicker(false);
            setModalVisible(false);
          } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            if (modalScrollViewRef.current) {
              const scrollDirection = event.key === 'ArrowDown' ? 50 : -50;
              modalScrollPosition = Math.max(0, modalScrollPosition + scrollDirection);
              modalScrollViewRef.current.scrollTo({
                y: modalScrollPosition,
                animated: true,
              });
            }
          }
        } else {
          // Navegação na lista principal
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            if (flatListRef.current) {
              const scrollDirection = event.key === 'ArrowDown' ? 100 : -100;
              currentScrollPosition = Math.max(0, currentScrollPosition + scrollDirection);
              flatListRef.current.scrollToOffset({
                offset: currentScrollPosition,
                animated: true,
              });
            }
          }
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [modalVisible]);

  // Função para buscar funcionario na API
  const fetchAtletas = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('jwtToken');
      const response = await axios.get<Funcionarios[]>(`${API_URL}/api/funcionarios/listarfuncionarios`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFuncionario(response.data);
    } catch (error) {
      console.error('Erro ao carregar lista de funcionario:', error);
      Alert.alert('Erro', 'Não foi possível carregar a lista de contatos.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Efeito para carregar funcionario ao focar na tela
  useFocusEffect(
    useCallback(() => {
      fetchAtletas();
    }, [])
  );

  // Manipulador para atualização da lista (pull-to-refresh)
  const handleRefresh = () => {
    setRefreshing(true);
    fetchAtletas();
  };

  // Função utilitária para formatar a data
  const formatarData = (dataString: string) => {
    if (!dataString || dataString === 'Não informada') return dataString;
    try {
      const [ano, mes, dia] = dataString.split('-');
      if (ano && mes && dia) {
        return `${dia}/${mes}/${ano}`;
      }
      return dataString;
    } catch {
      return dataString;
    }
  };

  

  // Manipulador para abrir o modal de edição de funcionario
  const handleEditAtleta = (funcionario: Funcionarios) => {
    setSelectedFuncionario(funcionario);
    setEditForm({
      nome: funcionario.nome,
      email: funcionario.email,
      dataNascimento: funcionario.dataNascimento,
      cpf: funcionario.cpf,
      telefone: funcionario.telefone,
      roles: funcionario.roles,
    });
    setOpenRolesPicker(false); // Garante que o dropdown está fechado
    setModalVisible(true);
  };

  // Manipulador para salvar as edições do funcionario
const handleSaveEdit = async () => {
  if (!selectedFuncionario || !editForm.nome || !editForm.roles) {
    Alert.alert('Erro', 'Nome e tipo (roles) são obrigatórios.');
    return;
  }

  try {
    setEditLoading(true);
    const token = await AsyncStorage.getItem('jwtToken');
    
    // Altere o ID para ser enviado na URL
    const url = `${API_URL}/api/funcionarios/${selectedFuncionario.id}`;

    // Envie o DTO de atualização com os dados do formulário
    const updateDTO = {
      ...editForm,
      id: selectedFuncionario.id,
      roles: editForm.roles
    };
    
    await axios.put(url, updateDTO, {
      headers: { Authorization: `Bearer ${token}` },
    });

    // Atualiza a lista de funcionário com os dados editados
    // A melhor prática é recarregar a lista para garantir que os dados estejam sincronizados
    await fetchAtletas();

    Alert.alert('Sucesso', 'Perfil do funcionário atualizado com sucesso!');
    setOpenRolesPicker(false); // Fecha o dropdown
    setModalVisible(false); // Fecha o modal após salvar
  } catch (error) {
    console.error('Erro ao salvar edições:', error);
    Alert.alert('Erro', 'Não foi possível atualizar o perfil do funcionário.');
  } finally {
    setEditLoading(false);
  }
};

  // Manipulador para excluir um funcionario
 const handleDelete = (funcionarioId: number, funcionarioRole: string) => {
  Alert.alert(
    'Confirmar Exclusão',
    'Tem certeza que deseja excluir este funcionário? Esta ação não pode ser desfeita.',
    [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        onPress: async () => {
          try {
            const token = await AsyncStorage.getItem('jwtToken');

            // Mude a URL para incluir o ID e passe o cargo como parâmetro
            const url = `${API_URL}/api/funcionarios/${funcionarioId}`;
            await axios.delete(url, {
              headers: { Authorization: `Bearer ${token}` },
              params: { roles: funcionarioRole }
            });

            // Recarrega a lista para mostrar a exclusão
            await fetchAtletas();

            Alert.alert('Sucesso', 'Funcionário excluído com sucesso!');
          } catch (error) {
            console.error('Erro ao excluir funcionário:', error);
            Alert.alert('Erro', 'Não foi possível excluir o funcionário.');
          }
        },
        style: 'destructive',
      },
    ]
  );
};

  const filteredAtletas = useCallback(() => {
    if (!searchTerm) {
      return funcionario;
    }
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    return funcionario.filter((func: Funcionarios) =>
      func.nome.toLowerCase().includes(lowerCaseSearchTerm)
    );
  }, [funcionario, searchTerm]);

  // Função para renderizar cada item da lista de funcionario
  const renderAtletaItem = ({ item }: { item: Funcionarios }) => (
    <TouchableOpacity 
      style={styles.atletaCard} 
      onPress={() => handleEditAtleta(item)}
      {...(Platform.OS === 'web' && {
        cursor: 'pointer',
        activeOpacity: 0.7,
      })}
      accessibilityLabel={`Editar funcionário ${item.nome}`}
    >
      <View style={styles.atletaInfo}>
        <Text style={styles.atletaName}>{item.nome}</Text>
        <Text style={styles.atletaDetail}>Cpf: {item.cpf}</Text>
        <Text style={styles.atletaDetail}>Email: {item.email}</Text>
        <Text style={styles.atletaDetail}>telefone: {item.telefone}</Text>
        <Text style={styles.atletaDetail}>email: {item.email}</Text>
        <Text style={styles.atletaDetail}>Data Nascismento: {formatarData(item.dataNascimento)}</Text>
        <Text style={styles.atletaDetail}>Tipo: {item.roles ? item.roles : 'Não informado'}</Text>
    
      </View>
      <TouchableOpacity 
        onPress={() => handleDelete(item.id, item.roles)} 
        style={styles.deleteButton}
        {...(Platform.OS === 'web' && {
          cursor: 'pointer',
          activeOpacity: 0.8,
        })}
        accessibilityLabel={`Excluir funcionário ${item.nome}`}
      >
        <FontAwesomeIcon icon={faTrashAlt} size={20} color={'#DC3545'} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  // Exibe indicador de carregamento se a lista estiver vazia e estiver carregando
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
      {/* Cabeçalho */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()} 
          style={styles.btnVoltar}
          {...(Platform.OS === 'web' && {
            cursor: 'pointer',
            activeOpacity: 0.7,
          })}
          accessibilityLabel="Voltar"
        >
          <FontAwesomeIcon icon={faArrowLeft} size={20} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Funcionarios</Text>
      </View>

      {/* Campo de busca */}
      <View style={styles.searchContainer}>
        <FontAwesomeIcon icon={faSearch} size={20} color={COLORS.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar funcionario por nome..." 
          placeholderTextColor={COLORS.textSecondary}
          value={searchTerm}
          onChangeText={setSearchTerm} // Atualiza o termo de busca
        />
      </View>

      {/* Exibição da lista de funcionario ou mensagem de vazio */}
      {filteredAtletas().length === 0 ? (
        <View style={styles.emptyListContainer}>
          <Text style={styles.emptyListText}>
            {searchTerm ? 'Nenhum funcionario encontrado com este nome.' : 'Nenhum funcionario encontrado.'}
          </Text>
          {!searchTerm && <Button title="Recarregar" onPress={handleRefresh} color={COLORS.primary} />}
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={filteredAtletas()} // Usa a lista filtrada
          keyExtractor={(item) => item.uniqueId}
          renderItem={renderAtletaItem}
          contentContainerStyle={[styles.listContent, Platform.OS === 'web' && styles.webFlatList]}
          onRefresh={handleRefresh}
          refreshing={refreshing}
          showsVerticalScrollIndicator={Platform.OS !== 'web'}
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled={Platform.OS === 'web'}
          bounces={Platform.OS !== 'web'}
        />
      )}

      {/* Modal de Edição de Atleta */}
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
            <Text style={styles.modalTitle}>Editar Atleta</Text>
            {selectedFuncionario && (
              <ScrollView 
                ref={modalScrollViewRef}
                style={[styles.modalScrollView, Platform.OS === 'web' && styles.webModalScrollView]}
                showsVerticalScrollIndicator={Platform.OS !== 'web'}
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
                <Text style={styles.inputLabel}>Data de Nascimento:</Text>
                <TextInput
                  style={styles.input}
                  value={editForm.dataNascimento}
                  onChangeText={(text) => setEditForm({ ...editForm, dataNascimento: text })}
                  placeholder="AAAA-MM-DD"
                  placeholderTextColor={COLORS.textSecondary}
                  keyboardType="numeric"
                />
                <Text style={styles.inputLabel}>Cpf:</Text>
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
                    zIndex={1000}
                    listMode="SCROLLVIEW"
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
                {...(Platform.OS === 'web' && {
                  cursor: 'pointer',
                  activeOpacity: 0.8,
                })}
                accessibilityLabel="Cancelar edição"
              >
                <Text style={styles.textStyle}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.buttonSave]}
                onPress={handleSaveEdit}
                disabled={editLoading}
                {...(Platform.OS === 'web' && !editLoading && {
                  cursor: 'pointer',
                  activeOpacity: 0.8,
                })}
                {...(Platform.OS === 'web' && editLoading && {
                  cursor: 'not-allowed',
                })}
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

// Estilos
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    backgroundColor: '#1c348e', // Azul escuro do time
    paddingHorizontal: 10,
    paddingTop: Platform.OS === 'android' ? 50 : 20, // Ajuste para status bar
  },
  btnVoltar: {
    position: 'absolute',
    left: 10,
    top: Platform.OS === 'android' ? 47 : 15, // Alinha com o título
    padding: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnVoltarText: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.white,
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
    marginBottom: 10,
    textAlign: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBackground,
    borderRadius: 8,
    marginHorizontal: 10,
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
  },
  listContent: {
    padding: 10,
    paddingBottom: 20, // Espaço extra no final
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
    borderLeftColor: COLORS.primary, // Detalhe com a cor primária
  },
  atletaInfo: {
    flex: 1,
    marginRight: 10, // Espaçamento entre info e botão de delete
  },
  atletaName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary, // Nome com a cor primária do time
    marginBottom: 5,
  },
  atletaDetail: {
    fontSize: 14,
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  deleteButton: {
    padding: 8,
    backgroundColor: "#fff",
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButtonText: {
    fontSize: 16,
    color: COLORS.white,
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)', // Fundo escurecido
  },
  modalView: {
    margin: 20,
    backgroundColor: COLORS.white,
    borderRadius: 15, // Bordas mais suaves
    padding: 25,
    alignItems: 'center',
    shadowColor: COLORS.textPrimary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
    width: '90%',
    maxHeight: '85%', // Ajuste para telas menores
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
    height: 45, // Um pouco maior
    borderColor: COLORS.borderColor,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 15,
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 25, // Mais espaçamento
  },
  button: {
    borderRadius: 10,
    paddingVertical: 12, // Um pouco mais de padding
    elevation: 2,
    flex: 1,
    marginHorizontal: 8, // Mais espaçamento entre botões
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonClose: {
    backgroundColor: COLORS.textSecondary, // Cinza mais escuro
  },
  buttonSave: {
    backgroundColor: COLORS.primary, // Azul escuro do time
  },
  textStyle: {
    color: COLORS.white,
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 16,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 15,
    paddingVertical: 5,
    paddingHorizontal: 5,
    backgroundColor: COLORS.background, // Fundo leve para o switch
    borderRadius: 8,
  },
  downloadPdfButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary, // Azul escuro para o botão de download na lista
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 8,
    alignSelf: 'flex-start',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  downloadPdfButtonText: {
    color: COLORS.white,
    marginLeft: 8,
    fontSize: 14,
    fontWeight: 'bold',
  },
  pdfSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    flexWrap: 'wrap',
    justifyContent: 'center', // Centraliza botões PDF
  },
  buttonPdfAction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary, // Azul escuro para ações de PDF
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: COLORS.blueBorder, // Borda em um tom de azul
    marginBottom: 10,
    marginRight: 5, // Espaçamento entre os botões de ação
  },
  buttonPdfActionText: {
    color: COLORS.white,
    marginLeft: 8,
    fontWeight: 'bold',
    fontSize: 14,
  },
  dropdownContainer: {
    width: '100%',
    marginBottom: 15,
    zIndex: 1000,
  },
  dropdown: {
    borderColor: COLORS.borderColor,
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: COLORS.white,
    minHeight: 45,
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
  // Estilos específicos para web
  webFlatList: {
    ...Platform.select({
      web: {
        maxHeight: 600, // Use a numeric value for maxHeight
        overflow: 'visible', // Use only 'visible' or 'hidden' for overflow
      },
    }),
  },
  webModalScrollView: {
    ...Platform.select({
      web: {
        maxHeight: 400,
        overflow: 'hidden',
      },
    }),
  },
});

export default ListaFuncionarios;
