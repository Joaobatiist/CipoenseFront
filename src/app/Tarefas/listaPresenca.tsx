import { ToastContainer } from '@/components/Toast';
import { Sidebar } from '@/components/layout/Sidebar';
import { faBars, faCalendarAlt, faCheckCircle, faChevronRight, faCircle, faTimesCircle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import DateTimePicker from '@react-native-community/datetimepicker';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import moment from 'moment';
import React, { JSX, useCallback } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { useListaPresenca, UseListaPresencaReturn } from '../../hooks/useListaPresenca';
import { Aluno } from '../../types/presencaTypes';
import '../../utils/localendarConfig';

 moment.locale('pt-br');

type RootStackParamList = {
  ListaPresenca: undefined;
};

type ListaPresencaScreenNavigationProp = NavigationProp<RootStackParamList, 'ListaPresenca'>;

export default function ListaPresencaScreen(): JSX.Element {
  const { width } = useWindowDimensions();
  const navigation = useNavigation<ListaPresencaScreenNavigationProp>();
  
  // Utiliza o hook customizado para toda a lógica e estado
  const {
    flatListRef,
    historicoFlatListRef,
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
    setSelectedDate,
    setTempSelectedDate,
    setViewMode,
    setShowDatePickerModal,
    setPresencaStatus,
    salvarPresenca,
    onDateChangeInPicker,
    confirmIosDate,
    getHeaderTitle,
    onScrollToIndexFailed,
    toggleSidebar,
    closeSidebar,
    handleBackNavigation,
    fetchAlunosForDay,
    fetchHistoricoPresencas,
  } = useListaPresenca(width);


  // --- Renderização dos Itens ---

  const renderAlunoItem = useCallback(
    ({ item, index }: { item: Aluno; index: number }) => {
      const isEditable = viewMode === 'registro';

      let iconFa: any = faCircle; 
      let iconColor = 'lightgray';

      if (item.presente === true) {
        iconFa = faCheckCircle; 
        iconColor = 'green';
      } else if (item.presente === false) {
        iconFa = faTimesCircle; 
        iconColor = 'red';
      }

      const isFocused = Platform.OS === 'web' && focusIndex === index;

      const ItemWrapper = (isEditable && Platform.OS === 'web') ? View : Pressable;
      const wrapperProps = (isEditable && Platform.OS === 'web') 
        ? { style: [styles.alunoItem, isFocused && styles.itemFocused] }
        : {
            onPress: () => {
              if (isEditable) setPresencaStatus(item.id, item.presente === true ? null : true);
            },
            style: ({ pressed }: any) => [styles.alunoItem, isFocused && styles.itemFocused, pressed && styles.itemPressed],
            android_ripple: { color: '#eee' },
            accessible: true,
            accessibilityLabel: `Aluno ${item.nome}. Status: ${item.presente === true ? 'presente' : item.presente === false ? 'ausente' : 'não marcado'}`,
            accessibilityRole: "button" as const,
          };

      return (
        <ItemWrapper {...wrapperProps}>
          <Text style={styles.alunoNome} numberOfLines={1} ellipsizeMode="tail">
            {item.nome}
          </Text>

          <View style={styles.iconContainer}>
            {isEditable ? (
              <>
                <TouchableOpacity onPress={() => setPresencaStatus(item.id, true)} accessibilityRole="button" accessibilityLabel={`Marcar ${item.nome} como presente`}>
                  <FontAwesomeIcon 
                    icon={faCheckCircle} 
                    size={30} 
                    color={item.presente === true ? 'green' : 'lightgray'} 
                  />
                </TouchableOpacity>
                <View style={{ width: 12 }} />
                <TouchableOpacity onPress={() => setPresencaStatus(item.id, false)} accessibilityRole="button" accessibilityLabel={`Marcar ${item.nome} como ausente`}>
                  <FontAwesomeIcon 
                    icon={faTimesCircle} 
                    size={30} 
                    color={item.presente === false ? 'red' : 'lightgray'} 
                  />
                </TouchableOpacity>
              </>
            ) : (
              <FontAwesomeIcon 
                icon={iconFa} 
                size={30} 
                color={iconColor} 
              />
            )}
          </View>
        </ItemWrapper>
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


  // --- UI Component ---

  return (
    <View style={styles.container}>
      {Platform.OS === 'web' && <ToastContainer />}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => handleBackNavigation(navigation)}
        >
          {/* Ícone de Voltar ou Botão é omitido no original, mantendo a função */}
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuButton} onPress={toggleSidebar}>
          <FontAwesomeIcon icon={faBars} size={24} color="#fff" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>{getHeaderTitle()}</Text>

        {viewMode === 'registro' && (
          Platform.OS === 'web' ? (
            <View style={styles.calendarButtonWeb}>
              <FontAwesomeIcon icon={faCalendarAlt} size={20} color="#fff" />
              <input
                type="date"
                value={moment(selectedDate).format('YYYY-MM-DD')}
                onChange={(e: any) => {
                  const dateString = e.target.value; 
                  const [year, month, day] = dateString.split('-').map(Number);
                  const newDate = new Date(year, month - 1, day, 12, 0, 0);
                  
                  if (!isNaN(newDate.getTime())) {
                    setSelectedDate(newDate);
                    setViewMode('registro');
                  }
                }}
                style={{
                  position: 'absolute',
                  top: -10,
                  left: -10,
                  width: "100%",
                  height: 60,
                  opacity: 0,
                  cursor: 'pointer',
                  zIndex: 12,
                }}
              />
            </View>
          ) : (
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
          )
        )}
      </View>

       <Sidebar 
                      isOpen={sidebarOpen} 
                      onClose={closeSidebar}
                      userName={userName}
                      userRole={userRole as 'SUPERVISOR' | 'COORDENADOR' | 'TECNICO'}
                      onNavigateToSection={closeSidebar} // Ação de navegação
                  />

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
              ref={historicoFlatListRef as any} // Tipagem ajustada para o useListaPresenca
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
            ref={flatListRef as any} // Tipagem ajustada para o useListaPresenca
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
            <TouchableOpacity 
              style={[styles.saveButton, saving && styles.saveButtonDisabled]} 
              onPress={viewMode === 'registro' ? salvarPresenca : () => setViewMode('registro')} 
              disabled={saving} 
              accessibilityRole="button"
            >
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


// O Stylesheet permanece inalterado para manter o estilo original
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
    alignItems: 'center', 
    justifyContent: 'center',
    paddingVertical: 12,
    minHeight: Platform.select({ web: 70, default: 60 }),
    borderBottomWidth: 1,
    borderBottomColor: '#e5c228',
    ...Platform.select({
      web: { 
        position: 'fixed' as any, 
        top: 0, 
        zIndex: 10,
      }, 
      default: { 
        paddingTop: (Platform.OS === 'android' ? (StatusBar.currentHeight || 20) : 0) + 12,
      },
    }),
  } as any,
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    flex: 1,
  },
  menuButton: {
    position: 'absolute',
    left: 16,
    padding: 8,
    zIndex: 11,
  },
  calendarButton: {
    position: 'absolute',
    right: 16,
    padding: 8,
    zIndex: 11,
  },
  calendarButtonWeb: {
    position: 'absolute',
    right: "2%",
    padding: 8,
    zIndex: 11,
  },
  contentWrapper: {
    flex: 1,
    width: '100%',
    maxWidth: 1200,
    alignSelf: 'center',
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
    ...Platform.select({ web: { position: 'fixed' as any, bottom: 0, zIndex: 9 }, default: {} }),
  } as any,
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
    borderColor: '#1c348e',
    borderWidth: 1,
    borderLeftWidth: 5,
    borderLeftColor: '#1c348e',
  },
  diaCardContent: { flex: 1 },
  diaCardTitle: { fontSize: 16, fontWeight: 'bold', color: '#2e2f35ff' },
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