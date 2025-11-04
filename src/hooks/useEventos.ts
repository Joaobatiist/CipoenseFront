import { apiService } from '@/services';
import { Evento } from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';
import { useEffect, useState } from 'react';
import { Alert, Platform } from 'react-native';
import { toast } from 'react-toastify';

interface UseEventosReturn {
  eventos: Evento[];
  loading: boolean;
  addEvento: (evento: Omit<Evento, 'id'>) => Promise<void>;
  updateEvento: (id: string, evento: Omit<Evento, 'id'>) => Promise<void>;
  deleteEvento: (id: string) => Promise<void>;
  refreshEventos: () => Promise<void>;
}

const getAuthHeaders = async () => {
  try {
    const token = await AsyncStorage.getItem('jwtToken');
    
    if (!token) {
      throw new Error('Token não encontrado');
    }

    // Verificar se o token ainda é válido
    try {
      const decoded = jwtDecode(token);
      const currentTime = Date.now() / 1000;
      
      if (decoded.exp && decoded.exp < currentTime) {
        await AsyncStorage.removeItem('jwtToken');
        throw new Error('Token expirado');
      }
    } catch (decodeError) {
      await AsyncStorage.removeItem('jwtToken');
      throw new Error('Token inválido');
    }

    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  } catch (error) {
    console.error('Erro ao obter headers de autenticação:', error);
    throw error;
  }
};

export const useEventos = (): UseEventosReturn => {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchEventos = async (): Promise<void> => {
    try {
      setLoading(true);
      const response = await apiService.get<Evento[]>('/api/eventos');
      
      const formattedEventos = response.data.map(event => ({
        ...event,
        data: new Date(event.data + 'T00:00:00').toLocaleDateString('pt-BR'),
      }));
      
      setEventos(formattedEventos);
    } catch (error) {
      console.error('Erro ao buscar eventos:', error);
      if (Platform.OS === 'web') {
        toast.error('Erro. Não foi possível carregar a agenda de treinos.');
      } else {
        Alert.alert('Erro', 'Não foi possível carregar a agenda de treinos.');
      }
      setEventos([]);
    } finally {
      setLoading(false);
    }
  };

  const addEvento = async (eventoData: Omit<Evento, 'id'>): Promise<void> => {
    try {
      setLoading(true);
      
      const headers = await getAuthHeaders();
      
      const response = await apiService.post<Evento>('/api/eventos', eventoData, { headers });
      
      if (response.status === 201 || response.status === 200) {
        await fetchEventos(); // Recarregar lista
        // Não retorna nada para manter assinatura Promise<void>
      }

    } catch (error: any) {
      console.error('Erro ao adicionar evento:', error);
      
      if (error.response?.status === 403) {
        // Token inválido - redirecionar para login
        await AsyncStorage.removeItem('jwtToken');
        // navigation.navigate('Login'); // Descomentar se tiver navegação
        throw new Error('Sessão expirada. Faça login novamente.');
      } else if (error.response?.status === 401) {
        throw new Error('Não autorizado para criar eventos.');
      } else if (error.response?.status === 400) {
        throw new Error('Dados do evento inválidos.');
      } else {
        throw new Error('Erro interno do servidor.');
      }
    } finally {
      setLoading(false);
    }
  };

  const updateEvento = async (id: string, eventoData: Omit<Evento, 'id'>): Promise<void> => {
    try {
      setLoading(true);
      const formattedDate = new Date(eventoData.data + 'T00:00:00').toISOString().split('T')[0];
      
      const updatedEvento = {
        id,
        ...eventoData,
        data: formattedDate,
      };

      const response = await apiService.put<Evento>(`/api/eventos/${id}`, updatedEvento);
      
      const formattedEvento: Evento = {
        ...response.data,
        data: new Date(response.data.data + 'T00:00:00').toLocaleDateString('pt-BR'),
      };

      setEventos(prev => prev.map(event => event.id === id ? formattedEvento : event));
      if (Platform.OS === 'web') {
        toast.success('Sucesso! Treino atualizado com sucesso!');
      } else {
        Alert.alert('Sucesso', 'Treino atualizado com sucesso!');
      }
    } catch (error) {
      console.error('Erro ao atualizar evento:', error);
      if (Platform.OS === 'web') {
        toast.error('Erro. Não foi possível atualizar o treino.');
      } else {
        Alert.alert('Erro', 'Não foi possível atualizar o treino.');
      }
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const deleteEvento = async (id: string): Promise<void> => {
    if (Platform.OS === 'web') {
      if (pendingDeleteId === id) {
      
        try {
          setLoading(true);
          await apiService.delete(`/api/eventos/${id}`);
          setEventos(prev => prev.filter(evento => evento.id !== id));
          toast.success('Treino excluído com sucesso!');
        } catch (error) {
          console.error('Erro ao excluir evento:', error);
          toast.error('Erro. Não foi possível excluir o treino.');
        } finally {
          setLoading(false);
          setPendingDeleteId(null);
        }
      } else {
        // Primeira tentativa: solicita confirmação
        setPendingDeleteId(id);
        toast.warning('⚠️ Tem certeza? Clique em "Excluir" novamente para confirmar', {
          autoClose: 2000,
          onClose: () => setPendingDeleteId(null)
        });
      }
    } else {
      // Alert.alert para mobile (iOS/Android)
      Alert.alert(
        'Confirmar Exclusão',
        'Tem certeza que deseja excluir este treino?',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Excluir',
            style: 'destructive',
            onPress: async () => {
              try {
                setLoading(true);
                await apiService.delete(`/api/eventos/${id}`);
                setEventos(prev => prev.filter(evento => evento.id !== id));
                Alert.alert('Sucesso', 'Treino excluído com sucesso!');
              } catch (error) {
                console.error('Erro ao excluir evento:', error);
                Alert.alert('Erro', 'Não foi possível excluir o treino.');
              } finally {
                setLoading(false);
              }
            },
          },
        ]
      );
    }
  };

  const refreshEventos = async (): Promise<void> => {
    await fetchEventos();
  };

  useEffect(() => {
    fetchEventos();
  }, []);

  return {
    eventos,
    loading,
    addEvento,
    updateEvento,
    deleteEvento,
    refreshEventos,
  };
};
