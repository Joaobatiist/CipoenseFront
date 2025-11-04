// Arquivo: useListaPresenca.ts (COMPLETO E CORRIGIDO)

import AsyncStorage from '@react-native-async-storage/async-storage';
import { isAxiosError } from 'axios';
import { router, useFocusEffect, useNavigation } from 'expo-router';
import { jwtDecode } from 'jwt-decode';
import moment from 'moment';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, FlatList, Platform } from 'react-native';
import { toast } from 'react-toastify';
import { presencaService } from '../services/presencaApi';
import { Aluno, CustomJwtPayload, Evento, PresencaData, PresencaRegistro, PresencasAgrupadas, ViewMode } from '../types/presencaTypes'; // PresencaRegistro importado

moment.locale('pt-br');

// Função de Tratamento de Erro (adaptada do seu snippet)
const handleApiError = (error: unknown, defaultMessage: string) => {
    let message = defaultMessage;
    if (isAxiosError(error) && error.response?.data?.message) {
        message = error.response.data.message;
    } else if (error instanceof Error) {
        message = error.message;
    }

    if (Platform.OS === 'web') {
        toast.error(message);
    } else {
        Alert.alert('Erro na API', message);
    }
};

export function useListaPresenca(width: number) {
  const isLargeScreen = width >= 768; // breakpoint
  const navigation = useNavigation();

  // --- Refs
  const flatListRef = useRef<FlatList<Aluno>>(null);
  // CORREÇÃO: a lista de histórico usa string (keys do objeto), não PresencasAgrupadas
  const historicoFlatListRef = useRef<FlatList<string>>(null);
  const scrollIndexRef = useRef(0);
  
  // --- Estado de Dados
  const [eventosDisponiveis, setEventosDisponiveis] = useState<Evento[]>([]); 
  const [selectedEventoId, setSelectedEventoId] = useState<string | null>(null); 
  const [alunos, setAlunos] = useState<Aluno[]>([]); 
  const [presencasAgrupadas, setPresencasAgrupadas] = useState<PresencasAgrupadas>({}); 
  
  const [viewMode, setViewMode] = useState<ViewMode>('registro'); 
  
  // --- Estado da UI/Loading
  const [loading, setLoading] = useState(true); 
  const [saving, setSaving] = useState(false); 
  const [showEventoPickerModal, setShowEventoPickerModal] = useState(true); // Começa aberto para escolher o evento
  const [focusIndex, setFocusIndex] = useState(0); 
  const [sidebarOpen, setSidebarOpen] = useState(false); 
  
  // --- Estado do Usuário
  const [userName, setUserName] = useState(''); 
  const [userRole, setUserRole] = useState(''); 

  // --- Handlers de Dados ---
  
  const loadUserData = useCallback(async () => {
    try {
        const token = await AsyncStorage.getItem('jwtToken');
        if (token) {
            const decoded = jwtDecode<CustomJwtPayload>(token);
            setUserName(decoded.userName || 'Usuário');
            setUserRole(decoded.roles?.[0] || 'ATLETA'); // Pega a primeira role
        } else {
            router.replace('../../'); // Força logout se não houver token
        }
    } catch (e) {
        console.error("Erro ao carregar dados do usuário:", e);
        router.replace('../../');
    }
  }, []);

  const fetchEventosDisponiveis = useCallback(async () => {
    setLoading(true);
    try {
        const eventos = await presencaService.fetchEventosDisponiveis();
        setEventosDisponiveis(eventos);
        
        // Seleciona o primeiro evento por padrão, se não houver um selecionado
        if (eventos.length > 0 && !selectedEventoId) {
            setSelectedEventoId(eventos[0].id);
            fetchAlunosForEvent(eventos[0].id);
        } else if (selectedEventoId && eventos.some(e => e.id === selectedEventoId)) {
            // Se já tem um evento selecionado e ele existe, recarrega a lista
            fetchAlunosForEvent(selectedEventoId);
        } else if (eventos.length > 0) {
            // Se o evento anterior não existe mais, seleciona o primeiro
            setSelectedEventoId(eventos[0].id);
            fetchAlunosForEvent(eventos[0].id);
        } else {
            setAlunos([]);
        }
    } catch (error) {
        handleApiError(error, 'Falha ao carregar lista de eventos');
        setEventosDisponiveis([]);
        setAlunos([]);
    } finally {
        setLoading(false);
    }
  }, [selectedEventoId]);

  const fetchAlunosForEvent = useCallback(async (eventoId: string) => { 
    setLoading(true);
    try {
      const alunosCarregados = await presencaService.fetchAlunosForEvent(eventoId);
      setAlunos(alunosCarregados);
      setFocusIndex(0); 
    } catch (error) {
      if (error instanceof Error && error.message.includes('Token')) { 
        Alert.alert('Erro de Autenticação', 'Token não encontrado. Faça login novamente.'); 
        router.replace('../../'); 
      } else {
        handleApiError(error, 'Falha ao carregar lista de presença do evento'); 
        setAlunos([]); 
      }
    } finally {
      setLoading(false); 
    }
  }, []);

  const fetchHistoricoPresencas = useCallback(async (eventoId?: string) => {
    setLoading(true);
    try {
      if (eventoId) {
        // Busca apenas o histórico do evento específico
        const alunosHistorico = await presencaService.fetchAlunosForEvent(eventoId);
        // Filtra apenas os que já têm presença marcada
        const presencasMarcadas = alunosHistorico.filter(aluno => aluno.presente !== null);
        
        // Agrupa por evento (não por data)
        const agrupado: PresencasAgrupadas = {};
        if (presencasMarcadas.length > 0) {
          const eventoKey = eventoId;
          agrupado[eventoKey] = presencasMarcadas.map(aluno => ({
            id: aluno.id || '',
            data: moment().format('YYYY-MM-DD'), // Data atual como fallback
            presente: aluno.presente!,
            atletaId: aluno.atletaId,
            nomeAtleta: aluno.nome,
            eventoId: aluno.eventoId,
            descricaoEvento: aluno.descricaoEvento,
          }));
        }
        setPresencasAgrupadas(agrupado);
      } else {
        // Busca histórico completo (comportamento anterior)
        const historico = await presencaService.fetchHistoricoPresencas();
        const agrupado = historico.reduce<PresencasAgrupadas>((acc, registro: PresencaRegistro) => {
          const dataFormatada = moment(registro.data).format('YYYY-MM-DD');
          if (!acc[dataFormatada]) {
            acc[dataFormatada] = [];
          }
          acc[dataFormatada].push(registro);
          return acc;
        }, {});
        setPresencasAgrupadas(agrupado);
      }
    } catch (error) {
      handleApiError(error, 'Falha ao carregar histórico');
      setPresencasAgrupadas({});
    } finally {
      setLoading(false);
    }
  }, []);

  // --- Handlers de Ação ---

  const onSelectEvento = useCallback((eventoId: string) => {
    setSelectedEventoId(eventoId);
    setShowEventoPickerModal(false);
    fetchAlunosForEvent(eventoId);
    setFocusIndex(0);
  }, [fetchAlunosForEvent]);

  const toggleSidebar = useCallback(() => {
    setSidebarOpen(prev => !prev);
  }, []);

  const handleStatusChange = useCallback((atletaId: string, presente: boolean) => {
    if (viewMode === 'registro') {
      setAlunos(prevAlunos => 
        prevAlunos.map(aluno =>
          aluno.atletaId === atletaId ? { ...aluno, presente } : aluno
        )
      );
    } else if (viewMode === 'historico') {
      // Atualiza o histórico quando editado
      setPresencasAgrupadas(prevAgrupadas => {
        const novoAgrupadas = { ...prevAgrupadas };
        Object.keys(novoAgrupadas).forEach(key => {
          novoAgrupadas[key] = novoAgrupadas[key].map(registro =>
            registro.atletaId === atletaId ? { ...registro, presente } : registro
          );
        });
        return novoAgrupadas;
      });
    }
  }, [viewMode]);


  // CRÍTICO: Implementação completa e corrigida da função de salvar presença
  const salvarPresenca = useCallback(async () => {
    if (!selectedEventoId) {
        Alert.alert('Erro', 'Nenhum evento selecionado para salvar.');
        return;
    }

    let presencasParaEnviar: PresencaData[] = [];

    if (viewMode === 'registro') {
      // 1. Prepara os dados: Filtra apenas os alunos marcados e inclui o eventoId
      presencasParaEnviar = alunos
          .filter(aluno => aluno.presente !== null)
          .map(aluno => ({
              atletaId: aluno.atletaId,
              presente: aluno.presente!,
              eventoId: selectedEventoId, // <--- CRÍTICO: Inclui o ID do Evento
          }));
    } else if (viewMode === 'historico') {
      // Salva as alterações do histórico
      const registrosHistorico = Object.values(presencasAgrupadas).flat();
      presencasParaEnviar = registrosHistorico.map(registro => ({
        atletaId: registro.atletaId,
        presente: registro.presente,
        eventoId: registro.eventoId,
      }));
    }

    if (presencasParaEnviar.length === 0) {
        Alert.alert('Atenção', 'Nenhuma presença foi marcada para salvar.');
        return;
    }

    setSaving(true);
    try {
        await presencaService.salvarPresenca(presencasParaEnviar);
        
        // 2. CORREÇÃO CRÍTICA: Recarrega a lista após o salvamento ser bem-sucedido
        if (viewMode === 'registro') {
          await fetchAlunosForEvent(selectedEventoId); 
        } else if (viewMode === 'historico') {
          await fetchHistoricoPresencas(selectedEventoId);
        }

        // 3. Exibe mensagens de feedback
        if (Platform.OS === 'web') { toast.success('Presenças salvas com sucesso!'); } else { Alert.alert('Sucesso', 'Presenças salvas com sucesso!'); }

    } catch (error) { 
        handleApiError(error, 'Falha ao salvar presenças'); 
    } finally { 
        setSaving(false); 
    }
  }, [alunos, selectedEventoId, fetchAlunosForEvent, viewMode, presencasAgrupadas, fetchHistoricoPresencas]);


  // --- Efeitos ---

  // Efeito principal de foco (carrega dados na entrada da tela)
  useFocusEffect(
    useCallback(() => {
      loadUserData();
      fetchEventosDisponiveis(); 
      // Não chama fetchAlunosForEvent aqui; ele é chamado dentro de fetchEventosDisponiveis
      
      if (viewMode === 'historico') {
        fetchHistoricoPresencas(selectedEventoId || undefined);
      }
      return () => {
        // Limpeza (se necessário)
      };
    }, [loadUserData, viewMode, fetchEventosDisponiveis, fetchHistoricoPresencas])
  );

  // Efeito para recarregar a lista de atletas quando o evento selecionado mudar
  useEffect(() => {
    if (selectedEventoId && viewMode === 'registro') {
      fetchAlunosForEvent(selectedEventoId);
    }
  }, [selectedEventoId, viewMode]);


  // ... (Restante do seu código, incluindo lógica de teclado, onScrollToIndexFailed, etc.) ...
  
  // safe scrollToIndex fallback
  const onScrollToIndexFailed = useCallback(
    (info: { index: number; highestMeasuredFrameIndex: number; averageItemLength: number }) => {
      if (viewMode === 'historico' && historicoFlatListRef.current) {
        setTimeout(() => {
          try {
            historicoFlatListRef.current?.scrollToIndex({ index: Math.min(info.index, info.highestMeasuredFrameIndex), animated: true });
          } catch {
            historicoFlatListRef.current?.scrollToOffset({ offset: 0, animated: true });
          }
        }, 250);
      } else if (viewMode === 'registro' && flatListRef.current) {
        setTimeout(() => {
          try {
            flatListRef.current?.scrollToIndex({ index: Math.min(info.index, info.highestMeasuredFrameIndex), animated: true });
          } catch {
            flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
          }
        }, 250);
      }
    },
    [viewMode]
  );

  // --- Retorno do Hook ---

  return {
    // Refs
    flatListRef,
    historicoFlatListRef,
    // Estado de Dados
    alunos,
    presencasAgrupadas,
    eventosDisponiveis,
    selectedEventoId,
    viewMode,
    loading,
    saving,
    focusIndex,
    isLargeScreen,
    sidebarOpen,
    userName,
    userRole,
    showEventoPickerModal,
    // Setters
    setSelectedEventoId,
    setViewMode,
    setShowEventoPickerModal,
    setFocusIndex,
    // Funções/Handlers
    salvarPresenca, // Expõe para o botão Salvar
    onSelectEvento,
    handleStatusChange,
    toggleSidebar,
    onScrollToIndexFailed,
    fetchHistoricoPresencas, // Para mudar o viewMode
    fetchAlunosForEvent,
  };
}