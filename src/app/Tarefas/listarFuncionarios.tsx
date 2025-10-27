import { Sidebar } from '@/components/layout/Sidebar';
import { ToastContainer } from '@/components/Toast';
import {
  faBars,
  faEdit,
  faSearch,
  faTrashAlt
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';


// Importa o hook e os tipos/constantes refatorados
import { useListaFuncionarios } from '../../hooks/useListaFuncionarios';
import { FuncionarioDto, COLORS, HEADER_HEIGHT, STATUS_BAR_HEIGHT } from '../../types/funcionariosTypes';


const ListaFuncionarios = () => {
    // 1. Uso do Custom Hook para obter toda a lógica e estado
    const {
        // Refs
        flatListRef,
        modalScrollViewRef,
        // Dados/Estado
        filteredData,
        selectedFuncionario,
        editForm,
        loading,
        refreshing,
        modalVisible,
        editLoading,
        searchTerm,
        focusIndex,
        sidebarOpen,
        userName,
        userRole,
        pendingDeleteId,
        // Dropdown States e Consts (Para o caso de querer reativar a edição de Role)
        openRolesPicker,
        ROLES_OPTIONS,
        // Setters
        setSearchTerm,
        setEditForm,
        setModalVisible,
        setOpenRolesPicker,
        setFocusIndex,
        // Handlers
        toggleSidebar,
        closeSidebar,
        handleRefresh,
        handleEditAtleta,
        handleSaveEdit,
        handleDelete,
        funcionarios, 
    } = useListaFuncionarios();


  // Função para renderizar cada item da lista (Função de renderização mantida no componente)
  const renderFuncionarioItem = ({ item, index }: { item: FuncionarioDto, index: number }) => {
    const isFocused = Platform.OS === 'web' && focusIndex === index;
    
    return (
      <TouchableOpacity 
        style={[
          styles.atletaCard, 
          isFocused && styles.atletaCardFocused,
          Platform.OS === 'web' && { cursor: 'pointer' as any }
        ]} 
        onPress={() => {
          setFocusIndex(index);
          handleEditAtleta(item);
        }}
        onFocus={() => {
            // Permite o foco via tab/shift+tab
            if (Platform.OS === 'web') setFocusIndex(index);
        }}
        onBlur={() => {
            // Limpa o foco ao sair
            if (Platform.OS === 'web' && focusIndex === index) setFocusIndex(-1);
        }}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={`Funcionário ${item.nome}, Cargo ${item.roles}. Pressione para editar.`}
      >
        <View style={styles.atletaInfo}>
          <Text style={styles.atletaName} numberOfLines={1} ellipsizeMode="tail">{item.nome}</Text>
          <Text style={styles.atletaDetail}>Cargo: {item.roles ? item.roles : 'Não informado'}</Text>
          <Text style={styles.atletaDetail}>Email: {item.email}</Text>
          <Text style={styles.atletaDetail}>Tel: {item.telefone}</Text>
        </View>
        <View style={styles.atletaActions}>
          <TouchableOpacity 
            onPress={() => handleEditAtleta(item)}
            style={styles.editButton}
            accessibilityLabel={`Editar ${item.nome}`}
          >
            <FontAwesomeIcon icon={faEdit} size={20} color={COLORS.primary} />
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => handleDelete(item.id, item.roles)} 
            style={[styles.deleteButton, pendingDeleteId === item.id.toString() && { backgroundColor: 'rgba(220, 53, 69, 0.1)' }]}
            accessibilityLabel={`Excluir ${item.nome}`}
          >
            <FontAwesomeIcon icon={faTrashAlt} size={20} color={COLORS.danger} />
            {pendingDeleteId === item.id.toString() && Platform.OS === 'web' && (
              <Text style={{ color: COLORS.danger, fontSize: 10, marginTop: 4 }}>Confirmar</Text>
            )}
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };
  
  // Exibição de Loading
  if (loading && funcionarios.length === 0 && searchTerm === '') {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={{ color: COLORS.textPrimary }}>Carregando...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* ToastContainer no Web */}
      {Platform.OS === 'web' && <ToastContainer isOverlayOpen={modalVisible} />}
      
      {/* Header Fixo (Responsivo) */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.menuButton} onPress={toggleSidebar}>
         <FontAwesomeIcon icon={faBars} size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Funcionários</Text>
      </View>
      
      {/* Sidebar */}
        <Sidebar 
          isOpen={sidebarOpen} 
          onClose={closeSidebar}
          userName={userName}
          userRole={userRole as 'SUPERVISOR' | 'COORDENADOR' | 'TECNICO'}
          onNavigateToSection={() => {}}
        />
      
      {/* Conteúdo Principal */}
      <View style={styles.contentWrapper}>
        
        {/* Campo de busca */}
        <View style={styles.searchContainer}>
          <FontAwesomeIcon icon={faSearch} size={20} color={COLORS.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar funcionário por nome..." 
            placeholderTextColor={COLORS.textSecondary}
            value={searchTerm}
            onChangeText={(text) => {
              setSearchTerm(text);
              setFocusIndex(0);
            }} 
            accessibilityRole="search"
            keyboardAppearance="light"
          />
        </View>

        {/* Exibição da lista */}
        {filteredData.length === 0 ? (
          <View style={styles.emptyListContainer}>
            <Text style={styles.emptyListText}>
              {searchTerm ? 'Nenhum funcionário encontrado com este nome.' : 'Nenhum funcionário encontrado.'}
            </Text>
            {!searchTerm && (
                <TouchableOpacity style={styles.reloadButton} onPress={handleRefresh}>
                    <Text style={styles.reloadButtonText}>Recarregar</Text>
                </TouchableOpacity>
            )}
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={filteredData}
            keyExtractor={(item) => item.uniqueId}
            renderItem={renderFuncionarioItem}
            contentContainerStyle={styles.listContent}
            onRefresh={handleRefresh}
            refreshing={refreshing}
            showsVerticalScrollIndicator={Platform.OS === 'web'}
            scrollEnabled={true}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled={Platform.OS === 'web'}
            bounces={Platform.OS !== 'web'}
            initialNumToRender={15}
          />
        )}
      </View>

      {/* Modal de Edição */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setOpenRolesPicker(false);
          setModalVisible(false);
        }}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>Editar Funcionário</Text>
            {selectedFuncionario && (
              <ScrollView 
                ref={modalScrollViewRef}
                style={styles.modalScrollView}
                showsVerticalScrollIndicator={Platform.OS === 'web'}
                keyboardShouldPersistTaps="handled"
                nestedScrollEnabled={Platform.OS === 'web'}
                bounces={Platform.OS !== 'web'}
              >
                <Text style={styles.inputLabel}>Nome:</Text>
                <TextInput
                  style={styles.input}
                  value={editForm.nome}
                  onChangeText={(text) => setEditForm({ ...editForm, nome: text })}
                  placeholder="Nome completo"
                  placeholderTextColor={COLORS.textSecondary}
                />
                
                <Text style={styles.inputLabel}>Email:</Text>
                <TextInput
                  style={styles.input}
                  value={editForm.email}
                  onChangeText={(text) => setEditForm({ ...editForm, email: text })}
                  placeholder="email@example.com"
                  placeholderTextColor={COLORS.textSecondary}
                  keyboardType="email-address"
                />
                <Text style={styles.inputLabel}>Data de Nascimento (AAAA-MM-DD):</Text>
                <TextInput
                  style={styles.input}
                  value={editForm.dataNascimento}
                  onChangeText={(text) => setEditForm({ ...editForm, dataNascimento: text })}
                  placeholder="AAAA-MM-DD"
                  placeholderTextColor={COLORS.textSecondary}
                  keyboardType="numeric"
                />
                <Text style={styles.inputLabel}>CPF:</Text>
                <TextInput
                  style={styles.input}
                  value={editForm.cpf}
                  onChangeText={(text) => setEditForm({ ...editForm, cpf: text })}
                  placeholder="000.000.000-00"
                  placeholderTextColor={COLORS.textSecondary}
                  keyboardType="numeric"
                />
                <Text style={styles.inputLabel}>Telefone:</Text>
                <TextInput
                  style={styles.input}
                  value={editForm.telefone}
                  onChangeText={(text) => setEditForm({ ...editForm, telefone: text })}
                  placeholder="(XX) XXXXX-XXXX"
                  placeholderTextColor={COLORS.textSecondary}
                  keyboardType="numeric"
                />

                <Text style={styles.inputLabel}>Tipo:</Text>
                {/* Exibindo a role atual, pois o DropDownPicker foi desativado no código original */}
                <Text style={styles.input}>{editForm.roles}</Text> 

              </ScrollView>
            )}
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.buttonClose]}
                onPress={() => {
                  setOpenRolesPicker(false);
                  setModalVisible(false);
                }}
                disabled={editLoading}
                accessibilityLabel="Cancelar edição"
              >
                <Text style={styles.textStyle}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.buttonSave]}
                onPress={handleSaveEdit}
                disabled={editLoading}
                accessibilityLabel="Salvar alterações"
              >
                {editLoading ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <Text style={styles.textStyle}>Salvar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// --- Estilos Otimizados para Responsividade (Inalterados) ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: COLORS.headerColor,
    paddingHorizontal: 10,
    minHeight: HEADER_HEIGHT, 
    ...Platform.select({
      web: {
        position: 'fixed' as any,
        top: 0,
        width: '100%',
        zIndex: 10,
        paddingTop: 15, // Padrão Web
      },
      default: { 
        paddingTop: STATUS_BAR_HEIGHT + 12,
      },
    }),
  } as any,
  menuButton: {
    position: 'absolute',
    left: 10,
    top: Platform.select({
      web: 15,
      default: STATUS_BAR_HEIGHT + 10,
    }),
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 11,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.white,
    textAlign: 'center',
  },
  contentWrapper: {
    flex: 1,
    paddingHorizontal: 10,
    // Compensação da altura do header fixo para Web e Mobile
    marginTop: Platform.OS === 'web' ? HEADER_HEIGHT : 0, 
    width: '100%',
    maxWidth: 1200, 
    alignSelf: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  emptyListContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyListText: {
    fontSize: 18,
    color: COLORS.textSecondary,
    marginBottom: 15,
    textAlign: 'center',
  },
  reloadButton: {
      backgroundColor: COLORS.primary,
      padding: 10,
      borderRadius: 8,
      ...(Platform.OS === 'web' && { cursor: 'pointer' as any }),
  },
  reloadButtonText: {
      color: COLORS.white,
      fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBackground,
    borderRadius: 8,
    marginTop: 10,
    marginBottom: 10,
    paddingHorizontal: 10,
    shadowColor: COLORS.textPrimary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 8,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
    color: COLORS.textPrimary,
    ...(Platform.OS === 'web' && { outline: 'none' as any }),
  },
  listContent: {
    paddingBottom: 20, 
  },
  atletaCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.cardBackground,
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    shadowColor: COLORS.textPrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
    alignItems: 'center',
    justifyContent: 'space-between',
    borderLeftWidth: 5,
    borderLeftColor: COLORS.primary, 
    ...(Platform.OS === 'web' && { cursor: 'pointer' as any }),
  },
  atletaCardFocused: {
    borderColor: COLORS.secondary,
    borderWidth: 1,
    borderLeftWidth: 5, 
    shadowOpacity: 0.3,
    elevation: 6,
  },
  atletaInfo: {
    flex: 1,
    marginRight: 10, 
    overflow: 'hidden',
  },
  atletaActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
  },
  atletaName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary, 
    marginBottom: 5,
  },
  atletaDetail: {
    fontSize: 14,
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  editButton: {
      padding: 8,
  },
  deleteButton: {
    padding: 8,
    backgroundColor: "transparent",
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)', 
    ...Platform.select({ web: { position: 'fixed' as any, top: 0, left: 0, right: 0, bottom: 0, overflowY: 'auto' as any } }),
  },
  modalView: {
    margin: 20,
    backgroundColor: COLORS.white,
    borderRadius: 15, 
    padding: 25,
    alignItems: 'center',
    shadowColor: COLORS.textPrimary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
    width: '90%',
    maxWidth: 600,
    maxHeight: '90%', 
    minHeight: 300,
    zIndex: 20,
    ...Platform.select({ web: { marginVertical: 40 } }),
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: COLORS.primary,
  },
  modalScrollView: {
    width: '100%',
    paddingHorizontal: 5,
    ...Platform.select({ web: { maxHeight: 400, overflowY: 'auto' as any } }),
  },
  inputLabel: {
    alignSelf: 'flex-start',
    marginBottom: 5,
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.textPrimary,
  },
  input: {
    width: '100%',
    height: 45, 
    borderColor: COLORS.borderColor,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
    color: COLORS.textPrimary,
    ...(Platform.OS === 'web' && { outline: 'none' as any }),
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 25, 
  },
  button: {
    borderRadius: 10,
    paddingVertical: 12, 
    elevation: 2,
    flex: 1,
    marginHorizontal: 8, 
    justifyContent: 'center',
    alignItems: 'center',
    ...(Platform.OS === 'web' && { cursor: 'pointer' as any }),
  },
  buttonClose: {
    backgroundColor: COLORS.textSecondary, 
  },
  buttonSave: {
    backgroundColor: COLORS.primary, 
  },
  textStyle: {
    color: COLORS.white,
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 16,
  },
  dropdownContainer: {
    width: '100%',
    marginBottom: 15,
    zIndex: 3000, 
  },
  dropdown: {
    borderColor: COLORS.borderColor,
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: COLORS.white,
    minHeight: 45,
    ...(Platform.OS === 'web' && { outline: 'none' as any }),
  },
  dropdownList: {
    borderColor: COLORS.borderColor,
    backgroundColor: COLORS.white,
    borderRadius: 8,
    maxHeight: 150,
  },
  dropdownText: {
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  dropdownPlaceholder: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
   webScrollView: {
    ...Platform.select({
      web: {
        height: '100vh',
        overflowY: 'auto' as any,
      },
    }),
  } as any,
});

export default ListaFuncionarios;