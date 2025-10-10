import React, { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';
import { CadastroForm } from '../../components/forms/CadastroForm';

interface CustomJwtPayload {
  userType?: string;
  roles?: string[];
}

export default function CadastroAtletaScreen() {
  const [userRole, setUserRole] = useState<string>('TECNICO');

  useEffect(() => {
    const getUserRole = async () => {
      try {
        const token = await AsyncStorage.getItem('jwtToken');
        if (token) {
          const decoded = jwtDecode<CustomJwtPayload>(token);
          setUserRole(decoded.userType || 'TECNICO');
        }
      } catch (error) {
        console.error('Erro ao decodificar token:', error);
      }
    };
    
    getUserRole();
  }, []);

  return (
    <CadastroForm 
      type="atleta" 
      userRole={userRole as 'SUPERVISOR' | 'COORDENADOR' | 'TECNICO'}
    />
  );
}
