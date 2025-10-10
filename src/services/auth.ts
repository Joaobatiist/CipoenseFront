import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { jwtDecode } from 'jwt-decode';
import { Alert } from 'react-native';

import { ROLE_ROUTES } from '../constants';
import { AuthResponse, CustomJwtPayload, LoginCredentials, UserRole } from '../types';
import { apiService } from './api';

class AuthService {
  private readonly TOKEN_KEY = 'jwtToken';

  async login(credentials: LoginCredentials): Promise<void> {
    try {
      const response = await apiService.post<AuthResponse>('/auth/login', credentials);
      const { jwt } = response.data;

      if (!jwt) {
        throw new Error('Token JWT não recebido');
      }

      await this.storeToken(jwt);
      const userRole = this.getUserRoleFromToken(jwt);
      
      Alert.alert('Sucesso', 'Login realizado com sucesso!');
      this.navigateToUserHome(userRole);
      
    } catch (error) {
      console.error('Erro no login:', error);
      Alert.alert('Erro', 'Credenciais inválidas. Tente novamente.');
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.TOKEN_KEY);
      router.replace('/');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  }

  async getToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(this.TOKEN_KEY);
    } catch (error) {
      console.error('Erro ao obter token:', error);
      return null;
    }
  }

  async isAuthenticated(): Promise<boolean> {
    const token = await this.getToken();
    if (!token) return false;

    try {
      const decoded = jwtDecode<CustomJwtPayload>(token);
      const now = Date.now() / 1000;
      return decoded.exp ? decoded.exp > now : false;
    } catch {
      return false;
    }
  }

  getUserRoleFromToken(token: string): UserRole | null {
    try {
      const decoded = jwtDecode<CustomJwtPayload>(token);
      const role = decoded.roles?.[0] as UserRole;
      return role || null;
    } catch {
      return null;
    }
  }

  getUserInfoFromToken(token: string): CustomJwtPayload | null {
    try {
      return jwtDecode<CustomJwtPayload>(token);
    } catch {
      return null;
    }
  }

  private async storeToken(token: string): Promise<void> {
    await AsyncStorage.setItem(this.TOKEN_KEY, token);
  }

  private navigateToUserHome(role: UserRole | null): void {
    if (!role) {
      console.warn('Role não reconhecido:', role);
      Alert.alert('Aviso', 'Seu perfil não foi reconhecido. Redirecionando...');
      router.replace('/');
      return;
    }

    const route = ROLE_ROUTES[role];
    if (route) {
      router.replace(route as any);
    } else {
      router.replace('/');
    }
  }
}

export const authService = new AuthService();
export default authService;
