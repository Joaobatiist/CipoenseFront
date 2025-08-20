// src/components/SupervisorAnalisesScreen.tsx

import { faArrowLeft, faChartLine, faChevronRight, faSearch } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

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
    const [atletas, setAtletas] = useState<Atleta[]>([]);
    const [filteredAtletas, setFilteredAtletas] = useState<Atleta[]>([]);
    const [searchText, setSearchText] = useState('');
    const [analises, setAnalises] = useState<AnaliseIa[]>([]);
    const [loadingAtletas, setLoadingAtletas] = useState(true);
    const [loadingAnalises, setLoadingAnalises] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedAtleta, setSelectedAtleta] = useState<Atleta | null>(null);

    useEffect(() => {
        fetchAtletas();
    }, []);

    useEffect(() => {
        const filtered = atletas.filter(atleta =>
            atleta.nomeCompleto.toLowerCase().includes(searchText.toLowerCase())
        );
        setFilteredAtletas(filtered);
    }, [atletas, searchText]);

    const getToken = async (): Promise<string | null> => {
        try {
            const token = await AsyncStorage.getItem('jwtToken');
            return token;
        } catch (err) {
            console.error('Erro ao obter token:', err);
            return null;
        }
    };

    const fetchAtletas = async () => {
        setLoadingAtletas(true);
        setError(null);
        try {
            const token = await getToken();
            if (!token) {
                setError('Token de autenticação não encontrado.');
                setLoadingAtletas(false);
                return;
            }
            
            const response = await fetch(`${API_BASE_URL}/api/atletas/listagem`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (!response.ok) {
                throw new Error(`Erro ao buscar atletas: ${response.status}`);
            }

            const data: Atleta[] = await response.json();
            setAtletas(data);
        } catch (err: any) {
            console.error("Falha ao buscar atletas:", err);
            setError(err.message || 'Falha ao carregar a lista de atletas.');
        } finally {
            setLoadingAtletas(false);
        }
    };

    const fetchAnalisesByAtleta = async (atletaEmail: string) => {
        if (!atletaEmail) {
            console.warn("WARN: E-mail do atleta é undefined. Interrompendo a busca de análises.");
            setLoadingAnalises(false);
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
            
            const response = await fetch(`${API_BASE_URL}/api/analises/atleta/${atletaEmail}`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (!response.ok) {
                if (response.status === 204) {
                    setAnalises([]);
                    return;
                }
                throw new Error(`Erro ao buscar análises: ${response.status}`);
            }
            
            const data: AnaliseIa[] = await response.json();
            setAnalises(data);

        } catch (err: any) {
            console.error("ERRO na busca de análises:", err);
            setError(err.message || 'Falha ao carregar as análises de desempenho.');
        } finally {
            setLoadingAnalises(false);
        }
    };
    
    const handleSelectAtleta = (atleta: Atleta) => {
        setSelectedAtleta(atleta);
        fetchAnalisesByAtleta(atleta.email);
    };

    const renderAtletaItem = ({ item }: { item: Atleta }) => (
        <TouchableOpacity 
            style={[styles.atletaCard, selectedAtleta?.id === item.id && styles.atletaCardSelected]} 
            onPress={() => handleSelectAtleta(item)}
        >
            <Text style={styles.atletaName}>{item.nomeCompleto}</Text>
            <FontAwesomeIcon icon={faChevronRight} size={16} color="#004A8F" />
        </TouchableOpacity>
    );

    const renderAnaliseItem = ({ item }: { item: AnaliseIa }) => (
        <View style={styles.analiseCard}>
            <View style={styles.analiseCardHeader}>
                <FontAwesomeIcon icon={faChartLine} size={20} color="#004A8F" />
                <Text style={styles.analiseTitle}>Análise - {new Date(item.dataAnalise).toLocaleDateString('pt-BR')}</Text>
            </View>
            {/* CORREÇÃO AQUI: Dividir o texto da análise por quebra de linha e renderizar cada parágrafo separadamente */}
            {item.respostaIA.split('\n').map((paragraph, index) => (
                <Text key={index} style={styles.analiseText}>{paragraph}</Text>
            ))}
        </View>
    );

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <FontAwesomeIcon icon={faArrowLeft} size={18} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Análises de Desempenho (IA)</Text>
            </View>

            {loadingAtletas ? (
                <ActivityIndicator size="large" color="#004A8F" style={styles.centered} />
            ) : error ? (
                <Text style={styles.errorText}>{error}</Text>
            ) : (
                <ScrollView style={styles.content}>
                    <View style={styles.searchContainer}>
                        <FontAwesomeIcon icon={faSearch} size={20} color="#888" style={styles.searchIcon} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Pesquisar atleta..."
                            placeholderTextColor="#888"
                            value={searchText}
                            onChangeText={setSearchText}
                        />
                    </View>
                    
                    <View style={styles.atletasListContainer}>
                        <Text style={styles.subTitle}>Atletas</Text>
                        <FlatList
                            data={filteredAtletas}
                            keyExtractor={(item) => item.id.toString()}
                            renderItem={renderAtletaItem}
                            ListEmptyComponent={<Text style={styles.emptyText}>Nenhum atleta encontrado.</Text>}
                            contentContainerStyle={{ paddingBottom: 10 }}
                            scrollEnabled={false}
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
                                    keyExtractor={(item) => item.id.toString()}
                                    renderItem={renderAnaliseItem}
                                    scrollEnabled={false}
                                />
                            ) : (
                                <Text style={styles.emptyText}>Nenhuma análise de IA disponível para {selectedAtleta.nomeCompleto}.</Text>
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
    headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginLeft: 15, paddingLeft: 30 },
    backButton: { padding: 5 },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    errorText: { textAlign: 'center', color: 'red', margin: 20 },
    content: { 
        flex: 1,
        paddingHorizontal: 15,
    },
    subTitle: { 
        fontSize: 18, 
        fontWeight: 'bold', 
        marginBottom: 10,
        color: '#333', 
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 25,
        paddingHorizontal: 15,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    searchIcon: {
        marginRight: 10,
    },
    searchInput: {
        flex: 1,
        height: 50,
        fontSize: 16,
        color: '#333',
    },
    atletasListContainer: { 
        marginBottom: 10,
    },
    atletaCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingVertical: 15,
        paddingHorizontal: 20,
        borderRadius: 10,
        marginVertical: 4,
        borderWidth: 1,
        borderColor: '#ddd',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    atletaCardSelected: {
        backgroundColor: '#e6f7ff',
        borderColor: '#004A8F',
    },
    atletaName: { fontSize: 16, color: '#333', fontWeight: '500' },
    analisesContainer: { 
        marginTop: 10,
    },
    analiseCard: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 12,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    analiseCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    analiseTitle: { fontSize: 16, fontWeight: 'bold', marginLeft: 10 },
    analiseText: { fontSize: 14, color: '#555', lineHeight: 22 },
    emptyText: {
        textAlign: 'center',
        marginTop: 10,
        fontSize: 16,
        color: '#888',
    },
});

export default SupervisorAnalisesScreen;