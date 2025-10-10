import { useEffect, useState } from 'react';
import { authService } from '../services';
import { CustomJwtPayload, UserRole } from '../types';

interface UseAuthReturn {
  isAuthenticated: boolean;
  userInfo: CustomJwtPayload | null;
  userRole: UserRole | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuth = (): UseAuthReturn => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [userInfo, setUserInfo] = useState<CustomJwtPayload | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async (): Promise<void> => {
    try {
      setIsLoading(true);
      const authenticated = await authService.isAuthenticated();
      setIsAuthenticated(authenticated);

      if (authenticated) {
        const token = await authService.getToken();
        if (token) {
          const info = authService.getUserInfoFromToken(token);
          const role = authService.getUserRoleFromToken(token);
          setUserInfo(info);
          setUserRole(role);
        }
      }
    } catch (error) {
      console.error('Erro ao verificar status de autenticação:', error);
      setIsAuthenticated(false);
      setUserInfo(null);
      setUserRole(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<void> => {
    try {
      await authService.login({ email, senha: password });
      await checkAuthStatus();
    } catch (error) {
      throw error;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await authService.logout();
      setIsAuthenticated(false);
      setUserInfo(null);
      setUserRole(null);
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  return {
    isAuthenticated,
    userInfo,
    userRole,
    isLoading,
    login,
    logout,
  };
};
