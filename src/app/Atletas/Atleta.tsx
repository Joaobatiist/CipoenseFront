import React, { useState, useRef, useEffect } from 'react';
import { SafeAreaView, View, TouchableOpacity, Text, ScrollView, LayoutChangeEvent, Alert, FlatList, ActivityIndicator, Image } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faBars, faTimes, faCalendarAlt, faChartLine, faBell, faUser, faSignOutAlt } from '@fortawesome/free-solid-svg-icons';

import { ptBR } from "../../utils/localendarConfig";
import { LocaleConfig } from 'react-native-calendars';
import { router } from 'expo-router';
import { styles } from "../../Styles/Atleta";
import AsyncStorage from '@react-native-async-storage/async-storage';

LocaleConfig.locales["pt-br"] = ptBR;
LocaleConfig.defaultLocale = "pt-br";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

interface SectionOffsets {
  agenda?: number;
  desempenho?: number;
  comunicados?: number;
  perfil?: number;
}

interface Evento {
  id: string;
  data: string;
  descricao: string;
  professor: string;
  local: string;
  horario: string;
}

interface DestinatarioResponse {
  id: number;
  nome: string;
  tipo: string;
}

interface ComunicadoResponse {
  id: number;
  assunto: string;
  mensagem: string;
  dataEnvio: string;
  destinatarios: DestinatarioResponse[];
}

interface ApiResponse<T> {
    data: T | null;
    loading: boolean;
    error: string | null;
}

