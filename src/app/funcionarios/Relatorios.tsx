import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, StackActions } from '@react-navigation/native';
import { jwtDecode, JwtPayload } from 'jwt-decode';
import React, { useEffect, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Platform,
  KeyboardAvoidingView,
  // SafeAreaView, // Descomente se precisar de Safe Area
} from 'react-native';
import { TextInputMask } from 'react-native-masked-text';
import DropDownPicker from 'react-native-dropdown-picker';

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
  [key: string]: number;
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
}

const AthleteEvaluationForm = () => {
  const navigation = useNavigation();
  const [selectedAtletaId, setSelectedAtletaId] = useState<number | null>(null);
  const [nomeCompleto, setNomeCompleto] = useState<string>('');
  const [nomeAvaliador, setNomeAvaliador] = useState<string>('');
  const [selectedSubdivisao, setSelectedSubdivisao] = useState<string>('');
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

  // DropDownPicker specific states
  const [openAtletaPicker, setOpenAtletaPicker] = useState(false);
  const [openSubdivisaoPicker, setOpenSubdivisaoPicker] = useState(false);

  const formatarData = (data: string): string => {
    const [dia, mes, ano] = data.split('/');
    return `${ano}-${mes}-${dia}`;
  };
  const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

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
        if (isTokenLoaded && !authToken) { // Token carregado mas é nulo, já foi redirecionado
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

      } catch (error: any) {
        console.error('Erro ao buscar dados de atletas/subdivisões:', error);
        Alert.alert('Erro de Carga', `Não foi possível carregar dados de atletas ou subdivisões: ${error.message}`);
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
      setNomeCompleto('');
      setSelectedSubdivisao('');
      setFilteredAtletasList(atletasList);
      setSubdivisaoOptionsForPicker(subdivisoesList);
      setIsSubdivisaoPickerDisabled(false);
    } else {
      const selected = atletasList.find(atleta => atleta.id === value);
      if (selected) {
        setSelectedAtletaId(selected.id);
        setNomeCompleto(selected.nomeCompleto);
        setSelectedSubdivisao(selected.subDivisao);
        setSubdivisaoOptionsForPicker([selected.subDivisao]);
        setIsSubdivisaoPickerDisabled(true);
      } else {
        setSelectedAtletaId(null);
        setNomeCompleto('');
        setSelectedSubdivisao('');
        setFilteredAtletasList(atletasList);
        setSubdivisaoOptionsForPicker(subdivisoesList);
        setIsSubdivisaoPickerDisabled(false);
      }
    }
  };


  const handleSubdivisaoFilterChange = (value: string | null) => {
    if (!isSubdivisaoPickerDisabled) {
      const subdivisao = value || '';
      setSelectedSubdivisao(subdivisao);
      if (subdivisao === '') {
        setFilteredAtletasList(atletasList);
      } else {
        const filtered = atletasList.filter(atleta => atleta.subDivisao === subdivisao);
        setFilteredAtletasList(filtered);
      }
      setSelectedAtletaId(null);
      setNomeCompleto('');
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

    console.log('Dados enviados para /api/relatoriogeral/cadastrar:', JSON.stringify(requestBody, null, 2));

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
      console.log('Avaliação Geral data sent successfully!');

      Alert.alert('Sucesso', 'Avaliação enviada com sucesso!');
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
          >
            <Text style={styles.ratingOptionText}>{option}</Text>
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
    <View style={styles.section}>
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
    // <SafeAreaView style={styles.safeArea}> // Descomente se precisar de Safe Area
    <KeyboardAvoidingView
      style={styles.keyboardAvoidingContainer}
      // Experimente 'position' para Android se 'height' não estiver funcionando bem
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0} // Ajuste conforme a altura do seu cabeçalho
    >
      <ScrollView
        contentContainerStyle={styles.scrollViewContent}
        keyboardShouldPersistTaps="handled" // Permite interações com elementos que não são textInput
      >
        <Text style={styles.title}>
          ASSOCIAÇÃO DESPORTIVA CIPOENSE - ESCOLINHA DE FUTEBOL DA ADC
        </Text>

        <View style={[styles.section, { zIndex: 2000 }]}>
          <Text style={styles.sectionTitle}>Dados do Atleta</Text>

          <Text style={styles.label}>Nome do Atleta:</Text>
          <DropDownPicker
            open={openAtletaPicker}
            value={selectedAtletaId}
            items={filteredAtletasList.map(atleta => ({
              label: atleta.nomeCompleto,
              value: atleta.id,
            }))}
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
            items={[
              { label: 'Selecione uma Subdivisão', value: '' },
              ...subdivisaoOptionsForPicker.map(subdivisao => ({
                label: subdivisao,
                value: subdivisao,
              })),
            ]}
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

          <TextInput
            style={styles.input}
            placeholder="Período"
            value={periodo}
            onChangeText={setPeriodo}
            // Adicionado: onFocus para garantir que o ScrollView rola para o campo
            onFocus={() => {
              // Você pode adicionar um pequeno atraso se a rolagem for muito rápida
              // setTimeout(() => {
              //   this.scrollViewRef.current?.scrollToEnd({ animated: true }); // Exemplo se você usar um ref
              // }, 100);
            }}
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

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Avaliação Geral do Jogador</Text>
          <TextInput
            style={styles.input}
            placeholder="Feedback do Treinador"
            value={feedbackTreinador}
            onChangeText={setFeedbackTreinador}
            multiline
            numberOfLines={6}
            // Adicionado: para garantir que o TextInput multiline se ajuste ao conteúdo
            textAlignVertical="top" // Alinha o texto no topo em Android para multiline
            // onFocus e onBlur podem ajudar a gerenciar a rolagem
            onFocus={() => {/* pode adicionar lógica de rolagem aqui se necessário */}}
          />
          <TextInput
            style={styles.input}
            placeholder="Feedback do Avaliador"
            value={feedbackAvaliador}
            onChangeText={setFeedbackAvaliador}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            onFocus={() => {/* pode adicionar lógica de rolagem aqui se necessário */}}
          />
          <TextInput
            style={styles.input}
            placeholder="Pontos Fortes"
            value={pontosFortes}
            onChangeText={setPontosFortes}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            onFocus={() => {/* pode adicionar lógica de rolagem aqui se necessário */}}
          />
          <TextInput
            style={styles.input}
            placeholder="Pontos Fracos"
            value={pontosFracos}
            onChangeText={setPontosFracos}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            onFocus={() => {/* pode adicionar lógica de rolagem aqui se necessário */}}
          />
          <TextInput
            style={styles.input}
            placeholder="Áreas de Aprimoramento"
            value={areasAprimoramento}
            onChangeText={setAreasAprimoramento}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            onFocus={() => {/* pode adicionar lógica de rolagem aqui se necessário */}}
          />
          <TextInput
            style={styles.input}
            placeholder="Metas/Planos/Objetivos"
            value={metasObjetivos}
            onChangeText={setMetasObjetivos}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            onFocus={() => {/* pode adicionar lógica de rolagem aqui se necessário */}}
          />
        </View>

        <View style={styles.section}>
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
            // Adicionado: onFocus para garantir que o ScrollView rola para o campo
            onFocus={() => {
              // Pode ser útil para os últimos campos
            }}
          />
          <Text style={styles.label}>Assinatura do Avaliador/Treinador</Text>

          <View style={{ flexDirection: 'row', gap: 10, justifyContent: 'space-between', marginTop: 10 }}>
            <TouchableOpacity
              style={styles.button}
              onPress={handleSubmit}
              disabled={isLoading || !authToken || !isTokenLoaded || selectedAtletaId === null || !selectedSubdivisao}
            >
              {isLoading || !isTokenLoaded ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Salvar Avaliação</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={() => navigation.goBack()}>
              <Text style={styles.buttonText}>Voltar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
    
  );
};

