import { faArrowLeft, faSearch, faTrashAlt } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationProp, useFocusEffect, useNavigation } from '@react-navigation/native';
import axios, { isAxiosError } from 'axios';
import * as DocumentPicker from 'expo-document-picker';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Button,
  FlatList,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

// Assumindo que você está usando @expo/vector-icons
import { MaterialIcons } from '@expo/vector-icons';


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
  blueBorder: '#1E4E8A',
};

const API_URL = process.env.EXPO_PUBLIC_API_BASE_URL;
const HEADER_HEIGHT = Platform.OS === 'web' ? 70 : 60 + (Platform.OS === 'android' ? StatusBar.currentHeight || 20 : 0);


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

type RootStackParamList = {
  ListaContatosAtletas: undefined;
  // Adicione outras telas se houver links de navegação para elas
};
type ListaContatosAtletasNavigationProp = NavigationProp<
  RootStackParamList,
  'ListaContatosAtletas'
>;

const ListaContatosAtletas = () => {
  const navigation = useNavigation<ListaContatosAtletasNavigationProp>();
  const [atletas, setAtletas] = useState<AtletaProfileDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [selectedAtleta, setSelectedAtleta] = useState<AtletaProfileDto | null>(null);
  const flatListRef = useRef<FlatList<AtletaProfileDto>>(null);
  const modalScrollViewRef = useRef<ScrollView>(null);

  // --- Estados Faltantes ---
  const [editForm, setEditForm] = useState<Partial<AtletaProfileDto>>({
    isAptoParaJogar: false,
    documentoPdfBase64: null,
    documentoPdfContentType: null,
  });
  const [editLoading, setEditLoading] = useState<boolean>(false);
  const [uploadingPdf, setUploadingPdf] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [focusIndex, setFocusIndex] = useState<number>(-1); // Foco para navegação por teclado (Web)
  // --- Fim Estados Faltantes ---

  // --- Funções Auxiliares ---
  const formatarData = (dataString: string) => {
    if (!dataString || dataString === 'Não informada') return dataString;
    try {
      const datePart = dataString.split('T')[0];
      const [ano, mes, dia] = datePart.split('-');
      if (ano && mes && dia) {
        return `${dia}/${mes}/${ano}`;
      }
      return dataString;
    } catch {
      return dataString;
    }
  };

  const filteredData = useMemo(() => {
    if (!searchTerm) {
      return atletas;
    }
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    return atletas.filter((atleta: AtletaProfileDto) =>
      atleta.nome.toLowerCase().includes(lowerCaseSearchTerm)
    );
  }, [atletas, searchTerm]);
  // --- Fim Funções Auxiliares ---

  // --- Funções de API e Handlers de Ação ---
  const fetchAtletas = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('jwtToken');
      const response = await axios.get<AtletaProfileDto[]>(`${API_URL}/api/supervisor/atletas`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAtletas(response.data);
      if (response.data.length > 0) setFocusIndex(0);
    } catch (error) {
      console.error('Erro ao carregar lista de atletas:', error);
      Alert.alert('Erro', 'Não foi possível carregar a lista de contatos.');
      setAtletas([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchAtletas();
    }, [])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAtletas();
  };

  const handleDownloadPdf = async (base64Content: string, contentType: string, fileName: string = 'documento.pdf') => {
    if (!base64Content || !contentType) {
      Alert.alert('Erro', 'Conteúdo do PDF ou tipo não disponível para download.');
      return;
    }

    try {
      // Cria um blob do base64 para compartilhar diretamente
      // Nota: Esta é uma abordagem simplificada. 
      // Em produção, você pode querer salvar o arquivo temporariamente usando expo-file-system
      if (Platform.OS === 'web') {
        // Para web, cria um link de download direto
        const pureBase64 = base64Content.replace(/^data:.*;base64,/, '');
        const byteCharacters = atob(pureBase64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: contentType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        Alert.alert('Sucesso', 'Download iniciado!');
      } else {
        // Para mobile, seria necessário usar expo-file-system
        // Por ora, apenas exibe uma mensagem
        Alert.alert('Aviso', 'Funcionalidade de download disponível apenas na versão web no momento.');
      }
    } catch (error) {
      console.error('Erro ao baixar/compartilhar PDF:', error);
      Alert.alert('Erro', 'Não foi possível baixar o documento. Tente novamente.');
    }
  };

  const handleEditAtleta = (atleta: AtletaProfileDto) => {
    setSelectedAtleta(atleta);
    // Formata a data de volta para AAAA-MM-DD para o input
    const dataNascimentoFormatada = atleta.dataNascimento?.split('T')[0] || atleta.dataNascimento;
    
    setEditForm({
      nome: atleta.nome,
      email: atleta.email,
      dataNascimento: dataNascimentoFormatada,
      subDivisao: atleta.subDivisao,
      contatoResponsavel: atleta.contatoResponsavel,
      isAptoParaJogar: atleta.isAptoParaJogar,
      posicao: atleta.posicao,
      documentoPdfBase64: atleta.documentoPdfBase64 || null,
      documentoPdfContentType: atleta.documentoPdfContentType || null,
    });
    setModalVisible(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedAtleta || !editForm.nome || !editForm.email) {
      Alert.alert('Erro', 'Nome e email são obrigatórios.');
      return;
    }

    try {
      setEditLoading(true);
      const token = await AsyncStorage.getItem('jwtToken');
      
      // Envia o DTO de atualização.
      const updateDTO = {
        ...editForm,
        // Garante que a data está no formato esperado pelo backend (AAAA-MM-DD)
        dataNascimento: editForm.dataNascimento?.split('T')[0] || editForm.dataNascimento,
      };

      await axios.put(
        `${API_URL}/api/supervisor/atletas/${selectedAtleta.id}`,
        updateDTO,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Atualiza a lista com o novo atleta (ou recarrega, se preferir)
      await fetchAtletas();
      
      Alert.alert('Sucesso', 'Perfil do atleta atualizado com sucesso!');
      setModalVisible(false);
    } catch (error) {
      console.error('Erro ao salvar edições:', error);
      let errorMessage = 'Não foi possível atualizar o perfil do atleta.';
      if (isAxiosError(error) && error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      Alert.alert('Erro', errorMessage);
    } finally {
      setEditLoading(false);
    }
  };

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

  const handlePdfUpload = async (atletaId: string) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: false,
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        setUploadingPdf(true);
        const token = await AsyncStorage.getItem('jwtToken');
        const fileUri = result.assets[0].uri;
        
        const formData = new FormData();
        formData.append('file', {
          uri: fileUri,
          name: result.assets[0].name || 'document.pdf',
          type: 'application/pdf',
        } as any);

        const response = await axios.post<string>(
          `${API_URL}/api/supervisor/atletas/${atletaId}/documento-pdf`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'multipart/form-data',
            },
          }
        );

        const newPdfBase64 = response.data;
        const newPdfContentType = "application/pdf";

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
  // --- Fim Funções de API e Handlers de Ação ---


  // --- Lógica de Navegação por Teclado na Web (Foco e Scroll) ---

  const scrollItemToView = useCallback((index: number) => {
    if (flatListRef.current) {
      // Move o item focado para o centro da FlatList
      flatListRef.current.scrollToIndex({
        index,
        animated: true,
        viewPosition: 0.5,
      });
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
        // Checa se algum input ou textarea está focado
        const isInputFocused =
          document.activeElement?.tagName === 'INPUT' ||
          document.activeElement?.tagName === 'TEXTAREA';

        if (modalVisible) {
          // Navegação no modal
          if (event.key === 'Escape') {
            event.preventDefault();
            setModalVisible(false);
          }
          if (modalScrollViewRef.current && !isInputFocused) {
             // Lógica de rolagem do modal
            switch (event.key) {
              case 'ArrowDown':
                event.preventDefault();
                // Usa um valor positivo no Y para descer na rolagem
                modalScrollViewRef.current?.scrollTo({ y: 100, animated: true });
                break;
              case 'ArrowUp':
                event.preventDefault();
                // Para subir na rolagem, não há uma propriedade scrollPosition.
                // Seria necessário manter um estado do scroll, então vamos simplificar a navegação.
                // Você pode implementar com useRef para rastrear a posição, mas por ora vamos desabilitar este comportamento específico.
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
            }
          }
          return;
        }

        // Navegação na lista principal (Foco)
        if (isInputFocused) return; // Não interfere na busca

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
  // --- Fim Lógica de Navegação por Teclado na Web ---

  // --- Renderização do Item da Lista ---
  const renderAtletaItem = ({
    item,
    index,
  }: {
    item: AtletaProfileDto;
    index: number;
  }) => {
    const isFocused = Platform.OS === 'web' && focusIndex === index;

    return (
      <TouchableOpacity
        style={[
          styles.atletaCard,
          isFocused && styles.atletaCardFocused,
          Platform.OS === 'web' && { cursor: 'pointer' as any }
        ]}
        onPress={() => {
          setFocusIndex(index);
          handleEditAtleta(item);
        }}
        activeOpacity={0.7}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={`Atleta ${item.nome}, Pressione Enter para editar.`}
      >
        <View style={styles.atletaInfo}>
          <Text style={styles.atletaName} numberOfLines={1} ellipsizeMode="tail">
            {item.nome}
          </Text>
          <Text style={styles.atletaDetail}>
            {`Matrícula: ${item.matricula}`}
          </Text>
          <Text style={styles.atletaDetail}>{`Email: ${item.email}`}</Text>
          <Text style={styles.atletaDetail}>
            {`Subdivisão: ${item.subDivisao}`}
          </Text>
          <Text style={styles.atletaDetail}>
            {`Posição: ${item.posicao}`}
          </Text>
          <Text style={styles.atletaDetail}>
            {`Data Nasc.: ${formatarData(item.dataNascimento)}`}
          </Text>
          {item.contatoResponsavel && item.contatoResponsavel !== 'Não informado' && (
            <Text style={styles.atletaDetail}>
              {`Contato Responsavel: ${item.contatoResponsavel}`}
            </Text>
          )}
          <Text style={styles.atletaDetail}>
            {`Apto para Jogar: `}
            <Text
              style={{
                fontWeight: 'bold',
                color: item.isAptoParaJogar ? COLORS.success : COLORS.danger,
              }}
            >
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
          style={styles.deleteButton}
          activeOpacity={0.7}
          accessibilityLabel={`Excluir atleta ${item.nome}`}
        >
          <FontAwesomeIcon icon={faTrashAlt} size={20} color={COLORS.danger} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };
  // --- Fim Renderização do Item da Lista ---

  if (loading && atletas.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={{ color: COLORS.textPrimary }}>Carregando atletas...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.btnVoltar}
          accessibilityLabel="Voltar"
        >
          <FontAwesomeIcon icon={faArrowLeft} size={20} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Atletas</Text>
      </View>

      <View style={styles.contentWrapper}>
        {/* Campo de busca */}
        <View style={styles.searchContainer}>
          <FontAwesomeIcon icon={faSearch} size={20} color={COLORS.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar atleta por nome..."
            placeholderTextColor={COLORS.textSecondary}
            value={searchTerm}
            onChangeText={(text) => {
              setSearchTerm(text);
              setFocusIndex(0); // Reseta o foco ao buscar
            }}
            accessibilityRole="search"
          />
        </View>

        {/* Lista de atletas */}
        {filteredData.length === 0 ? (
          <View style={styles.emptyListContainer}>
            <Text style={styles.emptyListText}>
              {searchTerm ? 'Nenhum atleta encontrado com este nome.' : 'Nenhum atleta cadastrado.'}
            </Text>
            {!searchTerm && <Button title="Recarregar" onPress={handleRefresh} color={COLORS.primary} />}
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={filteredData}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderAtletaItem}
            contentContainerStyle={styles.listContent}
            onRefresh={handleRefresh}
            refreshing={refreshing}
            showsVerticalScrollIndicator={Platform.OS === 'web'}
            scrollEnabled={true}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled={Platform.OS === 'web'}
            bounces={Platform.OS !== 'web'}
          />
        )}
      </View>


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
                <Text style={styles.inputLabel}>Subdivisão:</Text>
                <TextInput
                  style={styles.input}
                  value={editForm.subDivisao}
                  onChangeText={(text) => setEditForm({ ...editForm, subDivisao: text })}
                  placeholder="Ex: Sub-20"
                  placeholderTextColor={COLORS.textSecondary}
                />
                <Text style={styles.inputLabel}>Posição:</Text>
                <TextInput
                  style={styles.input}
                  value={editForm.posicao}
                  onChangeText={(text) => setEditForm({ ...editForm, posicao: text })}
                  placeholder="Ex: Atacante"
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
                    trackColor={{ false: COLORS.borderColor, true: COLORS.primary }}
                    thumbColor={editForm.isAptoParaJogar ? COLORS.secondary : COLORS.white}
                    ios_backgroundColor={COLORS.borderColor}
                    onValueChange={(value) => setEditForm({ ...editForm, isAptoParaJogar: value })}
                    value={editForm.isAptoParaJogar ?? false}
                  />
                </View>

                <Text style={styles.inputLabel}>Documento PDF:</Text>
                <View style={styles.pdfSection}>
                  {editForm.documentoPdfBase64 && editForm.documentoPdfContentType ? (
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                      <TouchableOpacity
                        style={[styles.buttonPdfAction, { backgroundColor: COLORS.info }]}
                        onPress={() => handleDownloadPdf(editForm.documentoPdfBase64!, editForm.documentoPdfContentType!, `documento_${selectedAtleta!.nome}.pdf`)}
                      >
                        <MaterialIcons name="cloud-download" size={20} color={COLORS.white} />
                        <Text style={styles.buttonPdfActionText}>Baixar</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.buttonPdfAction, { backgroundColor: COLORS.danger }]}
                        onPress={() => handleDeleteMainPdf(selectedAtleta!.id)}
                      >
                        <MaterialIcons name="delete" size={20} color={COLORS.white} />
                        <Text style={styles.buttonPdfActionText}>Remover</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.buttonPdfAction, { backgroundColor: COLORS.primary }]}
                        onPress={() => handlePdfUpload(selectedAtleta!.id)}
                        disabled={uploadingPdf}
                      >
                        {uploadingPdf ? (
                          <ActivityIndicator color={COLORS.white} />
                        ) : (
                          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
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
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
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
                disabled={editLoading}
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


// --- Estilos para Responsividade ---
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
    backgroundColor: COLORS.primary, // Azul escuro
    paddingHorizontal: 10,
    minHeight: HEADER_HEIGHT,
    ...Platform.select({
      web: {
        position: 'fixed',
        top: 0,
        width: '100%',
        zIndex: 10,
        paddingTop: 15,
      },
      default: {
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 20 : 12,
      },
    }),
  },
  btnVoltar: {
    position: 'absolute',
    left: 10,
    top: Platform.select({
      web: 15,
      default: (Platform.OS === 'android' ? StatusBar.currentHeight || 20 : 12) + 5,
    }),
    padding: 8,
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
    paddingHorizontal: Platform.OS === 'web' ? 20 : 10,
    marginTop: Platform.OS === 'web' ? HEADER_HEIGHT : 0,
    width: '100%',
    maxWidth: Platform.OS === 'web' ? 1000 : '100%', // Limita a largura na web
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
    marginBottom: 10,
    textAlign: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBackground,
    borderRadius: 8,
    marginTop: 15,
    marginBottom: 10,
    paddingHorizontal: 10,
    shadowColor: COLORS.textPrimary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    width: '100%',
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
    // Garante que a lista preencha o espaço na web
    flexGrow: 1, 
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
    borderColor: COLORS.secondary, // Amarelo para indicar foco na web
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
  deleteButton: {
    padding: 8,
  },
  downloadPdfButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.info, 
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 8,
    alignSelf: 'flex-start',
    ...(Platform.OS === 'web' && { cursor: 'pointer' as any }),
  },
  downloadPdfButtonText: {
    color: COLORS.white,
    marginLeft: 8,
    fontSize: 14,
    fontWeight: 'bold',
  },
  // Modal Styles
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    ...Platform.select({
      web: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflowY: 'auto',
      },
    }),
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
    ...Platform.select({ web: { maxHeight: 400, overflowY: 'auto' as any } }), // Altura fixa para scroll na web
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
    ...(Platform.OS === 'web' && { cursor: 'pointer' as any }),
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
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 15,
    paddingVertical: 5,
    paddingHorizontal: 5,
    backgroundColor: COLORS.background,
    borderRadius: 8,
  },
  pdfSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    width: '100%',
  },
  buttonPdfAction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1c348e',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#1c348e',
    marginBottom: 10,
    marginRight: 10,
    ...(Platform.OS === 'web' && { cursor: 'pointer' as any }),
  },
  buttonPdfActionText: {
    color: '#ffffffff',
    marginLeft: 8,
    fontWeight: 'bold',
    fontSize: 14,
  },
});

export default ListaContatosAtletas;