import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

if(!API_BASE_URL){
    console.warn('Variável de ambiente EXPO_API_BASE_URL não definida!!')
}

const Api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
    headers: {
        'Content-Typer': 'application/json',
    },
});

Api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    } catch (error) {
      console.error('Erro ao obter token para o interceptor:', error);
      return Promise.reject(error);
    }
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor
Api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (axios.isAxiosError(error) && error.response) {
      const { status } = error.response;

      if (status === 401 || status === 403) {
        console.warn('Requisição não autorizada ou proibida. Token pode estar inválido ou expirado.');
        Alert.alert('Sessão Expirada', 'Sua sessão expirou ou não é válida. Por favor, faça login novamente.');
        await AsyncStorage.removeItem('jwtToken');
      
      } else if (status >= 500) {
        Alert.alert('Erro do Servidor', 'Ocorreu um erro interno no servidor. Tente novamente mais tarde.');
      }
    } else {
      Alert.alert('Erro de Conexão', 'Não foi possível conectar ao servidor. Verifique sua conexão com a internet.');
    }
    return Promise.reject(error);
  }
);

export default Api;