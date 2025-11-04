// Arquivo: listaPresenca.tsx (FINAL E CORRIGIDO)

import { ToastContainer } from '@/components/Toast';
import { Sidebar } from '@/components/layout/Sidebar';
import {
  faBars,
  faCalendarAlt,
  faChartBar,
  faCheckCircle,
  faCircle,
  faHistory,
  faSave,
  faTimesCircle,
  faUsers
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
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
import { useListaPresenca } from '../../hooks/useListaPresenca';
import { Aluno, Evento, PresencaRegistro } from '../../types/presencaTypes'; // Importação de PresencaRegistro
import '../../utils/localendarConfig';

moment.locale('pt-br');

type RootStackParamList = {
  ListaPresenca: undefined;
};

type ListaPresencaScreenNavigationProp = NavigationProp<
  RootStackParamList,
  'ListaPresenca'
>;

// Componente para a escolha de Evento - CORRIGIDO: Renomeando a prop para onSelectEvento
const EventoPickerModal = ({
  eventos,
  selectedEventoId,
  onSelectEvento, // CORREÇÃO: Prop renomeada para casar com o hook
  onClose,
  visible,
}: {
  eventos: Evento[];
  selectedEventoId: string | null;
  onSelectEvento: (id: string) => void; // CORREÇÃO
  onClose: () => void;
  visible: boolean;
}) => {
  return (
    <Modal
      transparent
      animationType="slide"
      visible={visible}
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalBackground} onPress={onClose}>
        <View style={styles.datePickerContainer} onStartShouldSetResponder={() => true}>
          <Text style={styles.pickerTitle}>Selecione o Evento</Text>
          <FlatList
            data={eventos}
            keyExtractor={(e) => e.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => {
                  onSelectEvento(item.id); // CORREÇÃO: Uso da prop renomeada
                  onClose();
                }}
                style={[
                  styles.eventoItem,
                  item.id === selectedEventoId && styles.eventoItemSelected,
                ]}
              >
                <Text style={styles.eventoItemTitle}>{item.descricao}</Text>
                <Text style={styles.eventoItemSubtitle}>
                  {moment(item.data).format('DD/MM/YYYY')} • {item.horario} • {item.local}
                </Text>
              </TouchableOpacity>
            )}
            contentContainerStyle={{ paddingBottom: 8 }}
          />
          <TouchableOpacity onPress={onClose} style={styles.confirmButton}>
            <Text style={styles.confirmButtonText}>Fechar</Text>
          </TouchableOpacity>
        </View>
      </Pressable>
    </Modal>
  );
};

