// app/Tarefas/ControleEstoque.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  Alert,
  TouchableOpacity,
  SafeAreaView, // Importado para garantir a área segura
  Platform, // Importado para estilos específicos de plataforma
  StatusBar // Importado para obter a altura da barra de status no Android
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

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
  }, []);

  const fetchItems = async () => {
    console.log('FETCH_ITEMS (Estoque): Iniciando busca de itens do estoque...');
    const token = await getToken();

    if (!token) {
      console.warn('FETCH_ITEMS (Estoque): Token não encontrado. Redirecionando para o login.');
      Alert.alert(
        'Sessão Expirada',
        'Você precisa estar logado para acessar o estoque. Por favor, faça login novamente.',
        [{ text: 'OK', onPress: () => router.replace('../../') }]
      );
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
          Alert.alert(
            'Sessão Expirada',
            'Sua sessão expirou ou você não tem permissão para acessar o estoque. Faça login novamente.',
            [{ text: 'OK', onPress: () => router.replace('../../') }]
          );
          await AsyncStorage.removeItem('jwtToken');
        }
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }
      const data: Item[] = await response.json();
      setItems(data);
      console.log('FETCH_ITEMS (Estoque): Itens do estoque carregados com sucesso. Total:', data.length);
    } catch (error) {
      console.error('Erro ao buscar itens:', error);
      Alert.alert('Erro', `Não foi possível carregar os itens. ${error instanceof Error ? error.message : 'Verifique a conexão com o servidor.'}`);
    }
  };

  const handleAddItem = async () => {
    if (!itemName || !quantidade) {
      Alert.alert('Por favor', 'Preencha o nome do item e a quantidade.');
      return;
    }

    const token = await getToken();
    if (!token) {
      Alert.alert('Erro de Autenticação', 'Você não está logado para adicionar itens.', [{ text: 'OK', onPress: () => router.replace('../../') }]);
      return;
    }

    const tempId = Date.now().toString();
    const newItemLocal: Item = {
      id: tempId,
      nome: itemName,
      quantidade: parseInt(quantidade, 10),
    };

    setItems((prevItems) => [...prevItems, newItemLocal]);

    setItemName('');
    setQuantidade('');
    Alert.alert('Item Adicionado', 'O item foi adicionado à lista.');

    try {
      const newItemForBackend = {
        nome: newItemLocal.nome,
        quantidade: newItemLocal.quantidade,
      };

      console.log('DEBUG (handleAddItem): Dados enviados para o backend (POST):', JSON.stringify(newItemForBackend));

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
      Alert.alert(
        'Erro de Sincronização',
        'O item foi adicionado à sua lista, mas não foi possível sincronizá-lo com o servidor. Tente novamente mais tarde.'
      );
    }
  };

  const handleUpdateItem = async () => {
    if (!editarItem || !itemName || !quantidade) {
      Alert.alert('Aviso', 'Nenhum item selecionado para edição ou campos vazios.');
      return;
    }

    const token = await getToken();
    if (!token) {
      Alert.alert('Erro de Autenticação', 'Você não está logado para atualizar itens.', [{ text: 'OK', onPress: () => router.replace('../../') }]);
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
    Alert.alert('Item Atualizado', 'O item foi atualizado na lista.');

    try {
      const itemForUpdateBackend = {
        id: updatedItemLocal.id,
        nome: updatedItemLocal.nome,
        quantidade: updatedItemLocal.quantidade,
      };

      console.log('DEBUG (handleUpdateItem): Dados enviados para o backend (PUT):', JSON.stringify(itemForUpdateBackend));

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
      Alert.alert(
        'Erro de Sincronização',
        'O item foi atualizado na sua lista, mas não foi possível sincronizá-lo com o servidor. Tente novamente mais tarde.'
      );
    }
  };

  const handleDeleteItem = async (id: string) => {
    Alert.alert(
      'Confirmar Exclusão',
      'Tem certeza que deseja excluir este item?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Excluir',
          onPress: async () => {
            const token = await getToken();
            if (!token) {
              Alert.alert('Erro de Autenticação', 'Você não está logado para excluir itens.', [{ text: 'OK', onPress: () => router.replace('../../') }]);
              return;
            }

            setItems((prevItems) => prevItems.filter((item) => item.id !== id));
            Alert.alert('Item Excluído', 'O item foi removido da sua lista.');

            try {
              const response = await fetch(`${API_BASE_URL}/api/estoque/${id}`, {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${token}`,
                },
              });

              if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                  Alert.alert('Sessão Expirada', 'Faça login novamente.', [{ text: 'OK', onPress: () => router.replace('../../') }]);
                  await AsyncStorage.removeItem('jwtToken');
                }
                const errorText = await response.text();
                throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
              }
            } catch (error) {
              console.error('Erro ao deletar item no backend:', error);
              Alert.alert(
                'Erro de Sincronização',
                'Não foi possível sincronizar a exclusão com o servidor. O item pode reaparecer em um próximo carregamento.'
              );
            }
          },
        },
      ]
    );
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
        <TouchableOpacity style={styles.editButton} onPress={() => handleEditClick(item)}>
          <Text style={styles.actionButtonText}>✏️</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteItem(item.id)}>
          <Text style={styles.actionButtonText}>🗑️</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Estoque</Text>
      </View>

      <View style={styles.formContainer}>
        <Text style={styles.formTitle}>{editarItem ? 'Editar Item' : 'Adicionar Novo Item'}</Text>
        <TextInput
          style={styles.input}
          placeholder="Nome do Item"
          value={itemName}
          onChangeText={setItemName}
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
            style={styles.actionButton}
            onPress={editarItem ? handleUpdateItem : handleAddItem}
          >
            <Text style={styles.buttonText}>
              {editarItem ? 'Salvar' : 'Adicionar Item'}
            </Text>
          </TouchableOpacity>
          {editarItem && (
            <TouchableOpacity style={styles.cancelButton} onPress={handleCancelEdit}>
              <Text style={styles.buttonText}>Cancelar</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {items.length === 0 ? (
        <Text style={styles.noItemsText}>Nenhum item cadastrado ainda.</Text>
      ) : (
        <FlatList
          data={items}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f0f0',
  },
  header: {
    backgroundColor: '#1c348e',
    paddingVertical: 15,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'space-between',
    flexDirection: 'row',
    marginBottom: 20,
    // Estilo condicional para Android para evitar a barra de status
    ...Platform.select({
      android: {
        paddingTop: StatusBar.currentHeight,
      },
    }),
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
  },
  backButton: {
    padding: 5,
  },
  formContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    
    marginHorizontal: 0,
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
  },
  cancelButton: {
    backgroundColor: '#dc3545',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  listContent: {
    paddingHorizontal: 15,
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
});

export default Estoque;