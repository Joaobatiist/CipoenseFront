import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  Modal,
  ScrollView,
  SafeAreaView,
  Dimensions,
  Alert,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import DropDownPicker, { ItemType } from 'react-native-dropdown-picker';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
// MODIFICAÇÃO AQUI: Importar 'parse' junto com 'format'
import { format, parse } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Ionicons from '@expo/vector-icons/Ionicons';

// --- INTERFACES (Definições de Tipos) ---

export interface AtletaListagem {
  id: number;
  nomeCompleto: string;
  subDivisao?: string;
}

export interface RelatorioDesempenho {
  id: number;
  controle: number;
  recepcao: number;
  dribles: number;
  passe: number;
  tiro: number;
  cruzamento: number;
  giro: number;
  manuseioDeBola: number;
  forcaChute: number;
  gerenciamentoDeGols: number;
  jogoOfensivo: number;
  jogoDefensivo: number;
  [key: string]: number;
}

export interface RelatorioTaticoPsicologico {
  id: number;
  esportividade: number;
  disciplina: number;
  foco: number;
  confianca: number;
  tomadaDecisoes: number;
  compromisso: number;
  lideranca: number;
  trabalhoEmEquipe: number;
  atributosFisicos: number;
  atuarSobPressao: number;
  [key: string]: number;
}

export interface AvaliacaoGeral {
  id: number;
  atletaId: number;
  nomeAtleta: string;
  userName: string;
  dataAvaliacao: string; // Mantemos como string, mas agora sabemos o formato exato
  periodoTreino: string;
  subDivisao: string;
  feedbackTreinador: string;
  feedbackAvaliador: string;
  pontosFortes: string;
  pontosFracos: string;
  areasAprimoramento: string;
  metasObjetivos: string;
  relatorioDesempenho: RelatorioDesempenho | null;
  relatorioTaticoPsicologico: RelatorioTaticoPsicologico | null;
}

// --- CONFIGURAÇÃO AXIOS E FUNÇÕES DE API ---

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

