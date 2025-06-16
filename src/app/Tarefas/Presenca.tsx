import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  Modal,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, NavigationProp, useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import axios from 'axios';
import { styles } from '../../Styles/Presenca'; 
import Api from '../../Config/Api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import moment from 'moment';
import 'moment/locale/pt-br';
import DateTimePicker from '@react-native-community/datetimepicker';

moment.locale('pt-br');


interface PresencaRegistro {
  id: number;
  data: string; 
  presente: boolean;
  atletaId: number;
  nomeAtleta: string;
}
interface Aluno {
  id: number;
  nome: string;
  presente: boolean | null; 
  email?: string;
  subDivisao?: string;
}
interface PresencaData {
  atletaId: number;
  presente: boolean;
  data: string; 
}

type RootStackParamList = {
  ListaPresenca: undefined;
};
type ListaPresencaScreenNavigationProp = NavigationProp<RootStackParamList, 'ListaPresenca'>;

const ListaPresencaScreen = () => {
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [tempSelectedDate, setTempSelectedDate] = useState<Date>(new Date());
  const [showDatePickerModal, setShowDatePickerModal] = useState(false);
  const [presencasAgrupadas, setPresencasAgrupadas] = useState<Record<string, PresencaRegistro[]>>({});
  
  // NOVO: Estado único para controlar a visualização da tela
  type ViewMode = 'registro' | 'historico' | 'detalhe';
  const [viewMode, setViewMode] = useState<ViewMode>('registro');

  const navigation = useNavigation<ListaPresencaScreenNavigationProp>();

  useFocusEffect(
    useCallback(() => {
      if (viewMode === 'historico') {
        fetchHistoricoPresencas();
      } else { 
        fetchAlunosForDay(moment(selectedDate).format('YYYY-MM-DD'));
      }
    }, [viewMode, selectedDate]) 
  );

 const fetchAlunosForDay = async (dateString: string) => {
  setLoading(true);
  try {
    const token = await AsyncStorage.getItem('jwtToken');
    const response = await Api.get<any[]>(`/api/presenca/atletas?data=${dateString}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    console.log('✅ Dados brutos do backend:', response.data);

    // Corrige o mapeamento: presenca -> presente
    const alunosCarregados: Aluno[] = response.data.map((aluno: any) => ({
      id: aluno.id,
      nome: aluno.nome,
      presente: aluno.presenca !== undefined ? aluno.presenca : null, // <-- Aqui está a correção
      email: aluno.email,
      subDivisao: aluno.subDivisao
    }));

    setAlunos(alunosCarregados);
  } catch (error) {
    console.error('Erro ao buscar alunos:', error);
    Alert.alert('Erro', 'Falha ao carregar dados.');
    setAlunos([]);
  } finally {
    setLoading(false);
  }
};

  const fetchHistoricoPresencas = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      if (!token) {
        Alert.alert("Erro de Autenticação", "Token não encontrado. Faça login novamente.");
        router.replace('../../');
        return;
      }
      
      const response = await Api.get<PresencaRegistro[]>('/api/presenca/historico', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const grouped: Record<string, PresencaRegistro[]> = {};
      response.data.forEach(item => {
        const dateKey = moment(item.data).format('YYYY-MM-DD');
        if (!grouped[dateKey]) {
          grouped[dateKey] = [];
        }
        grouped[dateKey].push(item);
      });
      
      const sortedKeys = Object.keys(grouped).sort((a, b) => b.localeCompare(a));
      const sortedGrouped: Record<string, PresencaRegistro[]> = {};
      sortedKeys.forEach(key => {
        sortedGrouped[key] = grouped[key];
      });

      setPresencasAgrupadas(sortedGrouped);

    } catch (error) {
      console.error("Erro ao buscar histórico de presenças:", error);
      if (axios.isAxiosError(error) && error.response) {
        Alert.alert("Erro", `Falha ao carregar histórico: ${error.response.data.message || 'Erro desconhecido.'}`);
      } else {
        Alert.alert("Erro", "Não foi possível conectar ao servidor ou erro inesperado.");
      }
      setPresencasAgrupadas({});
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
          data: moment(selectedDate).format('YYYY-MM-DD')
        }));

      if (presencasParaEnviar.length === 0) {
        Alert.alert("Aviso", "Nenhuma presença foi marcada para salvar.");
        setSaving(false);
        return;
      }

      await Api.post(`/api/presenca/registrar`, presencasParaEnviar, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      Alert.alert("Sucesso", "Presenças registradas/atualizadas com sucesso!");
      
    
      setViewMode('detalhe');
      
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


  const renderAlunoItem = useCallback(({ item }: { item: Aluno }) => {
    const isEditable = viewMode === 'registro';
    const isDetalhe = viewMode === 'detalhe';   // Modo visualização

    // Define a cor do ícone baseado no status
    let iconName = "circle"; // Padrão (não registrado)
    let iconColor = "lightgray";

    if (item.presente === true) {
        iconName = "check-circle";
        iconColor = "green";
    } else if (item.presente === false) {
        iconName = "cancel";
        iconColor = "red";
    }

    return (
        <View style={styles.alunoItem}>
            <Text style={styles.alunoNome}>{item.nome}</Text>
            <View style={styles.iconContainer}>
                {isEditable ? (
                    
                    <>
                        <TouchableOpacity onPress={() => setPresencaStatus(item.id, true)}>
                            <MaterialIcons name="check-circle" size={30} color={item.presente === true ? "green" : "lightgray"} />
                        </TouchableOpacity>
                        <View style={{ width: 15 }} />
                        <TouchableOpacity onPress={() => setPresencaStatus(item.id, false)}>
                            <MaterialIcons name="cancel" size={30} color={item.presente === false ? "red" : "lightgray"} />
                        </TouchableOpacity>
                    </>
                ) : (
                   
                    <MaterialIcons
                        name={iconName}
                        size={30}
                        color={iconColor}
                    />
                )}
            </View>
        </View>
    );
  }, [viewMode, setPresencaStatus]);
  const renderDiaHistoricoItem = useCallback(({ item }: { item: string }) => {
    const dataFormatada = moment(item).format('DD/MM/YYYY (dddd)');
    const registrosDoDia = presencasAgrupadas[item];
    const totalPresentes = registrosDoDia.filter(p => p.presente === true).length;
    const totalAusentes = registrosDoDia.filter(p => p.presente === false).length;
    const totalAlunos = registrosDoDia.length;

    return (
      <TouchableOpacity
        style={styles.diaCard}
        onPress={() => {
          setSelectedDate(moment(item).toDate());
          setViewMode('detalhe'); 
        }}
      >
        <View style={styles.diaCardContent}>
          <Text style={styles.diaCardTitle}>{dataFormatada}</Text>
          <Text style={styles.diaCardSummary}>
            Presentes: {totalPresentes} | Ausentes: {totalAusentes} | Total: {totalAlunos}
          </Text>
        </View>
        <MaterialIcons name="arrow-forward-ios" size={20} color="#1c348e" />
      </TouchableOpacity>
    );
  }, [presencasAgrupadas]);

  const onDateChangeInPicker = (event: any, date?: Date) => {
    const currentDate = date || tempSelectedDate;
    setShowDatePickerModal(Platform.OS === 'ios');
    setTempSelectedDate(currentDate);

    if (Platform.OS === 'android') {
      setSelectedDate(currentDate);
      setViewMode('registro'); 
    }
  };
  
  const confirmIosDate = () => {
    setShowDatePickerModal(false);
    setSelectedDate(tempSelectedDate);
    setViewMode('registro'); 
  };
  
  const getHeaderTitle = () => {
      switch (viewMode) {
          case 'historico':
              return 'Histórico de Presenças';
          case 'detalhe':
              return `Detalhes - ${moment(selectedDate).format('DD/MM/YYYY')}`;
          case 'registro':
          default:
              return `Registro - ${moment(selectedDate).format('DD/MM/YYYY')}`;
      }
  };

 
  return (
    <View style={styles.container}>
      
      <View style={styles.header}>
        
        <TouchableOpacity
          onPress={() => {
            if (viewMode === 'detalhe') {
              setViewMode('historico');
            } else if (viewMode === 'historico') {
              setViewMode('registro');
              setSelectedDate(new Date());
            } else { // 'registro'
              navigation.goBack();
            }
          }}
          style={styles.btnVoltar}
        >
          <MaterialIcons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>{getHeaderTitle()}</Text>
        
        {viewMode === 'registro' && (
          <TouchableOpacity
            onPress={() => {
              setTempSelectedDate(selectedDate);
              setShowDatePickerModal(true);
            }}
            style={styles.calendarButton}
          >
            
          </TouchableOpacity>
        )}
      </View>

      {showDatePickerModal && Platform.OS === 'ios' && (
        <Modal transparent={true} animationType="slide" visible={showDatePickerModal} onRequestClose={() => setShowDatePickerModal(false)}>
            <View style={styles.modalBackground}>
              <View style={styles.datePickerContainer}>
                  <DateTimePicker value={tempSelectedDate} mode="date" display="spinner" onChange={onDateChangeInPicker} />
                  <TouchableOpacity onPress={confirmIosDate} style={styles.confirmButton}>
                      <Text style={styles.confirmButtonText}>Confirmar</Text>
                  </TouchableOpacity>
              </View>
            </View>
        </Modal>
      )}
      {showDatePickerModal && Platform.OS === 'android' && (
          <DateTimePicker value={tempSelectedDate} mode="date" display="default" onChange={onDateChangeInPicker} />
      )}

      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1c348e" />
          <Text>Carregando...</Text>
        </View>
      ) : viewMode === 'historico' ? (
        Object.keys(presencasAgrupadas).length === 0 ? (
          <View style={styles.emptyListContainer}>
            <Text style={styles.emptyListText}>Nenhum registro de presença encontrado.</Text>
            <TouchableOpacity style={styles.reloadButton} onPress={fetchHistoricoPresencas}>
              <Text style={styles.reloadButtonText}>Recarregar Histórico</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={Object.keys(presencasAgrupadas)}
            keyExtractor={(item) => item}
            renderItem={renderDiaHistoricoItem}
            contentContainerStyle={styles.listContent}
          />
        )
      ) : (
        alunos.length === 0 ? (
          <View style={styles.emptyListContainer}>
            <Text style={styles.emptyListText}>Nenhum aluno encontrado para esta data.</Text>
            <TouchableOpacity style={styles.reloadButton} onPress={() => fetchAlunosForDay(moment(selectedDate).format('YYYY-MM-DD'))}>
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
        )
      )}

      {viewMode === 'registro' && (
        <TouchableOpacity style={[styles.saveButton, saving && styles.saveButtonDisabled]} onPress={salvarPresenca} disabled={saving}>
          {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.saveButtonText}>Salvar Presenças</Text>}
        </TouchableOpacity>
      )}
      
      {viewMode === 'detalhe' && (
        <TouchableOpacity style={styles.saveButton} onPress={() => setViewMode('registro')}>
          <Text style={styles.saveButtonText}>Editar Presenças</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={styles.previousListsButton}
        onPress={() => {
          if (viewMode === 'historico') {
            setViewMode('registro');
            setSelectedDate(new Date());
          } else {
            setViewMode('historico');
          }
        }}
      >
        <Text style={styles.previousListsButtonText}>
          {viewMode === 'historico' ? 'Voltar ao Registro do Dia' : 'Ver Histórico'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default ListaPresencaScreen;