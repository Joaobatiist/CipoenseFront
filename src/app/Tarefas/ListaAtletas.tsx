// ListaAtletasScreen.tsx

import { ToastContainer } from '@/components/Toast';
import { faBars, faSearch, faTrashAlt } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import React from 'react';
import {
  ActivityIndicator,
  Button,
  FlatList,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import { MaterialIcons } from '@expo/vector-icons';

// Importa o hook e os tipos refatorados
import { useListaAtletas } from '../../hooks/useListaAtletas';
import { AtletaProfileDto, COLORS, HEADER_HEIGHT } from '../../types/atletasTypes';
import { Sidebar } from '@/components/layout/Sidebar'; // Assumindo o caminho


export default function ListaAtletasScreen() {
  const {
    // Refs
    flatListRef,
    modalScrollViewRef,
    // Dados/Estado
    filteredData,
    selectedAtleta,
    editForm,
    loading,
    refreshing,
    modalVisible,
    editLoading,
    uploadingPdf,
    searchTerm,
    focusIndex,
    sidebarOpen,
    userName,
    userRole,
    pendingDeleteId,
    // Dropdown States e Consts
    openPosicoesPicker,
    openSubDivisoesPicker,
    POSICOES,
    SUBDIVISOES,
    // Setters
    setSearchTerm,
    setEditForm,
    setModalVisible,
    setOpenPosicoesPicker,
    setOpenSubDivisoesPicker,
    // Handlers
    toggleSidebar,
    closeSidebar,
    handleRefresh,
    handleEditAtleta,
    handleSaveEdit,
    handleDeleteAtleta,
    handleDownloadPdf,
    handlePdfUpload,
    handleDeleteMainPdf,
    // Helpers
    formatarData,
  } = useListaAtletas();


  // --- Renderização do Item da Lista ---
  const renderAtletaItem = ({
    item,
    index,
  }: {
    item: AtletaProfileDto;
    index: number;
  }) => {
    const isFocused = Platform.OS === 'web' && focusIndex === index;

    return (
      <TouchableOpacity
        style={[
          styles.atletaCard,
          isFocused && styles.atletaCardFocused,
          Platform.OS === 'web' && { cursor: 'pointer' as any }
        ]}
        onPress={() => {
          handleEditAtleta(item);
        }}
        activeOpacity={0.7}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={`Atleta ${item.nome}, Pressione Enter para editar.`}
      >
        <View style={styles.atletaInfo}>
          <Text style={styles.atletaName} numberOfLines={1} ellipsizeMode="tail">
            {item.nome}
          </Text>
          <Text style={styles.atletaDetail}>
            {`Matrícula: ${item.matricula}`}
          </Text>
          <Text style={styles.atletaDetail}>{`Email: ${item.email}`}</Text>
          <Text style={styles.atletaDetail}>
            {`Subdivisão: ${item.subDivisao}`}
          </Text>
          <Text style={styles.atletaDetail}>
            {`Posição: ${item.posicao}`}
          </Text>
          <Text style={styles.atletaDetail}>
            {`Data Nasc.: ${formatarData(item.dataNascimento)}`}
          </Text>
          {item.contatoResponsavel && item.contatoResponsavel !== 'Não informado' && (
            <Text style={styles.atletaDetail}>
              {`Contato Responsavel: ${item.contatoResponsavel}`}
            </Text>
          )}
          <Text style={styles.atletaDetail}>
            {`Apto para Jogar: `}
            <Text
              style={{
                fontWeight: 'bold',
                color: item.isAptoParaJogar ? COLORS.success : COLORS.danger,
              }}
            >
              {item.isAptoParaJogar ? 'Sim' : 'Não'}
            </Text>
          </Text>
          {item.documentoPdfBase64 && item.documentoPdfContentType && (
            <TouchableOpacity
              onPress={() => handleDownloadPdf(item.documentoPdfBase64!, item.documentoPdfContentType!, `documento_${item.nome}.pdf`)}
              style={styles.downloadPdfButton}
            >
              <MaterialIcons name="cloud-download" size={20} color={COLORS.white} />
              <Text style={styles.downloadPdfButtonText}>Baixar Documento</Text>
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          onPress={() => handleDeleteAtleta(item.id)}
          style={[styles.deleteButton, pendingDeleteId === item.id && { backgroundColor: 'rgba(220, 53, 69, 0.1)' }]}
          activeOpacity={0.7}
          accessibilityLabel={`Excluir atleta ${item.nome}`}
        >
          <FontAwesomeIcon icon={faTrashAlt} size={20} color={COLORS.danger} />
          {pendingDeleteId === item.id && Platform.OS === 'web' && (
            <Text style={{ color: COLORS.danger, fontSize: 10, marginTop: 4 }}>Confirmar</Text>
          )}
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };
  // --- Fim Renderização do Item da Lista ---

  if (loading && filteredData.length === 0 && searchTerm === '') {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={{ color: COLORS.textPrimary }}>Carregando atletas...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
  {Platform.OS === 'web' && <ToastContainer isOverlayOpen={modalVisible} />}
      {/* Header */}
      <View style={styles.header}>
      <TouchableOpacity style={styles.menuButton} onPress={toggleSidebar}>
        <FontAwesomeIcon icon={faBars} size={24} color="#fff" />
       </TouchableOpacity>
        <Text style={styles.headerTitle}>Atletas</Text>
      </View>

             <Sidebar 
                isOpen={sidebarOpen} 
                onClose={closeSidebar}
                userName={userName}
                userRole={userRole as 'SUPERVISOR' | 'COORDENADOR' | 'TECNICO'}
                onNavigateToSection={() => {}}
            />
      <View style={styles.contentWrapper} id="search-input-container">
        {/* Campo de busca */}
        <View style={styles.searchContainer}>
          <FontAwesomeIcon icon={faSearch} size={20} color={COLORS.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar atleta por nome..."
            placeholderTextColor={COLORS.textSecondary}
            value={searchTerm}
            onChangeText={(text) => setSearchTerm(text)}
            accessibilityRole="search"
            keyboardAppearance="light"
          />
        </View>

        {/* Lista de atletas */}
        {filteredData.length === 0 ? (
          <View style={styles.emptyListContainer}>
            <Text style={styles.emptyListText}>
              {searchTerm ? 'Nenhum atleta encontrado com este nome.' : 'Nenhum atleta cadastrado.'}
            </Text>
            {!searchTerm && <Button title="Recarregar" onPress={handleRefresh} color={COLORS.primary} />}
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={filteredData}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderAtletaItem}
            contentContainerStyle={styles.listContent}
            onRefresh={handleRefresh}
            refreshing={refreshing}
            showsVerticalScrollIndicator={Platform.OS === 'web'}
            scrollEnabled={true}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled={Platform.OS === 'web'}
            bounces={Platform.OS !== 'web'}
            initialNumToRender={20}
          />
        )}
      </View>


      {/* Modal de Edição de Atleta */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>Editar Atleta</Text>
            {selectedAtleta && (
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
                <Text style={styles.inputLabel}>Subdivisão:</Text>
                <View style={[styles.dropdownContainer, { zIndex: 4000 }]}>
                  <DropDownPicker
                    open={openSubDivisoesPicker}
                    value={editForm.subDivisao ?? null}
                    items={SUBDIVISOES.map(item => ({...item, key: item.value}))}
                    setOpen={setOpenSubDivisoesPicker}
                    setValue={(callback) => {
                      const value = typeof callback === 'function' ? callback(editForm.subDivisao ?? null) : callback;
                      setEditForm({ ...editForm, subDivisao: value });
                    }}
                    placeholder="Selecione a Subdivisão"
                    style={styles.dropdown}
                    dropDownContainerStyle={styles.dropdownList}
                    textStyle={styles.dropdownText}
                    placeholderStyle={styles.dropdownPlaceholder}
                    zIndex={4000} 
                    listMode="SCROLLVIEW"
                    scrollViewProps={{ nestedScrollEnabled: true }}
                  />
                </View>
                <Text style={styles.inputLabel}>Posição:</Text>
               <View style={[styles.dropdownContainer, { zIndex: 3000 }]}>
                  <DropDownPicker
                    open={openPosicoesPicker}
                    value={editForm.posicao ?? null}
                    items={POSICOES.map(item => ({...item, key: item.value}))}
                    setOpen={setOpenPosicoesPicker}
                    setValue={(callback) => {
                      const value = typeof callback === 'function' ? callback(editForm.posicao ?? null) : callback;
                      setEditForm({ ...editForm, posicao: value });
                    }}
                    placeholder="Selecione a posição"
                    style={styles.dropdown}
                    dropDownContainerStyle={styles.dropdownList}
                    textStyle={styles.dropdownText}
                    placeholderStyle={styles.dropdownPlaceholder}
                    zIndex={3000} 
                    listMode="SCROLLVIEW"
                    scrollViewProps={{ nestedScrollEnabled: true }}
                  />
                </View>
                <Text style={styles.inputLabel}>Contato Responsável:</Text>
                <TextInput
                  style={styles.input}
                  value={editForm.contatoResponsavel ?? ''}
                  onChangeText={(text) => setEditForm({ ...editForm, contatoResponsavel: text })}
                  placeholder="(XX) XXXXX-XXXX"
                  placeholderTextColor={COLORS.textSecondary}
                  keyboardType="phone-pad"
                />

                <View style={styles.switchContainer}>
                  <Text style={styles.inputLabel}>Apto para Jogar:</Text>
                  <Switch
                    trackColor={{ false: COLORS.borderColor, true: COLORS.primary }}
                    thumbColor={editForm.isAptoParaJogar ? COLORS.secondary : COLORS.white}
                    ios_backgroundColor={COLORS.borderColor}
                    onValueChange={(value) => setEditForm({ ...editForm, isAptoParaJogar: value })}
                    value={editForm.isAptoParaJogar ?? false}
                  />
                </View>

                <Text style={styles.inputLabel}>Documento PDF:</Text>
                <View style={styles.pdfSection}>
                  {editForm.documentoPdfBase64 && editForm.documentoPdfContentType ? (
                    <View style={{ width: '100%' }}>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 8, justifyContent: 'flex-start' }}>
                        <TouchableOpacity
                          style={[styles.buttonPdfAction, { backgroundColor: COLORS.info }]}
                          onPress={() => handleDownloadPdf(editForm.documentoPdfBase64!, editForm.documentoPdfContentType!, `documento_${selectedAtleta!.nome}.pdf`)}
                        >
                          <MaterialIcons name="cloud-download" size={20} color={COLORS.white} />
                          <Text style={styles.buttonPdfActionText}>Baixar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.buttonPdfAction, { backgroundColor: COLORS.danger }]}
                          onPress={() => handleDeleteMainPdf(selectedAtleta!.id)}
                        >
                          <MaterialIcons name="delete" size={20} color={COLORS.white} />
                          <Text style={styles.buttonPdfActionText}>Remover</Text>
                        </TouchableOpacity>
                      </View>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'flex-start' }}>
                        <TouchableOpacity
                          style={[styles.buttonPdfAction, { backgroundColor: COLORS.primary }]}
                          onPress={() => handlePdfUpload(selectedAtleta!.id)}
                          disabled={uploadingPdf}
                        >
                          {uploadingPdf ? (
                            <ActivityIndicator color={COLORS.white} />
                          ) : (
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                              <MaterialIcons name="cloud-upload" size={20} color={COLORS.white} />
                              <Text style={styles.buttonPdfActionText}>Trocar</Text>
                            </View>
                          )}
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : (
                    <View style={{ width: '100%', alignItems: 'flex-start' }}>
                      <Text style={{ color: COLORS.textSecondary, marginBottom: 8, fontStyle: 'italic' }}>Nenhum PDF presente.</Text>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                        <TouchableOpacity
                          style={styles.buttonPdfAction}
                          onPress={() => handlePdfUpload(selectedAtleta!.id)}
                          disabled={uploadingPdf}
                        >
                          {uploadingPdf ? (
                            <ActivityIndicator color={COLORS.blueBorder} />
                          ) : (
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                              <MaterialIcons name="add-to-drive" size={20} color={COLORS.white} />
                              <Text style={styles.buttonPdfActionText}>Adicionar PDF</Text>
                            </View>
                          )}
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </View>
              </ScrollView>
            )}
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.buttonClose]}
                onPress={() => setModalVisible(false)}
                disabled={editLoading}
              >
                <Text style={styles.textStyle}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.buttonSave]}
                onPress={handleSaveEdit}
                disabled={editLoading}
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


