import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import { useNavigation } from '@react-navigation/native';
import { jwtDecode, JwtPayload } from 'jwt-decode';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { TextInputMask } from 'react-native-masked-text';

// Define an interface for the 'avaliacao' state to include all possible attributes
// and an index signature for dynamic access.
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
  [key: string]: number; // Index signature to allow dynamic access like avaliacao[attr]
}

interface CustomJwtPayload extends JwtPayload {
  sub?: string; // May still contain email
  userId?: number;
  userType?: string;
  userName?: string; // ⭐ NEW: Expecting the entity name claim
}

// Interface para o DTO de Atleta para seleção
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
  const [subdivisoesList, setSubdivisoesList] = useState<string[]>([]); // Lista completa de subdivisões distintas
  const [subdivisaoOptionsForPicker, setSubdivisaoOptionsForPicker] = useState<string[]>([]); // Opções para o picker de subdivisão
  const [isSubdivisaoPickerDisabled, setIsSubdivisaoPickerDisabled] = useState<boolean>(false); // Controla se o picker de subdivisão está desabilitado
  const formatarData = (data: string): string => {
    const [dia, mes, ano] = data.split('/');
    return `${ano}-${mes}-${dia}`;
  };
  const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

  useEffect(() => {
    const loadAuthData = async () => {
      setIsTokenLoaded(false);
      try {
        const storedToken = await AsyncStorage.getItem('jwtToken');
        if (storedToken) {
          setAuthToken(storedToken);
          console.log('Token de autenticação carregado:', storedToken);
          try {
            const decodedToken = jwtDecode<CustomJwtPayload>(storedToken);

            if (decodedToken.userName) { // Check for the new 'userName' claim first
              setNomeAvaliador(decodedToken.userName);
              console.log('Nome do Avaliador do token (userName):', decodedToken.userName);
            } else if (decodedToken.sub) { // Fallback to 'sub' if 'userName' is not present
              setNomeAvaliador(decodedToken.sub);
              console.log('Nome do Avaliador do token (sub fallback):', decodedToken.sub);
            }
            if (decodedToken.userId) {
              console.log('ID do Usuário do token:', decodedToken.userId);
            }
            if (decodedToken.userType) {
              console.log('Tipo de Usuário do token:', decodedToken.userType);
            }

          } catch (decodeError) {
            console.error('Erro ao decodificar o token:', decodeError);
            Alert.alert('Erro de Token', 'Não foi possível decodificar o token de autenticação.');
          }
        } else {
          Alert.alert('Autenticação Necessária', 'Por favor, faça login para enviar avaliações. Você será redirecionado para a tela de login.');
        }
      } catch (error) {
        console.error('Erro ao carregar token de autenticação do AsyncStorage:', error);
        Alert.alert('Erro', 'Não foi possível carregar o token de autenticação. Tente novamente.');
      } finally {
        setIsTokenLoaded(true);
      }
    };
    loadAuthData();
  }, []);

  useEffect(() => {
    const fetchAtletasAndSubdivisoes = async () => {
      if (isTokenLoaded && authToken && API_BASE_URL) {
        try {
          // Buscar lista de atletas
          const atletasResponse = await fetch(`${API_BASE_URL}/api/atletas/listagem`, {
            headers: { 'Authorization': `Bearer ${authToken}` },
          });
          if (!atletasResponse.ok) {
            throw new Error(`HTTP error! Status: ${atletasResponse.status} ao buscar atletas.`);
          }
          const atletasData: AtletaParaSelecao[] = await atletasResponse.json();
          setAtletasList(atletasData);
          setFilteredAtletasList(atletasData); // Inicialmente, a lista filtrada é a lista completa

          // Buscar lista de subdivisões distintas
          const subdivisoesResponse = await fetch(`${API_BASE_URL}/api/atletas/subdivisoes`, {
            headers: { 'Authorization': `Bearer ${authToken}` },
          });
          if (!subdivisoesResponse.ok) {
            throw new Error(`HTTP error! Status: ${subdivisoesResponse.status} ao buscar subdivisões.`);
          }
          const subdivisoesData: string[] = await subdivisoesResponse.json();
          setSubdivisoesList(subdivisoesData); // Armazena a lista completa de subdivisões
          setSubdivisaoOptionsForPicker(subdivisoesData); // Inicializa as opções do picker com todas as subdivisões

        } catch (error: any) {
          console.error('Erro ao buscar dados de atletas/subdivisões:', error);
          Alert.alert('Erro de Carga', `Não foi possível carregar dados de atletas ou subdivisões: ${error.message}`);
        }
      }
    };
    fetchAtletasAndSubdivisoes();
  }, [isTokenLoaded, authToken, API_BASE_URL]);


  const handleAvaliacaoChange = (attribute: keyof AthleteEvaluation, value: number) => {
    setAvaliacao({ ...avaliacao, [attribute]: value });
  };

  // Função para lidar com a seleção do atleta
  const handleAtletaChange = (itemValue: number | null) => {
    if (itemValue === null) {
      setSelectedAtletaId(null);
      setNomeCompleto('');
      setSelectedSubdivisao(''); // Resetar a subdivisão selecionada
      setFilteredAtletasList(atletasList); // Voltar a exibir todos os atletas
      setSubdivisaoOptionsForPicker(subdivisoesList); // Voltar a exibir todas as opções de subdivisão
      setIsSubdivisaoPickerDisabled(false); // Habilitar o picker de subdivisão
    } else {
      const selected = atletasList.find(atleta => atleta.id === itemValue);
      if (selected) {
        setSelectedAtletaId(selected.id);
        setNomeCompleto(selected.nomeCompleto);
        setSelectedSubdivisao(selected.subDivisao); // Definir a subdivisão do atleta selecionado
        setFilteredAtletasList([selected]); // Opcional: filtrar o picker de atletas para mostrar apenas o selecionado
        setSubdivisaoOptionsForPicker([selected.subDivisao]); // Restringir opções de subdivisão
        setIsSubdivisaoPickerDisabled(true); // Desabilitar o picker de subdivisão
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

  // Função para lidar com a seleção da subdivisão e filtrar atletas
  const handleSubdivisaoFilterChange = (subdivisao: string) => {
    // Só permite a filtragem se o picker de subdivisão não estiver desabilitado (ou seja, nenhum atleta foi selecionado e travou a subdivisão)
    if (!isSubdivisaoPickerDisabled) {
      setSelectedSubdivisao(subdivisao);
      if (subdivisao === '') { // Opção "Todas"
        setFilteredAtletasList(atletasList);
      } else {
        const filtered = atletasList.filter(atleta => atleta.subDivisao === subdivisao);
        setFilteredAtletasList(filtered);
      }
      // Resetar a seleção do atleta quando a subdivisão muda, pois o filtro pode ter mudado o atleta visível
      setSelectedAtletaId(null);
      setNomeCompleto('');
    }
  };


  const handleSubmit = async () => {
    setIsLoading(true);

    console.log('API_BASE_URL utilizada:', API_BASE_URL);

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

    // Common headers for authenticated requests
    const authHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`,
    };

    // Dados para o CriarAvaliacaoRequest no backend
    const requestBody = {
      atletaId: selectedAtletaId!, // Usando o operador de asserção não nula
      userName: nomeAvaliador, 
      dataAvaliacao: formatarData(dataAvaliacao), // Certifique-se de que está no formato correto (YYYY-MM-DD)
      periodoTreino: periodo,
      subdivisao: selectedSubdivisao, // Incluir a subdivisão selecionada
      feedbackTreinador,
      feedbackAvaliador,
      pontosFortes,
      pontosFracos,
      areasAprimoramento,
      metasObjetivos, // Usando o nome corrigido da variável de estado
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
      // Enviar dados para o endpoint de relatório geral
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
      // navigation.goBack(); // Opcional: Voltar para a tela anterior
    } catch (error: any) {
      console.error('Erro ao enviar avaliação:', error);
      if (error.message.includes('Status: 401')) {
        Alert.alert('Não Autorizado', 'Sua sessão expirou ou você não tem permissão. Por favor, faça login novamente.');
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
    <ScrollView style={styles.container}>
      <Text style={styles.title}>
        ASSOCIAÇÃO DESPORTIVA CIPOENSE - ESCOLINHA DE FUTEBOL DA ADC
      </Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Dados do Atleta</Text>

        <Text style={styles.label}>Nome do Atleta:</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={selectedAtletaId}
            onValueChange={(itemValue) => handleAtletaChange(itemValue)}
            style={styles.picker}
          >
            <Picker.Item label="Selecione um Atleta" value={null} />
            {filteredAtletasList.map((atleta) => (
              <Picker.Item key={atleta.id} label={atleta.nomeCompleto} value={atleta.id} />
            ))}
          </Picker>
        </View>

        <Text style={styles.label}>Nome do Avaliador:</Text>
        <TextInput
          style={styles.input}
          value={nomeAvaliador}
          editable={false} // Nome do avaliador é preenchido pelo token
        />

        <Text style={styles.label}>Subdivisão:</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={selectedSubdivisao}
            onValueChange={(itemValue) => handleSubdivisaoFilterChange(itemValue)}
            style={styles.picker}
            enabled={!isSubdivisaoPickerDisabled} // Controla se o picker está habilitado/desabilitado
          >
            {/* Renderiza "Selecione uma Subdivisão" apenas se o picker não estiver desabilitado */}
            {!isSubdivisaoPickerDisabled && <Picker.Item label="Selecione uma Subdivisão" value="" />}
            {/* As opções são baseadas em subdivisaoOptionsForPicker */}
            {subdivisaoOptionsForPicker.map((subdivisao, index) => (
              <Picker.Item key={index} label={subdivisao} value={subdivisao} />
            ))}
          </Picker>
        </View>

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

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Avaliação Geral do Jogador</Text>
        <TextInput
          style={styles.input}
          placeholder="Feedback do Treinador"
          value={feedbackTreinador}
          onChangeText={setFeedbackTreinador}
          multiline
          numberOfLines={6}
        />
        <TextInput
          style={styles.input}
          placeholder="Feedback do Avaliador"
          value={feedbackAvaliador}
          onChangeText={setFeedbackAvaliador}
          multiline
          numberOfLines={6}
        />
        <TextInput
          style={styles.input}
          placeholder="Pontos Fortes"
          value={pontosFortes}
          onChangeText={setPontosFortes}
          multiline
          numberOfLines={6}
        />
        <TextInput
          style={styles.input}
          placeholder="Pontos Fracos"
          value={pontosFracos}
          onChangeText={setPontosFracos}
          multiline
          numberOfLines={6}
        />
        <TextInput
          style={styles.input}
          placeholder="Áreas de Aprimoramento"
          value={areasAprimoramento}
          onChangeText={setAreasAprimoramento}
          multiline
          numberOfLines={6}
        />
        <TextInput
          style={styles.input}
          placeholder="Metas/Planos/Objetivos"
          value={metasObjetivos}
          onChangeText={setMetasObjetivos}
          multiline
          numberOfLines={6}
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
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
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
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    marginBottom: 10,
    overflow: 'hidden', // Garante que o Picker não vaze
  },
  picker: {
    height: 50,
    width: '100%',
  },
});

export default AthleteEvaluationForm;