if (!API_BASE_URL) {
  console.error("ERRO: Variável de ambiente EXPO_PUBLIC_API_BASE_URL não definida!");
  Alert.alert("Erro de Configuração", "A URL base da API não foi definida. Verifique seu arquivo .env ou app.json.");
}

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token.trim()}`;
      }
      
      return config;
    } catch (error) {
      console.error('Erro ao configurar token de autorização:', error);
      return config;
    }
    
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const fetchHistoricalEvaluations = async (): Promise<AvaliacaoGeral[]> => {
  try {
    const response = await api.get<AvaliacaoGeral[]>('/api/relatoriogeral/listar');
    if (!Array.isArray(response.data)) {
      console.error("Dados recebidos da API /listar não são um array:", response.data);
      throw new TypeError("Os dados da lista de avaliações estão em formato inválido.");
    }
    // Adicione este log para depurar o formato da data que está vindo da API
    if (response.data.length > 0) {
      console.log("DEBUG: Formato da dataAvaliacao recebida:", response.data[0].dataAvaliacao);
    }
    return response.data;
  } catch (error) {
    console.error("Erro ao buscar avaliações históricas:", error);
    if (axios.isAxiosError(error) && error.response) {
        console.error("Status do erro:", error.response.status);
        console.error("Dados do erro:", error.response.data);
    }
    throw error;
  }
};

export const fetchAvaliacaoGeralById = async (id: number): Promise<AvaliacaoGeral> => {
    try {
      const response = await api.get<AvaliacaoGeral>(`/api/relatoriogeral/buscarporid/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Erro ao buscar AvaliacaoGeral pelo ID ${id}:`, error);
      if (axios.isAxiosError(error) && error.response) {
          console.error("Status do erro:", error.response.status);
          console.error("Dados do erro:", error.response.data);
      }
      throw error;
    }
};

export const fetchAthletesList = async (): Promise<AtletaListagem[]> => {
  try {
    const response = await api.get<AtletaListagem[]>('/api/atletas/listagem');
    if (!Array.isArray(response.data)) {
      console.error("Dados recebidos da API /atletas/listagem não são um array:", response.data);
      throw new TypeError("Os dados da lista de atletas estão em formato inválido.");
    }
    return response.data;
  } catch (error) {
    console.error("Erro ao buscar lista de atletas:", error);
    if (axios.isAxiosError(error) && error.response) {
        console.error("Status do erro:", error.response.status);
        console.error("Dados do erro:", error.response.data);
    }
    throw error;
  }
};

// --- SUBCOMPONENTE ReportSection ---

interface ReportSectionProps {
  title: string;
  data: Record<string, number>;
  labels: { [key: string]: string };
}

const ReportSection: React.FC<ReportSectionProps> = ({ title, data, labels }) => {
  return (
    <View style={reportSectionStyles.section}>
      <Text style={reportSectionStyles.sectionTitle}>{title}</Text>
      {Object.keys(data).map((key) => {
        if (key === 'id') return null;
        const label = labels[key] || key;
        const value = data[key];
        return (
          <View key={key} style={reportSectionStyles.detailRow}>
            <Text style={reportSectionStyles.detailLabel}>{label}:</Text>
            <Text style={reportSectionStyles.detailValue}>{value}</Text>
          </View>
        );
      })}
    </View>
  );
};

const reportSectionStyles = StyleSheet.create({
  section: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#eee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#444',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    paddingBottom: 5,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
    paddingVertical: 2,
  },
  detailLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  detailValue: {
    fontSize: 15,
    color: '#555',
    fontWeight: 'bold',
  },
});


// --- COMPONENTE DA TELA RELATORIOS ---

const { height } = Dimensions.get('window');

const RelatoriosScreen: React.FC = () => {
  const navigation = useNavigation();
  const [evaluations, setEvaluations] = useState<AvaliacaoGeral[]>([]);
  const [filteredEvaluations, setFilteredEvaluations] = useState<AvaliacaoGeral[]>([]);
  const [atletasList, setAtletasList] = useState<AtletaListagem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const [openAtletaPicker, setOpenAtletaPicker] = useState(false);
  const [selectedAtletaId, setSelectedAtletaId] = useState<number>(0);

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedEvaluationDetails, setSelectedEvaluationDetails] = useState<AvaliacaoGeral | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);

  const loadEvaluationsAndAthletes = useCallback(async () => {
    setRefreshing(true);
    setError(null);
    try {
      const fetchedEvaluations = await fetchHistoricalEvaluations();
      // MODIFICAÇÃO AQUI: Usar 'parse' para ordenar corretamente
      fetchedEvaluations.sort((a, b) =>
        parse(b.dataAvaliacao, 'dd-MM-yyyy', new Date()).getTime() -
        parse(a.dataAvaliacao, 'dd-MM-yyyy', new Date()).getTime()
      );
      setEvaluations(fetchedEvaluations);

      const fetchedAthletes = await fetchAthletesList();
      setAtletasList(fetchedAthletes);
    } catch (err) {
      console.error("Erro ao buscar dados da lista:", err);
      if (err instanceof TypeError) {
        setError(err.message);
      } else if (axios.isAxiosError(err) && err.message.includes("Network Error")) {
        setError("Erro de conexão. Verifique se o servidor está rodando e acessível.");
      } else {
        setError("Não foi possível carregar a lista de avaliações. Tente novamente.");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadEvaluationsAndAthletes();
    }, [loadEvaluationsAndAthletes])
  );

  useEffect(() => {
    if (selectedAtletaId === 0) {
      setFilteredEvaluations(evaluations);
    } else {
      const filtered = evaluations.filter(
        (evaluation) => evaluation.atletaId === selectedAtletaId
      );
      setFilteredEvaluations(filtered);
    }
  }, [selectedAtletaId, evaluations]);

  const handleAtletaFilterChange = (item: ItemType<number>) => {
    setSelectedAtletaId(item.value ?? 0);
  };

  const openDetailsModal = async (evaluationId: number) => {
    setDetailsLoading(true);
    setModalVisible(true);
    try {
      const completeDetails = await fetchAvaliacaoGeralById(evaluationId);
      setSelectedEvaluationDetails(completeDetails);
      setDetailsError(null);
    } catch (err) {
      console.error('Erro ao carregar detalhes:', err);
      setDetailsError("Erro ao carregar os detalhes");
      setSelectedEvaluationDetails(null);
    } finally {
      setDetailsLoading(false);
    }
  };

  const closeDetailsModal = () => {
    setModalVisible(false);
    setSelectedEvaluationDetails(null);
    setDetailsError(null);
  };

  const handleGoBack = () => {
    navigation.goBack();
  };

  const renderEvaluationCard = ({ item }: { item: AvaliacaoGeral }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => openDetailsModal(item.id)}
    >
      <Text style={styles.cardTitle}>Avaliação de {item.nomeAtleta}</Text>
      <Text style={styles.cardText}>
        {/* CORREÇÃO PRINCIPAL AQUI: Usar 'parse' para interpretar a data corretamente */}
        Data: {format(parse(item.dataAvaliacao, 'dd-MM-yyyy', new Date()), 'dd/MM/yyyy', { locale: ptBR })}
      </Text>
      <Text style={styles.cardText}>Avaliador: {item.userName}</Text>
      <Text style={styles.cardText}>Período: {item.periodoTreino}</Text>
      {item.subDivisao && <Text style={styles.cardText}>Subdivisão: {item.subDivisao}</Text>}
    </TouchableOpacity>
  );

  const desempenhoLabels = {
    controle: "Controle",
    recepcao: "Recepção",
    dribles: "Dribles",
    passe: "Passe",
    tiro: "Tiro",
    cruzamento: "Cruzamento",
    giro: "Giro",
    manuseioDeBola: "Manuseio de Bola",
    forcaChute: "Força de Chute",
    gerenciamentoDeGols: "Gerenciamento de Gols",
    jogoOfensivo: "Jogo Ofensivo",
    jogoDefensivo: "Jogo Defensivo",
  };

  const taticoPsicologicoLabels = {
    esportividade: "Esportividade",
    disciplina: "Disciplina",
    foco: "Foco",
    confianca: "Confiança",
    tomadaDecisoes: "Tomada de Decisões",
    compromisso: "Compromisso",
    lideranca: "Liderança",
    trabalhoEmEquipe: "Trabalho em Equipe",
    atributosFisicos: "Atributos Físicos",
    atuarSobPressao: "Atuar Sob Pressão",
  };


  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#e5c228" />
        <Text style={styles.loadingText}>Carregando relatórios...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadEvaluationsAndAthletes}>
          <Text style={styles.retryButtonText}>Tentar Novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.mainScreenBackButton} onPress={handleGoBack}>
        <Ionicons name="arrow-back" size={30} color="#333" />
      </TouchableOpacity>

      <Text style={styles.header}> Avaliações</Text>

      <View style={styles.filterContainer}>
        <Text style={styles.filterLabel}>Filtrar por Atleta:</Text>
        <DropDownPicker<number>
          open={openAtletaPicker}
          value={selectedAtletaId}
          items={[
            { label: 'Todos os Atletas', value: 0, icon: () => <Ionicons name="people-outline" size={18} color="#000" /> },
            ...atletasList.map(atleta => ({
              label: atleta.nomeCompleto,
              value: atleta.id,
              icon: () => <Ionicons name="person-outline" size={18} color="#000" />,
            })),
          ]}
          setOpen={setOpenAtletaPicker}
          setValue={setSelectedAtletaId}
          onSelectItem={handleAtletaFilterChange}
          placeholder="Selecione um Atleta"
          style={styles.dropdown}
          containerStyle={styles.dropdownContainer}
          zIndex={3000}
          listMode="SCROLLVIEW"
          itemSeparator={true}
          itemSeparatorStyle={styles.itemSeparator}
          textStyle={{ fontSize: 16, color: '#333' }}
          selectedItemLabelStyle={{ fontWeight: 'bold' }}
          dropDownContainerStyle={{ borderColor: '#ddd', borderWidth: 1 }}
        />
      </View>

      {filteredEvaluations.length === 0 ? (
        <Text style={styles.noEvaluationsText}>Nenhuma avaliação encontrada.</Text>
      ) : (
        <FlatList
          data={filteredEvaluations}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderEvaluationCard}
          contentContainerStyle={styles.listContentContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={loadEvaluationsAndAthletes} tintColor="#1c348e" />
          }
        />
      )}

      {/* Modal de Detalhes da Avaliação */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeDetailsModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity style={styles.modalCloseButton} onPress={closeDetailsModal}>
                <Ionicons name="close-circle-outline" size={30} color="#666" />
            </TouchableOpacity>

            {detailsLoading ? (
              <View style={styles.centeredModalContent}>
                <ActivityIndicator size="large" color="#1c348e" />
                <Text style={styles.loadingText}>Carregando detalhes...</Text>
              </View>
            ) : detailsError ? (
              <View style={styles.centeredModalContent}>
                <Text style={styles.errorText}>{detailsError}</Text>
              </View>
            ) : selectedEvaluationDetails ? (
              <ScrollView style={styles.detailsScrollView}>
                <Text style={styles.modalHeader}>
                  Detalhes da Avaliação de {selectedEvaluationDetails.nomeAtleta}
                </Text>

                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Informações Gerais</Text>
                  <Text style={styles.detailText}><Text style={styles.detailLabel}>Atleta:</Text> {selectedEvaluationDetails.nomeAtleta}</Text>
                  <Text style={styles.detailText}><Text style={styles.detailLabel}>Avaliador:</Text> {selectedEvaluationDetails.userName}</Text>
                  <Text style={styles.detailText}>
                    <Text style={styles.detailLabel}>Data:</Text>{' '}
                    {/* CORREÇÃO PRINCIPAL AQUI também */}
                    {format(parse(selectedEvaluationDetails.dataAvaliacao, 'dd-MM-yyyy', new Date()), 'dd/MM/yyyy', { locale: ptBR })}
                  </Text>
                  <Text style={styles.detailText}><Text style={styles.detailLabel}>Período de Treino:</Text> {selectedEvaluationDetails.periodoTreino}</Text>
                  {selectedEvaluationDetails.subDivisao && <Text style={styles.detailText}><Text style={styles.detailLabel}>Subdivisão:</Text> {selectedEvaluationDetails.subDivisao}</Text>}
                </View>

                {selectedEvaluationDetails.relatorioDesempenho && (
                  <ReportSection
                    title="Relatório de Desempenho (Técnico)"
                    data={selectedEvaluationDetails.relatorioDesempenho}
                    labels={desempenhoLabels}
                  />
                )}

                {selectedEvaluationDetails.relatorioTaticoPsicologico && (
                  <ReportSection
                    title="Relatório Tático/Psicológico"
                    data={selectedEvaluationDetails.relatorioTaticoPsicologico}
                    labels={taticoPsicologicoLabels}
                  />
                )}

                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Feedbacks e Metas</Text>
                  <Text style={styles.feedbackText}><Text style={styles.detailLabel}>Feedback Treinador:</Text> {selectedEvaluationDetails.feedbackTreinador}</Text>
                  <Text style={styles.feedbackText}><Text style={styles.detailLabel}>Feedback Avaliador:</Text> {selectedEvaluationDetails.feedbackAvaliador}</Text>
                  <Text style={styles.feedbackText}><Text style={styles.detailLabel}>Pontos Fortes:</Text> {selectedEvaluationDetails.pontosFortes}</Text>
                  <Text style={styles.feedbackText}><Text style={styles.detailLabel}>Pontos Fracos:</Text> {selectedEvaluationDetails.pontosFracos}</Text>
                  <Text style={styles.feedbackText}><Text style={styles.detailLabel}>Áreas de Aprimoramento:</Text> {selectedEvaluationDetails.areasAprimoramento}</Text>
                  <Text style={styles.feedbackText}><Text style={styles.detailLabel}>Metas e Objetivos:</Text> {selectedEvaluationDetails.metasObjetivos}</Text>
                </View>
              </ScrollView>
            ) : (
              <View style={styles.centeredModalContent}>
                <Text>Nenhum dado disponível</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f0f4f8',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f4f8',
  },
  centeredModalContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#555',
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 25,
    color: '#2c3e50',
    textAlign: 'center',
    paddingTop: 20,
    paddingLeft: 40,
    paddingRight: 40,
  },
  filterContainer: {
    marginBottom: 20,
    zIndex: 3000,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  filterLabel: {
    fontSize: 16,
    marginBottom: 8,
    color: '#34495e',
    fontWeight: '600',
  },
  
  dropdownContainer: {
    height: 50,
  },
  dropdown: {
    backgroundColor: '#f8f8f8',
    borderColor: '#b0c4de',
    borderRadius: 8,
  },
  itemSeparator: {
    backgroundColor: '#e0e0e0',
    height: 1,
  },
  noEvaluationsText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#777',
    fontStyle: 'italic',
  },
  listContentContainer: {
    paddingBottom: 20,
    paddingHorizontal: 5,
  },
  card: {
    backgroundColor: '#ffffff',
    padding: 18,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 5,
    borderLeftWidth: 5,
    borderLeftColor: '#1c348e',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#2c3e50',
  },
  cardText: {
    fontSize: 15,
    color: '#555',
    marginBottom: 4,
  },
  errorText: {
    color: '#e74c3c',
    fontSize: 17,
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: 'bold',
  },
  retryButton: {
    backgroundColor: '#3498db',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
    marginTop: 10,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold',
  },
  mainScreenBackButton: {
    position: 'absolute',
    top: 20,
    left: 16,
    zIndex: 10,
    padding: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    width: '95%',
    maxHeight: height * 0.9,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
    flex: 1,
  },
  modalCloseButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    padding: 5,
    zIndex: 1,
  },
  modalCloseButtonText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#666',
  },
  modalHeader: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 20,
    textAlign: 'center',
    marginTop: 30,
  },
  detailsScrollView: {
    flex: 1,
    paddingHorizontal: 5,
  },
  section: {
    backgroundColor: '#fdfdff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e0e6ed',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: 'bold',
    color: '#34495e',
    marginBottom: 12,
    borderBottomWidth: 1.5,
    borderBottomColor: '#c0d6e4',
    paddingBottom: 8,
  },
  detailText: {
    fontSize: 15,
    marginBottom: 6,
    color: '#4a4a4a',
  },
  detailLabel: {
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  feedbackText: {
    fontSize: 15,
    marginBottom: 8,
    color: '#4a4a4a',
    lineHeight: 22,
  },
});

export default RelatoriosScreen;