import { faArrowLeft, faTrashAlt } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import axios from 'axios';
import * as DocumentPicker from 'expo-document-picker';
import { documentDirectory, writeAsStringAsync } from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
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
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

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

type AtletaProfileDto = {
  id: string;
  matricula: string;
  nome: string;
  email: string;
  subDivisao: string;
  dataNascimento: string;
  foto: string | null;
  posicao: string;
  contatoResponsavel: string | null;
  isAptoParaJogar: boolean;
  documentoPdfBase64: string | null;
  documentoPdfContentType: string | null;
  documentos?: { id: string; nome: string; url: string; tipo: string }[];
};

const ListaContatosAtletas = () => {
  const navigation = useNavigation();
  const [atletas, setAtletas] = useState<AtletaProfileDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [selectedAtleta, setSelectedAtleta] = useState<AtletaProfileDto | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const modalScrollViewRef = useRef<ScrollView>(null);
  
  // Navegação por teclado na web
  useEffect(() => {
    if (Platform.OS === 'web') {
      const handleKeyPress = (event: KeyboardEvent) => {
        if (document.activeElement?.tagName === 'INPUT' || 
            document.activeElement?.tagName === 'TEXTAREA') {
          return; // Não interfere quando há input focado
        }

        if (modalVisible && modalScrollViewRef.current) {
          // Navegação no modal
          switch (event.key) {
            case 'ArrowDown':
              event.preventDefault();
              modalScrollViewRef.current?.scrollTo({ y: 100, animated: true });
              break;
            case 'ArrowUp':
              event.preventDefault();
              modalScrollViewRef.current?.scrollTo({ y: -100, animated: true });
              break;
            case 'PageDown':
              event.preventDefault();
              modalScrollViewRef.current?.scrollTo({ y: 400, animated: true });
              break;
            case 'PageUp':
              event.preventDefault();
              modalScrollViewRef.current?.scrollTo({ y: -400, animated: true });
              break;
            case 'Home':
              event.preventDefault();
              modalScrollViewRef.current?.scrollTo({ y: 0, animated: true });
              break;
            case 'End':
              event.preventDefault();
              modalScrollViewRef.current?.scrollToEnd({ animated: true });
              break;
            case 'Escape':
              event.preventDefault();
              setModalVisible(false);
              break;
          }
        } else if (flatListRef.current) {
          // Navegação na lista principal
          switch (event.key) {
            case 'ArrowDown':
              event.preventDefault();
              flatListRef.current?.scrollToOffset({ offset: 100, animated: true });
              break;
            case 'ArrowUp':
              event.preventDefault();
              flatListRef.current?.scrollToOffset({ offset: -100, animated: true });
              break;
            case 'PageDown':
              event.preventDefault();
              flatListRef.current?.scrollToOffset({ offset: 400, animated: true });
              break;
            case 'PageUp':
              event.preventDefault();
              flatListRef.current?.scrollToOffset({ offset: -400, animated: true });
              break;
            case 'Home':
              event.preventDefault();
              flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
              break;
            case 'End':
              event.preventDefault();
              flatListRef.current?.scrollToEnd({ animated: true });
              break;
          }
        }
      };

      document.addEventListener('keydown', handleKeyPress);
      return () => document.removeEventListener('keydown', handleKeyPress);
    }
  }, [modalVisible]);

  const [editForm, setEditForm] = useState<Partial<AtletaProfileDto>>({
    isAptoParaJogar: false,
    documentoPdfBase64: null,
    documentoPdfContentType: null,
  });
  const [editLoading, setEditLoading] = useState<boolean>(false);
  const [uploadingPdf, setUploadingPdf] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>(''); // Novo estado para o termo de busca

  // Função para buscar atletas na API
  const fetchAtletas = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('jwtToken');
      const response = await axios.get<AtletaProfileDto[]>(`${API_URL}/api/supervisor/atletas`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAtletas(response.data);
    } catch (error) {
      console.error('Erro ao carregar lista de atletas:', error);
      Alert.alert('Erro', 'Não foi possível carregar a lista de contatos.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Efeito para carregar atletas ao focar na tela
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

  // Função para baixar/compartilhar o PDF
  const handleDownloadPdf = async (base64Content: string, contentType: string, fileName: string = 'documento.pdf') => {
    if (!base64Content || !contentType) {
      Alert.alert('Erro', 'Conteúdo do PDF ou tipo não disponível para download.');
      return;
    }

    try {
      // Remove o prefixo de dados da string base64, se presente
  const tempUri = `${documentDirectory}Documento_${fileName}`;
  const pureBase64 = base64Content.replace(/^data:.*;base64,/, '');
  await writeAsStringAsync(tempUri, pureBase64, { encoding: 'base64' });

      // Verifica se a funcionalidade de compartilhamento está disponível no dispositivo
      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert('Erro', 'A funcionalidade de download/compartilhamento não está disponível neste dispositivo.');
        return;
      }

      // Abre o diálogo de compartilhamento/salvamento do sistema operacional
      await Sharing.shareAsync(tempUri, {
        mimeType: contentType,
        UTI: 'com.adobe.pdf', // Universal Type Identifier para PDF no iOS, ajuda na identificação do arquivo
      });

      Alert.alert('Download concluído');

    } catch (shareError) {
      console.error('Erro ao baixar/compartilhar PDF:', shareError);
      Alert.alert('Erro', 'Não foi possível baixar o documento. Tente novamente.');
    }
  };

  // Manipulador para abrir o modal de edição de atleta
  const handleEditAtleta = (atleta: AtletaProfileDto) => {
    setSelectedAtleta(atleta);
    setEditForm({
      nome: atleta.nome,
      email: atleta.email,
      dataNascimento: atleta.dataNascimento,
      subDivisao: atleta.subDivisao,
      contatoResponsavel: atleta.contatoResponsavel,
      isAptoParaJogar: atleta.isAptoParaJogar,
      posicao: atleta.posicao,
      documentoPdfBase64: atleta.documentoPdfBase64 || null,
      documentoPdfContentType: atleta.documentoPdfContentType || null,
    });
    setModalVisible(true);
  };

  // Manipulador para salvar as edições do atleta
  const handleSaveEdit = async () => {
    if (!selectedAtleta || !editForm.nome || !editForm.email) {
      Alert.alert('Erro', 'Nome e email são obrigatórios.');
      return;
    }

    try {
      setEditLoading(true);
      const token = await AsyncStorage.getItem('jwtToken');
      const response = await axios.put<AtletaProfileDto>(
        `${API_URL}/api/supervisor/atletas/${selectedAtleta.id}`,
        editForm,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Atualiza a lista de atletas com os dados editados
      setAtletas(prevAtletas =>
        prevAtletas.map(atleta =>
          atleta.id === selectedAtleta.id ? { ...atleta, ...response.data } : atleta
        )
      );
      Alert.alert('Sucesso', 'Perfil do atleta atualizado com sucesso!');
      setModalVisible(false); // Fecha o modal após salvar
    } catch (error) {
      console.error('Erro ao salvar edições:', error);
      Alert.alert('Erro', 'Não foi possível atualizar o perfil do atleta.');
    } finally {
      setEditLoading(false);
    }
  };

  // Manipulador para excluir um atleta
  const handleDeleteAtleta = (atletaId: string) => {
    Alert.alert(
      'Confirmar Exclusão',
      'Tem certeza que deseja excluir este atleta? Esta ação não pode ser desfeita.',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Excluir',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('jwtToken');
              await axios.delete(`${API_URL}/api/supervisor/atletas/deletar/${atletaId}`, {
                headers: { Authorization: `Bearer ${token}` },
              });
              // Remove o atleta excluído da lista local
              setAtletas(prevAtletas => prevAtletas.filter(atleta => atleta.id !== atletaId));
              Alert.alert('Sucesso', 'Atleta excluído com sucesso!');
            } catch (error) {
              console.error('Erro ao excluir atleta:', error);
              Alert.alert('Erro', 'Não foi possível excluir o atleta.');
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  // Manipulador para upload de um novo documento PDF
  const handlePdfUpload = async (atletaId: string) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: false, // Não copia para o cache se não for necessário persistir
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        setUploadingPdf(true);
        const token = await AsyncStorage.getItem('jwtToken');

        const fileUri = result.assets[0].uri;
        
        const formData = new FormData();
        // Anexa o arquivo com URI, nome e tipo MIME
        formData.append('file', {
          uri: fileUri,
          name: result.assets[0].name || 'document.pdf',
          type: 'application/pdf',
        } as any); // 'as any' para contornar um possível problema de tipagem do FormData no React Native

        const response = await axios.post<string>(
          `${API_URL}/api/supervisor/atletas/${atletaId}/documento-pdf`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'multipart/form-data', // Importante para FormData
            },
          }
        );

        const newPdfBase64 = response.data; // Assumindo que o backend retorna o base64 do novo PDF
        const newPdfContentType = "application/pdf";

        // Atualiza o estado do atleta com o novo PDF
        setAtletas(prevAtletas =>
          prevAtletas.map(atleta =>
            atleta.id === atletaId
              ? {
                ...atleta,
                documentoPdfBase64: newPdfBase64,
                documentoPdfContentType: newPdfContentType,
              }
              : atleta
          )
        );
        // Atualiza o formulário de edição para refletir o PDF recém-carregado
        setEditForm(prevForm => ({
          ...prevForm,
          documentoPdfBase64: newPdfBase64,
          documentoPdfContentType: newPdfContentType,
        }));
        Alert.alert('Sucesso', 'Documento PDF enviado com sucesso!');
      }
    } catch (error) {
      console.error('Erro ao enviar PDF:', error);
      Alert.alert('Erro', 'Não foi possível enviar o documento PDF.');
    } finally {
      setUploadingPdf(false);
    }
  };

  // Manipulador para remover o documento PDF principal
  const handleDeleteMainPdf = async (atletaId: string) => {
    Alert.alert(
      'Remover PDF',
      'Tem certeza que deseja remover o documento PDF principal deste atleta?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('jwtToken');
              await axios.delete(`${API_URL}/api/supervisor/atletas/${atletaId}/documento-pdf`, {
                headers: { Authorization: `Bearer ${token}` },
              });
              // Limpa os dados do PDF no estado local
              setAtletas(prevAtletas =>
                prevAtletas.map(atleta =>
                  atleta.id === atletaId
                    ? {
                      ...atleta,
                      documentoPdfBase64: null,
                      documentoPdfContentType: null,
                    }
                    : atleta
                )
              );
              setEditForm(prevForm => ({
                ...prevForm,
                documentoPdfBase64: null,
                documentoPdfContentType: null,
              }));
              Alert.alert('Sucesso', 'Documento PDF removido com sucesso.');
            } catch (error) {
              console.error('Erro ao remover PDF:', error);
              Alert.alert('Erro', 'Não foi possível remover o documento PDF.');
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  // Lógica de filtragem dos atletas (apenas pelo nome)
  const filteredAtletas = useCallback(() => {
    if (!searchTerm) {
      return atletas;
    }
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    return atletas.filter(atleta =>
      atleta.nome.toLowerCase().includes(lowerCaseSearchTerm)
    );
  }, [atletas, searchTerm]);

  // Função para renderizar cada item da lista de atletas
  const renderAtletaItem = ({ item }: { item: AtletaProfileDto }) => (
    <TouchableOpacity 
      style={[
        styles.atletaCard,
        Platform.OS === 'web' && { cursor: 'pointer' as any }
      ]} 
      onPress={() => handleEditAtleta(item)}
      activeOpacity={0.7}
      accessible={true}
      accessibilityLabel={`Editar atleta ${item.nome}`}
      accessibilityRole="button"
    >
      <View style={styles.atletaInfo}>
        <Text style={styles.atletaName}>{item.nome}</Text>
        <Text style={styles.atletaDetail}>{`Matrícula: ${item.matricula}`}</Text>
        <Text style={styles.atletaDetail}>{`Email: ${item.email}`}</Text>
        <Text style={styles.atletaDetail}>{`Subdivisão: ${item.subDivisao}`}</Text>
        <Text style={styles.atletaDetail}>{`Posição: ${item.posicao}`}</Text>
        <Text style={styles.atletaDetail}>{`Data Nascismento: ${formatarData(item.dataNascimento)}`}</Text>
        {item.contatoResponsavel && item.contatoResponsavel !== 'Não informado' && (
          <Text style={styles.atletaDetail}>{`Contato Responsavel: ${item.contatoResponsavel}`}</Text>
        )}
        <Text style={styles.atletaDetail}>
          {`Apto para Jogar: `}
          <Text style={{ fontWeight: 'bold', color: item.isAptoParaJogar ? COLORS.success : COLORS.danger }}>
            {item.isAptoParaJogar ? 'Sim' : 'Não'}
          </Text>
        </Text>
        {item.documentoPdfBase64 && item.documentoPdfContentType && (
          <TouchableOpacity
            onPress={() => handleDownloadPdf(item.documentoPdfBase64!, item.documentoPdfContentType!, `documento_${item.nome}.pdf`)}
            style={styles.downloadPdfButton}
          >
            <MaterialIcons name="cloud-download" size={20} color={COLORS.white} />
            <Text style={styles.downloadPdfButtonText}>Baixar Documento</Text>
          </TouchableOpacity>
        )}
      </View>
      <TouchableOpacity 
        onPress={() => handleDeleteAtleta(item.id)} 
        style={[
          styles.deleteButton,
          Platform.OS === 'web' && { cursor: 'pointer' as any }
        ]}
        activeOpacity={0.7}
        accessible={true}
        accessibilityLabel={`Excluir atleta ${item.nome}`}
        accessibilityRole="button"
      >
       <FontAwesomeIcon icon={faTrashAlt} size={20} color={'#DC3545'} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  // Exibe indicador de carregamento se a lista estiver vazia e estiver carregando
  if (loading && atletas.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={{ color: COLORS.textPrimary }}>Carregando contatos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Cabeçalho */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.btnVoltar}>
          <FontAwesomeIcon icon={faArrowLeft} size={20} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Atletas</Text>
      </View>

      {/* Campo de busca */}
      <View style={styles.searchContainer}>
        <MaterialIcons name="search" size={20} color={COLORS.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar atleta por nome..." 
          placeholderTextColor={COLORS.textSecondary}
          value={searchTerm}
          onChangeText={setSearchTerm} // Atualiza o termo de busca
        />
      </View>

      {/* Exibição da lista de atletas ou mensagem de vazio */}
      {filteredAtletas().length === 0 ? (
        <View style={styles.emptyListContainer}>
          <Text style={styles.emptyListText}>
            {searchTerm ? 'Nenhum atleta encontrado com este nome.' : 'Nenhum atleta encontrado.'}
          </Text>
          {!searchTerm && <Button title="Recarregar" onPress={handleRefresh} color={COLORS.primary} />}
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={filteredAtletas()} // Usa a lista filtrada
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderAtletaItem}
          contentContainerStyle={styles.listContent}
          onRefresh={handleRefresh}
          refreshing={refreshing}
          // Otimizações para web
          style={Platform.OS === 'web' ? styles.webFlatList : undefined}
          showsVerticalScrollIndicator={Platform.OS === 'web'}
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled={true}
          bounces={Platform.OS !== 'web'}
        />
      )}

      {/* Modal de Edição de Atleta */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>Editar Atleta</Text>
            {selectedAtleta && (
              <ScrollView 
                ref={modalScrollViewRef}
                style={[
                  styles.modalScrollView,
                  Platform.OS === 'web' && styles.webModalScrollView
                ]}
                showsVerticalScrollIndicator={Platform.OS === 'web'}
                showsHorizontalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                nestedScrollEnabled={true}
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
                <Text style={styles.inputLabel}>Subdivisão:</Text>
                <TextInput
                  style={styles.input}
                  value={editForm.subDivisao}
                  onChangeText={(text) => setEditForm({ ...editForm, subDivisao: text })}
                  placeholder="Ex: Categoria, Posição"
                  placeholderTextColor={COLORS.textSecondary}
                />
                <Text style={styles.inputLabel}>Posição:</Text>
                <TextInput
                  style={styles.input}
                  value={editForm.posicao}
                  onChangeText={(text) => setEditForm({ ...editForm, posicao: text })}
                  placeholder="Ex: Posição"
                  placeholderTextColor={COLORS.textSecondary}
                />
                <Text style={styles.inputLabel}>Contato Responsável:</Text>
                <TextInput
                  style={styles.input}
                  value={editForm.contatoResponsavel ?? ''}
                  onChangeText={(text) => setEditForm({ ...editForm, contatoResponsavel: text })}
                  placeholder="(XX) XXXXX-XXXX"
                  placeholderTextColor={COLORS.textSecondary}
                  keyboardType="phone-pad"
                />

                <View style={styles.switchContainer}>
                  <Text style={styles.inputLabel}>Apto para Jogar:</Text>
                  <Switch
                    trackColor={{ false: COLORS.borderColor, true: COLORS.primary }} // Cores da Cipoense para o switch
                    thumbColor={editForm.isAptoParaJogar ? COLORS.secondary : COLORS.white}
                    ios_backgroundColor={COLORS.borderColor}
                    onValueChange={(value) => setEditForm({ ...editForm, isAptoParaJogar: value })}
                    value={editForm.isAptoParaJogar ?? false}
                  />
                </View>

                <Text style={styles.inputLabel}>Documento PDF:</Text>
                <View style={styles.pdfSection}>
                  {editForm.documentoPdfBase64 && editForm.documentoPdfContentType ? (
                    <View style={{flexDirection: 'row', flexWrap: 'wrap'}}>
                      <TouchableOpacity
                        style={styles.buttonPdfAction}
                        onPress={() => handleDownloadPdf(editForm.documentoPdfBase64!, editForm.documentoPdfContentType!, `documento_${selectedAtleta!.nome}.pdf`)}
                      >
                        <MaterialIcons name="cloud-download" size={20} color={COLORS.white} />
                        <Text style={styles.buttonPdfActionText}>Baixar PDF</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.buttonPdfAction, { marginLeft: 10 }]}
                        onPress={() => handleDeleteMainPdf(selectedAtleta!.id)}
                      >
                        <MaterialIcons name="delete" size={20} color={COLORS.danger} />
                        <Text style={styles.buttonPdfActionText}>Remover</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.buttonPdfAction, { marginLeft: 10 }]}
                        onPress={() => handlePdfUpload(selectedAtleta!.id)}
                        disabled={uploadingPdf}
                      >
                        {uploadingPdf ? (
                          <ActivityIndicator color={COLORS.white} />
                        ) : (
                          <View style={{flexDirection: 'row', alignItems: 'center'}}>
                            <MaterialIcons name="cloud-upload" size={20} color={COLORS.white} />
                            <Text style={styles.buttonPdfActionText}>Trocar</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={styles.buttonPdfAction}
                      onPress={() => handlePdfUpload(selectedAtleta!.id)}
                      disabled={uploadingPdf}
                    >
                      {uploadingPdf ? (
                        <ActivityIndicator color={COLORS.white} />
                      ) : (
                        <View style={{flexDirection: 'row', alignItems: 'center'}}>
                          <MaterialIcons name="add-to-drive" size={20} color={COLORS.white} />
                          <Text style={styles.buttonPdfActionText}>Adicionar PDF</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              </ScrollView>
            )}
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.buttonClose]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.textStyle}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.buttonSave]}
                onPress={handleSaveEdit}
                disabled={editLoading}
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
  webFlatList: {
    maxHeight: '75vh' as any,
    overflow: 'auto' as any,
  },
  webModalScrollView: {
    maxHeight: '100%' as any,
    overflow: 'auto' as any,
  },
});

export default ListaContatosAtletas;