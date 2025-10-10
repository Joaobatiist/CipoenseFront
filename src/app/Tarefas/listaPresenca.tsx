import { Ionicons } from '@expo/vector-icons';
import { faArrowLeft, faCalendarAlt, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { NavigationProp } from '@react-navigation/native';
import { isAxiosError } from 'axios';
import { router, useFocusEffect, useNavigation } from 'expo-router';
import moment from 'moment';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { ResponsiveContainer } from '../../components/layout/ResponsiveContainer';
import Api from '../../Config/Api';
import { useResponsive } from '../../hooks/useResponsive';
import { createPresencaStyles } from '../../Styles/ResponsivePresenca';

// Carrega o locale pt-br usando a API do moment
moment.locale('pt-br');


interface PresencaRegistro {
  id: string;
  data: string; 
  presente: boolean;
  atletaId: string;
  nomeAtleta: string;
}
interface Aluno {
  id: string;
  nome: string;
  presente: boolean | null; 
  email?: string;
  subDivisao?: string;
}
interface PresencaData {
  atletaId: string;
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

  // Refs para controle de scroll
  const flatListRef = useRef<FlatList>(null);
  const historicoFlatListRef = useRef<FlatList>(null);

  // Navegação por teclado na web
  useEffect(() => {
    if (Platform.OS === 'web') {
      const handleKeyPress = (event: KeyboardEvent) => {
        if (document.activeElement?.tagName === 'INPUT' || 
            document.activeElement?.tagName === 'TEXTAREA') {
          return; // Não interfere quando há input focado
        }

        const currentFlatList = viewMode === 'historico' ? historicoFlatListRef.current : flatListRef.current;
        
        if (currentFlatList) {
          switch (event.key) {
            case 'ArrowDown':
              event.preventDefault();
              currentFlatList?.scrollToOffset({ offset: 100, animated: true });
              break;
            case 'ArrowUp':
              event.preventDefault();
              currentFlatList?.scrollToOffset({ offset: -100, animated: true });
              break;
            case 'PageDown':
              event.preventDefault();
              currentFlatList?.scrollToOffset({ offset: 400, animated: true });
              break;
            case 'PageUp':
              event.preventDefault();
              currentFlatList?.scrollToOffset({ offset: -400, animated: true });
              break;
            case 'Home':
              event.preventDefault();
              currentFlatList?.scrollToOffset({ offset: 0, animated: true });
              break;
            case 'End':
              event.preventDefault();
              currentFlatList?.scrollToEnd({ animated: true });
              break;
          }
        }
      };

      document.addEventListener('keydown', handleKeyPress);
      return () => document.removeEventListener('keydown', handleKeyPress);
    }
  }, [viewMode]);

  const navigation = useNavigation<ListaPresencaScreenNavigationProp>();
  
  // Hook para responsividade
  const { deviceType } = useResponsive();
  const styles = createPresencaStyles(deviceType);

  // Função centralizada para tratamento de erros
  const handleApiError = useCallback((error: any, defaultMessage: string) => {
    console.error(defaultMessage, error);
    if (isAxiosError(error) && error.response) {
      Alert.alert("Erro", `${defaultMessage}: ${error.response.data.message || 'Erro desconhecido.'}`);
    } else {
      Alert.alert("Erro", `${defaultMessage}. Verifique sua conexão.`);
    }
  }, []);

 const fetchAlunosForDay = useCallback(async (dateString: string) => {
  setLoading(true);
  try {
    const token = await AsyncStorage.getItem('jwtToken');
    if (!token) {
      Alert.alert("Erro de Autenticação", "Token não encontrado. Faça login novamente.");
      router.replace('../../');
      return;
    }

    const response = await Api.get<any[]>(`/api/presenca/atletas?data=${dateString}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    console.log('✅ Dados brutos do backend:', response.data);

    // Corrige o mapeamento: presenca -> presente
    const alunosCarregados: Aluno[] = response.data.map((aluno: any) => ({
      id: aluno.id,
      nome: aluno.nome,
      presente: aluno.presenca !== undefined ? aluno.presenca : null,
      email: aluno.email,
      subDivisao: aluno.subDivisao
    }));

    setAlunos(alunosCarregados);
  } catch (error) {
    handleApiError(error, 'Falha ao carregar dados dos alunos');
    setAlunos([]);
  } finally {
    setLoading(false);
  }
}, [handleApiError]);

  const fetchHistoricoPresencas = useCallback(async () => {
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
      handleApiError(error, 'Falha ao carregar histórico de presenças');
      setPresencasAgrupadas({});
    } finally {
      setLoading(false);
    }
  }, [handleApiError]);

  // Hook para recarregar dados quando a tela ganha foco
  useFocusEffect(
    useCallback(() => {
      if (viewMode === 'historico') {
        fetchHistoricoPresencas();
      } else { 
        fetchAlunosForDay(moment(selectedDate).format('YYYY-MM-DD'));
      }
    }, [viewMode, selectedDate, fetchHistoricoPresencas, fetchAlunosForDay]) 
  );

  const setPresencaStatus = useCallback((alunoId: string, status: boolean | null) => {
    setAlunos(prevAlunos =>
      prevAlunos.map((aluno: Aluno) =>
        aluno.id === alunoId ? { ...aluno, presente: status } : aluno
      )
    );
  }, []);



  const salvarPresenca = useCallback(async () => {
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
      handleApiError(error, 'Falha ao salvar presenças');
    } finally {
      setSaving(false);
    }
  }, [alunos, selectedDate, handleApiError]);


  const renderAlunoItem = useCallback(({ item }: { item: Aluno }) => {
    const isEditable = viewMode === 'registro';

    // Define a cor do ícone baseado no status
    let iconName: keyof typeof Ionicons.glyphMap = "ellipse-outline";
    let iconColor = "lightgray";

    if (item.presente === true) {
        iconName = "checkmark-circle";
        iconColor = "green";
    } else if (item.presente === false) {
        iconName = "close-circle";
        iconColor = "red";
    }

    return (
        <View style={styles.alunoItem}>
            <Text style={styles.alunoNome}>{item.nome}</Text>
            <View style={styles.iconContainer}>
                {isEditable ? (
                    <>
                        <TouchableOpacity 
                          onPress={() => setPresencaStatus(item.id, true)}
                          style={Platform.OS === 'web' ? { cursor: 'pointer' as any } : undefined}
                          activeOpacity={0.7}
                          accessible={true}
                          accessibilityLabel={`Marcar ${item.nome} como presente`}
                          accessibilityRole="button"
                        >
                            <Ionicons 
                                name="checkmark-circle-outline" 
                                size={30} 
                                color={item.presente === true ? "green" : "lightgray"} 
                            />
                        </TouchableOpacity>
                        <View style={{ width: 15 }} />
                        <TouchableOpacity 
                          onPress={() => setPresencaStatus(item.id, false)}
                          style={Platform.OS === 'web' ? { cursor: 'pointer' as any } : undefined}
                          activeOpacity={0.7}
                          accessible={true}
                          accessibilityLabel={`Marcar ${item.nome} como ausente`}
                          accessibilityRole="button"
                        >
                            <Ionicons 
                                name="close-circle-outline" 
                                size={30} 
                                color={item.presente === false ? "red" : "lightgray"} 
                            />
                        </TouchableOpacity>
                    </>
                ) : (
                    <Ionicons
                        name={iconName}
                        size={30}
                        color={iconColor}
                    />
                )}
            </View>
        </View>
    );
  }, [viewMode, setPresencaStatus, styles]);
  const renderDiaHistoricoItem = useCallback(({ item }: { item: string }) => {
    const dataFormatada = moment(item).format('DD/MM/YYYY (dddd)');
    const registrosDoDia = presencasAgrupadas[item];
    const totalPresentes = registrosDoDia.filter(p => p.presente === true).length;
    const totalAusentes = registrosDoDia.filter(p => p.presente === false).length;
    const totalAlunos = registrosDoDia.length;

    return (
      <TouchableOpacity
        style={[
          styles.diaCard,
          Platform.OS === 'web' && { cursor: 'pointer' as any }
        ]}
        onPress={() => {
          setSelectedDate(moment(item).toDate());
          setViewMode('detalhe'); 
        }}
        activeOpacity={0.7}
        accessible={true}
        accessibilityLabel={`Ver detalhes do dia ${moment(item).format('DD/MM/YYYY')}`}
        accessibilityRole="button"
      >
        <View style={styles.diaCardContent}>
          <Text style={styles.diaCardTitle}>{dataFormatada}</Text>
          <Text style={styles.diaCardSummary}>
            Presentes: {totalPresentes} | Ausentes: {totalAusentes} | Total: {totalAlunos}
          </Text>
        </View>
        <FontAwesomeIcon icon={faChevronRight} size={16} color="#666" />
      </TouchableOpacity>
    );
  }, [presencasAgrupadas, styles]);

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

 
  return (
    <ResponsiveContainer style={styles.container}>
      
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
          <FontAwesomeIcon icon={faArrowLeft} size={20} color="#fff" />
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
            <FontAwesomeIcon icon={faCalendarAlt} size={20} color="#fff" />
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
            ref={historicoFlatListRef}
            data={Object.keys(presencasAgrupadas)}
            keyExtractor={(item) => item}
            renderItem={renderDiaHistoricoItem}
            contentContainerStyle={styles.listContent}
            // Otimizações para web
            showsVerticalScrollIndicator={Platform.OS === 'web'}
            showsHorizontalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled={true}
            bounces={Platform.OS !== 'web'}
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
            ref={flatListRef}
            data={alunos}
            keyExtractor={item => item.id.toString()}
            renderItem={renderAlunoItem}
            contentContainerStyle={styles.listContent}
            // Otimizações para web
            showsVerticalScrollIndicator={Platform.OS === 'web'}
            showsHorizontalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled={true}
            bounces={Platform.OS !== 'web'}
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
    </ResponsiveContainer>
  );
};

export default ListaPresencaScreen;
