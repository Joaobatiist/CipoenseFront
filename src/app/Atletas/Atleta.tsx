import React, { useState, useRef, useEffect } from 'react';
import { SafeAreaView, View, TouchableOpacity, Text, ScrollView, LayoutChangeEvent, Alert, FlatList } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faBars, faTimes, faCalendarAlt, faChartLine, faBell, faUser, faSignOutAlt } from '@fortawesome/free-solid-svg-icons';

import { ptBR } from "../../utils/localendarConfig"
import { LocaleConfig } from 'react-native-calendars'; 
import { router } from 'expo-router';
import { styles } from "../../Styles/Atleta" 
import AsyncStorage from '@react-native-async-storage/async-storage';

LocaleConfig.locales["pt-br"] = ptBR
LocaleConfig.defaultLocale = "pt-br"

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

const Usuario: React.FC = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const scrollViewRef = useRef<ScrollView>(null); 
    const sectionOffsetsRef = useRef<SectionOffsets>({});
    
    const [comunicadosRecebidos, setComunicadosRecebidos] = useState<ComunicadoResponse[]>([]);
    const [loadingComunicados, setLoadingComunicados] = useState<boolean>(true);
    const [errorComunicados, setErrorComunicados] = useState<string | null>(null);

    const [eventos, setEventos] = useState<Evento[]>([]);
    const [loadingEventos, setLoadingEventos] = useState<boolean>(true);
    const [errorEventos, setErrorEventos] = useState<string | null>(null);

    const getToken = async (): Promise<string | null> => {
        try {
            const token = await AsyncStorage.getItem('jwtToken');
            return token;
        } catch (error) {
            console.error('DEBUG TOKEN (UsuarioScreen): Erro ao obter token do AsyncStorage:', error);
            return null;
        }
    };

    const fetchComunicados = async () => {
        setLoadingComunicados(true);
        setErrorComunicados(null);
        try {
            const token = await getToken();
            if (!token) {
                setErrorComunicados("Token JWT não encontrado para comunicados.");
                setLoadingComunicados(false);
                return;
            }
            
            
            const response = await fetch(`${API_BASE_URL}/api/comunicados`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const errorBody = await response.text();
                throw new Error(`Erro HTTP! status: ${response.status}, corpo: ${errorBody}`);
            }

            const data: ComunicadoResponse[] = await response.json();
            setComunicadosRecebidos(data);
        } catch (error: any) {
            console.error('ERRO GERAL NO FETCH_COMUNICADOS:', error);
            setErrorComunicados(`Falha ao carregar comunicados: ${error.message || 'Erro desconhecido'}`);
        } finally {
            setLoadingComunicados(false);
        }
    };

    const fetchEvents = async () => {
        setLoadingEventos(true);
        setErrorEventos(null);
        console.log('FETCH_EVENTS (UsuarioScreen): Iniciando busca de eventos...');
        try {
            const token = await getToken();
            if (!token) {
                console.warn('FETCH_EVENTS (UsuarioScreen): Token não encontrado para buscar eventos. Interrompendo a busca.');
                setErrorEventos('Sua sessão expirou ou você não está logado. Por favor, faça login novamente para ver os treinos.');
                setLoadingEventos(false);
                return;
            }
            console.log('FETCH_EVENTS (UsuarioScreen): Token presente para requisição GET de eventos.');

            const response = await fetch(`${API_BASE_URL}/api/eventos`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('FETCH_EVENTS (UsuarioScreen): Erro ao buscar eventos do backend:', response.status, errorText);
                throw new Error(`Falha ao carregar eventos: ${response.status} - ${errorText}`);
            }

            const data: Evento[] = await response.json();
            console.log('FETCH_EVENTS (UsuarioScreen): Dados brutos de eventos recebidos:', data); // <--- NOVO LOG
            const formattedData = data.map(event => ({
                ...event,
                data: new Date(event.data + 'T00:00:00').toLocaleDateString('pt-BR'), 
            }));
            setEventos(formattedData);
            console.log('FETCH_EVENTS (UsuarioScreen): Eventos carregados e formatados com sucesso. Quantidade:', formattedData.length); // <--- NOVO LOG
        } catch (error: any) {
            console.error("FETCH_EVENTS (UsuarioScreen): Falha ao buscar eventos:", error);
            setErrorEventos(`Não foi possível carregar a agenda de treinos. ${error.message || 'Tente novamente.'}`);
            setEventos([]); // Garante que a lista esteja vazia em caso de erro
        } finally {
            setLoadingEventos(false);
            console.log('FETCH_EVENTS (UsuarioScreen): Finalizado. loadingEventos:', false, 'errorEventos:', errorEventos); // <--- NOVO LOG
        }
    };

    useEffect(() => {
        fetchComunicados();
        fetchEvents();
    }, []);

    function Perfil() {
        router.navigate("./index");
    }

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

    const navigateToMeusTreinos = () => {
        scrollToSection('agenda');
    };

    const navigateToDesempenho = () => {
        scrollToSection('desempenho');
    };

    const navigateToComunicados = () => {
        scrollToSection('comunicados');
    };

    

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.menuButton} onPress={toggleSidebar}>
                    <FontAwesomeIcon icon={sidebarOpen ? faTimes : faBars} size={24} color="#333" /> 
                </TouchableOpacity>
            </View>

            {sidebarOpen && (
                <View style={styles.sidebar}>
                    <TouchableOpacity style={styles.closeButton} onPress={closeSidebar}>
                        <FontAwesomeIcon icon={faTimes} size={24} color="#fff" />
                    </TouchableOpacity>

                    <Text style={styles.logo}>Associação Desportiva Cipoense</Text>

                    <TouchableOpacity style={styles.navItem} onPress={navigateToMeusTreinos}>
                        <FontAwesomeIcon icon={faCalendarAlt} size={16} color="#fff" style={styles.navIcon} />
                        <Text style={styles.navText}>Agenda de Treinos</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.navItem} onPress={navigateToDesempenho}>
                        <FontAwesomeIcon icon={faChartLine} size={16} color="#fff" style={styles.navIcon} />
                        <Text style={styles.navText}>Meu Desempenho</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.navItem} onPress={navigateToComunicados}>
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
                    
                    {loadingEventos ? (
                        <Text style={styles.loadingMessage}>Carregando agenda de treinos...</Text>
                    ) : errorEventos ? (
                        <Text style={[styles.errorMessage, { color: 'red' }]}>{errorEventos}</Text>
                    ) : eventos.length === 0 ? (
                        <Text style={styles.emptyMessage}>Nenhum treino agendado para você.</Text>
                    ) : (
                        // <Text>Debug: {JSON.stringify(eventos, null, 2)}</Text> {/* <--- NOVO: Para ver os dados */}
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
                    )}
                </View>
                
                <View style={styles.section} onLayout={(event) => handleLayout(event, 'desempenho')}>
                    <Text style={styles.sectionTitle}>Meu Desempenho</Text>
                    <Text style={styles.emptyMessage}>Conteúdo da seção Meu Desempenho será implementado aqui.</Text>
                </View>

                <View style={styles.section} onLayout={(event) => handleLayout(event, 'comunicados')}>
                    <Text style={styles.sectionTitle}>Comunicados</Text>
                    
                    {loadingComunicados ? (
                        <Text style={styles.loadingMessage}>Carregando comunicados...</Text>
                    ) : errorComunicados ? (
                        <Text style={[styles.errorMessage, { color: 'red' }]}>{errorComunicados}</Text>
                    ) : comunicadosRecebidos.length === 0 ? (
                        <Text style={styles.emptyMessage}>Nenhum comunicado disponível.</Text>
                    ) : (
                        <View>
                            {comunicadosRecebidos.map((comunicado) => (
                                <View key={comunicado.id} style={styles.comunicadoCard}>
                                    <Text style={styles.comunicadoAssunto}>{comunicado.assunto}</Text>
                                    <Text style={styles.comunicadoMensagem}>{comunicado.mensagem}</Text>
                                    <Text style={styles.comunicadoData}>Data de Envio: {new Date(comunicado.dataEnvio).toLocaleDateString('pt-BR')}</Text>
                                </  View>
                            ))}
                        </View>
                    )}
                </View>

             

            </ScrollView>
        </SafeAreaView>
    );
};

export default Usuario;