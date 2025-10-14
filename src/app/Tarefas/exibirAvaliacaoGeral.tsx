import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import axios, { isAxiosError } from 'axios';
import { format, parse } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    FlatList,
    Modal,
    Platform,
    RefreshControl,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import DropDownPicker, { ItemType } from 'react-native-dropdown-picker';

// --- Constantes de Cores e Estilos Básicos ---
const COLORS = {
    primary: '#1c348e', // Azul Escuro (padrão do Header e Load)
    secondary: '#e5c228', // Amarelo (Destaque)
    background: '#f0f4f8', // Fundo principal
    white: '#ffffff',
    textPrimary: '#2c3e50',
    textSecondary: '#555',
    danger: '#e74c3c',
    border: '#b0c4de',
};
const HEADER_HEIGHT = Platform.OS === 'web' ? 70 : 60 + (Platform.OS === 'android' ? StatusBar.currentHeight || 20 : 0);
const MAX_WIDTH_WEB = 1000;
const { height: screenHeight } = Dimensions.get('window');

// --- Tipos de Dados (Mantidos) ---
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
    dataAvaliacao: string;
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

// --- Configuração da API (Mantida) ---
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

// --- Funções de Fetch (Mantidas) ---
export const fetchHistoricalEvaluations = async (): Promise<AvaliacaoGeral[]> => {
    try {
        const response = await api.get<AvaliacaoGeral[]>('/api/relatoriogeral/listar');
        if (!Array.isArray(response.data)) {
            throw new TypeError("Os dados da lista de avaliações estão em formato inválido.");
        }
        return response.data;
    } catch (error) {
        console.error("Erro ao buscar avaliações históricas:", error);
        throw error;
    }
};

export const fetchAvaliacaoGeralById = async (id: number): Promise<AvaliacaoGeral> => {
    try {
        const response = await api.get<AvaliacaoGeral>(`/api/relatoriogeral/buscarporid/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Erro ao buscar AvaliacaoGeral pelo ID ${id}:`, error);
        throw error;
    }
};

export const fetchAthletesList = async (): Promise<AtletaListagem[]> => {
    try {
        const response = await api.get<AtletaListagem[]>('/api/atletas/listagem');
        if (!Array.isArray(response.data)) {
            throw new TypeError("Os dados da lista de atletas estão em formato inválido.");
        }
        return response.data;
    } catch (error) {
        console.error("Erro ao buscar lista de atletas:", error);
        throw error;
    }
};

export const deleteAthletesList = async (id: number): Promise<AvaliacaoGeral> => {
    try {
        const response = await api.delete<AvaliacaoGeral>(`api/relatoriogeral/deletarporid/${id}`);
        return response.data;
    } catch (error) {
        console.error("Erro ao excluir relatório", error);
        throw error;
    }
};

// --- Componente de Seção de Relatório ---
interface ReportSectionProps {
    title: string;
    data: Record<string, number>;
    labels: { [key: string]: string };
}
const ReportSection: React.FC<ReportSectionProps> = ({ title, data, labels }) => {
    return (
        <View style={styles.sectionReport}>
            <Text style={styles.sectionTitleReport}>{title}</Text>
            {Object.keys(data).map((key) => {
                if (key === 'id') return null;
                const label = labels[key] || key;
                const value = data[key];
                return (
                    <View key={key} style={styles.detailRow}>
                        <Text style={styles.detailLabelReport}>{label}:</Text>
                        <Text style={styles.detailValueReport}>{value}</Text>
                    </View>
                );
            })}
        </View>
    );
};


