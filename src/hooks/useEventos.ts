import { apiService } from '@/services';
import { Evento } from '@/types';
import { useEffect, useState } from 'react';
import { Alert } from 'react-native';

interface UseEventosReturn {
  eventos: Evento[];
  loading: boolean;
  addEvento: (evento: Omit<Evento, 'id'>) => Promise<void>;
  updateEvento: (id: string, evento: Omit<Evento, 'id'>) => Promise<void>;
  deleteEvento: (id: string) => Promise<void>;
  refreshEventos: () => Promise<void>;
}

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
      Alert.alert('Erro', 'Não foi possível carregar a agenda de treinos.');
      setEventos([]);
    } finally {
      setLoading(false);
    }
  };

  const addEvento = async (eventoData: Omit<Evento, 'id'>): Promise<void> => {
    try {
      setLoading(true);
      const formattedDate = new Date(eventoData.data + 'T00:00:00').toISOString().split('T')[0];
      
      const novoEvento = {
        ...eventoData,
        data: formattedDate,
      };

      const response = await apiService.post<Evento>('/api/eventos', novoEvento);
      
      const formattedEvento: Evento = {
        ...response.data,
        data: new Date(response.data.data + 'T00:00:00').toLocaleDateString('pt-BR'),
      };

      setEventos(prev => [...prev, formattedEvento]);
      Alert.alert('Sucesso', 'Treino adicionado com sucesso!');
    } catch (error) {
      console.error('Erro ao adicionar evento:', error);
      Alert.alert('Erro', 'Não foi possível adicionar o treino.');
      throw error;
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
      Alert.alert('Sucesso', 'Treino atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar evento:', error);
      Alert.alert('Erro', 'Não foi possível atualizar o treino.');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const deleteEvento = async (id: string): Promise<void> => {
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
