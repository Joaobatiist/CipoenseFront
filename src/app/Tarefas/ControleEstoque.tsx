// app/Tarefas/ControleEstoque.tsx
// Icons removidos - usando Text/Emoji
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Dimensions, // Importado para obter a altura da tela, se necessário (boa prática)
  FlatList,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;
// **CONSTANTE CHAVE PARA WEB RESPONSIVO**
const MAX_WIDTH_WEB = 900; 
const HEADER_HEIGHT = Platform.OS === 'web' ? 70 : 60 + (Platform.OS === 'android' ? StatusBar.currentHeight || 20 : 0);

interface Item {
    id: string;
    nome: string;
    quantidade: number;
    iconName?: string;
}

const Estoque: React.FC = () => {
    const [items, setItems] = useState<Item[]>([]);
    const [itemName, setItemName] = useState('');
    const [quantidade, setQuantidade] = useState('');
    const [editarItem, setEditarItem] = useState<Item | null>(null);
    // FlatList ref deve ter o tipo correto
    const flatListRef = useRef<FlatList<Item>>(null); 

    const getToken = async (): Promise<string | null> => {
        try {
            const token = await AsyncStorage.getItem('jwtToken');
            return token;
        } catch (error) {
            console.error('DEBUG TOKEN (Estoque): Erro ao obter token do AsyncStorage:', error);
            return null;
        }
    };

    useEffect(() => {
        fetchItems();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Navegação por teclado na web (Mantido)
    useEffect(() => {
        if (Platform.OS === 'web') {
            const handleKeyPress = (event: KeyboardEvent) => {
                // ... (lógica de navegação por teclado mantida) ...
                 if (document.activeElement?.tagName === 'INPUT' || 
                    document.activeElement?.tagName === 'TEXTAREA') {
                    return; 
                }

                switch (event.key) {
                    case 'ArrowDown':
                    case 'ArrowUp':
                    case 'PageDown':
                    case 'PageUp':
                    case 'Home':
                    case 'End':
                         event.preventDefault();
                        if (flatListRef.current) {
                            const offset = event.key.includes('Page') ? 400 : 100;
                            if (event.key === 'ArrowUp' || event.key === 'PageUp') {
                                flatListRef.current.scrollToOffset({ offset: -offset, animated: true });
                            } else if (event.key === 'ArrowDown' || event.key === 'PageDown') {
                                flatListRef.current.scrollToOffset({ offset: offset, animated: true });
                            } else if (event.key === 'Home') {
                                flatListRef.current.scrollToOffset({ offset: 0, animated: true });
                            } else if (event.key === 'End') {
                                flatListRef.current.scrollToEnd({ animated: true });
                            }
                        }
                        break;
                }
            };

            document.addEventListener('keydown', handleKeyPress);
            return () => document.removeEventListener('keydown', handleKeyPress);
        }
    }, []);

    const fetchItems = async () => {
        // ... (lógica de fetchItems mantida) ...
        
        const token = await getToken();

        if (!token) {
            console.warn('FETCH_ITEMS (Estoque): Token não encontrado. Redirecionando para o login.');
            if (Platform.OS === 'web') {
                window.alert('Sessão Expirada\nVocê precisa estar logado para acessar o estoque. Por favor, faça login novamente.');
            } else {
                Alert.alert(
                    'Sessão Expirada',
                    'Você precisa estar logado para acessar o estoque. Por favor, faça login novamente.',
                    [{ text: 'OK', onPress: () => router.replace('../../') }]
                );
            }
            router.replace('../../');
            setItems([]);
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/api/estoque`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('FETCH_ITEMS (Estoque): Erro ao buscar itens:', response.status, errorText);

                if (response.status === 401 || response.status === 403) {
                    if (Platform.OS === 'web') {
                        window.alert('Sessão Expirada\nSua sessão expirou ou você não tem permissão para acessar o estoque. Faça login novamente.');
                    } else {
                        Alert.alert(
                            'Sessão Expirada',
                            'Sua sessão expirou ou você não tem permissão para acessar o estoque. Faça login novamente.',
                            [{ text: 'OK', onPress: () => router.replace('../../') }]
                        );
                    }
                    await AsyncStorage.removeItem('jwtToken');
                    router.replace('../../');
                }
                throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
            }
            const data: Item[] = await response.json();
            setItems(data);
            console.error('FETCH_ITEMS (Estoque): Itens do estoque carregados com sucesso. Total:', data.length);
        } catch (error) {
            console.error('Erro ao buscar itens:', error);
            const errorMsg = `Não foi possível carregar os itens. ${error instanceof Error ? error.message : 'Verifique a conexão com o servidor.'}`;
            if (Platform.OS === 'web') {
                window.alert(`Erro\n${errorMsg}`);
            } else {
                Alert.alert('Erro', errorMsg);
            }
        }
    };

    const handleAddItem = async () => {
        // ... (lógica handleAddItem mantida) ...
        if (!itemName || !quantidade) {
            if (Platform.OS === 'web') {
                window.alert('Por favor\nPreencha o nome do item e a quantidade.');
            } else {
                Alert.alert('Por favor', 'Preencha o nome do item e a quantidade.');
            }
            return;
        }

        const token = await getToken();
        if (!token) {
            if (Platform.OS === 'web') {
                window.alert('Erro de Autenticação\nVocê não está logado para adicionar itens.');
            } else {
                Alert.alert('Erro de Autenticação', 'Você não está logado para adicionar itens.', [{ text: 'OK', onPress: () => router.replace('../../') }]);
            }
            router.replace('../../');
            return;
        }

        const tempId = Date.now().toString();
        const newItemLocal: Item = {
            id: tempId,
            nome: itemName,
            quantidade: parseInt(quantidade, 10),
        };

        setItems((prevItems) => [...prevItems, newItemLocal]);

        setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);

        setItemName('');
        setQuantidade('');
        if (Platform.OS === 'web') {
            window.alert('Item Adicionado\nO item foi adicionado à lista.');
        } else {
            Alert.alert('Item Adicionado', 'O item foi adicionado à lista.');
        }

        try {
            const newItemForBackend = {
                nome: newItemLocal.nome,
                quantidade: newItemLocal.quantidade,
            };

            const response = await fetch(`${API_BASE_URL}/api/estoque`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newItemForBackend),
            });

            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    Alert.alert('Sessão Expirada', 'Faça login novamente.', [{ text: 'OK', onPress: () => router.replace('../../') }]);
                    await AsyncStorage.removeItem('jwtToken');
                }
                const errorText = await response.text();
                throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
            }

            const addedItemBackend: Item = await response.json();
            setItems((prevItems) =>
                prevItems.map((item) => (item.id === tempId ? addedItemBackend : item))
            );

        } catch (error) {
            console.error('Erro ao adicionar item ao backend:', error);
            if (Platform.OS === 'web') {
                window.alert('Erro de Sincronização\nO item foi adicionado à sua lista, mas não foi possível sincronizá-lo com o servidor. Tente novamente mais tarde.');
            } else {
                Alert.alert(
                    'Erro de Sincronização',
                    'O item foi adicionado à sua lista, mas não foi possível sincronizá-lo com o servidor. Tente novamente mais tarde.'
                );
            }
        }
    };

    const handleUpdateItem = async () => {
        // ... (lógica handleUpdateItem mantida) ...
        if (!editarItem || !itemName || !quantidade) {
            if (Platform.OS === 'web') {
                window.alert('Aviso\nNenhum item selecionado para edição ou campos vazios.');
            } else {
                Alert.alert('Aviso', 'Nenhum item selecionado para edição ou campos vazios.');
            }
            return;
        }

        const token = await getToken();
        if (!token) {
            if (Platform.OS === 'web') {
                window.alert('Erro de Autenticação\nVocê não está logado para atualizar itens.');
            } else {
                Alert.alert('Erro de Autenticação', 'Você não está logado para atualizar itens.', [{ text: 'OK', onPress: () => router.replace('../../') }]);
            }
            router.replace('../../');
            return;
        }

        const updatedItemLocal: Item = {
            ...editarItem,
            nome: itemName,
            quantidade: parseInt(quantidade, 10),
        };

        setItems((prevItems) =>
            prevItems.map((item) => (item.id === updatedItemLocal.id ? updatedItemLocal : item))
        );

        setItemName('');
        setQuantidade('');
        setEditarItem(null);
        if (Platform.OS === 'web') {
            window.alert('Item Atualizado\nO item foi atualizado na lista.');
        } else {
            Alert.alert('Item Atualizado', 'O item foi atualizado na lista.');
        }

        try {
            const itemForUpdateBackend = {
                id: updatedItemLocal.id,
                nome: updatedItemLocal.nome,
                quantidade: updatedItemLocal.quantidade,
            };

            const response = await fetch(`${API_BASE_URL}/api/estoque/${updatedItemLocal.id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(itemForUpdateBackend),
            });

            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    Alert.alert('Sessão Expirada', 'Faça login novamente.', [{ text: 'OK', onPress: () => router.replace('../../') }]);
                    await AsyncStorage.removeItem('jwtToken');
                }
                const errorText = await response.text();
                throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
            }

            const returnedUpdatedItemBackend: Item = await response.json();
            setItems((prevItems) =>
                prevItems.map((item) => (item.id === returnedUpdatedItemBackend.id ? returnedUpdatedItemBackend : item))
            );

        } catch (error) {
            console.error('Erro ao atualizar item no backend:', error);
            if (Platform.OS === 'web') {
                window.alert('Erro de Sincronização\nO item foi atualizado na sua lista, mas não foi possível sincronizá-lo com o servidor. Tente novamente mais tarde.');
            } else {
                Alert.alert(
                    'Erro de Sincronização',
                    'O item foi atualizado na sua lista, mas não foi possível sincronizá-lo com o servidor. Tente novamente mais tarde.'
                );
            }
        }
    };

    const handleDeleteItem = async (id: string) => {
        // **CORREÇÃO: Usar Alert.alert para Mobile e window.confirm para Web**
        const confirmar = Platform.OS === 'web' 
            ? window.confirm('Tem certeza que deseja excluir este item?')
            : true; // No mobile, o Alert.alert será usado abaixo

        const executarExclusao = async () => {
            const token = await getToken();
            if (!token) {
                if (Platform.OS === 'web') {
                    window.alert('Erro de Autenticação\nVocê não está logado para deletar itens.');
                } else {
                    Alert.alert('Erro de Autenticação', 'Você não está logado para deletar itens.', [{ text: 'OK', onPress: () => router.replace('../../') }]);
                }
                router.replace('../../');
                return;
            }
                        
            // Exclusão local imediata para feedback rápido
            setItems((prevItems) => prevItems.filter((item) => item.id !== id));
            if (Platform.OS === 'web') {
                window.alert('Item Excluído\nO item foi removido da sua lista.');
            } else {
                Alert.alert('Item Excluído', 'O item foi removido da sua lista.');
            }

            try {
                const response = await fetch(`${API_BASE_URL}/api/estoque/${id}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });

                if (!response.ok) {
                    if (response.status === 401 || response.status === 403) {
                        if (Platform.OS === 'web') {
                            window.alert('Sessão Expirada\nFaça login novamente.');
                        } else {
                            Alert.alert('Sessão Expirada', 'Faça login novamente.', [{ text: 'OK', onPress: () => router.replace('../../') }]);
                        }
                        await AsyncStorage.removeItem('jwtToken');
                        router.replace('../../');
                    }
                    const errorText = await response.text();
                    throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
                }
            } catch (error) {
                console.error('Erro ao deletar item no backend:', error);
                if (Platform.OS === 'web') {
                    window.alert('Erro de Sincronização\nNão foi possível sincronizar a exclusão com o servidor. O item pode reaparecer em um próximo carregamento.');
                } else {
                    Alert.alert(
                        'Erro de Sincronização',
                        'Não foi possível sincronizar a exclusão com o servidor. O item pode reaparecer em um próximo carregamento.'
                    );
                }
                // Opcional: Reverter a exclusão local se a exclusão no backend falhar
                // fetchItems(); 
            }
        };

        if (Platform.OS === 'web') {
            // Na web, usa window.confirm
            if (confirmar) {
                executarExclusao();
            }
        } else {
            // No mobile, usa Alert.alert
            Alert.alert(
                'Confirmação',
                'Tem certeza que deseja excluir este item?',
                [
                    {
                        text: 'Cancelar',
                        style: 'cancel',
                    },
                    {
                        text: 'Sim, Excluir',
                        onPress: executarExclusao,
                        style: 'destructive',
                    },
                ]
            );
        }
    };


    const handleEditClick = (item: Item) => {
        setEditarItem(item);
        setItemName(item.nome);
        setQuantidade(item.quantidade.toString());
    };

    const handleCancelEdit = () => {
        setEditarItem(null);
        setItemName('');
        setQuantidade('');
    };

    const renderItem = ({ item }: { item: Item }) => (
        <View style={styles.itemContainer}>
            {/* ... (renderItem mantido) ... */}
            {!item.iconName && (
                <View style={styles.itemIconPlaceholder}>
                    <Text style={styles.itemIconText}>📋</Text>
                </View>
            )}

            <View style={styles.itemInfoContent}>
                <Text style={styles.itemNameText}>{item.nome}</Text>
                <Text style={styles.itemQuantityText}>Quantidade: {item.quantidade}</Text>
            </View>

            <View style={styles.itemActionButtons}>
                <TouchableOpacity style={[styles.editButton, Platform.OS === 'web' && { cursor: 'pointer' as any }]} onPress={() => handleEditClick(item)}>
                    <Text style={styles.actionButtonText}>✏️</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.deleteButton, Platform.OS === 'web' && { cursor: 'pointer' as any }]} onPress={() => handleDeleteItem(item.id)}>
                    <Text style={styles.actionButtonText}>🗑️</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <FontAwesomeIcon icon={faArrowLeft} size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.title}>Estoque</Text>
            </View>

            {/* Container Principal do Conteúdo para centralizar na Web */}
            <View style={styles.mainContent}> 
                <View style={styles.formContainer}>
                    <Text style={styles.formTitle}>{editarItem ? 'Editar Item' : 'Adicionar Novo Item'}</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Nome do Item"
                        value={itemName}
                        onChangeText={setItemName}
                        autoFocus={Platform.OS === 'web'}
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Quantidade"
                        keyboardType="numeric"
                        value={quantidade}
                        onChangeText={setQuantidade}
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
                        style={Platform.OS === 'web' ? styles.webFlatList : undefined}
                        showsVerticalScrollIndicator={Platform.OS === 'web'}
                        showsHorizontalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                        nestedScrollEnabled={true}
                        bounces={Platform.OS !== 'web'}
                    />
                )}
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f0f0f0',
        // Adiciona padding top na web para compensar o header fixo, se necessário
        ...(Platform.OS === 'web' && { paddingTop: HEADER_HEIGHT }),
    },
    // **NOVO ESTILO** - Centraliza e limita o conteúdo na Web
    mainContent: {
        flex: 1,
        alignSelf: 'center', // Centraliza o container
        width: '100%',
        maxWidth: MAX_WIDTH_WEB, // Limita a largura
        paddingHorizontal: Platform.OS === 'web' ? 20 : 0, // Adiciona padding nas laterais na Web
    },
    header: {
        backgroundColor: '#1c348e',
        paddingVertical: 15,
        alignItems: 'center',
        justifyContent: 'space-between',
        flexDirection: 'row',
        // **AJUSTE WEB:** Fixed header para scroll
        ...(Platform.OS === 'web' ? {
            position: 'fixed',
            top: 0,
            width: '100%',
            zIndex: 1000,
            paddingTop: 15,
        } : {
            // Estilo condicional para Android para garantir o StatusBar
            paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight! + 10 : 10,
        }),
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        paddingRight: Platform.OS === 'android' ? 40 : 0,
        color: '#fff',
        flex: 1,
        textAlign: 'center',
    },
    backButton: {
        paddingLeft: 15,
    },
    formContainer: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 10,
        // **AJUSTE WEB/MOBILE:** Remove marginHorizontal fixo, usa paddingHorizontal do mainContent
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
    input: {
        height: 45,
        borderColor: '#1c348e',
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 15,
        marginBottom: 15,
        fontSize: 16,
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
        // **AJUSTE WEB/MOBILE:** Remove paddingHorizontal fixo, usa paddingHorizontal do mainContent
        paddingHorizontal: Platform.OS !== 'web' ? 15 : 0, 
        paddingBottom: 20,
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
        // Garante que o item ocupe 100% da largura do mainContent
        width: '100%', 
    },
    // ... (itemIconPlaceholder, itemIconText, itemInfoContent, etc. mantidos)
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
    editButton: {
        backgroundColor: '#e5c228',
        padding: 8,
        borderRadius: 5,
        marginLeft: 5,
    },
    deleteButton: {
        backgroundColor: '#1c348e',
        padding: 8,
        borderRadius: 5,
        marginLeft: 5,
    },
    actionButtonText: {
        color: '#fff',
        fontSize: 18,
    },
    noItemsText: {
        textAlign: 'center',
        fontSize: 16,
        color: '#666',
        marginTop: 20,
    },
    // Altura máxima do FlatList na Web para permitir o scroll
    webFlatList: {
        maxHeight: Dimensions.get('window').height * 0.75, 
        overflow: 'auto' as any,
    },
});

export default Estoque;