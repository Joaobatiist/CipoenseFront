import React, { JSX, useCallback, useEffect, useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { faArrowLeft, faCalendarAlt, faCheckCircle, faChevronRight, faCircle, faTimesCircle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { isAxiosError } from 'axios';
import { router, useFocusEffect } from 'expo-router';
import moment from 'moment';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Platform,
  Pressable,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
  StyleSheet,
  StatusBar,
} from 'react-native';
import Api from '../../Config/Api';

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

type ViewMode = 'registro' | 'historico' | 'detalhe';

export default function ListaPresencaScreen(): JSX.Element {
  const { width } = useWindowDimensions();
  const isLargeScreen = width >= 768; // breakpoint

  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [tempSelectedDate, setTempSelectedDate] = useState<Date>(new Date());
  const [showDatePickerModal, setShowDatePickerModal] = useState(false);
  const [presencasAgrupadas, setPresencasAgrupadas] = useState<Record<string, PresencaRegistro[]>>({});
  const [viewMode, setViewMode] = useState<ViewMode>('registro');

  // keyboard focus index for navigation on web
  const [focusIndex, setFocusIndex] = useState<number>(0);

  const flatListRef = useRef<FlatList | null>(null);
  const historicoFlatListRef = useRef<FlatList | null>(null);

  const navigation = useNavigation<ListaPresencaScreenNavigationProp>();

  const handleApiError = useCallback((error: any, defaultMessage: string) => {
    console.error(defaultMessage, error);
    if (isAxiosError(error) && error.response) {
      Alert.alert('Erro', `${defaultMessage}: ${error.response.data?.message || 'Erro desconhecido.'}`);
    } else {
      Alert.alert('Erro', `${defaultMessage}. Verifique sua conexão.`);
    }
  }, []);

  const fetchAlunosForDay = useCallback(async (dateString: string) => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      if (!token) {
        Alert.alert('Erro de Autenticação', 'Token não encontrado. Faça login novamente.');
        router.replace('../../');
        return;
      }

      const response = await Api.get<any[]>(`/api/presenca/atletas?data=${dateString}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const alunosCarregados: Aluno[] = response.data.map((aluno: any) => ({
        id: aluno.id,
        nome: aluno.nome,
        presente: aluno.presenca !== undefined ? aluno.presenca : null,
        email: aluno.email,
        subDivisao: aluno.subDivisao,
      }));

      setAlunos(alunosCarregados);
      setFocusIndex(0);
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
        Alert.alert('Erro de Autenticação', 'Token não encontrado. Faça login novamente.');
        router.replace('../../');
        return;
      }

      const response = await Api.get<PresencaRegistro[]>('/api/presenca/historico', {
        headers: { Authorization: `Bearer ${token}` },
      });

      const grouped: Record<string, PresencaRegistro[]> = {};
      response.data.forEach((item) => {
        const dateKey = moment(item.data).format('YYYY-MM-DD');
        if (!grouped[dateKey]) grouped[dateKey] = [];
        grouped[dateKey].push(item);
      });

      const sortedKeys = Object.keys(grouped).sort((a, b) => b.localeCompare(a));
      const sortedGrouped: Record<string, PresencaRegistro[]> = {};
      sortedKeys.forEach((key) => (sortedGrouped[key] = grouped[key]));

      setPresencasAgrupadas(sortedGrouped);
      setFocusIndex(0);
    } catch (error) {
      handleApiError(error, 'Falha ao carregar histórico de presenças');
      setPresencasAgrupadas({});
    } finally {
      setLoading(false);
    }
  }, [handleApiError]);

  // Hook para resetar o foco ao mudar de modo
  useEffect(() => {
    setFocusIndex(0);
  }, [viewMode]);

  useFocusEffect(
    useCallback(() => {
      if (viewMode === 'historico') fetchHistoricoPresencas();
      else fetchAlunosForDay(moment(selectedDate).format('YYYY-MM-DD'));
    }, [viewMode, selectedDate, fetchHistoricoPresencas, fetchAlunosForDay])
  );

  // Keyboard navigation (Web): use focusIndex to scroll by index
  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const handleKey = (e: KeyboardEvent) => {
      // ignore when typing in inputs
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

  const setPresencaStatus = useCallback((alunoId: string, status: boolean | null) => {
    setAlunos((prev) => prev.map((a) => (a.id === alunoId ? { ...a, presente: status } : a)));
  }, []);

  const salvarPresenca = useCallback(async () => {
    setSaving(true);
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      if (!token) {
        Alert.alert('Erro de Autenticação', 'Token não encontrado. Faça login novamente.');
        router.replace('../../');
        return;
      }

      const presencasParaEnviar: PresencaData[] = alunos
        .filter((a) => a.presente !== null)
        .map((a) => ({ atletaId: a.id, presente: a.presente as boolean, data: moment(selectedDate).format('YYYY-MM-DD') }));

      if (presencasParaEnviar.length === 0) {
        Alert.alert('Aviso', 'Nenhuma presença foi marcada para salvar.');
        setSaving(false);
        return;
      }

      await Api.post('/api/presenca/registrar', presencasParaEnviar, {
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      });

      Alert.alert('Sucesso', 'Presenças registradas/atualizadas com sucesso!');
      setViewMode('detalhe');
    } catch (error) {
      handleApiError(error, 'Falha ao salvar presenças');
    } finally {
      setSaving(false);
    }
  }, [alunos, selectedDate, handleApiError]);

  const renderAlunoItem = useCallback(
    ({ item, index }: { item: Aluno; index: number }) => {
      const isEditable = viewMode === 'registro';

      // Variáveis para FontAwesome
      let iconFa: any = faCircle; // Ícone de círculo (neutro/não marcado)
      let iconColor = 'lightgray';

      if (item.presente === true) {
        iconFa = faCheckCircle; // Círculo de check
        iconColor = 'green';
      } else if (item.presente === false) {
        iconFa = faTimesCircle; // Círculo de X
        iconColor = 'red';
      }

      const isFocused = Platform.OS === 'web' && focusIndex === index;

      return (
        <Pressable
          onPress={() => {
            if (isEditable) setPresencaStatus(item.id, item.presente === true ? null : true);
          }}
          style={({ pressed }) => [styles.alunoItem, isFocused && styles.itemFocused, pressed && styles.itemPressed]}
          android_ripple={{ color: '#eee' }}
          accessible={true}
          accessibilityLabel={`Aluno ${item.nome}. Status: ${item.presente === true ? 'presente' : item.presente === false ? 'ausente' : 'não marcado'}`}
          accessibilityRole="button"
        >
          <Text style={styles.alunoNome} numberOfLines={1} ellipsizeMode="tail">
            {item.nome}
          </Text>

          <View style={styles.iconContainer}>
            {isEditable ? (
              <>
                <TouchableOpacity onPress={() => setPresencaStatus(item.id, true)} accessibilityRole="button" accessibilityLabel={`Marcar ${item.nome} como presente`}>
                  {/* FontAwesome para Presente (Outline não existe, usamos a cor) */}
                  <FontAwesomeIcon 
                    icon={faCheckCircle} 
                    size={30} 
                    color={item.presente === true ? 'green' : 'lightgray'} 
                  />
                </TouchableOpacity>
                <View style={{ width: 12 }} />
                <TouchableOpacity onPress={() => setPresencaStatus(item.id, false)} accessibilityRole="button" accessibilityLabel={`Marcar ${item.nome} como ausente`}>
                  {/* FontAwesome para Ausente (Outline não existe, usamos a cor) */}
                  <FontAwesomeIcon 
                    icon={faTimesCircle} 
                    size={30} 
                    color={item.presente === false ? 'red' : 'lightgray'} 
                  />
                </TouchableOpacity>
              </>
            ) : (
              // FontAwesome - Ícone sólido para histórico/detalhe
              <FontAwesomeIcon 
                icon={iconFa} 
                size={30} 
                color={iconColor} 
              />
            )}
          </View>
        </Pressable>
      );
    },
    [viewMode, setPresencaStatus, focusIndex]
);

  const renderDiaHistoricoItem = useCallback(
    ({ item, index }: { item: string; index: number }) => {
      const dataFormatada = moment(item).format('DD/MM/YYYY (dddd)');
      const registrosDoDia = presencasAgrupadas[item] || [];
      const totalPresentes = registrosDoDia.filter((p) => p.presente === true).length;
      const totalAusentes = registrosDoDia.filter((p) => p.presente === false).length;
      const totalAlunos = registrosDoDia.length;

      const isFocused = Platform.OS === 'web' && focusIndex === index;

      return (
        <Pressable
          style={[styles.diaCard, isFocused && styles.itemFocused]}
          onPress={() => {
            setSelectedDate(moment(item).toDate());
            setViewMode('detalhe');
          }}
          accessibilityLabel={`Ver detalhes do dia ${moment(item).format('DD/MM/YYYY')}`}
          accessibilityRole="button"
        >
          <View style={styles.diaCardContent}>
            <Text style={styles.diaCardTitle}>{dataFormatada}</Text>
            <Text style={styles.diaCardSummary}>Presentes: {totalPresentes} | Ausentes: {totalAusentes} | Total: {totalAlunos}</Text>
          </View>
          <FontAwesomeIcon icon={faChevronRight} size={16} color="#666" />
        </Pressable>
      );
    },
    [presencasAgrupadas, focusIndex]
  );

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

  // safe scrollToIndex fallback
  const onScrollToIndexFailed = useCallback((info: { index: number }) => {
    // fallback: scrollToOffset approximate
    const index = info.index;
    // Assume uma altura média de 60px para o item (alunoItem ou diaCard)
    const approxOffset = Math.max(0, index * 60); 
    if (viewMode === 'historico') {
      historicoFlatListRef.current?.scrollToOffset({ offset: approxOffset, animated: true });
    } else {
      flatListRef.current?.scrollToOffset({ offset: approxOffset, animated: true });
    }
  }, [viewMode]);

  return (
    // REMOVIDO: { paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 20 : 0 }
    <View style={styles.container}> 
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            if (viewMode === 'detalhe') setViewMode('historico');
            else if (viewMode === 'historico') {
              setViewMode('registro');
              setSelectedDate(new Date());
            } else navigation.goBack();
          }}
          style={styles.btnVoltar}
          accessible
          accessibilityRole="button"
          accessibilityLabel="Voltar"
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
            accessibilityRole="button"
            accessibilityLabel="Abrir calendário"
          >
            <FontAwesomeIcon icon={faCalendarAlt} size={20} color="#fff" />
          </TouchableOpacity>
        )}
      </View>

      {/* Modal para iOS */}
      {showDatePickerModal && Platform.OS === 'ios' && (
        <Modal transparent animationType="slide" visible={showDatePickerModal} onRequestClose={() => setShowDatePickerModal(false)}>
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

      {/* DateTimePicker nativo para Android */}
      {showDatePickerModal && Platform.OS === 'android' && <DateTimePicker value={tempSelectedDate} mode="date" display="default" onChange={onDateChangeInPicker} />}

      {/* Conteúdo Principal */}
      <View style={[styles.contentWrapper, isLargeScreen && styles.contentWrapperLarge]}>
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
              showsVerticalScrollIndicator={Platform.OS === 'web'}
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled
              bounces={Platform.OS !== 'web'}
              initialNumToRender={12}
              onScrollToIndexFailed={onScrollToIndexFailed}
            />
          )
        ) : alunos.length === 0 ? (
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
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderAlunoItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={Platform.OS === 'web'}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
            bounces={Platform.OS !== 'web'}
            initialNumToRender={20}
            onScrollToIndexFailed={onScrollToIndexFailed}
          />
        )}
      </View>

      <View style={styles.actionsFooter}>
        <View style={styles.footerContent}>
          {(viewMode === 'registro' || viewMode === 'detalhe') && (
            <TouchableOpacity style={[styles.saveButton, saving && styles.saveButtonDisabled]} onPress={viewMode === 'registro' ? salvarPresenca : () => setViewMode('registro')} disabled={saving} accessibilityRole="button">
              {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.saveButtonText}>{viewMode === 'registro' ? 'Salvar Presenças' : 'Editar Presenças'}</Text>}
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.previousListsButton}
            onPress={() => {
              if (viewMode === 'historico') {
                setViewMode('registro');
                setSelectedDate(new Date());
              } else setViewMode('historico');
            }}
            accessibilityRole="button"
          >
            <Text style={styles.previousListsButtonText}>{viewMode === 'historico' ? 'Voltar ao Registro do Dia' : 'Ver Histórico'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    width: '100%',
  },
  header: {
    backgroundColor: '#1c348e',
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center', // Adicionado: Alinha os botões verticalmente ao centro
    justifyContent: 'center',
    paddingVertical: 12,
    minHeight: Platform.select({ web: 70, default: 60 }),
    borderBottomWidth: 1,
    borderBottomColor: '#e5c228',
    ...Platform.select({
      web: { 
        position: 'fixed', 
        top: 0, 
        zIndex: 10,
      }, 
      default: { 
        // Corrigido: Calcula o paddingTop correto para Android/Mobile
        paddingTop: (Platform.OS === 'android' ? (StatusBar.currentHeight || 20) : 0) + 12,
      },
    }),
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    flex: 1,
  },
  // Corrigido: Removido 'top: 50%' e 'transform' (já alinhado pelo 'header')
  btnVoltar: {
    position: 'absolute',
    left: 16,
    padding: 8,
    zIndex: 11,
  },
  // Corrigido: Removido 'top: 50%' e 'transform'
  calendarButton: {
    position: 'absolute',
    right: 16,
    padding: 8,
    zIndex: 11,
  },
  contentWrapper: {
    flex: 1,
    width: '100%',
    maxWidth: 1200,
    alignSelf: 'center',
    // Corrigido: Adicionado marginTop para compensar o header fixo no web (70px)
    marginTop: Platform.OS === 'web' ? 70 : 0, 
    paddingBottom: Platform.select({ web: 100, default: 8 }),
    paddingHorizontal: 16,
  },
  contentWrapperLarge: {
    paddingHorizontal: 32,
  },
  listContent: { paddingVertical: 12 },
  alunoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    backgroundColor: '#fff',
    marginVertical: 6,
    borderRadius: 8,
  },
  itemFocused: {
    borderColor: '#1c348e',
    borderWidth: 1,
  },
  itemPressed: { opacity: 0.9 },
  alunoNome: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
    flex: 1,
    maxWidth: '65%',
    paddingRight: 10,
  },
  iconContainer: {  flexDirection: 'row', alignItems: 'center', paddingLeft: 10 },
  actionsFooter: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    width: '100%',
    ...Platform.select({ web: { position: 'fixed', bottom: 0, zIndex: 9 }, default: {} }),
  },
  footerContent: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    maxWidth: 1200,
    alignSelf: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 10,
  },
  previousListsButton: {
    backgroundColor: '#e5c228',
    padding: 10,
    borderRadius: 8,
    width: 200,
  },
  previousListsButtonText: { color: '#1c348e', fontWeight: 'bold', textAlign: 'center' },
  saveButton: { backgroundColor: '#1c348e', padding: 10, borderRadius: 8, width: 150 },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonText: { color: '#fff', fontWeight: 'bold', textAlign: 'center' },
  diaCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    marginVertical: 6,
    borderRadius: 8,
    borderLeftWidth: 5,
    borderLeftColor: '#1c348e',
  },
  diaCardContent: { flex: 1 },
  diaCardTitle: { fontSize: 16, fontWeight: 'bold', color: '#1c348e' },
  diaCardSummary: { fontSize: 14, color: '#666', marginTop: 6 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 50 },
  emptyListContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 50 },
  emptyListText: { fontSize: 16, color: '#666', marginBottom: 10 },
  reloadButton: { backgroundColor: '#e5c228', padding: 10,  borderRadius: 5, marginTop: 10 },
  reloadButtonText: { color: '#1c348e', fontWeight: 'bold' },
  modalBackground: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  datePickerContainer: { backgroundColor: '#fff', borderTopLeftRadius: 10, borderTopRightRadius: 10, padding: 16 },
  confirmButton: { backgroundColor: '#1c348e', padding: 10, borderRadius: 6, marginTop: 10 },
  confirmButtonText: { color: '#fff', textAlign: 'center', fontWeight: 'bold' },
});






