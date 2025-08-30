import React, { useState, useRef, useEffect } from 'react';
import { SafeAreaView, View, TouchableOpacity, Text, ScrollView, LayoutChangeEvent, Alert, FlatList, ActivityIndicator, Image } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faBars, faTimes, faCalendarAlt, faChartLine, faBell, faUser, faSignOutAlt, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import { jwtDecode} from 'jwt-decode';
import { ptBR } from "../../utils/localendarConfig";
import { LocaleConfig } from 'react-native-calendars';
import { router } from 'expo-router';
import { styles } from "../../Styles/Atleta";
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configuração do calendário
LocaleConfig.locales["pt-br"] = ptBR;
LocaleConfig.defaultLocale = "pt-br";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

// --- Interfaces ---
interface SectionOffsets { agenda?: number; desempenho?: number; comunicados?: number; perfil?: number; }
interface JwtPayload { userName: string; }
interface Evento { id: string; data: string; descricao: string; professor: string; local: string; horario: string; }
interface DestinatarioResponse { id: number; nome: string; tipo: string; }
interface RemetenteResponse { id: number; nome: string; tipo: string; }

interface ComunicadoResponse {
  id: number;
  assunto: string;
  mensagem: string;
  dataEnvio: string;
  destinatarios: DestinatarioResponse[];
  remetente: RemetenteResponse;
}

interface AnaliseIa {
    id: number;
    respostaIA: string;
    dataAnalise: string;
}

interface AnaliseApiResponse {
    atletaEmail: string;
    nomeAtleta: string;
    analiseDesempenhoIA: string;
    dataAnalise?: string; 
}

interface ApiResponse<T> {
    data: T | null;
    loading: boolean;
    error: string | null;
}

