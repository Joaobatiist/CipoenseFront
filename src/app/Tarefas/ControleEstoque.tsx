import { FormField } from '@/components/forms/CadastroForm';
import { Sidebar } from '@/components/layout/Sidebar';
import { ToastContainer } from '@/components/Toast';
import { Item, useControleEstoque } from '@/hooks/useControleEstoque';
import { faBars } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import React, { useEffect } from 'react';
import {
    FlatList,
    Platform,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

// ... (Constantes permanecem as mesmas)
const MAX_WIDTH_WEB = 900; 
const HEADER_HEIGHT = Platform.OS === 'web' ? 70 : 60 + (Platform.OS === 'android' ? StatusBar.currentHeight || 20 : 0);

const Estoque: React.FC = () => {
    // ... (Desestruturação do hook permanece a mesma)
    const {
        items,
        itemName,
        quantidade,
        editarItem,
        sidebarOpen,
        userName,
        userRole,
        flatListRef,
        justificativa,
        data,
        setItemName,
        setJustificativa,
        setQuantidade,
        setData,
        toggleSidebar,
        closeSidebar,
        handleAddItem,
        handleUpdateItem,
        handleCancelEdit,
    } = useControleEstoque();

    // Configurar scroll na web
    useEffect(() => {
        if (Platform.OS === 'web') {
            // Garantir que o body permite scroll
            const body = document.body;
            const html = document.documentElement;
            
            body.style.overflow = 'auto';
            body.style.height = '100%';
            html.style.overflow = 'auto';
            html.style.height = '100%';
            
            return () => {
                // Cleanup se necessário
                body.style.overflow = '';
                body.style.height = '';
                html.style.overflow = '';
                html.style.height = '';
            };
        }
    }, []);

    const renderItem = ({ item }: { item: Item }) => (
        // ... (renderItem permanece o mesmo)
        <View style={styles.itemContainer}>
            
            {!item.iconName && (
                <View style={styles.itemIconPlaceholder}>
                    <Text style={styles.itemIconText}>📋</Text>
                </View>
            )}

            <View style={styles.itemInfoContent}>
                <Text style={styles.itemNameText}>{item.nome}</Text>
                <Text style={styles.itemQuantityText}>Quantidade: {item.quantidade}</Text>
                <Text style={styles.itemQuantityText}>Justificativa: {item.justificativa}</Text>
                <Text style={styles.itemQuantityText}>Data: {item.data}</Text>
            </View>
            
            <View style={styles.itemActionButtons}>
                
            </View>
        </View>
    );

    // Estrutura do formulário (Componente interno para evitar repetição)
    const FormContent = (
        <>
            <View style={styles.formContainer}>
                <Text style={styles.formTitle}>{editarItem ? 'Editar Item' : 'Adicionar Novo Item'}</Text>
               
                <FormField
                        label="Nome do item"
                        value={itemName}
                        onChangeText={setItemName}
                        placeholder="Nome do Item"
                        required
                />
                 
                <FormField
                        label="Justificativa"
                        value={justificativa}
                        onChangeText={setJustificativa}
                        placeholder="Justificativa"
                        required
                />
                
                <FormField
                        label="Data"
                        value={data}
                        onChangeText={setData}
                        placeholder="DD/MM/AAAA"
                        mask="date" 
                        required
                />
                
                <FormField
                        label="Quantidade"
                        value={quantidade}
                        onChangeText={(text) => setQuantidade(text.replace(/[^0-9]/g, ''))}
                        placeholder="Numeric"
                        required
                />
                
                <View style={styles.formButtons}>
                    <TouchableOpacity
                        style={[styles.actionButton, Platform.OS === 'web' && { cursor: 'pointer' as any }]}
                        onPress={editarItem ? handleUpdateItem : handleAddItem}
                    >
                        <Text style={styles.buttonText}>
                            {editarItem ? 'Salvar' : 'Adicionar Item'}
                        </Text>
                    </TouchableOpacity>
                    {editarItem && (
                        <TouchableOpacity style={[styles.cancelButton, Platform.OS === 'web' && { cursor: 'pointer' as any }]} onPress={handleCancelEdit}>
                            <Text style={styles.buttonText}>Cancelar</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
            
            {items.length === 0 ? (
                <Text style={styles.noItemsText}>Nenhum item cadastrado ainda.</Text>
            ) : (
                <FlatList
                    ref={flatListRef}
                    data={items}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={styles.listContent}
                    style={styles.flatList}
                    showsVerticalScrollIndicator={Platform.OS === 'web'}
                    scrollEnabled={Platform.OS !== 'web'}
                    keyboardShouldPersistTaps="handled"
                    nestedScrollEnabled={false}
                    bounces={Platform.OS !== 'web'}
                />
            )}
        </>
    );

    return (
        <SafeAreaView style={styles.container}>
            {Platform.OS === 'web' && <ToastContainer />}
            <View style={styles.header}>
                <TouchableOpacity style={styles.menuButton} onPress={toggleSidebar}>
                    <FontAwesomeIcon icon={faBars} size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.title}>Estoque</Text>
            </View>

            <Sidebar 
                isOpen={sidebarOpen} 
                onClose={closeSidebar}
                userName={userName}
                userRole={userRole as 'SUPERVISOR' | 'COORDENADOR' | 'TECNICO'} 
                onNavigateToSection={() => {}}
            />

            <View style={styles.mainContent}>
                {FormContent}
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f0f0f0',
    },
    mainContent: {
        flex: 1,
        alignSelf: 'center',
        width: '100%',
        maxWidth: MAX_WIDTH_WEB,
        paddingHorizontal: Platform.OS === 'web' ? 20 : 15,
        marginTop: Platform.OS === 'web' ? HEADER_HEIGHT : 0,
    },

    header: {
        backgroundColor: '#1c348e',
        paddingVertical: 15,
        alignItems: 'center',
        justifyContent: 'space-between',
        flexDirection: 'row',
        ...(Platform.OS === 'web' ? {
            position: 'fixed',
            top: 0,
            width: '100%',
            zIndex: 1000,
            paddingTop: 15,
        } : {
            paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight! + 10 : 10,
        }),
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#fff',
        flex: 1,
        textAlign: 'center',
    },
    menuButton: {
        paddingLeft: 15,
    },
    formContainer: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 10,
        marginHorizontal: Platform.OS !== 'web' ? 15 : 0, 
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 3,
    },
    formTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 15,
        textAlign: 'center',
        color: '#333',
    },
    formButtons: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: 10,
    },
    actionButton: {
        backgroundColor: '#1c348e',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 8,
        alignItems: 'center',
        flex: 1,
        marginHorizontal: 5,
        ...(Platform.OS === 'web' && { cursor: 'pointer' as any }),
    },
    cancelButton: {
        backgroundColor: '#dc3545',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 8,
        alignItems: 'center',
        flex: 1,
        marginHorizontal: 5,
        ...(Platform.OS === 'web' && { cursor: 'pointer' as any }),
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    listContent: {
        paddingHorizontal: Platform.OS !== 'web' ? 15 : 0, 
        paddingBottom: 20,
        flexGrow: 1, 
    },
    itemContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderColor: '#e5c228',
        borderWidth: 1,
        paddingVertical: 15,
        paddingHorizontal: 15,
        borderRadius: 10,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 3,
        elevation: 2,
        width: '100%', 
    },
    itemIconPlaceholder: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#e0f0ff',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    itemIconText: {
        fontSize: 24,
    },
    itemInfoContent: {
        flex: 1,
        justifyContent: 'center',
    },
    itemNameText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 2,
    },
    itemQuantityText: {
        fontSize: 15,
        color: '#666',
    },
    itemActionButtons: {
        flexDirection: 'row',
        marginLeft: 15,
    },
    noItemsText: {
        textAlign: 'center',
        fontSize: 16,
        color: '#666',
        marginTop: 20,
    },
    flatList: {
        width: '100%',
        flex: Platform.OS === 'web' ? 1 : undefined,
    },
});

export default Estoque;