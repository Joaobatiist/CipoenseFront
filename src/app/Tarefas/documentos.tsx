// DocumentosScreen.tsx

import { Sidebar } from '@/components/layout/Sidebar';
import { ToastContainer } from '@/components/Toast';
import {
    faBars,
    faEdit,
    faFilePdf,
    faPlus,
    faTrashAlt,
    faUpload,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import React, { useCallback } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Modal,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

// Importa o hook e os tipos/constantes refatorados
import { useDocumentos } from '../../hooks/useDocumentos';
import { COLORS_DOCUMENTOS, DocumentoPdf, HEADER_HEIGHT } from '../../types/documentosTypes';
import moment from 'moment'; // Necessário para formatação da data

const DocumentosScreen: React.FC = () => {
    // 1. Uso do Custom Hook para obter toda a funcionalidade
    const {
        documentos,
        loading,
        refreshing,
        modalVisible,
        isSaving,
        selectedDocumento,
        form,
        sidebarOpen,
        userName,
        userRole,
        setModalVisible,
        setForm,
        toggleSidebar,
        closeSidebar,
        handleRefresh,
        handleOpenModal,
        handlePickDocument,
        handleSaveDocumento,
        handleDeleteDocumento,
    } = useDocumentos();

    // Função de Renderização do Item da Lista
    const renderDocumentoItem = useCallback(({ item }: { item: DocumentoPdf }) => {
        // Função para abrir o URL no navegador/visor de PDF
        const handleDownload = () => {
            if (Platform.OS === 'web') {
                window.open(item.urlDocumento, '_blank');
            } else {
                // Em mobile, pode-se usar Linking ou um módulo específico de download/visualização
                // Por simplicidade, usamos Linking (necessário importar do react-native)
                // Se for um link direto, o próprio RN pode lidar
                // Linking.openURL(item.urlDocumento);
                alert(`Simulando download/visualização de: ${item.urlDocumento}`);
            }
        };

        return (
            <View style={styles.documentoCard}>
                <View style={styles.documentoInfo}>
                    <FontAwesomeIcon icon={faFilePdf} size={24} color={COLORS_DOCUMENTOS.danger} style={{ marginRight: 10 }} />
                    <View style={{ flex: 1 }}>
                        <Text style={styles.documentoDescricao} numberOfLines={2} ellipsizeMode="tail">
                            {item.descricao}
                        </Text>
                        <Text style={styles.documentoDetalhe}>
                            Arquivo: {item.nomeArquivo}
                        </Text>
                        <Text style={styles.documentoDetalhe}>
                            Upload: {moment(item.dataUpload).format('DD/MM/YYYY HH:mm')}
                        </Text>
                        <TouchableOpacity 
                            style={styles.downloadButton}
                            onPress={handleDownload}
                            accessibilityLabel={`Visualizar PDF ${item.nomeArquivo}`}
                        >
                            <Text style={styles.downloadButtonText}>Visualizar/Baixar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
                <View style={styles.documentoActions}>
                    <TouchableOpacity
                        onPress={() => handleOpenModal(item)}
                        style={styles.actionButton}
                        accessibilityLabel="Editar documento"
                    >
                        <FontAwesomeIcon icon={faEdit} size={20} color={COLORS_DOCUMENTOS.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => handleDeleteDocumento(item.id)}
                        style={styles.actionButton}
                        accessibilityLabel="Excluir documento"
                    >
                        <FontAwesomeIcon icon={faTrashAlt} size={20} color={COLORS_DOCUMENTOS.danger} />
                    </TouchableOpacity>
                </View>
            </View>
        );
    }, [handleOpenModal, handleDeleteDocumento]);

    // Renderização de Lista Vazia
    const renderEmptyList = useCallback(() => (
        <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Nenhum documento PDF foi cadastrado.</Text>
            <TouchableOpacity style={styles.reloadButton} onPress={handleRefresh}>
                <Text style={styles.reloadButtonText}>Recarregar Lista</Text>
            </TouchableOpacity>
        </View>
    ), [handleRefresh]);

    // Exibição de Loading
    if (loading && documentos.length === 0) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS_DOCUMENTOS.primary} />
                <Text style={{ color: COLORS_DOCUMENTOS.textPrimary }}>Carregando documentos...</Text>
            </View>
        );
    }

    const isEditing = selectedDocumento !== null;
    const modalTitle = isEditing ? 'Editar Documento' : 'Novo Documento';

    return (
        <SafeAreaView style={styles.safeArea}>
            {Platform.OS === 'web' && <ToastContainer />}

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.menuButton} onPress={toggleSidebar}>
                    <FontAwesomeIcon icon={faBars} size={24} color={COLORS_DOCUMENTOS.white} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Gestão de Documentos</Text>
            </View>

            {/* Sidebar */}
            <Sidebar
                isOpen={sidebarOpen}
                onClose={closeSidebar}
                userName={userName}
                userRole={userRole as 'SUPERVISOR' | 'COORDENADOR' | 'TECNICO'}
                onNavigateToSection={() => {}}
            />

            <View style={styles.contentWrapper}>
                {/* Botão de Adicionar Documento */}
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => handleOpenModal(null)}
                    disabled={isSaving}
                >
                    <FontAwesomeIcon icon={faPlus} size={18} color={COLORS_DOCUMENTOS.white} style={{ marginRight: 8 }} />
                    <Text style={styles.addButtonText}>Adicionar Documento</Text>
                </TouchableOpacity>

                {/* Lista de Documentos */}
                <FlatList
                    data={documentos}
                    keyExtractor={(item) => `doc-${item.id}`}
                    renderItem={renderDocumentoItem}
                    ListEmptyComponent={renderEmptyList}
                    contentContainerStyle={styles.listContent}
                    onRefresh={handleRefresh}
                    refreshing={refreshing}
                    showsVerticalScrollIndicator={Platform.OS === 'web'}
                    scrollEnabled={true}
                    nestedScrollEnabled={Platform.OS === 'web'}
                />
            </View>

            {/* Modal de Criação/Edição */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.centeredView}>
                    <View style={styles.modalView}>
                        <Text style={styles.modalTitle}>{modalTitle}</Text>

                        <ScrollView style={styles.modalScrollView} keyboardShouldPersistTaps="handled">
                            <Text style={styles.inputLabel}>Descrição do Documento:</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Ex: Regulamento Interno, Manual do Atleta..."
                                placeholderTextColor={COLORS_DOCUMENTOS.textSecondary}
                                value={form.descricao}
                                onChangeText={(text) => setForm({ ...form, descricao: text })}
                                multiline
                                numberOfLines={2}
                            />

                            <Text style={styles.inputLabel}>
                                Arquivo PDF: {isEditing ? '(Opcional para substituição)' : ''}
                            </Text>

                            <TouchableOpacity
                                style={styles.filePickerButton}
                                onPress={handlePickDocument}
                                disabled={isSaving}
                            >
                                <FontAwesomeIcon icon={faUpload} size={18} color={COLORS_DOCUMENTOS.white} />
                                <Text style={styles.filePickerButtonText}>
                                    {isEditing && !form.pdfFile ? 'Substituir PDF' : 'Selecionar PDF'}
                                </Text>
                            </TouchableOpacity>
                            
                            <View style={styles.fileInfoContainer}>
                                <Text style={styles.fileInfoText}>
                                    {isEditing && !form.pdfFile ? `PDF Atual: ${form.nomeArquivo}` : ''}
                                    {form.pdfFile ? `Novo PDF: ${form.nomeArquivo}` : ''}
                                    {!isEditing && !form.pdfFile ? 'Nenhum arquivo selecionado' : ''}
                                </Text>
                            </View>
                            
                        </ScrollView>
                        
                        <View style={styles.modalButtonContainer}>
                            <TouchableOpacity
                                style={[styles.button, styles.buttonClose]}
                                onPress={() => setModalVisible(false)}
                                disabled={isSaving}
                            >
                                <Text style={styles.textStyle}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.button, styles.buttonSave, isSaving && styles.buttonDisabled]}
                                onPress={handleSaveDocumento}
                                disabled={isSaving}
                            >
                                {isSaving ? (
                                    <ActivityIndicator color={COLORS_DOCUMENTOS.white} />
                                ) : (
                                    <Text style={styles.textStyle}>{isEditing ? 'Salvar' : 'Criar'}</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

// --- Estilos ---
const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: COLORS_DOCUMENTOS.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        backgroundColor: COLORS_DOCUMENTOS.headerColor,
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
                paddingTop: 50, // Ajuste para RN/Android/iOS
            },
        }),
    } as any,
    menuButton: {
        position: 'absolute',
        left: 10,
        top: Platform.select({
            web: 15,
            default: 50,
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
        color: COLORS_DOCUMENTOS.white,
        textAlign: 'center',
    },
    contentWrapper: {
        flex: 1,
        paddingHorizontal: 15,
        marginTop: Platform.OS === 'web' ? HEADER_HEIGHT : 0,
        width: '100%',
        maxWidth: 800,
        alignSelf: 'center',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS_DOCUMENTOS.background,
    },
    listContent: {
        paddingBottom: 20,
    },
    // Card de Documento
    documentoCard: {
        flexDirection: 'row',
        backgroundColor: COLORS_DOCUMENTOS.cardBackground,
        borderRadius: 10,
        padding: 15,
        marginVertical: 8,
        shadowColor: COLORS_DOCUMENTOS.textPrimary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 4,
        alignItems: 'center',
        justifyContent: 'space-between',
        borderLeftWidth: 5,
        borderLeftColor: COLORS_DOCUMENTOS.primary,
    },
    documentoInfo: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 10,
    },
    documentoDescricao: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS_DOCUMENTOS.primary,
        marginBottom: 5,
    },
    documentoDetalhe: {
        fontSize: 13,
        color: COLORS_DOCUMENTOS.textSecondary,
    },
    documentoActions: {
        flexDirection: 'row',
        gap: 5,
    },
    actionButton: {
        padding: 8,
    },
    downloadButton: {
        marginTop: 5,
        alignSelf: 'flex-start',
        backgroundColor: COLORS_DOCUMENTOS.info,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 5,
        ...(Platform.OS === 'web' && { cursor: 'pointer' as any }),
    },
    downloadButtonText: {
        color: COLORS_DOCUMENTOS.white,
        fontSize: 12,
        fontWeight: 'bold',
    },
    // Botão de Adicionar (Fora da lista)
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: "#1c348e",
        padding: 15,
        borderRadius: 10,
        marginVertical: 10,
        ...(Platform.OS === 'web' && { cursor: 'pointer' as any }),
    },
    addButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    // Modal
    centeredView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.6)',
        ...Platform.select({ web: { position: 'fixed' as any, top: 0, left: 0, right: 0, bottom: 0, overflowY: 'auto' as any } }),
    },
    modalView: {
        margin: 20,
        backgroundColor: COLORS_DOCUMENTOS.white,
        borderRadius: 15,
        padding: 25,
        alignItems: 'center',
        shadowColor: COLORS_DOCUMENTOS.textPrimary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 8,
        width: '90%',
        maxWidth: 500,
        maxHeight: '80%',
        zIndex: 20,
        ...Platform.select({ web: { marginVertical: 40 } }),
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        color: COLORS_DOCUMENTOS.primary,
    },
    modalScrollView: {
        width: '100%',
        paddingHorizontal: 5,
    },
    inputLabel: {
        alignSelf: 'flex-start',
        marginBottom: 5,
        fontSize: 15,
        fontWeight: '500',
        color: COLORS_DOCUMENTOS.textPrimary,
    },
    input: {
        width: '100%',
        height: 80, // Aumenta a altura para descrição
        borderColor: COLORS_DOCUMENTOS.borderColor,
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 12,
        marginBottom: 15,
        fontSize: 16,
        color: COLORS_DOCUMENTOS.textPrimary,
        textAlignVertical: 'top',
        ...(Platform.OS === 'web' && { outline: 'none' as any }),
    },
    filePickerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS_DOCUMENTOS.secondary,
        padding: 12,
        borderRadius: 8,
        marginBottom: 10,
        width: '100%',
        ...(Platform.OS === 'web' && { cursor: 'pointer' as any }),
    },
    filePickerButtonText: {
        color: COLORS_DOCUMENTOS.primary,
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 10,
    },
    fileInfoContainer: {
        padding: 10,
        backgroundColor: COLORS_DOCUMENTOS.background,
        borderRadius: 8,
        width: '100%',
        marginBottom: 15,
        borderLeftWidth: 3,
        borderLeftColor: COLORS_DOCUMENTOS.borderColor,
    },
    fileInfoText: {
        fontSize: 14,
        color: COLORS_DOCUMENTOS.textSecondary,
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
    buttonDisabled: {
        opacity: 0.6,
    },
    buttonClose: {
        backgroundColor: COLORS_DOCUMENTOS.textSecondary,
    },
    buttonSave: {
        backgroundColor: COLORS_DOCUMENTOS.primary,
    },
    textStyle: {
        color: COLORS_DOCUMENTOS.white,
        fontWeight: 'bold',
        textAlign: 'center',
        fontSize: 16,
    },
    // Lista vazia
    emptyContainer: {
        alignItems: 'center',
        padding: 40,
        backgroundColor: COLORS_DOCUMENTOS.cardBackground,
        borderRadius: 12,
        marginVertical: 20,
        borderWidth: 1,
        borderColor: COLORS_DOCUMENTOS.borderColor,
    },
    emptyText: {
        textAlign: 'center',
        fontSize: 16,
        color: COLORS_DOCUMENTOS.textSecondary,
        fontStyle: 'italic',
        marginBottom: 10,
    },
    reloadButton: {
        backgroundColor: COLORS_DOCUMENTOS.info,
        padding: 10,
        borderRadius: 8,
        marginTop: 10,
        ...(Platform.OS === 'web' && { cursor: 'pointer' as any }),
    },
    reloadButtonText: {
        color: COLORS_DOCUMENTOS.white,
        fontWeight: 'bold',
    },
});

export default DocumentosScreen;