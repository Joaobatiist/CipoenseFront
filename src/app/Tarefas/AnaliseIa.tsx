import { faArrowLeft, faChartLine, faChevronRight, faSearch } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

// --- Interfaces ---
interface Atleta {
    id: number;
    nomeCompleto: string;
    email: string;
}

interface AnaliseIa {
    id: number;
    atletaEmail: string;
    prompt: string;
    respostaIA: string;
    dataAnalise: string;
}

const SupervisorAnalisesScreen: React.FC = () => {
    // --- Referencias para scroll ---
    const scrollViewRef = useRef<ScrollView>(null);
    const flatListRef = useRef<FlatList>(null);
    
    // --- Estados ---
    const [atletas, setAtletas] = useState<Atleta[]>([]);
    const [searchText, setSearchText] = useState('');
    const [analises, setAnalises] = useState<AnaliseIa[]>([]);
    const [loadingAtletas, setLoadingAtletas] = useState(true);
    const [loadingAnalises, setLoadingAnalises] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedAtleta, setSelectedAtleta] = useState<Atleta | null>(null);

    // --- Computed Values ---
    const filteredAtletas = useMemo(() => {
        if (!searchText.trim()) return atletas;
        return atletas.filter(atleta =>
            atleta.nomeCompleto.toLowerCase().includes(searchText.toLowerCase().trim())
        );
    }, [atletas, searchText]);

    // --- Funções Utilitárias ---
    const getToken = useCallback(async (): Promise<string | null> => {
        try {
            return await AsyncStorage.getItem('jwtToken');
        } catch (error) {
            console.error('Erro ao obter token:', error);
            return null;
        }
    }, []);

    const handleApiError = useCallback((error: any, context: string): string => {
        console.error(`Erro em ${context}:`, error);
        if (error.message?.includes('Token')) {
            return 'Sessão expirada. Faça login novamente.';
        }
        if (error.message?.includes('Network')) {
            return 'Erro de conexão. Verifique sua internet.';
        }
        return error.message || `Erro ao ${context.toLowerCase()}.`;
    }, []);

    // --- Navegação por teclado para web ---
    useEffect(() => {
        if (Platform.OS === 'web') {
            let currentScrollPosition = 0;
            let currentFlatListPosition = 0;

            const handleKeyDown = (event: KeyboardEvent) => {
                // Navegação com teclas de seta
                if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                    event.preventDefault();
                    
                    // Se há atletas selecionados, navegar na FlatList
                    if (selectedAtleta && flatListRef.current) {
                        const scrollDirection = event.key === 'ArrowDown' ? 100 : -100;
                        currentFlatListPosition = Math.max(0, currentFlatListPosition + scrollDirection);
                        flatListRef.current.scrollToOffset({
                            offset: currentFlatListPosition,
                            animated: true,
                        });
                    } 
                    // Caso contrário, navegar no ScrollView principal
                    else if (scrollViewRef.current) {
                        const scrollDirection = event.key === 'ArrowDown' ? 100 : -100;
                        currentScrollPosition = Math.max(0, currentScrollPosition + scrollDirection);
                        scrollViewRef.current.scrollTo({
                            y: currentScrollPosition,
                            animated: true,
                        });
                    }
                }
            };

            window.addEventListener('keydown', handleKeyDown);
            return () => window.removeEventListener('keydown', handleKeyDown);
        }
    }, [selectedAtleta]);

    // --- Funções de API ---
    const fetchAtletas = useCallback(async () => {
        setLoadingAtletas(true);
        setError(null);
        
        try {
            const token = await getToken();
            if (!token) {
                throw new Error('Token de autenticação não encontrado.');
            }
            
            const response = await fetch(`${API_BASE_URL}/api/atletas/listagem`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (!response.ok) {
                throw new Error(`Erro ${response.status}: Falha ao buscar atletas`);
            }

            const data: Atleta[] = await response.json();
            setAtletas(data);
            
        } catch (error: any) {
            const errorMessage = handleApiError(error, 'buscar atletas');
            setError(errorMessage);
        } finally {
            setLoadingAtletas(false);
        }
    }, [getToken, handleApiError]);

    // --- Efeitos ---
    useEffect(() => {
        fetchAtletas();
    }, [fetchAtletas]);

    const fetchAnalisesByAtleta = useCallback(async (atletaEmail: string) => {
        if (!atletaEmail?.trim()) {
            console.warn('E-mail do atleta inválido:', atletaEmail);
            setAnalises([]);
            return;
        }

        setLoadingAnalises(true);
        setError(null);
        setAnalises([]);
        
        try {
            const token = await getToken();
            if (!token) {
                throw new Error('Token de autenticação não encontrado.');
            }
            
            const response = await fetch(`${API_BASE_URL}/api/analises/atleta/${encodeURIComponent(atletaEmail)}`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (response.status === 204 || response.status === 404) {
                setAnalises([]);
                return;
            }

            if (!response.ok) {
                throw new Error(`Erro ${response.status}: Falha ao buscar análises`);
            }
            
            const data: AnaliseIa[] = await response.json();
            setAnalises(Array.isArray(data) ? data : []);

        } catch (error: any) {
            const errorMessage = handleApiError(error, 'buscar análises');
            setError(errorMessage);
            setAnalises([]);
        } finally {
            setLoadingAnalises(false);
        }
    }, [getToken, handleApiError]);
    // --- Funções de Interação ---
    const handleSelectAtleta = useCallback((atleta: Atleta) => {
        if (selectedAtleta?.id === atleta.id) {
            // Se clicar no mesmo atleta, deseleciona
            setSelectedAtleta(null);
            setAnalises([]);
            return;
        }
        
        setSelectedAtleta(atleta);
        fetchAnalisesByAtleta(atleta.email);
    }, [selectedAtleta, fetchAnalisesByAtleta]);

    const handleSearchChange = useCallback((text: string) => {
        setSearchText(text);
        // Se houver um atleta selecionado e ele não aparecer na busca, deseleciona
        if (selectedAtleta && !selectedAtleta.nomeCompleto.toLowerCase().includes(text.toLowerCase())) {
            setSelectedAtleta(null);
            setAnalises([]);
        }
    }, [selectedAtleta]);

    // --- Componentes de Renderização ---
    const renderAtletaItem = useCallback(({ item }: { item: Atleta }) => {
        const isSelected = selectedAtleta?.id === item.id;
        
        return (
            <TouchableOpacity 
                style={[styles.atletaCard, isSelected && styles.atletaCardSelected]} 
                onPress={() => handleSelectAtleta(item)}
                activeOpacity={0.7}
                {...(Platform.OS === 'web' && {
                    cursor: 'pointer',
                    activeOpacity: 0.8,
                })}
                accessibilityLabel={`Selecionar atleta ${item.nomeCompleto}`}
            >
                <View style={styles.atletaInfo}>
                    <Text style={styles.atletaName}>{item.nomeCompleto}</Text>
                    <Text style={styles.atletaEmail}>{item.email}</Text>
                </View>
                <FontAwesomeIcon 
                    icon={faChevronRight} 
                    size={16} 
                    color={isSelected ? "#1c348e" : "#004A8F"} 
                />
            </TouchableOpacity>
        );
    }, [selectedAtleta, handleSelectAtleta]);

    const renderAnaliseItem = useCallback(({ item }: { item: AnaliseIa }) => {
        const dataFormatada = new Date(item.dataAnalise).toLocaleDateString('pt-BR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        const paragrafos = item.respostaIA
            .split('\n')
            .filter(p => p.trim()) // Remove parágrafos vazios
            .map(p => p.trim());

        return (
            <View style={styles.analiseCard}>
                <View style={styles.analiseCardHeader}>
                    <FontAwesomeIcon icon={faChartLine} size={20} color="#1c348e" />
                    <Text style={styles.analiseTitle}>Análise de Desempenho</Text>
                </View>
                
                <Text style={styles.analiseDate}>{dataFormatada}</Text>
                
                <View style={styles.analiseContent}>
                    {paragrafos.map((paragrafo, index) => (
                        <Text key={index} style={styles.analiseText}>
                            {paragrafo}
                        </Text>
                    ))}
                </View>
            </View>
        );
    }, []);

    const renderEmptyAtletas = useCallback(() => (
        <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
                {searchText ? 'Nenhum atleta encontrado para a busca.' : 'Nenhum atleta cadastrado.'}
            </Text>
        </View>
    ), [searchText]);

    const renderEmptyAnalises = useCallback(() => (
        <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
                Nenhuma análise de IA disponível para {selectedAtleta?.nomeCompleto}.
            </Text>
        </View>
    ), [selectedAtleta]);

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <TouchableOpacity 
                    onPress={() => router.back()} 
                    style={styles.backButton}
                    {...(Platform.OS === 'web' && {
                        cursor: 'pointer',
                        activeOpacity: 0.7,
                    })}
                    accessibilityLabel="Voltar"
                >
                    <FontAwesomeIcon icon={faArrowLeft} size={18} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Análises de Desempenho (IA)</Text>
            </View>

            {loadingAtletas ? (
                <ActivityIndicator size="large" color="#004A8F" style={styles.centered} />
            ) : error ? (
                <Text style={styles.errorText}>{error}</Text>
            ) : (
                <ScrollView 
                    ref={scrollViewRef}
                    style={[styles.content, Platform.OS === 'web' && styles.webScrollView]}
                    showsVerticalScrollIndicator={Platform.OS !== 'web'}
                    keyboardShouldPersistTaps="handled"
                    nestedScrollEnabled={Platform.OS === 'web'}
                    bounces={Platform.OS !== 'web'}
                >
                    <View style={styles.searchContainer}>
                        <FontAwesomeIcon icon={faSearch} size={20} color="#888" style={styles.searchIcon} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Pesquisar atleta..."
                            placeholderTextColor="#888"
                            value={searchText}
                            onChangeText={handleSearchChange}
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                    </View>
                    
                    <View style={styles.atletasListContainer}>
                        <Text style={styles.subTitle}>Atletas</Text>
                        <FlatList
                            ref={flatListRef}
                            data={filteredAtletas}
                            keyExtractor={(item) => `atleta-${item.id}`}
                            renderItem={renderAtletaItem}
                            ListEmptyComponent={renderEmptyAtletas}
                            contentContainerStyle={[{ paddingBottom: 10 }, Platform.OS === 'web' && styles.webFlatList]}
                            scrollEnabled={false}
                            showsVerticalScrollIndicator={Platform.OS !== 'web'}
                            keyboardShouldPersistTaps="handled"
                            nestedScrollEnabled={Platform.OS === 'web'}
                            bounces={Platform.OS !== 'web'}
                        />
                    </View>

                    {selectedAtleta && (
                        <View style={styles.analisesContainer}>
                            <Text style={styles.subTitle}>Análises de {selectedAtleta.nomeCompleto}</Text>
                            {loadingAnalises ? (
                                <ActivityIndicator size="large" color="#004A8F" />
                            ) : analises.length > 0 ? (
                                <FlatList
                                    data={analises}
                                    keyExtractor={(item) => `analise-${item.id}`}
                                    renderItem={renderAnaliseItem}
                                    scrollEnabled={false}
                                    showsVerticalScrollIndicator={Platform.OS !== 'web'}
                                    keyboardShouldPersistTaps="handled"
                                    nestedScrollEnabled={Platform.OS === 'web'}
                                    bounces={Platform.OS !== 'web'}
                                    ItemSeparatorComponent={() => <View style={styles.separator} />}
                                />
                            ) : (
                                renderEmptyAnalises()
                            )}
                        </View>
                    )}
                </ScrollView>
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#f0f4f7',
    },
    header: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        padding: 15, 
        backgroundColor: '#1c348e',
        paddingTop: Platform.OS === 'android' ? 50 : 10,
        paddingLeft: Platform.OS === 'android' ? 15 : 0,
        borderBottomLeftRadius: 15,
        borderBottomRightRadius: 15,
        marginBottom: 10,
    },
    headerTitle: { 
        color: '#fff', 
        fontSize: 20, 
        fontWeight: 'bold', 
        marginLeft: 15, 
        paddingLeft: 30,
        flex: 1
    },
    backButton: { 
        padding: 8,
        borderRadius: 20,
    },
    centered: { 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center' 
    },
    errorText: { 
        textAlign: 'center', 
        color: '#e74c3c', 
        margin: 20,
        fontSize: 16,
        backgroundColor: '#ffeaea',
        padding: 15,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e74c3c'
    },
    content: { 
        flex: 1,
        paddingHorizontal: 15,
    },
    subTitle: { 
        fontSize: 18, 
        fontWeight: 'bold', 
        marginBottom: 12,
        color: '#2c3e50', 
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 25,
        paddingHorizontal: 15,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 3,
        elevation: 3,
    },
    searchIcon: {
        marginRight: 12,
    },
    searchInput: {
        flex: 1,
        height: 50,
        fontSize: 16,
        color: '#333',
    },
    atletasListContainer: { 
        marginBottom: 15,
    },
    atletaCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingVertical: 15,
        paddingHorizontal: 20,
        borderRadius: 12,
        marginVertical: 3,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    atletaCardSelected: {
        backgroundColor: '#e3f2fd',
        borderColor: '#1c348e',
        borderWidth: 2,
    },
    atletaInfo: {
        flex: 1,
        marginRight: 10,
    },
    atletaName: { 
        fontSize: 16, 
        color: '#2c3e50', 
        fontWeight: '600',
        marginBottom: 2
    },
    atletaEmail: {
        fontSize: 14,
        color: '#7f8c8d',
        fontStyle: 'italic'
    },
    analisesContainer: { 
        marginTop: 15,
    },
    analiseCard: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 12,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 4,
        elevation: 3,
        borderLeftWidth: 4,
        borderLeftColor: '#1c348e',
    },
    analiseCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#ecf0f1',
    },
    analiseTitle: { 
        fontSize: 18, 
        fontWeight: 'bold', 
        marginLeft: 12,
        color: '#2c3e50',
        flex: 1
    },
    analiseDate: {
        fontSize: 14,
        color: '#7f8c8d',
        marginBottom: 12,
        fontStyle: 'italic'
    },
    analiseContent: {
        marginTop: 8,
    },
    analiseText: { 
        fontSize: 15, 
        color: '#34495e', 
        lineHeight: 24,
        marginBottom: 8,
        textAlign: 'justify'
    },
    emptyContainer: {
        alignItems: 'center',
        padding: 30,
        backgroundColor: '#fff',
        borderRadius: 12,
        marginVertical: 10,
    },
    emptyText: {
        textAlign: 'center',
        fontSize: 16,
        color: '#7f8c8d',
        fontStyle: 'italic'
    },
    separator: {
        height: 8,
    },
    // Estilos específicos para web
    webScrollView: {
        ...Platform.select({
            web: {
                maxHeight: 820, // or any appropriate numeric value
                overflow: 'visible', // valid values: 'visible' or 'hidden'
            },
        }),
    },
    webFlatList: {
        ...Platform.select({
            web: {
                maxHeight: 400, // Use a numeric value for maxHeight
                overflow: 'visible', // Use a valid value for overflow
            },
        }),
    },
});

export default SupervisorAnalisesScreen;