// --- Estilos para Responsividade (Mantidos inalterados) ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
   
    paddingVertical: 12,
    backgroundColor: COLORS.primary, // Azul escuro
    paddingHorizontal: 10,
    minHeight: HEADER_HEIGHT,
    ...Platform.select({
      web: {
        position: 'fixed' as any,
        top: 0,
        width: '100%',
        zIndex: 10,
        paddingTop: 15,
      },
      default: {
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 20 : 12,
      },
    }),
  } as any,
 menuButton: {
    position: 'absolute',
    left: 10,
    top: Platform.select({
      web: 15,
      default: (Platform.OS === 'android' ? StatusBar.currentHeight || 20 : 12) + 5,
    }),
    padding: 8,
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
    paddingHorizontal: Platform.OS === 'web' ? 20 : 10,
    marginTop: Platform.OS === 'web' ? HEADER_HEIGHT : 0,
    width: '100%',
    maxWidth: Platform.OS === 'web' ? 1000 : '100%', 
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
    marginBottom: 10,
    textAlign: 'center',
  },
  dropdownPlaceholder: {
    fontSize: 16,
    color: COLORS.textSecondary,
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
     dropdownText: {
    fontSize: 16,
    color: COLORS.textPrimary,
  },
    dropdownList: {
      borderColor: COLORS.borderColor,
      backgroundColor: COLORS.white,
      borderRadius: 8,
      maxHeight: 150,
    },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBackground,
    borderRadius: 16,
    marginTop: 15,
    marginBottom: 10,
    paddingHorizontal: 10,
    shadowColor: '#006cb4ff',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    width: '100%',
    ...(Platform.OS === 'web' && { 
        outline: 'none' as any,
        borderWidth: 1, // Adiciona uma borda inicial para o efeito de foco
        borderColor: '#fff',
        }),
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
    flexGrow: 1, 
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
  deleteButton: {
    padding: 8,
    alignItems: 'center',
  },
  downloadPdfButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.info, 
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 8,
    alignSelf: 'flex-start',
    ...(Platform.OS === 'web' && { cursor: 'pointer' as any }),
  },
  downloadPdfButtonText: {
    color: COLORS.white,
    marginLeft: 8,
    fontSize: 14,
    fontWeight: 'bold',
  },
  // Modal Styles
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    ...Platform.select({
      web: {
        position: 'fixed' as any,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflowY: 'auto' as any,
      },
    }),
  } as any,
  modalView: {
    backgroundColor: COLORS.white,
    borderRadius: 15,
    padding: Platform.OS === 'web' ? 25 : 15,
    alignItems: 'center',
    width: Platform.OS === 'web' ? 410 : '100%',
    maxWidth: 600,
    minHeight: 400,
    alignSelf: 'center',
    shadowColor: COLORS.textPrimary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
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
    gap: Platform.OS === 'web' ? 16 : 8,
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
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 15,
    paddingVertical: 5,
    paddingHorizontal: 5,
    backgroundColor: COLORS.background,
    borderRadius: 8,
  },
  pdfSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    gap: Platform.OS === 'web' ? 10 : 6,
    width: '100%',
  },
  buttonPdfAction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: Platform.OS === 'web' ? 10 : 14,
    paddingHorizontal: Platform.OS === 'web' ? 15 : 18,
    marginBottom: 10,
    marginRight: 10,
    ...(Platform.OS === 'web' && { cursor: 'pointer' as any }),
  },
  buttonPdfActionText: {
    color: '#ffffffff',
    marginLeft: 8,
    fontWeight: 'bold',
    fontSize: 14,
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