const styles = StyleSheet.create({
  keyboardAvoidingContainer: {
    flex: 1,
    backgroundColor: '#f0f0f0', // Mudei para uma cor ligeiramente diferente para depuração
  },
  scrollViewContent: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 100, // Aumentei o paddingBottom para dar mais espaço de rolagem
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  section: {
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    paddingBottom: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
    minHeight: 40, // Garante uma altura mínima para inputs normais
  },
  // Estilo específico para TextInputs multiline, se necessário
  multilineInput: {
    minHeight: 120, // Altura mínima para campos de texto longos
    textAlignVertical: 'top', // Para Android, garante que o cursor comece no topo
  },
  table: {
    width: '100%',
    marginBottom: 10,
    marginTop: 5,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  tableHead: {
    width: '50%',
    fontWeight: 'bold',
    padding: 8,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  tableCell: {
    width: '50%',
    padding: 8,
  },
  ratingOptionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '50%',
  },
  ratingOption: {
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 5,
  },
  ratingOptionSelected: {
    backgroundColor: '#e5c228',
  },
  ratingOptionText: {
    color: '#000',
    fontSize: 14,
  },
  button: {
    flex: 1,
    backgroundColor: '#1c348e',
    padding: 15,
    borderRadius: 15,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  dropdownContainer: {
    height: 50,
    marginBottom: 10,
  },
  dropdown: {
    backgroundColor: '#fafafa',
    borderColor: '#ccc',
    borderRadius: 5,
  },
  itemSeparator: {
    height: 1,
    backgroundColor: '#cccccc',
  },
});

export default AthleteEvaluationForm;