export default function ListaPresencaScreen(): JSX.Element {
  const { width } = useWindowDimensions();
  const navigation = useNavigation<ListaPresencaScreenNavigationProp>();

  // CORREÇÃO CRÍTICA: Desestruturação alinhada com useListaPresenca.ts
  const {
    flatListRef,
    historicoFlatListRef,
    alunos,
    presencasAgrupadas,
    eventosDisponiveis,
    selectedEventoId,
    viewMode,
    loading,
    saving,
    focusIndex,
    isLargeScreen,
    sidebarOpen,
    userName,
    userRole,
    showEventoPickerModal,
    setViewMode,
    setShowEventoPickerModal,
    handleStatusChange, // CORRIGIDO: Nome da função de mudança de status
    setSelectedEventoId,
    salvarPresenca,
    onSelectEvento,
    onScrollToIndexFailed,
    toggleSidebar,
    fetchHistoricoPresencas,
    fetchAlunosForEvent,
  } = useListaPresenca(width);

  // CORREÇÃO: Movendo a lógica de obtenção do evento para dentro do componente
  const selectedEvento = eventosDisponiveis.find(
    (e) => e.id === selectedEventoId
  );

  // CORREÇÃO: Definindo a lógica do título aqui
  const getHeaderTitle = useCallback(() => {
    if (viewMode === 'historico') return 'Histórico de Presenças';
    if (viewMode === 'detalhe') return 'Detalhe do Registro';

    return selectedEvento
      ? `${selectedEvento.descricao} - ${moment(selectedEvento.data).format(
          'DD/MM'
        )}`
      : 'Registro de Presença';
  }, [viewMode, selectedEvento]);

  // CORREÇÃO: Implementando a lógica de navegação de volta (se necessário)
  const handleBackNavigation = useCallback(
    (nav: ListaPresencaScreenNavigationProp) => {
      if (viewMode === 'detalhe') {
        setViewMode('historico');
      } else {
        // Se estiver em 'registro' ou 'historico', volta a tela
        if (nav.canGoBack()) {
            nav.goBack();
        } else {
            // Se for web ou rota inicial, pode redirecionar, se for o caso.
            // Aqui, apenas fechamos a sidebar se estiver aberta em mobile/web.
            if (sidebarOpen) {
                toggleSidebar();
            }
        }
      }
    },
    [viewMode, setViewMode, sidebarOpen, toggleSidebar]
  );

  // --- Renderização dos Itens ---

  const renderAlunoItem = useCallback(
    ({ item, index }: { item: Aluno; index: number }) => {
      const isEditable = viewMode === 'registro' && !!selectedEventoId;

      const isFocused = Platform.OS === 'web' && focusIndex === index;
      const ItemWrapper = isEditable && Platform.OS === 'web' ? View : Pressable;

      return (
        <ItemWrapper
          {...(ItemWrapper === Pressable
            ? {
                // CORREÇÃO: setPresencaStatus substituído por handleStatusChange
                onPress: () =>
                  isEditable &&
                  handleStatusChange(
                    item.atletaId,
                    item.presente === true ? false : true
                  ),
                style: ({ pressed, hovered }: any) => [
                  styles.alunoItem,
                  (isFocused || (Platform.OS === 'web' && hovered)) && styles.itemFocused,
                  pressed && styles.itemPressed,
                ],
                android_ripple: { color: '#eee' },
                accessibilityRole: 'button' as const,
                accessibilityLabel: `Aluno ${item.nome}. Status: ${
                  item.presente === true
                    ? 'presente'
                    : item.presente === false
                    ? 'ausente'
                    : 'não marcado'
                }`,
              }
            : { style: [styles.alunoItem, isFocused && styles.itemFocused] })}
        >
          <Text style={styles.alunoNome} numberOfLines={1} ellipsizeMode="tail">
            {item.nome}
          </Text>

          <View style={styles.iconContainer}>
            {isEditable ? (
              <View style={styles.presenceButtons}>
                <TouchableOpacity
                  style={[
                    styles.presenceButton,
                    styles.presentButton,
                    item.presente === true && styles.presentButtonActive
                  ]}
                  onPress={() => handleStatusChange(item.atletaId, true)}
                  accessibilityRole="button"
                  accessibilityLabel={`Marcar ${item.nome} como presente`}
                >
                  <FontAwesomeIcon
                    icon={faCheckCircle}
                    size={18}
                    color={item.presente === true ? '#fff' : '#4CAF50'}
                  />
                  <Text style={[
                    styles.presenceButtonText,
                    item.presente === true && styles.presenceButtonTextActive
                  ]}>
                    P
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.presenceButton,
                    styles.absentButton,
                    item.presente === false && styles.absentButtonActive
                  ]}
                  onPress={() => handleStatusChange(item.atletaId, false)}
                  accessibilityRole="button"
                  accessibilityLabel={`Marcar ${item.nome} como ausente`}
                >
                  <FontAwesomeIcon
                    icon={faTimesCircle}
                    size={18}
                    color={item.presente === false ? '#fff' : '#F44336'}
                  />
                  <Text style={[
                    styles.presenceButtonText,
                    item.presente === false && styles.presenceButtonTextActive
                  ]}>
                    F
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={[
                styles.statusBadge,
                item.presente === true && styles.statusBadgePresent,
                item.presente === false && styles.statusBadgeAbsent,
                item.presente === null && styles.statusBadgeNeutral
              ]}>
                <FontAwesomeIcon
                  icon={
                    item.presente === true
                      ? faCheckCircle
                      : item.presente === false
                      ? faTimesCircle
                      : faCircle
                  }
                  size={16}
                  color="#fff"
                />
                <Text style={styles.statusBadgeText}>
                  {item.presente === true ? 'Presente' : 
                   item.presente === false ? 'Ausente' : 'Não marcado'}
                </Text>
              </View>
            )}
          </View>
        </ItemWrapper>
      );
    },
    [viewMode, handleStatusChange, focusIndex, selectedEventoId]
  );

  const renderHistoricoAlunoItem = useCallback(
    ({ item, index }: { item: PresencaRegistro; index: number }) => {
      const isFocused = Platform.OS === 'web' && focusIndex === index;
      const isEditable = viewMode === 'historico';

      return (
        <View style={[styles.alunoItem, isFocused && styles.itemFocused]}>
          <Text style={styles.alunoNome} numberOfLines={1} ellipsizeMode="tail">
            {item.nomeAtleta}
          </Text>

          <View style={styles.iconContainer}>
            {isEditable ? (
              <View style={styles.presenceButtons}>
                <TouchableOpacity
                  style={[
                    styles.presenceButton,
                    styles.presentButton,
                    item.presente === true && styles.presentButtonActive
                  ]}
                  onPress={() => handleStatusChange(item.atletaId, true)}
                  accessibilityRole="button"
                  accessibilityLabel={`Marcar ${item.nomeAtleta} como presente`}
                >
                  <FontAwesomeIcon
                    icon={faCheckCircle}
                    size={18}
                    color={item.presente === true ? '#fff' : '#4CAF50'}
                  />
                  <Text style={[
                    styles.presenceButtonText,
                    item.presente === true && styles.presenceButtonTextActive
                  ]}>
                    P
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.presenceButton,
                    styles.absentButton,
                    item.presente === false && styles.absentButtonActive
                  ]}
                  onPress={() => handleStatusChange(item.atletaId, false)}
                  accessibilityRole="button"
                  accessibilityLabel={`Marcar ${item.nomeAtleta} como ausente`}
                >
                  <FontAwesomeIcon
                    icon={faTimesCircle}
                    size={18}
                    color={item.presente === false ? '#fff' : '#F44336'}
                  />
                  <Text style={[
                    styles.presenceButtonText,
                    item.presente === false && styles.presenceButtonTextActive
                  ]}>
                    A
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={[
                styles.statusBadge,
                item.presente === true && styles.statusBadgePresent,
                item.presente === false && styles.statusBadgeAbsent,
                item.presente === null && styles.statusBadgeNeutral
              ]}>
                <FontAwesomeIcon
                  icon={
                    item.presente === true
                      ? faCheckCircle
                      : item.presente === false
                      ? faTimesCircle
                      : faCircle
                  }
                  size={16}
                  color="#fff"
                />
                <Text style={styles.statusBadgeText}>
                  {item.presente === true ? 'Presente' : 
                   item.presente === false ? 'Ausente' : 'Não marcado'}
                </Text>
              </View>
            )}
          </View>
        </View>
      );
    },
    [viewMode, handleStatusChange, focusIndex]
  );

  // --- UI Component ---

  return (
    <View style={styles.container}>
      {Platform.OS === 'web' && <ToastContainer />}

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={toggleSidebar}
          accessibilityRole="button"
          accessibilityLabel="Abrir menu"
        >
          <FontAwesomeIcon icon={faBars} size={24} color="#fff" />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{getHeaderTitle()}</Text>
          {selectedEvento && (
            <Text style={styles.headerSubtitle}>
              {moment(selectedEvento.data).format('DD/MM/YYYY')} • {selectedEvento.local}
            </Text>
          )}
        </View>

        {viewMode === 'registro' && (
          <TouchableOpacity
            onPress={() => setShowEventoPickerModal(true)}
            style={styles.calendarButton}
            accessibilityRole="button"
            accessibilityLabel="Selecionar Evento"
          >
            <FontAwesomeIcon icon={faCalendarAlt} size={20} color="#fff" />
          </TouchableOpacity>
        )}
      </View>

      {/* Barra de Navegação de Modo Melhorada */}
      {selectedEventoId && (
        <View style={styles.modeToggleContainer}>
          <TouchableOpacity
            style={[
              styles.modeToggleButton,
              viewMode === 'registro' && styles.modeToggleButtonActive
            ]}
            onPress={() => setViewMode('registro')}
          >
            <FontAwesomeIcon 
              icon={faUsers} 
              size={16} 
              color={viewMode === 'registro' ? '#fff' : '#1c348e'} 
            />
            <Text style={[
              styles.modeToggleText,
              viewMode === 'registro' && styles.modeToggleTextActive
            ]}>
              Registro
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.modeToggleButton,
              viewMode === 'historico' && styles.modeToggleButtonActive
            ]}
            onPress={() => {
              setViewMode('historico');
              fetchHistoricoPresencas(selectedEventoId || undefined);
            }}
          >
            <FontAwesomeIcon 
              icon={faHistory} 
              size={16} 
              color={viewMode === 'historico' ? '#fff' : '#1c348e'} 
            />
            <Text style={[
              styles.modeToggleText,
              viewMode === 'historico' && styles.modeToggleTextActive
            ]}>
              Histórico
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <Sidebar
        isOpen={sidebarOpen}
        onClose={toggleSidebar}
        userName={userName}
        userRole={userRole as 'SUPERVISOR' | 'COORDENADOR' | 'TECNICO'}
        onNavigateToSection={toggleSidebar}
      />

      <EventoPickerModal
        eventos={eventosDisponiveis}
        selectedEventoId={selectedEventoId}
        onSelectEvento={onSelectEvento}
        onClose={() => setShowEventoPickerModal(false)}
        visible={showEventoPickerModal}
      />

      {/* Conteúdo Principal - CORRIGIDO */}
      <View style={[styles.contentWrapper, isLargeScreen && styles.contentWrapperLarge]}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1c348e" />
            <Text style={styles.emptyListText}>Carregando dados...</Text>
          </View>
        ) : viewMode === 'historico' ? (
          Object.keys(presencasAgrupadas).length === 0 ? (
            <View style={styles.emptyListContainer}>
              <FontAwesomeIcon icon={faChartBar} size={48} color="#cbd5e0" />
              <Text style={styles.emptyListText}>Nenhum registro de presença encontrado para este evento.</Text>
              <Text style={styles.emptyListSubtext}>Registre presenças primeiro para visualizar o histórico.</Text>
              <TouchableOpacity style={styles.reloadButton} onPress={() => fetchHistoricoPresencas(selectedEventoId || undefined)}>
                <Text style={styles.reloadButtonText}>Recarregar Histórico</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.historicoContainer}>
              {Object.keys(presencasAgrupadas).map((eventoKey) => {
                const registros = presencasAgrupadas[eventoKey];
                const evento = eventosDisponiveis.find(e => e.id === eventoKey);
                const nomeEvento = evento?.descricao || registros[0]?.descricaoEvento || 'Evento';
                const presentes = registros.filter(r => r.presente).length;
                const ausentes = registros.filter(r => !r.presente).length;
                const percentualPresenca = ((presentes / registros.length) * 100).toFixed(1);
                
                return (
                  <View key={eventoKey} style={styles.eventoHistoricoSection}>
                    <View style={styles.eventoHeaderCard}>
                      <View style={styles.eventoHeaderMain}>
                        <Text style={styles.eventoHeaderTitle}>{nomeEvento}</Text>
                        <View style={styles.percentualContainer}>
                          <Text style={styles.percentualText}>{percentualPresenca}%</Text>
                          <Text style={styles.percentualLabel}>presença</Text>
                        </View>
                      </View>
                      <View style={styles.eventoStatsContainer}>
                        <View style={styles.statItem}>
                          <FontAwesomeIcon icon={faCheckCircle} size={16} color="#4CAF50" />
                          <Text style={styles.statText}>{presentes} presentes</Text>
                        </View>
                        <View style={styles.statItem}>
                          <FontAwesomeIcon icon={faTimesCircle} size={16} color="#F44336" />
                          <Text style={styles.statText}>{ausentes} ausentes</Text>
                        </View>
                        <View style={styles.statItem}>
                          <FontAwesomeIcon icon={faUsers} size={16} color="#fff" />
                          <Text style={styles.statText}>{registros.length} total</Text>
                        </View>
                      </View>
                    </View>
                    <FlatList
                      data={registros}
                      keyExtractor={(item) => `${item.atletaId}-${item.eventoId}`}
                      renderItem={renderHistoricoAlunoItem}
                      contentContainerStyle={styles.listContent}
                      scrollEnabled={false}
                      showsVerticalScrollIndicator={false}
                    />
                  </View>
                );
              })}
            </View>
          )
        ) : !selectedEventoId ? (
          <View style={styles.emptyListContainer}>
            <Text style={styles.emptyListText}>Selecione um evento para fazer o registro.</Text>
            <TouchableOpacity style={styles.reloadButton} onPress={() => setShowEventoPickerModal(true)}>
              <Text style={styles.reloadButtonText}>Selecionar Evento</Text>
            </TouchableOpacity>
          </View>
        ) : alunos.length === 0 ? (
          <View style={styles.emptyListContainer}>
            <Text style={styles.emptyListText}>Nenhum aluno escalado para este evento.</Text>
            <TouchableOpacity style={styles.reloadButton} onPress={() => fetchAlunosForEvent(selectedEventoId)}>
              <Text style={styles.reloadButtonText}>Tentar Novamente</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={alunos}
            keyExtractor={(item) => item.atletaId}
            renderItem={renderAlunoItem}
            contentContainerStyle={styles.listContent}
            onScrollToIndexFailed={onScrollToIndexFailed}
          />
        )}
      </View>

      {/* Footer com botões melhorado */}
      <View style={styles.actionsFooter}>
        <View style={styles.footerContent}>
          {((viewMode === 'registro' && alunos.length > 0) || 
            (viewMode === 'historico' && Object.keys(presencasAgrupadas).length > 0)) && (
            <TouchableOpacity
              style={[styles.saveButton, saving && styles.saveButtonDisabled]}
              onPress={salvarPresenca}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <FontAwesomeIcon icon={faSave} size={16} color="#fff" />
              )}
              <Text style={styles.saveButtonText}>
                {saving ? 'Salvando...' : 'Salvar Presenças'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    width: '100%',
  },
  header: {
    backgroundColor: '#1c348e',
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    minHeight: Platform.select({ web: 80, default: 70 }),
    ...Platform.select({
      web: {
        position: 'fixed' as any,
        top: 0,
        zIndex: 10,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      },
      default: {
        paddingTop:
          (Platform.OS === 'android' ? (StatusBar.currentHeight || 20) : 0) +
          16,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
    }),
  } as any,
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  headerSubtitle: {
    color: '#e5c228',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 2,
  },
  backButton: {
    position: 'absolute',
    left: 16,
    padding: 8,
    zIndex: 11,
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
  // Estilos do Toggle de Modo
  modeToggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    alignSelf: 'center',
    marginHorizontal: 16,
    marginTop: Platform.OS === 'web' ? 90 : 8,
    borderRadius: 12,
    padding: 4,
    maxWidth: 800,
    ...Platform.select({
      web: {
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      },
      default: {
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
    }),
  } as any,
  modeToggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: Platform.OS === 'web' ? 20 : 98,
    borderRadius: 8,
    gap: 8,
  },
  modeToggleButtonActive: {
    backgroundColor: '#1c348e',
  },
  modeToggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1c348e',
  },
  modeToggleTextActive: {
    color: '#fff',
  },
  
  contentWrapper: {
    flex: 1,
    width: '100%',
    maxWidth: 1200,
    alignSelf: 'center',
    marginTop: 8,
    paddingBottom: Platform.select({ web: 100, default: 8 }),
    paddingHorizontal: Platform.select({ web: 32, default: 16 }),
    ...Platform.select({
      web: {
        alignItems: 'stretch',
        justifyContent: 'flex-start',
      },
      default: {},
    }),
  } as any,
  contentWrapperLarge: {
    paddingHorizontal: 32,
  },
  listContent: {
    paddingVertical: 8,
    ...Platform.select({
      web: {
        width: '100%',
        paddingHorizontal: 0,
        alignItems: 'stretch',
      },
      default: {},
    }),
  } as any,
  alunoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    marginVertical: 4,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#1c348e',
    ...Platform.select({
      web: {
        minWidth: 600,
        maxWidth: '90%',
        width: '90%',
        alignSelf: 'center',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      },
      default: {
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
    }),
  } as any,
  itemFocused: {
    borderColor: '#1c348e !important',
    borderWidth: 0,
    ...Platform.select({
      web: {
        boxShadow: '0 0 0 2px #1c348e, 0 2px 8px rgba(28, 52, 142, 0.3)',
      },
      default: {},
    }),
  } as any,
  itemPressed: {
    opacity: 0.9,
  },
  alunoNome: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a202c',
    flex: 1,
    maxWidth: '60%',
    paddingRight: 12,
  },
  iconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    minWidth: 120,
  },
  
  // Estilos dos Botões de Presença
  presenceButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  presenceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
    minWidth: 50,
  },
  presentButton: {
    borderColor: '#4CAF50',
    backgroundColor: '#f8fff9',
  },
  presentButtonActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  absentButton: {
    borderColor: '#F44336',
    backgroundColor: '#fff8f8',
  },
  absentButtonActive: {
    backgroundColor: '#F44336',
    borderColor: '#F44336',
  },
  presenceButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  presenceButtonTextActive: {
    color: '#fff',
  },
  
  // Estilos dos Status Badges
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  statusBadgePresent: {
    backgroundColor: '#4CAF50',
  },
  statusBadgeAbsent: {
    backgroundColor: '#F44336',
  },
  statusBadgeNeutral: {
    backgroundColor: '#9E9E9E',
  },
  statusBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  actionsFooter: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    width: '100%',
    ...Platform.select({
      web: {
        position: 'fixed' as any,
        bottom: 0,
        zIndex: 9,
        boxShadow: '0 -2px 8px rgba(0,0,0,0.1)',
      },
      default: {
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
    }),
  } as any,
  footerContent: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    maxWidth: 1200,
    alignSelf: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  saveButton: {
    backgroundColor: '#1c348e',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    minWidth: 180,
    ...Platform.select({
      web: {
        boxShadow: '0 2px 4px rgba(28, 52, 142, 0.3)',
      },
      default: {
        elevation: 3,
        shadowColor: '#1c348e',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
    }),
  } as any,
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
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
  },
  diaCardContent: {
    flex: 1,
  },
  diaCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2e2f35',
  },
  diaCardSubtitle: { // NOVO ESTILO
    fontSize: 14,
    fontWeight: '500',
    color: '#1c348e',
    marginTop: 4,
  },
  diaCardSummary: {
    fontSize: 14,
    color: '#666',
    marginTop: 6,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    backgroundColor: 'transparent',
  },
  emptyListContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyListText: {
    fontSize: 18,
    color: '#64748b',
    marginBottom: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  reloadButton: {
    backgroundColor: '#e5c228',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 16,
    ...Platform.select({
      web: {
        boxShadow: '0 2px 4px rgba(229, 194, 40, 0.3)',
      },
      default: {
        elevation: 3,
        shadowColor: '#e5c228',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
    }),
  } as any,
  reloadButtonText: {
    color: '#1c348e',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  modalBackground: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  datePickerContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    maxHeight: '80%',
    ...Platform.select({
      web: {
        boxShadow: '0 -4px 16px rgba(0,0,0,0.15)',
      },
      default: {
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
    }),
  } as any,
  confirmButton: {
    backgroundColor: '#1c348e',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 16,
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  pickerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#1c348e',
  },
  eventoItem: {
    padding: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  eventoItemSelected: {
    backgroundColor: '#e6eafc',
    borderColor: '#1c348e',
    borderWidth: 1,
    ...Platform.select({
      web: {
        boxShadow: '0 2px 8px rgba(28, 52, 142, 0.2)',
      },
      default: {
        elevation: 3,
        shadowColor: '#1c348e',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
    }),
  } as any,
  eventoItemTitle: {
    fontWeight: '600',
    fontSize: 16,
    color: '#1a202c',
    marginBottom: 4,
  },
  eventoItemSubtitle: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 18,
  },
  eventoHeaderCard: {
    backgroundColor: '#1c348e',
    padding: 20,
    marginVertical: 12,
    marginHorizontal: 8,
    borderRadius: 16,
    ...Platform.select({
      web: {
        boxShadow: '0 4px 12px rgba(28, 52, 142, 0.3)',
      },
      default: {
        elevation: 4,
        shadowColor: '#1c348e',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
      },
    }),
  } as any,
  eventoHeaderTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  eventoHeaderSubtitle: {
    fontSize: 16,
    color: '#e5c228',
    textAlign: 'center',
    fontWeight: '600',
  },
  
  // Estilos do Histórico
  historicoContainer: {
    paddingVertical: 8,
  },
  eventoHistoricoSection: {
    marginBottom: 16,
  },
  eventoHeaderMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  percentualContainer: {
    alignItems: 'center',
  },
  percentualText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#e5c228',
  },
  percentualLabel: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.8,
  },
  eventoStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  emptyListSubtext: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 8,
  },
});