import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  Modal, // Importar Modal de volta
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { router } from 'expo-router';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import moment from 'moment';

// --- Configuração ---
const BASE_URL = 'http://192.168.0.10:8080';

// --- Interfaces TypeScript ---
interface Aluno {
  id: number;
  nome: string;
  presente: boolean | null; // true (presente), false (ausente), null (não marcado)
  email?: string;
  subDivisao?: string;
}

interface PresencaData {
  atletaId: number;
  presente: boolean;
  data: string; // "YYYY-MM-DD"
}

type RootStackParamList = {
  ListaPresenca: undefined;
  ListaPresencasAnteriores: { initialDate?: string };
};
type ListaPresencaScreenNavigationProp = NavigationProp<RootStackParamList, 'ListaPresenca'>;

// --- Componente da Tela ---
const ListaPresencaScreen = () => {
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  // A data padrão agora é o dia atual, não amanhã.
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  // Data temporária para o picker
  const [tempSelectedDate, setTempSelectedDate] = useState<Date>(new Date());
  const [showDatePickerModal, setShowDatePickerModal] = useState(false);

  const navigation = useNavigation<ListaPresencaScreenNavigationProp>();

  // --- Efeito para carregar alunos ao montar e quando a data selecionada muda ---
  useEffect(() => {
    // Carrega alunos para a data no estado 'selectedDate'
    fetchAlunosForDay(moment(selectedDate).format('YYYY-MM-DD'));
  }, [selectedDate]);

  /**
   * Busca a lista de atletas para uma data específica.
   * @param dateString A data no formato "YYYY-MM-DD".
   */
  const fetchAlunosForDay = async (dateString: string) => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      if (!token) {
        Alert.alert("Erro de Autenticação", "Token não encontrado. Faça login novamente.");
        router.replace('../../');
        return;
      }

      const response = await axios.get<Aluno[]>(`${BASE_URL}/api/presenca/atletas?data=${dateString}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const alunosComPresenca: Aluno[] = response.data.map((aluno: Aluno) => ({
        ...aluno,
        presente: aluno.presente !== undefined ? aluno.presente : null,
      }));
      setAlunos(alunosComPresenca);

      const ids = alunosComPresenca.map(a => a.id);
      const uniqueIds = new Set(ids);
      if (ids.length !== uniqueIds.size) {
        console.warn("ATENÇÃO: IDs de alunos duplicados detectados! Isso pode causar comportamento inesperado.");
      }

    } catch (error) {
      console.error(`Erro ao buscar alunos para ${dateString}:`, error);
      if (axios.isAxiosError(error) && error.response) {
        Alert.alert("Erro", `Falha ao carregar alunos para ${dateString}: ${error.response.data.message || 'Erro desconhecido.'}`);
      } else {
        Alert.alert("Erro", "Não foi possível conectar ao servidor ou erro inesperado.");
      }
      setAlunos([]);
    } finally {
      setLoading(false);
    }
  };

  const setPresencaStatus = (alunoId: number, status: boolean | null) => {
    setAlunos(prevAlunos =>
      prevAlunos.map((aluno: Aluno) =>
        aluno.id === alunoId ? { ...aluno, presente: status } : aluno
      )
    );
  };

  const salvarPresenca = async () => {
    setSaving(true);
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      if (!token) {
        Alert.alert("Erro de Autenticação", "Token não encontrado. Faça login novamente.");
        router.replace('../../');
        return;
      }

      const presencasParaEnviar: PresencaData[] = alunos
        .filter(aluno => aluno.presente !== null)
        .map(aluno => ({
          atletaId: aluno.id,
          presente: aluno.presente!,
          data: moment(selectedDate).format('YYYY-MM-DD') // Envia a data selecionada
        }));

      if (presencasParaEnviar.length === 0) {
        Alert.alert("Aviso", "Nenhuma presença foi marcada para salvar.");
        setSaving(false);
        return;
      }

      const response = await axios.post(`${BASE_URL}/api/presenca/registrar`, presencasParaEnviar, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      Alert.alert("Sucesso", "Presenças registradas/atualizadas com sucesso!");
      console.log("Resposta do backend (salvar presença):", response.data);

    } catch (error) {
      console.error("Erro ao salvar presença:", error);
      if (axios.isAxiosError(error) && error.response) {
        Alert.alert("Erro", `Falha ao salvar presenças: ${error.response.data.message || 'Erro desconhecido.'}`);
      } else {
        Alert.alert("Erro", "Não foi possível conectar ao servidor ou erro inesperado ao salvar.");
      }
    } finally {
      setSaving(false);
    }
  };

  const renderAlunoItem = useCallback(({ item }: { item: Aluno }) => (
    <View style={styles.alunoItem}>
      <Text style={styles.alunoNome}>{item.nome}</Text>
      <View style={styles.iconContainer}>
        <TouchableOpacity onPress={() => setPresencaStatus(item.id, true)}>
          <MaterialIcons
            name="check-circle"
            size={30}
            color={item.presente === true ? "green" : "lightgray"}
          />
        </TouchableOpacity>
        <View style={{ width: 15 }} />
        <TouchableOpacity onPress={() => setPresencaStatus(item.id, false)}>
          <MaterialIcons
            name="cancel"
            size={30}
            color={item.presente === false ? "red" : "lightgray"}
          />
        </TouchableOpacity>
      </View>
    </View>
  ), []);

  const onDateChangeInPicker = (event: any, date?: Date) => {
    const currentDate = date || tempSelectedDate;
    setTempSelectedDate(currentDate); // Atualiza apenas a data temporária
    if (Platform.OS === 'android') {
      setShowDatePickerModal(false);
      setSelectedDate(currentDate); // Define a data final
    }
  };

 

  // --- Renderização Condicional ---
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1c348e" />
        <Text>Carregando alunos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.btnVoltar}
          accessibilityLabel="Voltar"
        >
          <MaterialIcons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          Presença - {moment(selectedDate).format('DD/MM/YYYY')}
        </Text>
        {/* Botão para abrir o DatePicker para selecionar a data do registro */}
        <TouchableOpacity
          onPress={() => {
            setTempSelectedDate(selectedDate); // Inicia o picker com a data atual
            setShowDatePickerModal(true);
          }}
          style={styles.calendarButton}
        >
         
        </TouchableOpacity>
      </View>

      {/* Modal para seleção de data de REGISTRO */}
     

      {alunos.length === 0 ? (
        <View style={styles.emptyListContainer}>
          <Text style={styles.emptyListText}>
            Nenhum aluno encontrado para esta data ou não há registros.
          </Text>
          <TouchableOpacity
            style={styles.reloadButton}
            onPress={() => fetchAlunosForDay(moment(selectedDate).format('YYYY-MM-DD'))}
          >
            <Text style={styles.reloadButtonText}>Tentar Novamente</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={alunos}
          keyExtractor={item => item.id.toString()}
          renderItem={renderAlunoItem}
          contentContainerStyle={styles.listContent}
        />
      )}

      <TouchableOpacity
        style={[styles.saveButton, saving && styles.saveButtonDisabled]}
        onPress={salvarPresenca}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.saveButtonText}>Salvar Presenças</Text>
        )}
      </TouchableOpacity>

     
      <TouchableOpacity
        style={styles.previousListsButton}
        
      >
        <Text style={styles.previousListsButtonText}>Ver Histórico</Text>
      </TouchableOpacity>
    </View>
  );
};

// --- Estilos ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: {
    backgroundColor: '#1c348e',
    padding: 15,
    paddingTop: Platform.OS === 'android' ? 40 : 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e5c228',
  },
  btnVoltar: {
    position: 'absolute',
    left: 15,
    top: Platform.OS === 'android' ? 40 : 20,
    zIndex: 1,
  },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  calendarButton: { // Novo estilo para o botão do calendário no cabeçalho
    position: 'absolute',
    right: 15,
    top: Platform.OS === 'android' ? 40 : 20,
    zIndex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  emptyListContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyListText: { fontSize: 18, color: '#666', marginBottom: 10 },
  reloadButton: {
    backgroundColor: '#e5c228',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginTop: 10,
  },
  reloadButtonText: { color: '#1c348e', fontWeight: 'bold' },
  listContent: { padding: 15 },
  alunoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  alunoNome: { fontSize: 18, color: '#333', flex: 1 },
  iconContainer: { flexDirection: 'row', alignItems: 'center' },
  saveButton: {
    backgroundColor: '#1c348e',
    paddingVertical: 15,
    marginHorizontal: 15,
    marginTop: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  saveButtonDisabled: { backgroundColor: '#a0a0a0' },
  previousListsButton: {
    backgroundColor: '#e5c228',
    paddingVertical: 15,
    marginHorizontal: 15,
    marginBottom: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previousListsButtonText: {
    color: '#1c348e',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Estilos do Modal para DateTimePicker (mantidos)
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  modalButtonsContainer: {
    flexDirection: 'row',
    marginTop: 20,
    justifyContent: 'space-around',
    width: '100%',
  },
  modalButton: {
    borderRadius: 10,
    padding: 10,
    elevation: 2,
    flex: 1,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  buttonClose: {
    backgroundColor: '#f44336',
  },
  buttonConfirm: {
    backgroundColor: '#4CAF50',
  },
  textStyle: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default ListaPresencaScreen;