const Usuario: React.FC = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const scrollViewRef = useRef<ScrollView>(null);
    const sectionOffsetsRef = useRef<SectionOffsets>({});

    const [comunicadosState, setComunicadosState] = useState<ApiResponse<ComunicadoResponse[]>>({ data: null, loading: true, error: null });
    const [eventosState, setEventosState] = useState<ApiResponse<Evento[]>>({ data: null, loading: true, error: null });
    const [analiseState, setAnaliseState] = useState<ApiResponse<string>>({ data: null, loading: true, error: null });

    const getToken = async (): Promise<string | null> => {
        try {
            const token = await AsyncStorage.getItem('jwtToken');
            return token;
        } catch (error) {
            console.error('Erro ao obter token do AsyncStorage:', error);
            return null;
        }
    };

    const fetchApiData = async <T,>(endpoint: string): Promise<T> => {
        const token = await getToken();
        if (!token) {
            throw new Error("Token JWT não encontrado. Por favor, faça login novamente.");
        }
        
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            const errorBody = await response.text();
            let errorMessage = `Erro HTTP! Status: ${response.status}`;
            try {
                const errorJson = JSON.parse(errorBody);
                errorMessage += `, Mensagem: ${errorJson.message || errorJson.error}`;
            } catch {
                errorMessage += `, Corpo: ${errorBody}`;
            }
            throw new Error(errorMessage);
        }

        return response.json();
    };

    useEffect(() => {
        const loadAllData = async () => {
            try {
                const [comunicados, eventos, analiseResponse] = await Promise.all([
                    fetchApiData<ComunicadoResponse[]>('/api/comunicados'),
                    fetchApiData<Evento[]>('/api/eventos'),
                    fetchApiData<{ analiseDesempenhoIA: string }>('/api/atleta/minha-analise')
                ]);

                setComunicadosState({ data: comunicados, loading: false, error: null });
                setEventosState({
                    data: eventos.map(event => ({
                        ...event,
                        data: new Date(event.data + 'T00:00:00').toLocaleDateString('pt-BR'),
                    })),
                    loading: false,
                    error: null
                });

                if (analiseResponse?.analiseDesempenhoIA) {
                    setAnaliseState({ data: analiseResponse.analiseDesempenhoIA, loading: false, error: null });
                } else {
                    setAnaliseState({ data: "Nenhuma análise de desempenho detalhada disponível no momento. Converse com seu treinador para iniciar.", loading: false, error: null });
                }

            } catch (error: any) {
                console.error('Erro ao carregar dados iniciais:', error);
                setComunicadosState(s => ({ ...s, loading: false, error: error.message }));
                setEventosState(s => ({ ...s, loading: false, error: error.message }));
                setAnaliseState(s => ({ ...s, loading: false, error: error.message }));
            }
        };

        loadAllData();
    }, []);

    const Perfil = () => {
        router.navigate('../funcionarios/Perfil');
    };

    const handleLogout = async () => {
        try {
            await AsyncStorage.removeItem('jwtToken');
            console.log('Token JWT removido com sucesso!');
            closeSidebar();
            router.replace('../../');
        } catch (error) {
            console.error('Erro ao fazer logout:', error);
            Alert.alert('Erro ao Sair', 'Não foi possível sair no momento. Tente novamente.');
        }
    };

    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
    };

    const closeSidebar = () => {
        setSidebarOpen(false);
    };

    const scrollToSection = (sectionName: keyof SectionOffsets) => {
        closeSidebar();
        const offset = sectionOffsetsRef.current[sectionName];
        if (offset !== undefined) {
            scrollViewRef.current?.scrollTo({ y: offset, animated: true });
        } else {
            console.warn(`Seção '${sectionName}' offset não encontrado.`);
        }
    };

    const handleLayout = (event: LayoutChangeEvent, sectionName: keyof SectionOffsets) => {
        sectionOffsetsRef.current[sectionName] = event.nativeEvent.layout.y;
    };

    const renderSectionContent = (loading: boolean, error: string | null, data: any, emptyMessage: string, renderData: (data: any) => React.ReactNode) => {
        if (loading) {
            return <ActivityIndicator size="large" color="#0000ff" />;
        }
        if (error) {
            return <Text style={[styles.errorMessage, { color: 'red' }]}>{error}</Text>;
        }
        if (!data || (Array.isArray(data) && data.length === 0)) {
            return <Text style={styles.emptyMessage}>{emptyMessage}</Text>;
        }
        return renderData(data);
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.menuButton} onPress={toggleSidebar}>
                    <FontAwesomeIcon icon={sidebarOpen ? faTimes : faBars} size={24} color="#ffffffff" />
                </TouchableOpacity>
            </View>

            {sidebarOpen && (
                <View style={styles.sidebar}>
                    <TouchableOpacity style={styles.closeButton} onPress={closeSidebar}>
                        <FontAwesomeIcon icon={faTimes} size={24} color="#fff" />
                    </TouchableOpacity>

                    <Image
                                          source={require("../../../assets/images/escudo.png")}
                                          style={{ width: "80%", height: 90, borderRadius: 55, marginLeft: 20 }}
                                        />
                                        <Text style={styles.title}>Associação Desportiva Cipoense</Text>

                    <TouchableOpacity style={styles.navItem} onPress={() => scrollToSection('agenda')}>
                        <FontAwesomeIcon icon={faCalendarAlt} size={16} color="#fff" style={styles.navIcon} />
                        <Text style={styles.navText}>Agenda de Treinos</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.navItem} onPress={() => scrollToSection('desempenho')}>
                        <FontAwesomeIcon icon={faChartLine} size={16} color="#fff" style={styles.navIcon} />
                        <Text style={styles.navText}>Meu Desempenho</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.navItem} onPress={() => scrollToSection('comunicados')}>
                        <FontAwesomeIcon icon={faBell} size={16} color="#fff" style={styles.navIcon} />
                        <Text style={styles.navText}>Comunicados</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.navItem} onPress={Perfil}>
                        <FontAwesomeIcon icon={faUser} size={16} color="#fff" style={styles.navIcon} />
                        <Text style={styles.navText}>Meu Perfil</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.navItem} onPress={handleLogout}>
                        <FontAwesomeIcon icon={faSignOutAlt} size={16} color="#fff" style={styles.navIcon} />
                        <Text style={styles.navText}>Sair</Text>
                    </TouchableOpacity>
                </View>
            )}

            <ScrollView ref={scrollViewRef} style={styles.scrollContainer}>

                <View style={styles.section} onLayout={(event) => handleLayout(event, 'agenda')}>
                    <Text style={styles.sectionTitle}>Agenda de Treinos</Text>
                    {renderSectionContent(
                        eventosState.loading,
                        eventosState.error,
                        eventosState.data,
                        'Nenhum treino agendado para você.',
                        (eventos) => (
                            <FlatList
                                data={eventos}
                                keyExtractor={item => item.id}
                                renderItem={({ item }) => (
                                    <View style={styles.eventCard}>
                                        <Text style={styles.eventDate}>📅 {item.data}</Text>
                                        <Text style={styles.eventDescription}>📝 {item.descricao}</Text>
                                        <Text style={styles.eventDetail}>👨‍🏫 Professor: {item.professor}</Text>
                                        <Text style={styles.eventDetail}>📍 Local: {item.local}</Text>
                                        <Text style={styles.eventDetail}>⏰ Horário: {item.horario}</Text>
                                    </View>
                                )}
                                scrollEnabled={false}
                                contentContainerStyle={styles.eventListContainer}
                            />
                        )
                    )}
                </View>
                <View style={styles.section} onLayout={(event) => handleLayout(event, 'desempenho')}>
                    <Text style={styles.sectionTitle}>Meu Desempenho</Text>
                    {renderSectionContent(
                        analiseState.loading,
                        analiseState.error,
                        analiseState.data,
                        'Nenhuma análise de desempenho disponível para você no momento.',
                        (analiseDesempenho) => (
                            <View style={styles.comunicadoCard}>
                                <Text style={styles.comunicadoAssunto}>Análise de Desempenho Personalizada</Text>
                                {analiseDesempenho.split('\n').map((paragraph: string, index: number) => (
                                    <Text key={index} style={styles.comunicadoMensagem}>{paragraph}</Text>
                                ))}
                                <Text style={styles.comunicadoData}>Gerado em: {new Date().toLocaleDateString('pt-BR')}</Text>
                            </View>
                        )
                    )}
                </View>
                <View style={styles.section} onLayout={(event) => handleLayout(event, 'comunicados')}>
                    <Text style={styles.sectionTitle}>Comunicados</Text>
                    {renderSectionContent(
                        comunicadosState.loading,
                        comunicadosState.error,
                        comunicadosState.data,
                        'Nenhum comunicado disponível.',
                        (comunicadosRecebidos) => (
                            <View>
                                {comunicadosRecebidos.map((comunicado: ComunicadoResponse) => (
                                    <View key={comunicado.id} style={styles.comunicadoCard}>
                                        <Text style={styles.comunicadoAssunto}>{comunicado.assunto}</Text>
                                        <Text style={styles.comunicadoMensagem}>{comunicado.mensagem}</Text>
                                        <Text style={styles.comunicadoData}>Data de Envio: {new Date(comunicado.dataEnvio).toLocaleDateString('pt-BR')}</Text>
                                    </View>
                                ))}
                            </View>
                        )
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default Usuario;