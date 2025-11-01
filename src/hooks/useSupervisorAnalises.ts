import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, FlatList, Platform, ScrollView } from 'react-native';
import { toast } from 'react-toastify';
import {
    AnaliseIa,
    API_BASE_URL,
    Atleta,
    CustomJwtPayload,
} from '../types/analiseTypes';

export const useSupervisorAnalises = () => {
    // Refs
    const scrollViewRef = useRef<ScrollView>(null);
    const flatListRef = useRef<FlatList<Atleta>>(null);
    
    // Estado
    const [atletas, setAtletas] = useState<Atleta[]>([]);
    const [searchText, setSearchText] = useState('');
    const [analises, setAnalises] = useState<AnaliseIa[]>([]);
    const [loadingAtletas, setLoadingAtletas] = useState(true);
    const [loadingAnalises, setLoadingAnalises] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedAtleta, setSelectedAtleta] = useState<Atleta | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [userName, setUserName] = useState('Usuário');
    const [userRole, setUserRole] = useState<string>('');
    const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

    // Contexto de Usuário e Sidebar
    useEffect(() => {
        const loadUserData = async () => {
            try {
                const token = await AsyncStorage.getItem('jwtToken');
                if (token) {
                    const decoded = jwtDecode<CustomJwtPayload>(token);
                    setUserName(decoded.userName || 'Usuário');
                    setUserRole(decoded.roles?.[0] || '');
                }
            } catch (error) {
                console.error('Erro ao decodificar token:', error);
            }
        };
        loadUserData();
    }, []);

    const toggleSidebar = useCallback(() => setSidebarOpen(prev => !prev), []);
    const closeSidebar = useCallback(() => setSidebarOpen(false), []);
    
    // Filtro Otimizado
    const filteredAtletas = useMemo(() => {
        if (!searchText.trim()) return atletas;
        return atletas.filter(atleta =>
            atleta.nomeCompleto.toLowerCase().includes(searchText.toLowerCase().trim())
        );
    }, [atletas, searchText]);


    // Helpers de API
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
        const errorMessage = error.message; 
        if (errorMessage?.includes('Token')) {
            return 'Sessão expirada. Faça login novamente.';
        }
        if (errorMessage?.includes('Network') || errorMessage?.includes('Failed to fetch')) {
            return 'Erro de conexão. Verifique sua internet.';
        }
        return errorMessage || `Erro ao ${context.toLowerCase()}.`;
    }, []);

    // API Call: Fetch Analises (Declarado primeiro para ser usado pelo handleSelectAtleta)
    const fetchAnalisesByAtleta = useCallback(async (atletaEmail: string) => {
        if (!atletaEmail?.trim()) {
            setAnalises([]);
            return;
        }

        setLoadingAnalises(true);
        setError(null);
        setAnalises([]);
        
        try {
            const token = await getToken();
            if (!token) throw new Error('Token de autenticação não encontrado.');
            
            const response = await fetch(`${API_BASE_URL}/api/analises/atleta/${encodeURIComponent(atletaEmail)}`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (response.status === 204 || response.status === 404) {
                setAnalises([]);
                return;
            }

            if (!response.ok) throw new Error(`Erro ${response.status}: Falha ao buscar análises`);
            
            const data: AnaliseIa[] = await response.json();
            setAnalises(Array.isArray(data) ? data : []);

            if (data && data.length > 0) {
                const mensagem = `${data.length} análise${data.length > 1 ? 's' : ''} carregada${data.length > 1 ? 's' : ''} com sucesso!`;
                if (Platform.OS === 'web') {
                    toast.success(mensagem);
                } else {
                    Alert.alert('Sucesso', mensagem);
                }
            }

        } catch (error: any) {
            const errorMessage = handleApiError(error, 'buscar análises');
            setError(errorMessage);
            setAnalises([]);
        } finally {
            setLoadingAnalises(false);
        }
    }, [getToken, handleApiError]);


    // API Call: Fetch Atletas
    const fetchAtletas = useCallback(async () => {
        setLoadingAtletas(true);
        setError(null);
        
        try {
            const token = await getToken();
            if (!token) throw new Error('Token de autenticação não encontrado.');
            
            const response = await fetch(`${API_BASE_URL}/api/atletas/listagem`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (!response.ok) throw new Error(`Erro ${response.status}: Falha ao buscar atletas`);

            const data: Atleta[] = await response.json();
            setAtletas(data);
            
        } catch (error: any) {
            const errorMessage = handleApiError(error, 'buscar atletas');
            setError(errorMessage);
        } finally {
            setLoadingAtletas(false);
        }
    }, [getToken, handleApiError]);


    // Handler: Seleção de Atleta
    const handleSelectAtleta = useCallback((atleta: Atleta) => {
        if (selectedAtleta?.id === atleta.id) {
            setSelectedAtleta(null);
            setAnalises([]);
            return;
        }
        
        setSelectedAtleta(atleta);
        fetchAnalisesByAtleta(atleta.email);
    }, [selectedAtleta, fetchAnalisesByAtleta]);

    // Handler: Mudança de Busca
    const handleSearchChange = useCallback((text: string) => {
        setSearchText(text);
        if (selectedAtleta && !selectedAtleta.nomeCompleto.toLowerCase().includes(text.toLowerCase())) {
            setSelectedAtleta(null);
            setAnalises([]);
        }
    }, [selectedAtleta]);

    // Handler: Deleção de Análise
    const handleDeleteAnalise = useCallback(async (analiseId: number) => {
        const executeDelete = async () => {
            try {
                const token = await getToken();
                if (!token) throw new Error('Token não encontrado');

                const response = await fetch(`${API_BASE_URL}/api/analises/delete?id=${analiseId}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                });

                const responseText = await response.text();
                
                if (!response.ok) {
                    let errorBody = responseText;
                    try { errorBody = JSON.parse(responseText)?.message || responseText; } catch {}
                    throw new Error(`Erro ao deletar: ${response.status} - ${errorBody}`);
                }

                setAnalises(prev => prev.filter(analise => analise.id !== analiseId));

                if (Platform.OS === 'web') {
                    toast.success('Análise deletada com sucesso!');
                } else {
                    Alert.alert('Sucesso', 'Análise deletada com sucesso!');
                }
            } catch (error: any) {
                console.error('Erro ao deletar análise:', error);
                const errorMessage = handleApiError(error, 'deletar análise');
                if (Platform.OS === 'web') {
                    toast.error(errorMessage);
                } else {
                    Alert.alert('Erro', errorMessage);
                }
            }
        };

        if (Platform.OS === 'web') {
            if (pendingDeleteId === analiseId.toString()) {
                await executeDelete();
                setPendingDeleteId(null);
            } else {
                if (pendingDeleteId !== analiseId.toString()) {
                    setPendingDeleteId(analiseId.toString());
                    toast.warning('⚠️ Tem certeza? Clique em "Deletar" novamente para confirmar', {
                        autoClose: 2000,
                        onClose: () => setPendingDeleteId(null)
                    });
                }
            }
        } else {
            Alert.alert(
                'Confirmar Exclusão',
                'Tem certeza que deseja deletar esta análise? Esta ação não pode ser desfeita.',
                [
                    { text: 'Cancelar', style: 'cancel' },
                    { text: 'Deletar', onPress: executeDelete, style: 'destructive' },
                ]
            );
        }
    }, [getToken, pendingDeleteId, handleApiError]);


    // Handler: Atualizar/Editar Análise
    const handleEditAnalise = useCallback(async (analise: AnaliseIa) => {
        try {
            const token = await getToken();
            if (!token) throw new Error('Token não encontrado');

            const response = await fetch(`${API_BASE_URL}/api/analises/update`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(analise),
            });

            const responseText = await response.text();

            if (!response.ok) {
                let errorBody = responseText;
                try { errorBody = JSON.parse(responseText)?.message || responseText; } catch {}
                throw new Error(`Erro ao atualizar: ${response.status} - ${errorBody}`);
            }

            // atualiza localmente
            setAnalises(prev => prev.map(a => (a.id === analise.id ? analise : a)));

            if (Platform.OS === 'web') {
                toast.success('Análise atualizada com sucesso!');
            } else {
                Alert.alert('Sucesso', 'Análise atualizada com sucesso!');
            }
        } catch (error: any) {
            console.error('Erro ao atualizar análise:', error);
            const errorMessage = handleApiError(error, 'atualizar análise');
            if (Platform.OS === 'web') {
                toast.error(errorMessage);
            } else {
                Alert.alert('Erro', errorMessage);
            }
        }
    }, [getToken, handleApiError]);


    // Efeito para carregar atletas no mont e refocar
    useEffect(() => {
        fetchAtletas();
    }, [fetchAtletas]);

    // Efeito de Navegação por Teclado (para Web)
    useEffect(() => {
        if (Platform.OS === 'web') {
            let currentScrollPosition = 0;
            
            const handleKeyDown = (event: KeyboardEvent) => {
                if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                    event.preventDefault();
                    
                    if (scrollViewRef.current) {
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
    }, []);
    
    return {
        // Refs
        scrollViewRef,
        flatListRef,
        // Estado e Dados
        filteredAtletas,
        analises,
        loadingAtletas,
        loadingAnalises,
        error,
        selectedAtleta,
        searchText,
        sidebarOpen,
        userName,
        userRole,
        pendingDeleteId,
        // Handlers e Setters
        toggleSidebar,
        closeSidebar,
        handleSearchChange,
        handleSelectAtleta,
        handleDeleteAnalise,
    handleEditAnalise,
        fetchAtletas, // Exposto para o botão "Recarregar Atletas"
    };
};