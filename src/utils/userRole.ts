import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode, JwtPayload } from 'jwt-decode';
import React from 'react';

interface CustomJwtPayload extends JwtPayload {
  roles?: string[];
}

/**
 * Obtém o userRole do JWT armazenado no AsyncStorage
 * Retorna o mesmo formato usado no login: 'SUPERVISOR', 'COORDENADOR', 'TECNICO', 'ATLETA'
 */
export const getUserRoleFromToken = async (): Promise<string | null> => {
  try {
    const token = await AsyncStorage.getItem('jwtToken');
    
    if (!token) {
      console.warn('Token JWT não encontrado no AsyncStorage');
      return null;
    }

    const decodedToken = jwtDecode<CustomJwtPayload>(token);
    console.log('Token decodificado:', decodedToken);

    const userRole = decodedToken.roles && decodedToken.roles.length > 0
      ? decodedToken.roles[0]
      : null;

    console.log('Cargo do usuário extraído:', userRole);
    return userRole;
    
  } catch (error) {
    console.error('Erro ao decodificar token JWT:', error);
    return null;
  }
};

/**
 * Hook personalizado para usar o userRole em componentes
 */
export const useUserRole = () => {
  const [userRole, setUserRole] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const loadUserRole = async () => {
      const role = await getUserRoleFromToken();
      setUserRole(role);
      setLoading(false);
    };

    loadUserRole();
  }, []);

  return { userRole, loading };
};
