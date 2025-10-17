import AsyncStorage from '@react-native-async-storage/async-storage';
import { StackActions, useNavigation } from '@react-navigation/native';
import { jwtDecode, JwtPayload } from 'jwt-decode';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
 
  Text,
  TextInput,
  TouchableOpacity,
  View,

} from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import { TextInputMask } from 'react-native-masked-text';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import {styles } from '../../Styles/realizarRelatorios';

interface AthleteEvaluation {
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

interface CustomJwtPayload extends JwtPayload {
  sub?: string;
  userId?: number;
  userType?: string;
  userName?: string;
}

interface AtletaParaSelecao {
  id: number;
  nomeCompleto: string;
  subDivisao: string;
  posicao: string;
}

const AthleteEvaluationForm = () => {
  const navigation = useNavigation();
  const scrollViewRef = useRef<ScrollView>(null);
  const [selectedAtletaId, setSelectedAtletaId] = useState<number | null>(null);
  const [nomeAvaliador, setNomeAvaliador] = useState<string>('');
  const [selectedSubdivisao, setSelectedSubdivisao] = useState<string>('');
  const [selectedPosicao, setSelectedPosicao] = useState<string>('');
  const [periodo, setPeriodo] = useState<string>('');
  const [avaliacao, setAvaliacao] = useState<AthleteEvaluation>({
    Controle: 3,
    recepcao: 3,
    dribles: 3,
    passe: 3,
    tiro: 3,
    cruzamento: 3,
    giro: 3,
    manuseioBola: 3,
    forcaChute: 3,
    GerenciamentoGols: 3,
    jogoOfensivo: 3,
    jogoDefensivo: 3,
    esportividade: 3,
    disciplina: 3,
    foco: 3,
    confianca: 3,
    tomadaDecisoes: 3,
    compromisso: 3,
    lideranca: 3,
    trabalhoEquipe: 3,
    atributosFisicos: 3,
    capacidadeSobPressao: 3,
  });
  const [feedbackTreinador, setFeedbackTreinador] = useState<string>('');
  const [feedbackAvaliador, setFeedbackAvaliador] = useState<string>('');
  const [pontosFortes, setPontosFortes] = useState<string>('');
  const [pontosFracos, setPontosFracos] = useState<string>('');
  const [areasAprimoramento, setAreasAprimoramento] = useState<string>('');
  const [metasObjetivos, setMetasObjetivos] = useState<string>('');
  const [dataAvaliacao, setDataAvaliacao] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [isTokenLoaded, setIsTokenLoaded] = useState<boolean>(false);
  const [atletasList, setAtletasList] = useState<AtletaParaSelecao[]>([]);
  const [filteredAtletasList, setFilteredAtletasList] = useState<AtletaParaSelecao[]>([]);
  const [subdivisoesList, setSubdivisoesList] = useState<string[]>([]);
  const [subdivisaoOptionsForPicker, setSubdivisaoOptionsForPicker] = useState<string[]>([]);
  const [isSubdivisaoPickerDisabled, setIsSubdivisaoPickerDisabled] = useState<boolean>(false);
  const [posicaoList, setPosicaoList] = useState<string[]>([]);
  const [posicaoOptionsForPicker, setPosicaoOptionsForPicker] = useState<string[]>([]);
  const [isPosicaoPickerDisabled, setIsPosicaoPickerDisabled] = useState<boolean>(false);

  // DropDownPicker specific states
  const [openAtletaPicker, setOpenAtletaPicker] = useState(false);
  const [openSubdivisaoPicker, setOpenSubdivisaoPicker] = useState(false);
  const [openPosicaoPicker, setOpenPosicaoPicker] = useState(false);

  // Memoized items for DropDownPickers to ensure unique keys
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

  const formatarData = (data: string): string => {
    const [dia, mes, ano] = data.split('/');
    return `${ano}-${mes}-${dia}`;
  };



  const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

  // Implementar navegação por teclado para web
  useEffect(() => {
    if (Platform.OS === 'web') {
      let currentScrollPosition = 0;

      const handleKeyDown = (event: KeyboardEvent) => {
        // Navegação no formulário principal
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
          event.preventDefault();
          if (scrollViewRef.current) {
            const scrollDirection = event.key === 'ArrowDown' ? 100 : -100;
            // Atualiza a posição de scroll baseada na estimativa
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

  // Função para resetar os estados do formulário
  const resetFormState = useCallback(() => {
    setSelectedAtletaId(null);

    setSelectedSubdivisao('');
    setSelectedPosicao('');
    setPeriodo('');
    setAvaliacao({
      Controle: 3,
      recepcao: 3,
      dribles: 3,
      passe: 3,
      tiro: 3,
      cruzamento: 3,
      giro: 3,
      manuseioBola: 3,
      forcaChute: 3,
      GerenciamentoGols: 3,
      jogoOfensivo: 3,
      jogoDefensivo: 3,
      esportividade: 3,
      disciplina: 3,
      foco: 3,
      confianca: 3,
      tomadaDecisoes: 3,
      compromisso: 3,
      lideranca: 3,
      trabalhoEquipe: 3,
      atributosFisicos: 3,
      capacidadeSobPressao: 3,
    });
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
    setPosicaoOptionsForPicker(posicaoList); // Resetar opções de posição
    setIsSubdivisaoPickerDisabled(false);
    setIsPosicaoPickerDisabled(false);
  }, [atletasList, subdivisoesList, posicaoList]);

  const checkAuthAndRedirect = useCallback(async () => {
    try {
      const storedToken = await AsyncStorage.getItem('jwtToken');
      if (!storedToken) {
        Alert.alert(
          'Autenticação Necessária',
          'Sua sessão expirou ou você não está logado. Você será redirecionado para a tela de login.',
          [{
            text: 'OK',
            onPress: () => {
              navigation.dispatch(StackActions.replace('Login'));
            }
          }]
        );
        return false;
      }
      return true;
    } catch (error) {
      console.error('Erro ao verificar token para redirecionamento:', error);
      Alert.alert('Erro', 'Ocorreu um erro ao verificar sua autenticação.');
      return false;
    }
  }, [navigation]);

  useEffect(() => {
    const loadAuthData = async () => {
      setIsTokenLoaded(false);
      try {
        const storedToken = await AsyncStorage.getItem('jwtToken');
        if (storedToken) {
          setAuthToken(storedToken);
          try {
            const decodedToken = jwtDecode<CustomJwtPayload>(storedToken);

            if (decodedToken.userName) {
              setNomeAvaliador(decodedToken.userName);
            } else if (decodedToken.sub) {
              setNomeAvaliador(decodedToken.sub);
            }
          } catch (decodeError) {
            console.error('Erro ao decodificar o token:', decodeError);
            Alert.alert('Erro de Token', 'Não foi possível decodificar o token de autenticação.');
            await AsyncStorage.removeItem('jwtToken');
            await checkAuthAndRedirect();
          }
        } else {
          await checkAuthAndRedirect();
        }
      } catch (error) {
        console.error('Erro ao carregar token de autenticação do AsyncStorage:', error);
        Alert.alert('Erro', 'Não foi possível carregar o token de autenticação. Tente novamente.');
      } finally {
        setIsTokenLoaded(true);
      }
    };
    loadAuthData();
  }, [checkAuthAndRedirect]);

  useEffect(() => {
    const fetchAtletasAndSubdivisoes = async () => {
      if (!isTokenLoaded || !authToken || !API_BASE_URL) {
        if (isTokenLoaded && !authToken) {
          console.log('Sem token válido, pulando fetch de atletas e subdivisões.');
        } else if (!API_BASE_URL) {
          console.warn('API_BASE_URL não configurado, pulando fetch de atletas e subdivisões.');
        } else {
          console.log('Aguardando token ser carregado para buscar atletas e subdivisões.');
        }
        return;
      }

      try {
        const atletasResponse = await fetch(`${API_BASE_URL}/api/atletas/listagem`, {
          headers: { 'Authorization': `Bearer ${authToken}` },
        });
        if (atletasResponse.status === 401) {
          Alert.alert('Sessão Expirada', 'Sua sessão expirou. Faça login novamente.');
          await AsyncStorage.removeItem('jwtToken');
          navigation.dispatch(StackActions.replace('Login'));
          return;
        }
        if (!atletasResponse.ok) {
          throw new Error(`HTTP error! Status: ${atletasResponse.status} ao buscar atletas.`);
        }
        const atletasData: AtletaParaSelecao[] = await atletasResponse.json();
        setAtletasList(atletasData);
        setFilteredAtletasList(atletasData);

        const subdivisoesResponse = await fetch(`${API_BASE_URL}/api/atletas/subdivisoes`, {
          headers: { 'Authorization': `Bearer ${authToken}` },
        });
        if (subdivisoesResponse.status === 401) {
          Alert.alert('Sessão Expirada', 'Sua sessão expirou. Faça login novamente.');
          await AsyncStorage.removeItem('jwtToken');
          navigation.dispatch(StackActions.replace('Login'));
          return;
        }
        if (!subdivisoesResponse.ok) {
          throw new Error(`HTTP error! Status: ${subdivisoesResponse.status} ao buscar subdivisões.`);
        }
        const subdivisoesData: string[] = await subdivisoesResponse.json();
        setSubdivisoesList(subdivisoesData);
        setSubdivisaoOptionsForPicker(subdivisoesData);

        // Fetch de Posições
        const posicoesResponse = await fetch(`${API_BASE_URL}/api/atletas/posicoes`, {
          headers: { 'Authorization': `Bearer ${authToken}` },
        });
        if (posicoesResponse.status === 401) {
          Alert.alert('Sessão Expirada', 'Sua sessão expirou. Faça login novamente.');
          await AsyncStorage.removeItem('jwtToken');
          navigation.dispatch(StackActions.replace('Login'));
          return;
        }
        if (!posicoesResponse.ok) {
          throw new Error(`HTTP error! Status: ${posicoesResponse.status} ao buscar posições.`);
        }
        const posicoesData: string[] = await posicoesResponse.json();
        setPosicaoList(posicoesData);
        setPosicaoOptionsForPicker(posicoesData);

      } catch (error: any) {
        console.error('Erro ao buscar dados de atletas/subdivisões/posições:', error);
        Alert.alert('Erro de Carga', `Não foi possível carregar dados de atletas, subdivisões ou posições: ${error.message}`);
      }
    };
    fetchAtletasAndSubdivisoes();
  }, [isTokenLoaded, authToken, API_BASE_URL, navigation]);

  const handleAvaliacaoChange = (attribute: keyof AthleteEvaluation, value: number) => {
    setAvaliacao({ ...avaliacao, [attribute]: value });
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
        setSelectedPosicao(selected.posicao);
        setSubdivisaoOptionsForPicker([selected.subDivisao]);
        setIsSubdivisaoPickerDisabled(true);
        setPosicaoOptionsForPicker([selected.posicao]);
        setIsPosicaoPickerDisabled(true);
      } else {
        setSelectedAtletaId(null);

        setSelectedSubdivisao('');
        setSelectedPosicao('');
        setFilteredAtletasList(atletasList);
        setSubdivisaoOptionsForPicker(subdivisoesList);
        setIsSubdivisaoPickerDisabled(false);
        setPosicaoOptionsForPicker(posicaoList);
        setIsPosicaoPickerDisabled(false);
      }
    }
  };


  const handleSubdivisaoFilterChange = (value: string | null) => {
    if (!isSubdivisaoPickerDisabled) {
      const subdivisao = value || '';
      setSelectedSubdivisao(subdivisao);
      if (subdivisao === '') {
        setFilteredAtletasList(atletasList);
        setPosicaoOptionsForPicker(posicaoList);
      } else {
        const filtered = atletasList.filter(atleta => atleta.subDivisao === subdivisao);
        setFilteredAtletasList(filtered);
        const uniquePosicoes = Array.from(new Set(filtered.map(atleta => atleta.posicao)));
        setPosicaoOptionsForPicker(uniquePosicoes);
      }
      setSelectedAtletaId(null);

      setSelectedPosicao('');
    }
  };

  const handlePosicaoFilterChange = (value: string | null) => {
    if (!isPosicaoPickerDisabled) {
      const posicao = value || '';
      setSelectedPosicao(posicao);
      if (posicao === '') {
        if (selectedSubdivisao) {
          const filtered = atletasList.filter(atleta => atleta.subDivisao === selectedSubdivisao);
          setFilteredAtletasList(filtered);
        } else {
          setFilteredAtletasList(atletasList);
        }
      } else {
        const filtered = atletasList.filter(atleta =>
          atleta.posicao === posicao && (selectedSubdivisao ? atleta.subDivisao === selectedSubdivisao : true)
        );
        setFilteredAtletasList(filtered);
      }
      setSelectedAtletaId(null);

    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);

    if (!API_BASE_URL) {
      Alert.alert('Erro de Configuração', 'A URL base da API não está configurada. Verifique seu arquivo .env e babel.config.js.');
      setIsLoading(false);
      return;
    }

    if (!isTokenLoaded) {
      Alert.alert('Carregando...', 'Aguarde enquanto o token de autenticação é carregado.');
      setIsLoading(false);
      return;
    }

    if (!authToken) {
      Alert.alert('Acesso Negado', 'Você precisa estar logado para enviar avaliações.');
      setIsLoading(false);
      return;
    }

    if (selectedAtletaId === null) {
      Alert.alert('Erro', 'Por favor, selecione um atleta.');
      setIsLoading(false);
      return;
    }

    if (!selectedSubdivisao) {
      Alert.alert('Erro', 'Por favor, selecione uma subdivisão.');
      setIsLoading(false);
      return;
    }

    if (!selectedPosicao) {
      Alert.alert('Erro', 'Por favor, selecione uma posição.');
      setIsLoading(false);
      return;
    }

    const authHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`,
    };

    const requestBody = {
      atletaId: selectedAtletaId,
      userName: nomeAvaliador,
      dataAvaliacao: formatarData(dataAvaliacao),
      periodoTreino: periodo,
      subdivisao: selectedSubdivisao,
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
      const geralResponse = await fetch(`${API_BASE_URL}/api/relatoriogeral/cadastrar`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(requestBody),
      });

      if (!geralResponse.ok) {
        const errorText = await geralResponse.text();
        throw new Error(`HTTP error! Status: ${geralResponse.status}, Message: ${errorText} for Avaliação Geral`);
      }
      

      Alert.alert(
        'Sucesso!',
        'Avaliação cadastrada com sucesso. Deseja cadastrar uma nova avaliação?',
        [
          {
            text: 'Não',
            onPress: () => {
             
              navigation.goBack();
            },
            style: 'cancel',
          },
          {
            text: 'Sim',
            onPress: () => {
              
              resetFormState();
            },
          },
        ],
        { cancelable: false }
      );
    } catch (error: any) {
      console.error('Erro ao enviar avaliação:', error);
      if (error.message.includes('Status: 401')) {
        Alert.alert('Não Autorizado', 'Sua sessão expirou ou você não tem permissão. Por favor, faça login novamente.');
        await AsyncStorage.removeItem('jwtToken');
        navigation.dispatch(StackActions.replace('Login'));
      } else if (error.message.includes('Status: 403')) {
        Alert.alert('Acesso Proibido', 'Você não tem permissão para realizar esta ação.');
      } else {
        Alert.alert('Erro', `Ocorreu um erro ao enviar a avaliação: ${error.message}. Tente novamente.`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  interface RatingOptionsProps {
    attribute: keyof AthleteEvaluation;
    value: number;
    onChange: (attribute: keyof AthleteEvaluation, value: number) => void;
  }

  const RatingOptions: React.FC<RatingOptionsProps> = ({ attribute, value, onChange }) => {
    const avaliacaoOptions = [5, 4, 3, 2, 1];

    return (
      <View style={styles.ratingOptionsContainer}>
        {avaliacaoOptions.map((option) => (
          <TouchableOpacity
            key={option}
            style={[
              styles.ratingOption,
              value === option && styles.ratingOptionSelected,
            ]}
            onPress={() => onChange(attribute, option)}
            {...(Platform.OS === 'web' && {
              cursor: 'pointer',
              activeOpacity: 0.8,
            })}
            accessibilityLabel={`Avaliar com nota ${option}`}
          >
           
            <Text style={value === option ? styles.ratingOptionTextSelected : styles.ratingOptionText}>
              {option}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const formatAttributeName = (attribute: keyof AthleteEvaluation) => {
    const mapping: { [key in keyof AthleteEvaluation]?: string } = {
      Controle: 'Controle',
      recepcao: 'Recepção',
      dribles: 'Dribles',
      passe: 'Passe',
      tiro: 'Tiro',
      cruzamento: 'Cruzamento',
      giro: 'Giro',
      manuseioBola: 'Manuseio de Bola',
      forcaChute: 'Força no Chute',
      GerenciamentoGols: 'Gerenciamento de Gols',
      jogoOfensivo: 'Jogo Ofensivo',
      jogoDefensivo: 'Jogo Defensivo',
      esportividade: 'Esportividade',
      disciplina: 'Disciplina',
      foco: 'Foco',
      confianca: 'Confiança',
      tomadaDecisoes: 'Tomada de Decisões',
      compromisso: 'Compromisso',
      lideranca: 'Liderança',
      trabalhoEquipe: 'Trabalho em Equipe',
      atributosFisicos: 'Atributos Físicos',
      capacidadeSobPressao: 'Capacidade Sob Pressão',
    };
    return mapping[attribute] || attribute;
  };

  const renderAvaliacaoTable = (title: string, attributes: (keyof AthleteEvaluation)[]) => (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.table}>
        <View style={styles.tableHeaderRow}>
          <Text style={styles.tableHead}>Atributo</Text>
          <Text style={styles.tableHead}>Avaliação</Text>
        </View>
        {attributes.map((attr) => (
          <View style={styles.tableRow} key={attr}>
            <Text style={styles.tableCell}>{formatAttributeName(attr)}</Text>
            <RatingOptions
              attribute={attr}
              value={avaliacao[attr]}
              onChange={handleAvaliacaoChange}
            />
          </View>
        ))}
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.keyboardAvoidingContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
    >
        {/* CORREÇÃO: Header movido para fora do ScrollView para ficar fixo */}
       <View style={styles.header}>
               <TouchableOpacity
                 onPress={() => navigation.goBack()}
                 style={styles.btnVoltar}
                 {...(Platform.OS === 'web' && {
                   cursor: 'pointer',
                   activeOpacity: 0.7,
                 })}
                 accessibilityLabel="Voltar"
               >
                 
               <FontAwesomeIcon icon={faArrowLeft} size={24} color="#fff" />
               </TouchableOpacity>
               <Text style={styles.titulo}>Avaliação de Desempenho</Text>
       </View>

      <ScrollView
        ref={scrollViewRef}
        // CORREÇÃO: Aplica webScrollView no 'style' para habilitar scroll do mouse
        style={Platform.OS === 'web' && styles.webScrollView}
        contentContainerStyle={styles.scrollViewContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={Platform.OS !== 'web'}
        nestedScrollEnabled={Platform.OS === 'web'}
        bounces={Platform.OS !== 'web'}
      >
        {/* NOVO CONTAINER: Envolve todo o conteúdo para limitar e centralizar (MAX_WIDTH) */}
        <View style={styles.mainContentContainer}>

            <View style={[styles.card, { zIndex: 3000 }]}>
            
            <Text style={styles.label}>Nome do Atleta:</Text>
            <DropDownPicker
                open={openAtletaPicker}
                value={selectedAtletaId}
                items={atletasPickerItems}
                setOpen={setOpenAtletaPicker}
                setValue={setSelectedAtletaId}
                onSelectItem={(item) => handleAtletaChange(item.value as number | null)}
                placeholder="Selecione um Atleta"
                style={styles.dropdown}
                containerStyle={styles.dropdownContainer}
                zIndex={3000}
                listMode="SCROLLVIEW"
                itemSeparator={true}
                itemSeparatorStyle={styles.itemSeparator}
            />

            <Text style={styles.label}>Nome do Avaliador:</Text>
            <TextInput
                style={styles.input}
                value={nomeAvaliador}
                editable={false}
            />

            <Text style={styles.label}>Subdivisão:</Text>
            <DropDownPicker
                open={openSubdivisaoPicker}
                value={selectedSubdivisao}
                items={subdivisaoPickerItems}
                setOpen={setOpenSubdivisaoPicker}
                setValue={setSelectedSubdivisao}
                onSelectItem={(item) => handleSubdivisaoFilterChange(item.value as string)}
                placeholder="Selecione uma Subdivisão"
                style={styles.dropdown}
                containerStyle={styles.dropdownContainer}
                disabled={isSubdivisaoPickerDisabled}
                zIndex={2000}
                listMode="SCROLLVIEW"
                itemSeparator={true}
                itemSeparatorStyle={styles.itemSeparator}
            />

            <Text style={styles.label}>Posição:</Text>
            <DropDownPicker
                open={openPosicaoPicker}
                value={selectedPosicao}
                items={posicaoPickerItems}
                setOpen={setOpenPosicaoPicker}
                setValue={setSelectedPosicao}
                onSelectItem={(item) => handlePosicaoFilterChange(item.value as string)}
                placeholder="Selecione uma Posição"
                style={styles.dropdown}
                containerStyle={styles.dropdownContainer}
                disabled={isPosicaoPickerDisabled}
                zIndex={1000}
                listMode="SCROLLVIEW"
                itemSeparator={true}
                itemSeparatorStyle={styles.itemSeparator}
            />

            <TextInput
                style={styles.input}
                placeholder="Período"
                value={periodo}
                onChangeText={setPeriodo}
            />
            </View>

            {renderAvaliacaoTable('Desempenho do Atleta', [
            'Controle',
            'recepcao',
            'dribles',
            'passe',
            'tiro',
            'cruzamento',
            'giro',
            'manuseioBola',
            'forcaChute',
            'GerenciamentoGols',
            'jogoOfensivo',
            'jogoDefensivo',
            ])}

            {renderAvaliacaoTable('Avaliação Tática/Psicológica/Física', [
            'esportividade',
            'disciplina',
            'foco',
            'confianca',
            'tomadaDecisoes',
            'compromisso',
            'lideranca',
            'trabalhoEquipe',
            'atributosFisicos',
            'capacidadeSobPressao',
            ])}

            <View style={styles.card}>
            <Text style={styles.sectionTitle}>Avaliação Geral do Jogador</Text>
            <TextInput
                style={[styles.input, styles.multilineInput]}
                placeholder="Feedback do Treinador"
                value={feedbackTreinador}
                onChangeText={setFeedbackTreinador}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
            />
            <TextInput
                style={[styles.input, styles.multilineInput]}
                placeholder="Feedback do Avaliador"
                value={feedbackAvaliador}
                onChangeText={setFeedbackAvaliador}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
            />
            <TextInput
                style={[styles.input, styles.multilineInput]}
                placeholder="Pontos Fortes"
                value={pontosFortes}
                onChangeText={setPontosFortes}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
            />
            <TextInput
                style={[styles.input, styles.multilineInput]}
                placeholder="Pontos Fracos"
                value={pontosFracos}
                onChangeText={setPontosFracos}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
            />
            <TextInput
                style={[styles.input, styles.multilineInput]}
                placeholder="Áreas de Aprimoramento"
                value={areasAprimoramento}
                onChangeText={setAreasAprimoramento}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
            />
            <TextInput
                style={[styles.input, styles.multilineInput]}
                placeholder="Metas/Planos/Objetivos"
                value={metasObjetivos}
                onChangeText={setMetasObjetivos}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
            />
            </View>

            <View style={styles.card}>
            <Text style={styles.sectionTitle}>Finalização</Text>
            <TextInputMask
                style={styles.input}
                type={'datetime'}
                options={{
                format: 'DD/MM/YYYY',
                }}
                value={dataAvaliacao}
                onChangeText={setDataAvaliacao}
                placeholder="Data da avaliação (DD/MM/YYYY)"
                keyboardType="numeric"
            />
            

            <View style={styles.buttonContainer}>
                <TouchableOpacity
                style={[
                    styles.button,
                    (isLoading || !authToken || !isTokenLoaded || selectedAtletaId === null || !selectedSubdivisao || !selectedPosicao) && styles.buttonDisabled
                ]}
                onPress={handleSubmit}
                disabled={isLoading || !authToken || !isTokenLoaded || selectedAtletaId === null || !selectedSubdivisao || !selectedPosicao}
                {...(Platform.OS === 'web' && !(isLoading || !authToken || !isTokenLoaded || selectedAtletaId === null || !selectedSubdivisao || !selectedPosicao) && {
                    cursor: 'pointer',
                    activeOpacity: 0.8,
                })}
                {...(Platform.OS === 'web' && (isLoading || !authToken || !isTokenLoaded || selectedAtletaId === null || !selectedSubdivisao || !selectedPosicao) && {
                    cursor: 'not-allowed',
                })}
                accessibilityLabel="Salvar avaliação do atleta"
                >
                {isLoading ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.buttonText}>Salvar Avaliação</Text>
                )}
                </TouchableOpacity>
                {/* CORREÇÃO: Estilo do botão secundário para ter fundo transparente */}
                <TouchableOpacity style={styles.buttonSecondary} onPress={() => navigation.goBack()}>
                <Text style={styles.buttonTextSecondary}>Voltar</Text>
                </TouchableOpacity>
            </View>
            </View>
        </View> {/* Fim do mainContentContainer */}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

// --- NOVOS ESTILOS RESPONSIVOS ---


export default AthleteEvaluationForm;