// --- Componente Principal ---
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

    // Refs para navegação por teclado na Web
    const flatListRef = useRef<FlatList<AvaliacaoGeral>>(null);
    const modalScrollViewRef = useRef<ScrollView>(null);

    // --- Labels para Relatórios ---
    const desempenhoLabels = useMemo(() => ({
        controle: "Controle", recepcao: "Recepção", dribles: "Dribles", passe: "Passe", tiro: "Tiro",
        cruzamento: "Cruzamento", giro: "Giro", manuseioDeBola: "Manuseio de Bola", forcaChute: "Força de Chute",
        gerenciamentoDeGols: "Gerenciamento de Gols", jogoOfensivo: "Jogo Ofensivo", jogoDefensivo: "Jogo Defensivo",
    }), []);

    const taticoPsicologicoLabels = useMemo(() => ({
        esportividade: "Esportividade", disciplina: "Disciplina", foco: "Foco", confianca: "Confiança",
        tomadaDecisoes: "Tomada de Decisões", compromisso: "Compromisso", lideranca: "Liderança",
        trabalhoEmEquipe: "Trabalho em Equipe", atributosFisicos: "Atributos Físicos", atuarSobPressao: "Atuar Sob Pressão",
    }), []);

    // --- DropDownPicker Items ---
    const atletaPickerItems: ItemType<number>[] = useMemo(() => ([
        { label: 'Todos os Atletas', value: 0, icon: () => <Ionicons name="people-outline" size={18} color={COLORS.textPrimary} /> },
        ...atletasList.map(atleta => ({
            label: atleta.nomeCompleto,
            value: atleta.id,
            icon: () => <Ionicons name="person-outline" size={18} color={COLORS.textPrimary} />,
        })),
    ]), [atletasList]);

    // --- Funções de Manipulação de Dados ---
    const loadEvaluationsAndAthletes = useCallback(async () => {
        setRefreshing(true);
        setError(null);
        try {
            const [fetchedEvaluations, fetchedAthletes] = await Promise.all([
                fetchHistoricalEvaluations(),
                fetchAthletesList()
            ]);

            fetchedEvaluations.sort((a, b) =>
                parse(b.dataAvaliacao, 'dd-MM-yyyy', new Date()).getTime() -
                parse(a.dataAvaliacao, 'dd-MM-yyyy', new Date()).getTime()
            );
            setEvaluations(fetchedEvaluations);
            setAtletasList(fetchedAthletes);
        } catch (err) {
            let message = "Não foi possível carregar a lista de avaliações. Tente novamente.";
            if (err instanceof TypeError) {
                message = err.message;
            } else if (isAxiosError(err) && err.message.includes("Network Error")) {
                message = "Erro de conexão. Verifique se o servidor está rodando e acessível.";
            }
            setError(message);
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
        const filtered = evaluations.filter(
            (evaluation) => selectedAtletaId === 0 || evaluation.atletaId === selectedAtletaId
        );
        setFilteredEvaluations(filtered);
    }, [selectedAtletaId, evaluations]);

    const handleAtletaFilterChange = (item: ItemType<number>) => {
        setSelectedAtletaId(item.value ?? 0);
    };

    const openDetailsModal = async (evaluationId: number) => {
        setDetailsLoading(true);
        setModalVisible(true);
        setSelectedEvaluationDetails(null);
        setDetailsError(null);
        try {
            const completeDetails = await fetchAvaliacaoGeralById(evaluationId);
            setSelectedEvaluationDetails(completeDetails);
        } catch (err) {
            console.error('Erro ao carregar detalhes:', err);
            setDetailsError("Erro ao carregar os detalhes da avaliação.");
        } finally {
            setDetailsLoading(false);
        }
    };

    const closeDetailsModal = () => {
        setModalVisible(false);
        setSelectedEvaluationDetails(null);
        setDetailsError(null);
    };

    const handleDeleteEvaluation = (id: number) => {
        Alert.alert(
            "Confirmar Exclusão",
            "Tem certeza que deseja excluir esta avaliação? Esta ação é irreversível.",
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Sim, Excluir",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await deleteAthletesList(id);
                            Alert.alert("Sucesso", "Avaliação excluída com sucesso.");
                            loadEvaluationsAndAthletes(); // Recarrega a lista
                        } catch {
                            Alert.alert("Erro", "Não foi possível excluir a avaliação.");
                        }
                    },
                },
            ]
        );
    };

    // --- Lógica de Navegação por Teclado na Web (Aprimorada) ---
    useEffect(() => {
        if (Platform.OS === 'web') {
            const handleKeyPress = (event: KeyboardEvent) => {
                // Checa se inputs no modal estão focados
                const isInputFocused =
                    document.activeElement?.tagName === 'INPUT' ||
                    document.activeElement?.tagName === 'TEXTAREA';

                if (modalVisible) {
                    // Navegação no modal
                    if (event.key === 'Escape') {
                        event.preventDefault();
                        closeDetailsModal();
                        return;
                    }
                    if (modalScrollViewRef.current && !isInputFocused) {
                        // Lógica de rolagem no Modal (mantida e aprimorada com offset no React Native)
                        const scrollAmount = event.key === 'PageDown' || event.key === 'PageUp' ? 400 : 100;
                        let offset = 0;

                        switch (event.key) {
                            case 'ArrowDown':
                            case 'PageDown':
                                event.preventDefault();
                                offset = scrollAmount;
                                break;
                            case 'ArrowUp':
                            case 'PageUp':
                                event.preventDefault();
                                offset = -scrollAmount;
                                break;
                            case 'Home':
                                event.preventDefault();
                                modalScrollViewRef.current.scrollTo({ y: 0, animated: true });
                                return;
                            case 'End':
                                event.preventDefault();
                                modalScrollViewRef.current.scrollToEnd({ animated: true });
                                return;
                            default:
                                return;
                        }
                        if (modalScrollViewRef.current.scrollTo) {
                            
                             if (event.key.includes('Page')) {
                                modalScrollViewRef.current.scrollTo({ y: offset, animated: true });
                             }
                        }
                    }
                    return;
                }

                if (flatListRef.current && !isInputFocused) {
                    const scrollAmount = event.key === 'PageDown' || event.key === 'PageUp' ? 400 : 100;
                    let offset = 0;

                    switch (event.key) {
                        case 'ArrowDown':
                        case 'PageDown':
                            event.preventDefault();
                            offset = scrollAmount;
                            break;
                        case 'ArrowUp':
                        case 'PageUp':
                            event.preventDefault();
                            offset = -scrollAmount;
                            break;
                        case 'Home':
                            event.preventDefault();
                            flatListRef.current.scrollToOffset({ offset: 0, animated: true });
                            return;
                        case 'End':
                            event.preventDefault();
                            flatListRef.current.scrollToEnd({ animated: true });
                            return;
                        default:
                            return;
                    }

                    if (flatListRef.current.scrollToOffset) {
                         // Simulando scroll relativo usando scrollToOffset
                         flatListRef.current.scrollToOffset({ offset, animated: true });
                    }
                }
            };

            document.addEventListener('keydown', handleKeyPress);
            return () => document.removeEventListener('keydown', handleKeyPress);
        }
    }, [modalVisible]);
  
    const renderEvaluationCard = ({ item }: { item: AvaliacaoGeral }) => (
        <View style={styles.cardRow}>
            {/* Área clicável para abrir o modal */}
            <TouchableOpacity
                style={[
                    styles.cardContent,
                    Platform.OS === 'web' && { cursor: 'pointer' as any }
                ]}
                onPress={() => openDetailsModal(item.id)}
                activeOpacity={0.7}
                accessible={true}
                accessibilityLabel={`Ver detalhes da avaliação de ${item.nomeAtleta}`}
                accessibilityRole="button"
            >
                <Text style={styles.cardTitle}>Avaliação de {item.nomeAtleta}</Text>
                <Text style={styles.cardText}>
                    Data: {format(parse(item.dataAvaliacao, 'dd-MM-yyyy', new Date()), 'dd/MM/yyyy', { locale: ptBR })}
                </Text>
                <Text style={styles.cardText}>Avaliador: {item.userName}</Text>
                <Text style={styles.cardText}>Período: {item.periodoTreino}</Text>
                {item.subDivisao && <Text style={styles.cardText}>Subdivisão: {item.subDivisao}</Text>}
            </TouchableOpacity>

            {/* Botão da lixeira separado */}
            <TouchableOpacity
                style={[
                    styles.deleteButton,
                    Platform.OS === 'web' && { cursor: 'pointer' as any }
                ]}
                onPress={() => handleDeleteEvaluation(item.id)}
                activeOpacity={0.7}
                accessible={true}
                accessibilityLabel={`Excluir avaliação de ${item.nomeAtleta}`}
                accessibilityRole="button"
            >
                <Ionicons name="trash-outline" size={28} color={COLORS.danger} />
            </TouchableOpacity>
        </View>
    );

    // --- Renderização de Status ---
    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color={COLORS.secondary} />
                <Text style={styles.loadingText}>Carregando relatórios...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.centered}>
                <Text style={styles.errorText}>Ops! {error}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={loadEvaluationsAndAthletes}>
                    <Text style={styles.retryButtonText}>Tentar Novamente</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // --- Renderização Principal ---
    return (
        <SafeAreaView style={styles.container}>
            {/* Header Fixo */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.btnVoltar}
                    accessibilityLabel="Voltar"
                >
                    <Ionicons name="arrow-back" size={24} color={COLORS.white} />
                </TouchableOpacity>
                <Text style={styles.titulo}>Relatórios de Avaliações</Text>
            </View>

            {/* Conteúdo Principal (Centralizado na Web) */}
            <View style={styles.mainContent}>
                {/* Filtro Dropdown */}
                <View style={styles.filterContainer}>
                    <Text style={styles.filterLabel}>Filtrar por Atleta:</Text>
                    <DropDownPicker<number>
                        open={openAtletaPicker}
                        value={selectedAtletaId}
                        items={atletaPickerItems}
                        setOpen={setOpenAtletaPicker}
                        setValue={setSelectedAtletaId}
                        onSelectItem={handleAtletaFilterChange}
                        placeholder="Selecione um Atleta"
                        style={styles.dropdown}
                        containerStyle={styles.dropdownContainer}
                        zIndex={3000}
                        listMode={Platform.OS === 'web' ? "SCROLLVIEW" : "MODAL"}
                        itemSeparator={true}
                        itemSeparatorStyle={styles.itemSeparator}
                        textStyle={styles.dropdownText}
                        selectedItemLabelStyle={styles.dropdownSelectedItem}
                        dropDownContainerStyle={styles.dropdownDropDown}
                    />
                </View>

                {/* Lista de Avaliações */}
                {filteredEvaluations.length === 0 ? (
                    <Text style={styles.noEvaluationsText}>Nenhuma avaliação encontrada.</Text>
                ) : (
                    <FlatList
                        ref={flatListRef}
                        data={filteredEvaluations}
                        keyExtractor={(item) => item.id.toString()}
                        renderItem={renderEvaluationCard}
                        contentContainerStyle={styles.listContentContainer}
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={loadEvaluationsAndAthletes} tintColor={COLORS.primary} />
                        }
                        // Estilo e otimizações para Web
                        style={Platform.OS === 'web' ? styles.webFlatList : undefined}
                        showsVerticalScrollIndicator={Platform.OS === 'web'}
                        keyboardShouldPersistTaps="handled"
                        nestedScrollEnabled={true}
                        bounces={Platform.OS !== 'web'}
                    />
                )}
            </View>

            {/* Modal de Detalhes da Avaliação */}
            <Modal
                animationType="fade" // 'fade' é melhor para web
                transparent={true}
                visible={modalVisible}
                onRequestClose={closeDetailsModal}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <TouchableOpacity
                            style={[
                                styles.modalCloseButton,
                                Platform.OS === 'web' && { cursor: 'pointer' as any }
                            ]}
                            onPress={closeDetailsModal}
                            activeOpacity={0.7}
                            accessibilityLabel="Fechar detalhes"
                            accessibilityRole="button"
                        >
                            <Ionicons name="close-circle-outline" size={32} color={COLORS.textSecondary} />
                        </TouchableOpacity>

                        {detailsLoading ? (
                            <View style={styles.centeredModalContent}>
                                <ActivityIndicator size="large" color={COLORS.primary} />
                                <Text style={styles.loadingText}>Carregando detalhes...</Text>
                            </View>
                        ) : detailsError ? (
                            <View style={styles.centeredModalContent}>
                                <Text style={styles.errorText}>{detailsError}</Text>
                            </View>
                        ) : selectedEvaluationDetails && (
                            <ScrollView
                                ref={modalScrollViewRef}
                                style={styles.detailsScrollView}
                                showsVerticalScrollIndicator={Platform.OS === 'web'}
                                keyboardShouldPersistTaps="handled"
                                nestedScrollEnabled={true}
                            >
                                <Text style={styles.modalHeader}>
                                    Detalhes da Avaliação de {selectedEvaluationDetails.nomeAtleta}
                                </Text>

                                {/* Informações Gerais */}
                                <View style={styles.section}>
                                    <Text style={styles.sectionTitle}>Informações Gerais</Text>
                                    <Text style={styles.detailText}><Text style={styles.detailLabel}>Atleta:</Text> {selectedEvaluationDetails.nomeAtleta}</Text>
                                    <Text style={styles.detailText}><Text style={styles.detailLabel}>Avaliador:</Text> {selectedEvaluationDetails.userName}</Text>
                                    <Text style={styles.detailText}>
                                        <Text style={styles.detailLabel}>Data:</Text>{' '}
                                        {format(parse(selectedEvaluationDetails.dataAvaliacao, 'dd-MM-yyyy', new Date()), 'dd/MM/yyyy', { locale: ptBR })}
                                    </Text>
                                    <Text style={styles.detailText}><Text style={styles.detailLabel}>Período de Treino:</Text> {selectedEvaluationDetails.periodoTreino}</Text>
                                    {selectedEvaluationDetails.subDivisao && <Text style={styles.detailText}><Text style={styles.detailLabel}>Subdivisão:</Text> {selectedEvaluationDetails.subDivisao}</Text>}
                                </View>

                                {/* Relatórios de Desempenho e Tático/Psicológico */}
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

                                {/* Feedbacks e Metas */}
                                <View style={styles.section}>
                                    <Text style={styles.sectionTitle}>Feedbacks e Metas</Text>
                                    <Text style={styles.feedbackText}><Text style={styles.detailLabel}>Feedback Treinador:</Text> {selectedEvaluationDetails.feedbackTreinador || 'Não informado.'}</Text>
                                    <Text style={styles.feedbackText}><Text style={styles.detailLabel}>Feedback Avaliador:</Text> {selectedEvaluationDetails.feedbackAvaliador || 'Não informado.'}</Text>
                                    <Text style={styles.feedbackText}><Text style={styles.detailLabel}>Pontos Fortes:</Text> {selectedEvaluationDetails.pontosFortes || 'Não informado.'}</Text>
                                    <Text style={styles.feedbackText}><Text style={styles.detailLabel}>Pontos Fracos:</Text> {selectedEvaluationDetails.pontosFracos || 'Não informado.'}</Text>
                                    <Text style={styles.feedbackText}><Text style={styles.detailLabel}>Áreas de Aprimoramento:</Text> {selectedEvaluationDetails.areasAprimoramento || 'Não informado.'}</Text>
                                    <Text style={styles.feedbackText}><Text style={styles.detailLabel}>Metas e Objetivos:</Text> {selectedEvaluationDetails.metasObjetivos || 'Não informado.'}</Text>
                                </View>
                            </ScrollView>
                        )}
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

