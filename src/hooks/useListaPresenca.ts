import { useCallback, useEffect, useState, useRef } from 'react';
import { Alert, Platform, FlatList } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { isAxiosError } from 'axios';
import { jwtDecode } from 'jwt-decode';
import { router, useFocusEffect } from 'expo-router';
import moment from 'moment';
import { toast } from 'react-toastify';
import { presencaService } from '../services/presencaApi';
import { Aluno, CustomJwtPayload, PresencaData, PresencasAgrupadas, PresencaRegistro, ViewMode } from '../types/presencaTypes';

moment.locale('pt-br');

export function useListaPresenca(width: number) {
  const isLargeScreen = width >= 768; // breakpoint

  // --- Estado de Dados
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [presencasAgrupadas, setPresencasAgrupadas] = useState<PresencasAgrupadas>({});
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [tempSelectedDate, setTempSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('registro');
  
  // --- Estado da UI/Loading
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDatePickerModal, setShowDatePickerModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userName, setUserName] = useState('Usuário');
  const [userRole, setUserRole] = useState<string>('');
  
  // --- Estado de Navegação (Web)
  const [focusIndex, setFocusIndex] = useState<number>(0);
  const flatListRef = useRef<FlatList<Aluno> | null>(null);
  const historicoFlatListRef = useRef<FlatList<string> | null>(null);

  // --- Funções de Utilidade
  const toggleSidebar = useCallback(() => setSidebarOpen(prev => !prev), []);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);
  
  const handleApiError = useCallback((error: any, defaultMessage: string) => {
    console.error(defaultMessage, error);
    if (isAxiosError(error) && error.response) {
      Alert.alert('Erro', `${defaultMessage}: ${error.response.data?.message || 'Erro desconhecido.'}`);
    } else {
      Alert.alert('Erro', `${defaultMessage}. Verifique sua conexão.`);
    }
  }, []);

  // --- Efeitos de Inicialização e Dados do Usuário
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
  
  // --- Funções de Busca (Encapuslamento de Service + Lógica de Estado)
  const fetchAlunosForDay = useCallback(async (dateString: string) => {
    setLoading(true);
    try {
      const alunosCarregados = await presencaService.fetchAlunosForDay(dateString);
      setAlunos(alunosCarregados);
      setFocusIndex(0);
    } catch (error) {
      if (error instanceof Error && error.message.includes('Token')) {
        Alert.alert('Erro de Autenticação', 'Token não encontrado. Faça login novamente.');
        router.replace('../../');
      } else {
        handleApiError(error, 'Falha ao carregar dados dos alunos');
        setAlunos([]);
      }
    } finally {
      setLoading(false);
    }
  }, [handleApiError]);

  const fetchHistoricoPresencas = useCallback(async () => {
    setLoading(true);
    try {
      const historico = await presencaService.fetchHistoricoPresencas();

      const grouped: PresencasAgrupadas = {};
      historico.forEach((item) => {
        const dateKey = moment(item.data).format('YYYY-MM-DD');
        if (!grouped[dateKey]) grouped[dateKey] = [];
        grouped[dateKey].push(item);
      });

      const sortedKeys = Object.keys(grouped).sort((a, b) => b.localeCompare(a));
      const sortedGrouped: PresencasAgrupadas = {};
      sortedKeys.forEach((key) => (sortedGrouped[key] = grouped[key]));

      setPresencasAgrupadas(sortedGrouped);
      setFocusIndex(0);
    } catch (error) {
       if (error instanceof Error && error.message.includes('Token')) {
        Alert.alert('Erro de Autenticação', 'Token não encontrado. Faça login novamente.');
        router.replace('../../');
      } else {
        handleApiError(error, 'Falha ao carregar histórico de presenças');
        setPresencasAgrupadas({});
      }
    } finally {
      setLoading(false);
    }
  }, [handleApiError]);

  // --- Efeito de Foco (Recarregamento de dados)
  useFocusEffect(
    useCallback(() => {
      if (viewMode === 'historico') fetchHistoricoPresencas();
      else fetchAlunosForDay(moment(selectedDate).format('YYYY-MM-DD'));
    }, [viewMode, selectedDate, fetchHistoricoPresencas, fetchAlunosForDay])
  );
  
  // --- Lógica de Registro de Presença
  const setPresencaStatus = useCallback((alunoId: string, status: boolean | null) => {
    setAlunos((prev) => prev.map((a) => (a.id === alunoId ? { ...a, presente: status } : a)));
  }, []);

  const salvarPresenca = useCallback(async () => {
    setSaving(true);
    try {
      const presencasParaEnviar: PresencaData[] = alunos
        .filter((a) => a.presente !== null)
        .map((a) => ({ atletaId: a.id, presente: a.presente as boolean, data: moment(selectedDate).format('YYYY-MM-DD') }));

      if (presencasParaEnviar.length === 0) {
        Alert.alert('Aviso', 'Nenhuma presença foi marcada para salvar.');
        setSaving(false);
        return;
      }

      await presencaService.salvarPresenca(presencasParaEnviar);

      // Feedback específico
      presencasParaEnviar.forEach(p => {
        const aluno = alunos.find(a => a.id === p.atletaId);
        if (aluno) {
          const msg = p.presente
            ? `Aluno ${aluno.nome} presente registrado com sucesso!`
            : `Aluno ${aluno.nome} ausente registrado com sucesso!`;
          if (Platform.OS === 'web') {
            toast.success(msg);
          } else {
            Alert.alert('Sucesso', msg);
          }
        }
      });

      // Recarrega o modo detalhe
      setViewMode('detalhe'); 
    } catch (error) {
      handleApiError(error, 'Falha ao salvar presenças');
    } finally {
      setSaving(false);
    }
  }, [alunos, selectedDate, handleApiError]);

  // --- Lógica de Data Picker
  const onDateChangeInPicker = useCallback((event: any, date?: Date) => {
    const currentDate = date || tempSelectedDate;
    setShowDatePickerModal(Platform.OS === 'ios');
    setTempSelectedDate(currentDate);

    if (Platform.OS === 'android') {
      setSelectedDate(currentDate);
      setViewMode('registro');
    }
  }, [tempSelectedDate]);

  const confirmIosDate = useCallback(() => {
    setShowDatePickerModal(false);
    setSelectedDate(tempSelectedDate);
    setViewMode('registro');
  }, [tempSelectedDate]);
  
  // --- Lógica do Header
  const getHeaderTitle = useCallback(() => {
    switch (viewMode) {
      case 'historico':
        return 'Histórico de Presenças';
      case 'detalhe':
        return `Detalhes - ${moment(selectedDate).format('DD/MM/YYYY')}`;
      case 'registro':
      default:
        return `Registro - ${moment(selectedDate).format('DD/MM/YYYY')}`;
    }
  }, [viewMode, selectedDate]);
  
  const handleBackNavigation = useCallback((navigation: { goBack: () => void }) => {
    if (viewMode === 'detalhe') setViewMode('historico');
    else if (viewMode === 'historico') {
      setViewMode('registro');
      setSelectedDate(new Date());
    } else navigation.goBack();
  }, [viewMode]);

  // --- Lógica de Navegação por Teclado (Web)
  useEffect(() => {
    setFocusIndex(0); // Resetar foco ao mudar de modo
  }, [viewMode]);
  
  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const handleKey = (e: KeyboardEvent) => {
      // Ignorar quando digitando em inputs
      const active = document?.activeElement as HTMLElement | null;
      if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.getAttribute('contenteditable') === 'true')) return;

      const currentList = viewMode === 'historico' ? Object.keys(presencasAgrupadas) : alunos;
      const length = Array.isArray(currentList) ? currentList.length : Object.keys(presencasAgrupadas).length;
      if (length === 0) return;

      let newIndex = focusIndex;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          newIndex = Math.min(focusIndex + 1, length - 1);
          break;
        case 'ArrowUp':
          e.preventDefault();
          newIndex = Math.max(focusIndex - 1, 0);
          break;
        case 'PageDown':
        // A lógica de Pagedown/PageUp pode ser simplificada ou removida, mantendo a original:
          e.preventDefault();
          newIndex = Math.min(focusIndex + Math.max(5, Math.floor(length / 6)), length - 1);
          break;
        case 'PageUp':
          e.preventDefault();
          newIndex = Math.max(focusIndex - Math.max(5, Math.floor(length / 6)), 0);
          break;
        case 'Home':
          e.preventDefault();
          newIndex = 0;
          break;
        case 'End':
          e.preventDefault();
          newIndex = length - 1;
          break;
        default:
          return;
      }

      setFocusIndex(newIndex);

      // scroll to index in the right list
      if (viewMode === 'historico') {
        historicoFlatListRef.current?.scrollToIndex({ index: newIndex, animated: true, viewPosition: 0.5 });
      } else {
        flatListRef.current?.scrollToIndex({ index: newIndex, animated: true, viewPosition: 0.5 });
      }
    };

    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [focusIndex, alunos, presencasAgrupadas, viewMode]);

  // safe scrollToIndex fallback
  const onScrollToIndexFailed = useCallback((info: { index: number }) => {
    const index = info.index;
    const approxOffset = Math.max(0, index * 60); 
    if (viewMode === 'historico') {
      historicoFlatListRef.current?.scrollToOffset({ offset: approxOffset, animated: true });
    } else {
      flatListRef.current?.scrollToOffset({ offset: approxOffset, animated: true });
    }
  }, [viewMode]);

  return {
    // Refs
    flatListRef,
    historicoFlatListRef,
    // Estado de Dados
    alunos,
    presencasAgrupadas,
    selectedDate,
    tempSelectedDate,
    viewMode,
    loading,
    saving,
    focusIndex,
    isLargeScreen,
    sidebarOpen,
    userName,
    userRole,
    showDatePickerModal,
    // Setters
    setSelectedDate,
    setTempSelectedDate,
    setViewMode,
    setShowDatePickerModal,
    setFocusIndex,
    // Funções/Handlers
    fetchAlunosForDay,
    fetchHistoricoPresencas,
    setPresencaStatus,
    salvarPresenca,
    onDateChangeInPicker,
    confirmIosDate,
    getHeaderTitle,
    onScrollToIndexFailed,
    toggleSidebar,
    closeSidebar,
    handleBackNavigation,
  };
}

export type UseListaPresencaReturn = ReturnType<typeof useListaPresenca>;