import Ionicons from '@expo/vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

// Define as interfaces para as formações e a mensagem
interface Atleta {
  id: number;
  apelido: string;
  posicao: string;
}

interface Formation {
  id: number;
  name: string;
  role: string;
  top: number;
  left: number;
}

interface FormationsData {
  [key: string]: Formation[];
}

// Cria e configura a instância do Axios para ser usada no aplicativo
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Adiciona um interceptor de requisição para incluir o token JWT do AsyncStorage
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token.trim()}`;
      }
      return config;
    } catch (error) {
      console.error('Erro ao configurar token de autorização:', error);
      return Promise.reject(error);
    }
  },
  (error) => {
    return Promise.reject(error);
  }
);


// Componente principal da aplicação
export default function App() {
  // Use o estado para armazenar os dados das formações, a formação atual, o jogador selecionado e os estados da interface.
  const [formations, setFormations] = useState<FormationsData | null>(null);
  const [currentFormation, setCurrentFormation] = useState<string>('4-4-2');
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(null);
  const [isFormationModalVisible, setFormationModalVisible] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Efeito para buscar dados da sua API em Spring Boot
  const fetchFormations = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get<FormationsData>('/formations');
      const data = response.data;

      if (data && !data[currentFormation]) {
          setCurrentFormation(Object.keys(data)[0]);
      }
      
      setFormations(data);
    } catch (err) {
      console.error('Erro ao conectar com a API:', err);
      setError('Falha ao carregar formações. Verifique se a API está online.');
      Alert.alert('Erro de Conexão', 'Não foi possível carregar as formações. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  }, [currentFormation]);
  
  useEffect(() => {
    fetchFormations();
  }, [fetchFormations]);

  // Manipulador para quando um jogador é selecionado.
  const handlePlayerSelect = (playerId: number) => {
    setSelectedPlayerId(playerId);
    const selectedPlayer = formations?.[currentFormation]?.find(p => p.id === playerId);
    if (selectedPlayer) {
        Alert.alert(
          'Jogador Selecionado',
          `Você selecionou ${selectedPlayer.name}.`
        );
    }
  };

  // Manipulador para quando uma nova formação é selecionada do modal.
  const handleFormationSelect = (formationKey: string) => {
    setCurrentFormation(formationKey);
    setFormationModalVisible(false);
  };
  
  // Mostra um estado de carregamento enquanto as formações estão sendo buscadas.
  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1c348e" />
        <Text style={styles.loadingText}>Carregando formações...</Text>
      </View>
    );
  }
  
  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchFormations}>
          <Text style={styles.retryButtonText}>Tentar Novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  return (
    <SafeAreaView style={styles.container}>
      {/* Seção do cabeçalho com botões */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => setFormationModalVisible(true)}
          style={[styles.headerButton, styles.formationButton]}
        >
          <Text style={styles.headerButtonText}>Formação: {currentFormation}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.headerButton}
          disabled
        >
          <Text style={styles.headerButtonText}>Subdivisão</Text>
        </TouchableOpacity>
      </View>

      {/* Contêiner do campo de futebol */}
      <View style={styles.pitchContainer}>
        {/* Linhas e marcações do campo */}
        <View style={styles.halfwayLine}></View>
        <View style={styles.centerCircle}></View>
        <View style={styles.penaltyArea}></View>
        <View style={styles.goalArea}></View>

        {/* Ícones dos jogadores mapeados a partir dos dados das formações */}
        {formations && formations[currentFormation]?.map((player) => (
          <View 
            key={player.id} 
            style={[
              styles.playerContainer, 
              { left: `${player.left}%`, top: `${player.top}%` }
            ]}
          >
            <TouchableOpacity
              onPress={() => handlePlayerSelect(player.id)}
              style={[
                styles.playerIcon,
                selectedPlayerId === player.id && styles.playerIconSelected,
              ]}
            ></TouchableOpacity>
            <Text style={styles.playerName}>{player.name}</Text>
            <Text style={styles.playerRole}>{player.role}</Text>
          </View>
        ))}
      </View>

      {/* Modal de seleção de formação */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isFormationModalVisible}
        onRequestClose={() => setFormationModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity style={styles.modalCloseButton} onPress={() => setFormationModalVisible(false)}>
              <Ionicons name="close-circle-outline" size={30} color="#666" />
            </TouchableOpacity>
            <Text style={styles.modalHeader}>Selecione uma Formação</Text>
            <View style={styles.modalFormationList}>
              {formations && Object.keys(formations).map((formationKey) => (
                <TouchableOpacity
                  key={formationKey}
                  onPress={() => handleFormationSelect(formationKey)}
                  style={[
                    styles.modalFormationButton,
                    currentFormation === formationKey && styles.modalFormationButtonSelected
                  ]}
                >
                  <Text style={[
                    styles.modalFormationButtonText,
                    currentFormation === formationKey && styles.modalFormationButtonTextSelected
                  ]}>
                    {formationKey}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f4f8',
    padding: 16,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#555',
  },
  errorText: {
    color: '#e74c3c',
    fontSize: 17,
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: 'bold',
  },
  retryButton: {
    backgroundColor: '#3498db',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
    marginTop: 10,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#d1d5db',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  headerButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    backgroundColor: '#fff',
    borderColor: '#d1d5db',
    borderWidth: 1,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  formationButton: {
    marginRight: 8,
  },
  headerButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  pitchContainer: {
    flex: 1,
    backgroundColor: '#16a34a',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#fff',
    position: 'relative',
    overflow: 'hidden',
  },
  halfwayLine: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#fff',
  },
  centerCircle: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: '#fff',
    transform: [{ translateX: -50 }, { translateY: -50 }],
  },
  penaltyArea: {
    position: 'absolute',
    bottom: 0,
    left: '50%',
    width: '60%',
    height: '25%',
    borderWidth: 2,
    borderColor: '#fff',
    borderBottomWidth: 0,
    transform: [{ translateX: -50 }],
  },
  goalArea: {
    position: 'absolute',
    bottom: 0,
    left: '50%',
    width: '30%',
    height: '12%',
    borderWidth: 2,
    borderColor: '#fff',
    borderBottomWidth: 0,
    transform: [{ translateX: -50 }],
  },
  playerContainer: {
    position: 'absolute',
    alignItems: 'center',
  },
  playerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#d1d5db',
    borderWidth: 2,
    borderColor: '#6b7280',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playerIconSelected: {
    borderColor: '#3b82f6',
    transform: [{ scale: 1.1 }],
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 5,
    elevation: 5,
  },
  playerName: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
  },
  playerRole: {
    fontSize: 10,
    color: '#d1d5db',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  modalCloseButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 1,
    padding: 5,
  },
  modalHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  modalFormationList: {
    marginTop: 10,
  },
  modalFormationButton: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#e5e7eb',
    marginBottom: 10,
    alignItems: 'center',
  },
  modalFormationButtonSelected: {
    backgroundColor: '#2563eb',
  },
  modalFormationButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
  },
  modalFormationButtonTextSelected: {
    color: '#fff',
  },
});
