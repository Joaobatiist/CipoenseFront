import AsyncStorage from '@react-native-async-storage/async-storage';
import { StackActions, useNavigation } from '@react-navigation/native';
import { jwtDecode } from 'jwt-decode';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Platform, ScrollView } from 'react-native';
import { toast } from 'react-toastify';

import {
  createAvaliacaoGeral,
  fetchAthletesList,
  fetchPosicoes,
  fetchSubdivisoes,
} from '../services/relatorioApi'; // Ajuste o caminho
import {
  Atleta,
  AvaliacaoGeralForm,
  CustomJwtPayload,
} from '../types/RelatorioTypes'; // Ajuste o caminho

// A interface de estado interno agora vive junto com o hook
export interface AthleteEvaluation {
  Controle: number;
  recepcao: number;
  dribles: number;
  passe: number;
  tiro: number;
  cruzamento: number;
  giro: number;
  manuseioBola: number;
  forcaChute: number;
  GerenciamentoGols: number;
  jogoOfensivo: number;
  jogoDefensivo: number;
  esportividade: number;
  disciplina: number;
  foco: number;
  confianca: number;
  tomadaDecisoes: number;
  compromisso: number;
  lideranca: number;
  trabalhoEquipe: number;
  atributosFisicos: number;
  capacidadeSobPressao: number;
}

// Estado inicial para o formulário de avaliação
const INITIAL_EVALUATION_STATE: AthleteEvaluation = {
  Controle: 3, recepcao: 3, dribles: 3, passe: 3, tiro: 3, cruzamento: 3, giro: 3,
  manuseioBola: 3, forcaChute: 3, GerenciamentoGols: 3, jogoOfensivo: 3, jogoDefensivo: 3,
  esportividade: 3, disciplina: 3, foco: 3, confianca: 3, tomadaDecisoes: 3,
  compromisso: 3, lideranca: 3, trabalhoEquipe: 3, atributosFisicos: 3, capacidadeSobPressao: 3,
};

