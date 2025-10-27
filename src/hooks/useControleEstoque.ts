import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { jwtDecode, JwtPayload } from 'jwt-decode';
import { useEffect, useState, useRef } from 'react';
import { Alert, Platform, FlatList } from 'react-native';
import { toast } from 'react-toastify';

interface Item {
    id: string;
    nome: string;
    quantidade: number;
    iconName?: string;
}

interface CustomJwtPayload extends JwtPayload {
    userType?: string;
    roles?: string[];
    userName?: string;
}

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

export const useControleEstoque = () => {
    const [items, setItems] = useState<Item[]>([]);
    const [itemName, setItemName] = useState('');
    const [quantidade, setQuantidade] = useState('');
    const [editarItem, setEditarItem] = useState<Item | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [userName, setUserName] = useState('Usuário');
    const [userRole, setUserRole] = useState<'SUPERVISOR' | 'COORDENADOR' | 'TECNICO' | ''>('');
    const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
    const flatListRef = useRef<FlatList<Item>>(null);

    // --- Funções de Autenticação e Token ---

    const getToken = async (): Promise<string | null> => {
        try {
            const token = await AsyncStorage.getItem('jwtToken');
            return token;
        } catch (error) {
            console.error('DEBUG TOKEN (useControleEstoque): Erro ao obter token do AsyncStorage:', error);
            return null;
        }
    };

    const handleAuthError = async (message: string) => {
        await AsyncStorage.removeItem('jwtToken');
        if (Platform.OS === 'web') {
            toast.error(message);
        } else {
            Alert.alert('Sessão Expirada', message, [{ text: 'OK', onPress: () => router.replace('../../') }]);
        }
        router.replace('../../');
    };

    // --- Efeitos ---

    // 1. Carregar dados do usuário do JWT ao montar
    useEffect(() => {
        const loadUserData = async () => {
            try {
                const token = await getToken();
                if (token) {
                    const decoded = jwtDecode<CustomJwtPayload>(token);
                    setUserName(decoded.userName || 'Usuário');
                    setUserRole(decoded.roles?.[0] as any || ''); // Cast para o tipo esperado
                }
            } catch (error) {
                console.error('Erro ao decodificar token:', error);
            }
        };
        loadUserData();
    }, []);

    // 2. Carregar itens do estoque ao montar
    useEffect(() => {
        fetchItems();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // 3. Navegação por teclado na web
    useEffect(() => {
        if (Platform.OS === 'web') {
            const handleKeyPress = (event: KeyboardEvent) => {
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

    // --- Funções de Lógica de Negócio (CRUD) ---

    const fetchItems = async () => {
        const token = await getToken();

        if (!token) {
            console.warn('FETCH_ITEMS: Token não encontrado.');
            handleAuthError('Sessão Expirada. Você precisa estar logado para acessar o estoque. Por favor, faça login novamente.');
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
                console.error('FETCH_ITEMS: Erro ao buscar itens:', response.status, errorText);

                if (response.status === 401 || response.status === 403) {
                    handleAuthError('Sua sessão expirou ou você não tem permissão para acessar o estoque. Faça login novamente.');
                    return;
                }
                throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
            }
            const data: Item[] = await response.json();
            setItems(data);
            console.log('Itens do estoque carregados com sucesso. Total:', data.length);
        } catch (error) {
            console.error('Erro ao buscar itens:', error);
            const errorMsg = `Não foi possível carregar os itens. ${error instanceof Error ? error.message : 'Verifique a conexão com o servidor.'}`;
            if (Platform.OS === 'web') {
                toast.error(errorMsg);
            } else {
                Alert.alert('Erro', errorMsg);
            }
        }
    };

    const handleAddItem = async () => {
        if (!itemName || !quantidade) {
            const msg = 'Por favor, preencha o nome do item e a quantidade.';
            Platform.OS === 'web' ? toast.error(msg) : Alert.alert('Por favor', msg);
            return;
        }

        const token = await getToken();
        if (!token) {
            handleAuthError('Você não está logado para adicionar itens.');
            return;
        }

        const tempId = Date.now().toString();
        const newQuantidade = parseInt(quantidade, 10);
        const newItemLocal: Item = { id: tempId, nome: itemName, quantidade: newQuantidade };

        // 1. Atualização Otimista (Local)
        setItems((prevItems) => [...prevItems, newItemLocal]);
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
        setItemName('');
        setQuantidade('');
        const successMsg = 'Item Adicionado. O item foi adicionado à lista.';
        Platform.OS === 'web' ? toast.success(successMsg) : Alert.alert('Item Adicionado', successMsg);

        // 2. Sincronização (Backend)
        try {
            const newItemForBackend = { nome: newItemLocal.nome, quantidade: newQuantidade };

            const response = await fetch(`${API_BASE_URL}/api/estoque`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(newItemForBackend),
            });

            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    handleAuthError('Sessão Expirada. Faça login novamente.');
                    return;
                }
                const errorText = await response.text();
                throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
            }

            const addedItemBackend: Item = await response.json();
            // 3. Atualiza o ID temporário com o ID real do backend
            setItems((prevItems) =>
                prevItems.map((item) => (item.id === tempId ? addedItemBackend : item))
            );
        } catch (error) {
            console.error('Erro ao adicionar item ao backend:', error);
            const errorMsg = 'Erro de Sincronização. O item foi adicionado à sua lista, mas não foi possível sincronizá-lo com o servidor. Tente novamente mais tarde.';
            Platform.OS === 'web' ? toast.error(errorMsg) : Alert.alert('Erro de Sincronização', errorMsg);
        }
    };

    const handleUpdateItem = async () => {
        if (!editarItem || !itemName || !quantidade) {
            const msg = 'Nenhum item selecionado para edição ou campos vazios.';
            Platform.OS === 'web' ? toast.warning('Aviso. ' + msg) : Alert.alert('Aviso', msg);
            return;
        }

        const token = await getToken();
        if (!token) {
            handleAuthError('Você não está logado para atualizar itens.');
            return;
        }

        const newQuantidade = parseInt(quantidade, 10);
        const updatedItemLocal: Item = { ...editarItem, nome: itemName, quantidade: newQuantidade };

        // 1. Atualização Otimista (Local)
        setItems((prevItems) =>
            prevItems.map((item) => (item.id === updatedItemLocal.id ? updatedItemLocal : item))
        );
        setItemName('');
        setQuantidade('');
        setEditarItem(null);
        const successMsg = 'Item Atualizado. O item foi atualizado na lista.';
        Platform.OS === 'web' ? toast.success(successMsg) : Alert.alert('Item Atualizado', successMsg);

        // 2. Sincronização (Backend)
        try {
            const itemForUpdateBackend = { id: updatedItemLocal.id, nome: updatedItemLocal.nome, quantidade: updatedItemLocal.quantidade };

            const response = await fetch(`${API_BASE_URL}/api/estoque/${updatedItemLocal.id}`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(itemForUpdateBackend),
            });

            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    handleAuthError('Sessão Expirada. Faça login novamente.');
                    return;
                }
                const errorText = await response.text();
                throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
            }

            // Opcional: Atualiza com os dados exatos retornados do backend, se houver
            const returnedUpdatedItemBackend: Item = await response.json();
            setItems((prevItems) =>
                prevItems.map((item) => (item.id === returnedUpdatedItemBackend.id ? returnedUpdatedItemBackend : item))
            );
        } catch (error) {
            console.error('Erro ao atualizar item no backend:', error);
            const errorMsg = 'Erro de Sincronização. O item foi atualizado na sua lista, mas não foi possível sincronizá-lo com o servidor. Tente novamente mais tarde.';
            Platform.OS === 'web' ? toast.error(errorMsg) : Alert.alert('Erro de Sincronização', errorMsg);
        }
    };

    const handleDeleteItem = async (id: string) => {
        const executarExclusao = async () => {
            const token = await getToken();
            if (!token) {
                handleAuthError('Você não está logado para deletar itens.');
                return;
            }

            // 1. Exclusão Otimista (Local)
            setItems((prevItems) => prevItems.filter((item) => item.id !== id));
            const successMsg = 'Item Excluído. O item foi removido da sua lista.';
            Platform.OS === 'web' ? toast.success(successMsg) : Alert.alert('Item Excluído', successMsg);

            // 2. Sincronização (Backend)
            try {
                const response = await fetch(`${API_BASE_URL}/api/estoque/${id}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` },
                });

                if (!response.ok) {
                    if (response.status === 401 || response.status === 403) {
                        handleAuthError('Sessão Expirada. Faça login novamente.');
                        return;
                    }
                    const errorText = await response.text();
                    throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
                }
            } catch (error) {
                console.error('Erro ao deletar item no backend:', error);
                const errorMsg = 'Erro de Sincronização. Não foi possível sincronizar a exclusão com o servidor. O item pode reaparecer em um próximo carregamento.';
                Platform.OS === 'web' ? toast.error(errorMsg) : Alert.alert('Erro de Sincronização', errorMsg);
                
            }
        };

        // Lógica de Confirmação Diferenciada (Web vs Mobile)
        if (Platform.OS === 'web') {
            if (pendingDeleteId === id) {
                executarExclusao();
                setPendingDeleteId(null);
            } else {
                setPendingDeleteId(id);
                toast.warning('⚠️ Tem certeza? Clique em "Excluir" novamente para confirmar', {
                    autoClose: 2000,
                    onClose: () => setPendingDeleteId(null) // Limpa o estado quando o toast fechar
                });
            }
        } else {
            Alert.alert(
                'Confirmação',
                'Tem certeza que deseja excluir este item?',
                [
                    { text: 'Cancelar', style: 'cancel' },
                    { text: 'Sim, Excluir', onPress: executarExclusao, style: 'destructive' },
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
    
    const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
    const closeSidebar = () => setSidebarOpen(false); 

    return {
        // Estados
        items,
        itemName,
        quantidade,
        editarItem,
        sidebarOpen,
        userName,
        userRole,
        pendingDeleteId,
        flatListRef,
        
        // Setters
        setItemName,
        setQuantidade,
        
        // Funções
        toggleSidebar,
        closeSidebar,
        handleAddItem,
        handleUpdateItem,
        handleDeleteItem,
        handleEditClick,
        handleCancelEdit,
        fetchItems,
    };
};

// Exporta o tipo Item para uso no componente
export type { Item };