const Usuario: React.FC = () => {
    // --- Estados ---
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const scrollViewRef = useRef<ScrollView>(null);
    const sectionOffsetsRef = useRef<SectionOffsets>({});
    const [userName, setUserName] = useState<string>('');
    
    const [comunicadosState, setComunicadosState] = useState<ApiResponse<ComunicadoResponse[]>>({ data: null, loading: true, error: null });
    const [eventosState, setEventosState] = useState<ApiResponse<Evento[]>>({ data: null, loading: true, error: null });
    const [minhaAnaliseState, setMinhaAnaliseState] = useState<ApiResponse<AnaliseIa>>({ data: null, loading: true, error: null });
    const [hiddenComunicados, setHiddenComunicados] = useState<number[]>([]);

    // --- Funções de Lógica e API ---
    const getToken = async (): Promise<string | null> => {
        try { return await AsyncStorage.getItem('jwtToken'); } catch (error) { return null; }
    };

    const getUserNameFromToken = async () => {
        const token = await getToken();
        if (token) {
            try { setUserName(jwtDecode<JwtPayload>(token).userName || 'Usuário'); } catch (error) { setUserName('Usuário'); }
        } else { setUserName('Usuário'); }
    };

    const fetchApiData = async <T,>(endpoint: string): Promise<T> => {
        const token = await getToken();
        if (!token) throw new Error("Token não encontrado.");
        const response = await fetch(`${API_BASE_URL}${endpoint}`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (!response.ok) {
             const errorBody = await response.text();
             throw new Error(`Erro na API: ${response.status} - ${errorBody}`);
        }
        return response.json();
    };

    // --- Efeito para Carregar Dados (COM A LÓGICA CORRIGIDA) ---
    useEffect(() => {
        const loadAllData = async () => {
            await getUserNameFromToken();
            try {
                const [comunicados, eventos, responseDaAnalise] = await Promise.all([
                    fetchApiData<ComunicadoResponse[]>('/api/comunicados'),
                    fetchApiData<Evento[]>('/api/eventos'),
                    fetchApiData<AnaliseApiResponse>('/api/atleta/minha-analise') 
                ]);

                setComunicadosState({ data: comunicados, loading: false, error: null });
                setEventosState({
                    data: eventos.map(event => ({ ...event, data: new Date(event.data + 'T00:00:00').toLocaleDateString('pt-BR') })),
                    loading: false, error: null
                });

                // LÓGICA CORRIGIDA AQUI
                if (responseDaAnalise && responseDaAnalise.dataAnalise) {
                    const analiseCorreta: AnaliseIa = {
                        id: 0,
                        respostaIA: responseDaAnalise.analiseDesempenhoIA,
                        dataAnalise: responseDaAnalise.dataAnalise,
                    };
                    setMinhaAnaliseState({ data: analiseCorreta, loading: false, error: null });
                } else {
                    // Se não houver data, consideramos que não há análise válida.
                    // A tela mostrará a "emptyMessage" da seção.
                    setMinhaAnaliseState({ data: null, loading: false, error: null });
                }

            } catch (error: any) {
                const errorMessage = error.message || 'Falha ao carregar dados.';
                setComunicadosState(s => ({ ...s, loading: false, error: errorMessage }));
                setEventosState(s => ({ ...s, loading: false, error: errorMessage }));
                setMinhaAnaliseState(s => ({ ...s, loading: false, error: "Não foi possível carregar a análise." }));
            }
        };
        loadAllData();
    }, []);
    
    // --- Funções de Interação ---
    const handleLogout = async () => {
        await AsyncStorage.removeItem('jwtToken');
        router.replace('../../');
    };

    const hideComunicado = (comunicadoId: number) => {
        setHiddenComunicados(prev => [...prev, comunicadoId]);
        Alert.alert('Comunicado Oculto');
    };

    const Perfil = () => router.navigate('../funcionarios/Perfil');
    const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
    const closeSidebar = () => setSidebarOpen(false);

    const scrollToSection = (sectionName: keyof SectionOffsets) => {
        closeSidebar();
        const offset = sectionOffsetsRef.current[sectionName];
        if (offset !== undefined) scrollViewRef.current?.scrollTo({ y: offset, animated: true });
    };

    const handleLayout = (event: LayoutChangeEvent, sectionName: keyof SectionOffsets) => {
        sectionOffsetsRef.current[sectionName] = event.nativeEvent.layout.y;
    };

    // --- Renderização ---
    const renderSectionContent = (loading: boolean, error: string | null, data: any, emptyMessage: string, renderData: (data: any) => React.ReactNode) => {
        if (loading) return <ActivityIndicator size="large" color="#1c348e" />;
        if (error) return <Text style={styles.errorMessage}>{error}</Text>;
        if (!data || (Array.isArray(data) && data.length === 0)) return <Text style={styles.emptyMessage}>{emptyMessage}</Text>;
        return renderData(data);
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.menuButton} onPress={toggleSidebar}>
                    <FontAwesomeIcon icon={sidebarOpen ? faTimes : faBars} size={24} color="#ffffffff" />
                    </TouchableOpacity><Text style={styles.titleheader}>Olá, {userName}!</Text>
                    </View>
            {sidebarOpen && (<View style={styles.sidebar}>
                <TouchableOpacity style={styles.closeButton} onPress={closeSidebar}>
                    <FontAwesomeIcon icon={faTimes} size={24} color="#fff" />
                    </TouchableOpacity>
                    <Image source={require("../../../assets/images/escudo.png")} style={{ width: "80%", height: 90, borderRadius: 55, marginLeft: 20, marginBottom: 10 }} />
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
                                        </TouchableOpacity></View>)}

            <ScrollView ref={scrollViewRef} style={styles.scrollContainer}>
                {/* Agenda */}
                <View style={styles.section} onLayout={(event) => handleLayout(event, 'agenda')}>
                    <Text style={styles.sectionTitle}>Agenda de Treinos</Text>
                    {renderSectionContent(
                        eventosState.loading, eventosState.error, eventosState.data, 'Nenhum treino agendado.', (eventos) => 
                        (<FlatList data={eventos} keyExtractor={item => item.id.toString()}
                         scrollEnabled={false} renderItem={({ item }) => (
                         <View style={styles.eventCard}>
                            <Text style={styles.eventDate}>📅 {item.data}</Text>
                            <Text style={styles.eventDescription}>📝 {item.descricao}</Text>
                            <Text style={styles.eventDetail}>👨‍🏫 Professor: {item.professor}</Text>
                            <Text style={styles.eventDetail}>📍 Local: {item.local}</Text>
                            <Text style={styles.eventDetail}>⏰ Horário: {item.horario}</Text>
                            </View>)} />))}
                            </View>

                {/* Comunicados */}
                <View style={styles.section} onLayout={(event) => handleLayout(event, 'comunicados')}>
                    <Text style={styles.sectionTitle}>Comunicados</Text>
                    {renderSectionContent(comunicadosState.loading, comunicadosState.error, comunicadosState.data, 'Nenhum comunicado disponível.',
                         (comunicadosRecebidos) => {
                            const visibleComunicados = comunicadosRecebidos.filter((c: ComunicadoResponse) => !hiddenComunicados.includes(c.id));
                            if (visibleComunicados.length === 0) return <Text style={styles.emptyMessage}>Nenhum comunicado para exibir.</Text>;
                            return (<View>{visibleComunicados.map((comunicado: ComunicadoResponse) => (
                            <View key={comunicado.id} style={styles.comunicadoCard}>
                                <Text style={styles.comunicadoAssunto}>{comunicado.assunto}</Text>
                                <Text style={styles.comunicadoMensagem}>{comunicado.mensagem}</Text>
                                <Text style={styles.comunicadoDestinatarios}>De: {comunicado.remetente.nome}</Text>
                                <Text style={styles.comunicadoDestinatarios}>Para: {comunicado.destinatarios.map(d => d.nome).join(', ')}</Text>
                                <Text style={styles.comunicadoData}>Em: {comunicado.dataEnvio}</Text>
                                <View style={styles.eventActions}><TouchableOpacity onPress={() => hideComunicado(comunicado.id)} style={styles.hideButton}>
                                    <FontAwesomeIcon icon={faEyeSlash} size={16} color="#fff" />
                                    <Text style={styles.buttonText}>Ocultar</Text>
                                    </TouchableOpacity>
                                    </View>
                                    </View>))}
                                    </View>);})}</View>
                
               
                <View style={styles.section} onLayout={(event) => handleLayout(event, 'desempenho')}>
                    <Text style={styles.sectionTitle}>Meu Desempenho</Text>
                    {renderSectionContent(minhaAnaliseState.loading, minhaAnaliseState.error, minhaAnaliseState.data, 'Nenhuma análise de desempenho disponível.', (analise) => (
                        <View style={styles.comunicadoCard}>
                            <Text style={styles.comunicadoAssunto}>Análise de Desempenho Personalizada</Text>
                            {analise.respostaIA.split('\n').map((paragraph: string, index: number) => (
                                <Text key={index} style={styles.comunicadoMensagem}>{paragraph}</Text>
                            ))}
                            <Text style={styles.comunicadoData}>
                                Gerado em: {new Date(analise.dataAnalise).toLocaleDateString('pt-BR')}
                            </Text>
                        </View>
                    ))}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default Usuario;