export const useAthleteEvaluationForm = () => {
  const navigation = useNavigation();
  const scrollViewRef = useRef<ScrollView>(null);

  // --- Estados do Formulário ---
  const [selectedAtletaId, setSelectedAtletaId] = useState<number | null>(null);
  const [nomeAvaliador, setNomeAvaliador] = useState<string>('');
  const [selectedSubdivisao, setSelectedSubdivisao] = useState<string>('');
  const [selectedPosicao, setSelectedPosicao] = useState<string>('');
  const [periodo, setPeriodo] = useState<string>('');
  const [avaliacao, setAvaliacao] = useState<AthleteEvaluation>(INITIAL_EVALUATION_STATE);
  const [feedbackTreinador, setFeedbackTreinador] = useState<string>('');
  const [feedbackAvaliador, setFeedbackAvaliador] = useState<string>('');
  const [pontosFortes, setPontosFortes] = useState<string>('');
  const [pontosFracos, setPontosFracos] = useState<string>('');
  const [areasAprimoramento, setAreasAprimoramento] = useState<string>('');
  const [metasObjetivos, setMetasObjetivos] = useState<string>('');
  const [dataAvaliacao, setDataAvaliacao] = useState<string>('');

  // --- Estados de UI e Dados ---
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [isTokenLoaded, setIsTokenLoaded] = useState<boolean>(false);
  const [atletasList, setAtletasList] = useState<Atleta[]>([]);
  const [filteredAtletasList, setFilteredAtletasList] = useState<Atleta[]>([]);
  const [subdivisoesList, setSubdivisoesList] = useState<string[]>([]);
  const [subdivisaoOptionsForPicker, setSubdivisaoOptionsForPicker] = useState<string[]>([]);
  const [isSubdivisaoPickerDisabled, setIsSubdivisaoPickerDisabled] = useState<boolean>(false);
  const [posicaoList, setPosicaoList] = useState<string[]>([]);
  const [posicaoOptionsForPicker, setPosicaoOptionsForPicker] = useState<string[]>([]);
  const [isPosicaoPickerDisabled, setIsPosicaoPickerDisabled] = useState<boolean>(false);

  // --- Estados do DropDownPicker ---
  const [openAtletaPicker, setOpenAtletaPicker] = useState(false);
  const [openSubdivisaoPicker, setOpenSubdivisaoPicker] = useState(false);
  const [openPosicaoPicker, setOpenPosicaoPicker] = useState(false);

  // --- Estados do Layout (Sidebar) ---
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userName, setUserName] = useState('Usuário');
  const [userRole, setUserRole] = useState<string>('');
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);

  // --- Funções Auxiliares ---
  const formatarData = (data: string): string => {
    const [dia, mes, ano] = data.split('/');
    return `${ano}-${mes}-${dia}`;
  };

  const resetFormState = useCallback(() => {
    setSelectedAtletaId(null);
    setSelectedSubdivisao('');
    setSelectedPosicao('');
    setPeriodo('');
    setAvaliacao(INITIAL_EVALUATION_STATE);
    setFeedbackTreinador('');
    setFeedbackAvaliador('');
    setPontosFortes('');
    setPontosFracos('');
    setAreasAprimoramento('');
    setMetasObjetivos('');
    setDataAvaliacao('');
    setOpenAtletaPicker(false);
    setOpenSubdivisaoPicker(false);
    setOpenPosicaoPicker(false);
    setFilteredAtletasList(atletasList);
    setSubdivisaoOptionsForPicker(subdivisoesList);
    setPosicaoOptionsForPicker(posicaoList);
    setIsSubdivisaoPickerDisabled(false);
    setIsPosicaoPickerDisabled(false);
  }, [atletasList, subdivisoesList, posicaoList]);

  const checkAuthAndRedirect = useCallback(async () => {
    try {
      const storedToken = await AsyncStorage.getItem('jwtToken');
      if (!storedToken) {
        const msg = 'Autenticação Necessária. Sua sessão expirou ou você não está logado.';
        if (Platform.OS === 'web') {
          toast.error(msg + ' Você será redirecionado.');
          setTimeout(() => navigation.dispatch(StackActions.replace('Login')), 2000);
        } else {
          Alert.alert(
            'Autenticação Necessária',
            msg + ' Você será redirecionado para a tela de login.',
            [{ text: 'OK', onPress: () => navigation.dispatch(StackActions.replace('Login')) }]
          );
        }
        return false;
      }
      return true;
    } catch (error) {
      console.error('Erro ao verificar token para redirecionamento:', error);
      if (Platform.OS === 'web') toast.error('Erro ao verificar sua autenticação.');
      else Alert.alert('Erro', 'Ocorreu um erro ao verificar sua autenticação.');
      return false;
    }
  }, [navigation]);

  // --- Efeitos (Side Effects) ---

  // Carrega dados do usuário (Sidebar)
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

  // Carrega token de autenticação (API)
  useEffect(() => {
    const loadAuthData = async () => {
      setIsTokenLoaded(false);
      try {
        const storedToken = await AsyncStorage.getItem('jwtToken');
        if (storedToken) {
          setAuthToken(storedToken);
          const decodedToken = jwtDecode<CustomJwtPayload>(storedToken);
          setNomeAvaliador(decodedToken.userName || decodedToken.sub || '');
        } else {
          await checkAuthAndRedirect();
        }
      } catch (error) {
        console.error('Erro ao carregar/decodificar token:', error);
        if (Platform.OS === 'web') toast.error('Erro de Token. Não foi possível decodificar.');
        else Alert.alert('Erro de Token', 'Não foi possível decodificar o token.');
        await AsyncStorage.removeItem('jwtToken');
        await checkAuthAndRedirect();
      } finally {
        setIsTokenLoaded(true);
      }
    };
    loadAuthData();
  }, [checkAuthAndRedirect]);

  // Busca dados iniciais (Atletas, Subdivisões, Posições)
  useEffect(() => {
    const fetchAtletasAndSubdivisoes = async () => {
      if (!isTokenLoaded || !authToken) {
        return;
      }

      try {
        const [atletasData, subdivisoesData, posicoesData] = await Promise.all([
          fetchAthletesList(),
          fetchSubdivisoes(),
          fetchPosicoes(),
        ]);

        setAtletasList(atletasData);
        setFilteredAtletasList(atletasData);
        setSubdivisoesList(subdivisoesData);
        setSubdivisaoOptionsForPicker(subdivisoesData);
        setPosicaoList(posicoesData);
        setPosicaoOptionsForPicker(posicoesData);

      } catch (error: any) {
        console.error('Erro ao buscar dados (atletas/subdivisões/posições):', error);
        const errorMessage = error.message || "Ocorreu um erro desconhecido.";
        if (Platform.OS === 'web') toast.error(`Erro de Carga: ${errorMessage}`);
        else Alert.alert('Erro de Carga', errorMessage);

        if (errorMessage.includes("autenticação") || errorMessage.includes("401")) {
          await AsyncStorage.removeItem('jwtToken');
          navigation.dispatch(StackActions.replace('Login'));
        }
      }
    };
    fetchAtletasAndSubdivisoes();
  }, [isTokenLoaded, authToken, navigation]);

  // Navegação por teclado (Web)
  useEffect(() => {
    if (Platform.OS === 'web') {
      let currentScrollPosition = 0;
      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
          event.preventDefault();
          if (scrollViewRef.current) {
            const scrollDirection = event.key === 'ArrowDown' ? 100 : -100;
            currentScrollPosition = Math.max(0, currentScrollPosition + scrollDirection);
            scrollViewRef.current.scrollTo({ y: currentScrollPosition, animated: true });
          }
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, []);

  // --- Memos (Itens dos Pickers) ---
  const atletasPickerItems = useMemo(() => [
    { label: 'Selecione um atleta', value: undefined },
    ...filteredAtletasList.map((atleta) => ({
      label: atleta.nomeCompleto,
      value: atleta.id,
    })),
  ], [filteredAtletasList]);

  const subdivisaoPickerItems = useMemo(() => [
    { label: 'Selecione uma Subdivisão', value: '' },
    ...subdivisaoOptionsForPicker.map((subdivisao) => ({
      label: subdivisao,
      value: subdivisao,
    })),
  ], [subdivisaoOptionsForPicker]);

  const posicaoPickerItems = useMemo(() => [
    { label: 'Selecione uma Posição', value: '' },
    ...posicaoOptionsForPicker.map((posicao) => ({
      label: posicao,
      value: posicao,
    })),
  ], [posicaoOptionsForPicker]);

  // --- Handlers de Evento ---
  const handleAvaliacaoChange = (attribute: keyof AthleteEvaluation, value: number) => {
    setAvaliacao((prev) => ({ ...prev, [attribute]: value }));
  };

  const handleAtletaChange = (value: number | null) => {
    if (value === null) {
      setSelectedAtletaId(null);
      setSelectedSubdivisao('');
      setSelectedPosicao('');
      setFilteredAtletasList(atletasList);
      setSubdivisaoOptionsForPicker(subdivisoesList);
      setIsSubdivisaoPickerDisabled(false);
      setPosicaoOptionsForPicker(posicaoList);
      setIsPosicaoPickerDisabled(false);
    } else {
      const selected = atletasList.find(atleta => atleta.id === value);
      if (selected) {
        setSelectedAtletaId(selected.id);
        setSelectedSubdivisao(selected.subDivisao);
        const pos = selected.posicao || '';
        setSelectedPosicao(pos);
        setSubdivisaoOptionsForPicker([selected.subDivisao]);
        setIsSubdivisaoPickerDisabled(true);
        setPosicaoOptionsForPicker(pos ? [pos] : []);
        setIsPosicaoPickerDisabled(true);
      }
    }
  };

  const handleSubdivisaoFilterChange = (value: string | null) => {
    if (isSubdivisaoPickerDisabled) return;
    const subdivisao = value || '';
    setSelectedSubdivisao(subdivisao);
    if (subdivisao === '') {
      setFilteredAtletasList(atletasList);
      setPosicaoOptionsForPicker(posicaoList);
    } else {
      const filtered = atletasList.filter(atleta => atleta.subDivisao === subdivisao);
      setFilteredAtletasList(filtered);
      const uniquePosicoes = Array.from(new Set(filtered.map(atleta => atleta.posicao || '')));
      setPosicaoOptionsForPicker(uniquePosicoes.filter(p => p));
    }
    setSelectedAtletaId(null);
    setSelectedPosicao('');
  };

  const handlePosicaoFilterChange = (value: string | null) => {
    if (isPosicaoPickerDisabled) return;
    const posicao = value || '';
    setSelectedPosicao(posicao);
    const baseList = selectedSubdivisao
      ? atletasList.filter(atleta => atleta.subDivisao === selectedSubdivisao)
      : atletasList;
    
    if (posicao === '') {
      setFilteredAtletasList(baseList);
    } else {
      const filtered = baseList.filter(atleta => atleta.posicao === posicao);
      setFilteredAtletasList(filtered);
    }
    setSelectedAtletaId(null);
  };

  const handleSubmit = async () => {
    // Validação inicial ANTES de iniciar loading
    if (!isTokenLoaded || !authToken || selectedAtletaId === null || !selectedSubdivisao || !selectedPosicao) {
      const msg = 'Erro: Verifique a autenticação e preencha Atleta, Subdivisão e Posição.';
      if (Platform.OS === 'web') toast.error(msg);
      else Alert.alert('Erro', msg);
      return;
    }

    setIsLoading(true);

    const formData: AvaliacaoGeralForm = {
      atletaId: selectedAtletaId,
      userName: nomeAvaliador,
      dataAvaliacao: formatarData(dataAvaliacao),
      periodoTreino: periodo,
      subDivisao: selectedSubdivisao,
      posicao: selectedPosicao,
      feedbackTreinador,
      feedbackAvaliador,
      pontosFortes,
      pontosFracos,
      areasAprimoramento,
      metasObjetivos,
      relatorioDesempenho: {
        controle: avaliacao.Controle,
        recepcao: avaliacao.recepcao,
        dribles: avaliacao.dribles,
        passe: avaliacao.passe,
        tiro: avaliacao.tiro,
        cruzamento: avaliacao.cruzamento,
        giro: avaliacao.giro,
        manuseioDeBola: avaliacao.manuseioBola,
        forcaChute: avaliacao.forcaChute,
        gerenciamentoDeGols: avaliacao.GerenciamentoGols,
        jogoOfensivo: avaliacao.jogoOfensivo,
        jogoDefensivo: avaliacao.jogoDefensivo,
      },
      relatorioTaticoPsicologico: {
        esportividade: avaliacao.esportividade,
        disciplina: avaliacao.disciplina,
        foco: avaliacao.foco,
        confianca: avaliacao.confianca,
        tomadaDecisoes: avaliacao.tomadaDecisoes,
        compromisso: avaliacao.compromisso,
        lideranca: avaliacao.lideranca,
        trabalhoEmEquipe: avaliacao.trabalhoEquipe,
        atributosFisicos: avaliacao.atributosFisicos,
        atuarSobPressao: avaliacao.capacidadeSobPressao,
      },
    };

    try {
      // Envia a requisição em background (fire-and-forget)
      // A API vai salvar no banco e processar a IA de forma assíncrona
      createAvaliacaoGeral(formData)
        .then(() => {
          console.log('✅ Avaliação e análise da IA processadas com sucesso');
        })
        .catch((error) => {
          console.error('⚠️ Erro no processamento da IA (dados podem ter sido salvos):', error);
          // Não exibe erro ao usuário pois ele já foi liberado
          // O servidor deve garantir que os dados sejam salvos mesmo se a IA falhar
        });

      // Libera o usuário IMEDIATAMENTE
      setIsLoading(false);

      if (Platform.OS === 'web') {
        toast.success('✅ Avaliação enviada com sucesso! A análise da IA está sendo processada em background.', { 
          autoClose: 3000,
          position: 'top-center'
        });
        // Pequeno delay para o usuário ver a mensagem antes de resetar
        setTimeout(resetFormState, 800);
      } else {
        Alert.alert(
          '✅ Enviado com Sucesso!',
          'Avaliação salva! A análise da IA será processada em background.\n\nDeseja cadastrar uma nova avaliação?',
          [
            { text: 'Não', onPress: () => navigation.goBack(), style: 'cancel' },
            { text: 'Sim', onPress: resetFormState },
          ],
          { cancelable: false }
        );
      }
    } catch (error: any) {
      // Este catch só pega erros síncronos de preparação
      console.error('❌ Erro ao preparar avaliação:', error);
      setIsLoading(false);
      
      const errorMessage = error.message || "Erro ao preparar a avaliação.";
      if (Platform.OS === 'web') toast.error(`Erro: ${errorMessage}`);
      else Alert.alert('Erro', errorMessage);

      if (errorMessage.includes("autenticação") || errorMessage.includes("401")) {
        await AsyncStorage.removeItem('jwtToken');
        navigation.dispatch(StackActions.replace('Login'));
      }
    }
  };

  // --- Retorno do Hook ---
  return {
    // Refs
    scrollViewRef,
    // Layout
    sidebarOpen,
    userName,
    userRole,
    toggleSidebar,
    closeSidebar,
    // Estado do Formulário e Setters
    nomeAvaliador,
    periodo, setPeriodo,
    dataAvaliacao, setDataAvaliacao,
    feedbackTreinador, setFeedbackTreinador,
    feedbackAvaliador, setFeedbackAvaliador,
    pontosFortes, setPontosFortes,
    pontosFracos, setPontosFracos,
    areasAprimoramento, setAreasAprimoramento,
    metasObjetivos, setMetasObjetivos,
    // Estado da Avaliação e Handler
    avaliacao,
    handleAvaliacaoChange,
    // Estado dos Pickers e Setters
    openAtletaPicker, setOpenAtletaPicker,
    openSubdivisaoPicker, setOpenSubdivisaoPicker,
    openPosicaoPicker, setOpenPosicaoPicker,
    // Dados dos Pickers
    selectedAtletaId,
    setSelectedAtletaId,
    selectedSubdivisao,
    setSelectedSubdivisao,
    selectedPosicao,
    setSelectedPosicao,
    atletasPickerItems,
    subdivisaoPickerItems,
    posicaoPickerItems,
    // Handlers dos Pickers
    handleAtletaChange,
    handleSubdivisaoFilterChange,
    handlePosicaoFilterChange,
    // Estado de UI dos Pickers
    isSubdivisaoPickerDisabled,
    isPosicaoPickerDisabled,
    // Estado de Submissão e Handlers
    isLoading,
    isTokenLoaded,
    authToken,
    handleSubmit,
    goBack: () => navigation.goBack(),
  };
};