// --- Estilos Refatorados e Responsivos ---
const styles = StyleSheet.create({
    // --- Geral ---
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.background,
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: COLORS.textSecondary,
    },
    errorText: {
        color: COLORS.danger,
        fontSize: 17,
        textAlign: 'center',
        marginBottom: 20,
        fontWeight: 'bold',
    },
    retryButton: {
        backgroundColor: COLORS.primary,
        paddingVertical: 12,
        paddingHorizontal: 25,
        borderRadius: 8,
        marginTop: 10,
        ...(Platform.OS === 'web' && { cursor: 'pointer' as any }),
    },
    retryButtonText: {
        color: COLORS.white,
        fontSize: 17,
        fontWeight: 'bold',
    },

    // --- Header ---
    header: {
        backgroundColor: COLORS.primary,
        flexDirection: 'row',
        textAlign: 'center',
        paddingVertical: 15,
        borderBottomWidth: 2,
        borderBottomColor: COLORS.secondary,
        minHeight: HEADER_HEIGHT,
        ...(Platform.OS === 'web' && {
            position: 'fixed',
            top: 0,
            width: '100%',
            zIndex: 4000, // ZIndex alto para garantir que fique por cima do dropdown
            paddingTop: 15,
        }),
    },
    titulo: {
        flex: 1,
        color: COLORS.white,
        textAlign: 'center',
        fontSize: 22,
        fontWeight: 'bold',
        paddingRight: 40, // Espaço para não colidir com o botão de voltar
    },
    btnVoltar: {
        position: 'absolute',
        left: 10,
        padding: 5,
        zIndex: 4001,
        // Ajusta a posição vertical na web e Android
        top: Platform.select({
            web: 20,
            android: (StatusBar.currentHeight || 20) + 10,
            ios: 18,
        }),
    },

    // --- Conteúdo Principal e Filtro ---
    mainContent: {
        flex: 1,
        paddingHorizontal: Platform.OS === 'web' ? 20 : 10,
        marginTop: Platform.OS === 'web' ? HEADER_HEIGHT : 10,
        alignSelf: 'center',
        width: '100%',
        maxWidth: MAX_WIDTH_WEB,
    },
    filterContainer: {
        marginBottom: 20,
        zIndex: 3000,
        backgroundColor: COLORS.white,
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
        color: COLORS.textPrimary,
        fontWeight: '600',
    },
    dropdownContainer: {
        height: 50,
    },
    dropdown: {
        backgroundColor: '#f8f8f8',
        borderColor: COLORS.border,
        borderRadius: 8,
    },
    dropdownText: {
        fontSize: 16,
        color: COLORS.textPrimary,
    },
    dropdownSelectedItem: {
        fontWeight: 'bold',
        color: COLORS.primary,
    },
    dropdownDropDown: {
        borderColor: COLORS.border,
        borderWidth: 1,
    },
    itemSeparator: {
        backgroundColor: '#e0e0e0',
        height: 1,
    },

    // --- Lista ---
    noEvaluationsText: {
        textAlign: 'center',
        marginTop: 20,
        fontSize: 16,
        color: COLORS.textSecondary,
        fontStyle: 'italic',
    },
    listContentContainer: {
        paddingBottom: 20,
    },
    cardRow: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.white,
        borderRadius: 10,
        padding: 15,
        marginBottom: 10,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        borderLeftWidth: 5,
        borderLeftColor: COLORS.primary,
    },
    cardContent: {
        flex: 1,
        justifyContent: "center",
    },
    deleteButton: {
        justifyContent: "center",
        alignItems: "center",
        paddingLeft: 15,
        paddingRight: 5,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 8,
        color: COLORS.textPrimary,
    },
    cardText: {
        fontSize: 15,
        color: COLORS.textSecondary,
        marginBottom: 4,
    },
    webFlatList: {
        // Altura máxima para a FlatList na Web para evitar rolagem de toda a página
        maxHeight: screenHeight * 0.75, 
        overflow: 'auto' as any,
    },


    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        // Estilos Web para fixar na viewport
        ...(Platform.OS === 'web' && {
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0
        }),
    },
    modalContent: {
        backgroundColor: COLORS.white,
        borderRadius: 15,
        padding: 20,
        width: '95%',
        maxWidth: 700,
        // Mantém o limite de altura em ambas as plataformas
        maxHeight: screenHeight * 0.9, 
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 10,
        zIndex: 5000,
        position: 'relative',
        
        // NO MOBILE: Não use flex: 1. Use minHeight para o layout inicial.
        // NA WEB: Use flex: 1 para layout de coluna.
        ...(Platform.OS === 'web' ? { flex: 1 } : { minHeight: 100 }), 
    },
    modalCloseButton: {
        position: 'absolute',
        top: 10,
        right: 10,
        padding: 5,
        zIndex: 5001,
        ...(Platform.OS === 'web' && { cursor: 'pointer' as any }),
    },
    modalHeader: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.primary,
        marginBottom: 20,
        textAlign: 'center',
        marginTop: 20,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        paddingBottom: 10,
    },
    detailsScrollView: {
        flexGrow: 1, // Permite que o scroll view ocupe o espaço restante
        paddingHorizontal: 5,
        // Estilo específico para rolagem na Web
        ...(Platform.OS === 'web' ? { maxHeight: screenHeight * 0.8, overflow: 'auto' as any } : {}), 
    },
    centeredModalContent: {
  
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 200, 
        height: '20%',
       
    },

    // --- Detalhes da Avaliação ---
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
        color: COLORS.textPrimary,
        marginBottom: 12,
        borderBottomWidth: 1.5,
        borderBottomColor: '#c0d6e4',
        paddingBottom: 8,
    },
    detailText: {
        fontSize: 15,
        marginBottom: 6,
        color: COLORS.textSecondary,
    },
    detailLabel: {
        fontWeight: 'bold',
        color: COLORS.textPrimary,
    },
    feedbackText: {
        fontSize: 15,
        marginBottom: 8,
        color: COLORS.textSecondary,
        lineHeight: 22,
    },

    // --- Estilos de ReportSection (Substituídos pelos estilos do componente principal) ---
    sectionReport: { // Renomeado para evitar conflito
        backgroundColor: '#f9f9f9',
        borderRadius: 8,
        padding: 18,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#eee',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
    },
    sectionTitleReport: { // Renomeado para evitar conflito
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
    detailLabelReport: {
        fontSize: 15,
        fontWeight: '600',
        color: '#333',
        flex: 1,
    },
    detailValueReport: {
        fontSize: 15,
        color: COLORS.primary,
        fontWeight: 'bold',
    },
});

export default RelatoriosScreen; 