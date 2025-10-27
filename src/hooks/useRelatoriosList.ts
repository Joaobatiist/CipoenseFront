// src/hooks/useRelatoriosList.ts

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { parse } from 'date-fns';
import { toast } from 'react-toastify';
import { Alert, Platform } from 'react-native';
import { 
    AvaliacaoGeral, 
    Atleta,
    CustomJwtPayload
} from '../types/RelatorioTypes'; // Ajuste o caminho conforme a estrutura
import { 
    fetchHistoricalEvaluations, 
    fetchAthletesList, 
    fetchAvaliacaoGeralById, 
    deleteAvaliacaoGeral 
} from '../services/relatorioApi'; // Ajuste o caminho
import { jwtDecode } from 'jwt-decode';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useRelatoriosList = () => {
    const [evaluations, setEvaluations] = useState<AvaliacaoGeral[]>([]);
    const [atletasList, setAtletasList] = useState<Atleta[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedAtletaId, setSelectedAtletaId] = useState<number>(0);
    const [searchText, setSearchText] = useState('');
    
    // States para Modal de Detalhes
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedEvaluationDetails, setSelectedEvaluationDetails] = useState<AvaliacaoGeral | null>(null);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [detailsError, setDetailsError] = useState<string | null>(null);
    
    // State para confirmação de exclusão web (PendingDeleteId)
    const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);

    // Dados do Usuário (Sidebar/Header)
    const [userName, setUserName] = useState('Usuário');
    const [userRole, setUserRole] = useState<string>('');

    // --- Lógica de Carregamento de Dados ---
    const loadUserData = useCallback(async () => {
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
    }, []);

    const loadEvaluationsAndAthletes = useCallback(async () => {
        setRefreshing(true);
        setError(null);
        try {
            const [fetchedEvaluations, fetchedAthletes] = await Promise.all([
                fetchHistoricalEvaluations(),
                fetchAthletesList()
            ]);

            // Ordenação por data (do mais recente ao mais antigo)
            fetchedEvaluations.sort((a, b) =>
                parse(b.dataAvaliacao, 'dd-MM-yyyy', new Date()).getTime() -
                parse(a.dataAvaliacao, 'dd-MM-yyyy', new Date()).getTime()
            );
            setEvaluations(fetchedEvaluations);
            setAtletasList(fetchedAthletes);
        } catch (err: any) {
            setError(err.message || "Erro desconhecido ao carregar dados.");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);
    
    // Carrega dados na montagem e no foco da tela
    useEffect(() => {
        loadUserData();
    }, [loadUserData]);

    useFocusEffect(
        useCallback(() => {
            loadEvaluationsAndAthletes();
        }, [loadEvaluationsAndAthletes])
    );
    
    // --- Lógica de Filtro e Busca ---
    const filteredEvaluations = useMemo(() => {
        let filtered = evaluations.filter(
            (evaluation) => selectedAtletaId === 0 || evaluation.atletaId === selectedAtletaId
        );
        
        if (searchText.trim()) {
            const lowerSearchText = searchText.toLowerCase();
            filtered = filtered.filter((evaluation) =>
                evaluation.nomeAtleta.toLowerCase().includes(lowerSearchText) ||
                evaluation.userName.toLowerCase().includes(lowerSearchText) ||
                evaluation.subDivisao.toLowerCase().includes(lowerSearchText)
            );
        }
        
        return filtered;
    }, [selectedAtletaId, evaluations, searchText]);

    const handleAtletaFilterChange = (id: number) => {
        setSelectedAtletaId(id);
    };

    // --- Lógica de Visualização (Modal) ---
    const openDetailsModal = useCallback(async (evaluationId: number) => {
        setDetailsLoading(true);
        setModalVisible(true);
        setSelectedEvaluationDetails(null);
        setDetailsError(null);
        try {
            const completeDetails = await fetchAvaliacaoGeralById(evaluationId);
            setSelectedEvaluationDetails(completeDetails);
        } catch (err: any) {
            console.error('Erro ao carregar detalhes:', err);
            setDetailsError(err.message || "Erro ao carregar os detalhes da avaliação.");
        } finally {
            setDetailsLoading(false);
        }
    }, []);

    const closeDetailsModal = useCallback(() => {
        setModalVisible(false);
        setSelectedEvaluationDetails(null);
        setDetailsError(null);
    }, []);

    // --- Lógica de Exclusão ---
    const deleteEvaluation = useCallback(async (id: number) => {
        try {
            await deleteAvaliacaoGeral(id);
            
            if (Platform.OS === 'web') {
                toast.success("Avaliação excluída com sucesso.");
            } else {
                Alert.alert("Sucesso", "Avaliação excluída com sucesso.");
            }
            
            loadEvaluationsAndAthletes(); // Recarrega a lista
        } catch (err: any) {
            if (Platform.OS === 'web') {
                toast.error(err.message || "Erro. Não foi possível excluir a avaliação.");
            } else {
                Alert.alert("Erro", err.message || "Não foi possível excluir a avaliação.");
            }
        }
    }, [loadEvaluationsAndAthletes]);

    const handleDeleteEvaluation = useCallback((id: number) => {
        if (Platform.OS === 'web') {
            if (pendingDeleteId === id) {
                deleteEvaluation(id);
                setPendingDeleteId(null);
            } else {
                setPendingDeleteId(id);
                toast.warning('⚠️ Tem certeza? Clique em "Excluir" novamente para confirmar', {
                    autoClose: 3000,
                    onClose: () => setPendingDeleteId(null)
                });
            }
        } else {
            Alert.alert(
                "Confirmar Exclusão",
                "Tem certeza que deseja excluir esta avaliação? Esta ação é irreversível.",
                [
                    { text: "Cancelar", style: "cancel" },
                    { text: "Sim, Excluir", style: "destructive", onPress: () => deleteEvaluation(id) },
                ]
            );
        }
    }, [deleteEvaluation, pendingDeleteId]);


    return {
        // Dados de Estado
        evaluations,
        filteredEvaluations,
        atletasList,
        loading,
        refreshing,
        error,
        searchText,
        selectedAtletaId,
        modalVisible,
        selectedEvaluationDetails,
        detailsLoading,
        detailsError,
        userName,
        userRole,
        pendingDeleteId,
        // Funções de Ação
        loadEvaluationsAndAthletes, // Para RefreshControl
        setSearchText,
        handleAtletaFilterChange,
        openDetailsModal,
        closeDetailsModal,
        handleDeleteEvaluation,
    };
};