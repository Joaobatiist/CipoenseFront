import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { Alert } from 'react-native';

class ApiService {
  private instance: AxiosInstance;

  constructor() {
    const baseURL = process.env.EXPO_PUBLIC_API_BASE_URL;
    
    if (!baseURL) {
      console.warn('Variável de ambiente EXPO_PUBLIC_API_BASE_URL não definida!');
    }

    this.instance = axios.create({
      baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.instance.interceptors.request.use(
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
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.instance.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (axios.isAxiosError(error) && error.response) {
          const { status } = error.response;

          if (status === 401 || status === 403) {
            console.warn('Requisição não autorizada. Token pode estar inválido.');
            Alert.alert(
              'Sessão Expirada',
              'Sua sessão expirou. Por favor, faça login novamente.'
            );
            await AsyncStorage.removeItem('jwtToken');
          } else if (status >= 500) {
            Alert.alert(
              'Erro do Servidor',
              'Ocorreu um erro interno. Tente novamente mais tarde.'
            );
          }
        }
        return Promise.reject(error);
      }
    );
  }

  // HTTP Methods
  public get<T = any>(url: string, p0?: { params: { data: string; }; }): Promise<AxiosResponse<T>> {
    return this.instance.get<T>(url, { params: p0?.params });
  }

  public post<T = any>(url: string, data?: any): Promise<AxiosResponse<T>> {
    return this.instance.post<T>(url, data);
  }

  public put<T = any>(url: string, data?: any): Promise<AxiosResponse<T>> {
    return this.instance.put<T>(url, data);
  }

  public delete<T = any>(url: string): Promise<AxiosResponse<T>> {
    return this.instance.delete<T>(url);
  }

  public patch<T = any>(url: string, data?: any): Promise<AxiosResponse<T>> {
    return this.instance.patch<T>(url, data);
  }
}

export const apiService = new ApiService();
export default apiService;
