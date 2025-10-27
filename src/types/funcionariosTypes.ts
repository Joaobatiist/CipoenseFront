import { Platform, StatusBar } from 'react-native';
import { JwtPayload } from 'jwt-decode';


export const COLORS = {
  primary: '#0E2A5C', 
  secondary: '#FDCB01', 
  white: '#FFFFFF',
  textPrimary: '#333333', 
  textSecondary: '#555555', 
  danger: '#DC3545', 
  success: '#28A745',
  info: '#17A2B8',
  background: '#F0F2F5', 
  cardBackground: '#FFFFFF',
  borderColor: '#E0E0E0',
  headerColor: '#1c348e', 
};

export const STATUS_BAR_HEIGHT = Platform.OS === 'android' ? StatusBar.currentHeight || 20 : 0;
export const HEADER_HEIGHT = Platform.OS === 'web' ? 70 : 60 + STATUS_BAR_HEIGHT; 

// Opções disponíveis para as roles dos funcionários
export const ROLES_OPTIONS = [
  { label: 'Técnico', value: 'TECNICO' },
  { label: 'Supervisor', value: 'SUPERVISOR' },
  { label: 'Coordenador', value: 'COORDENADOR' },
];

export interface CustomJwtPayload extends JwtPayload {
    userType?: string;
    roles?: string[];
    userName?: string;
}

export type FuncionarioDto = {
  id: number;
  cpf: string;
  nome: string;
  email: string;
  dataNascimento: string;
  telefone: string;
  roles: string; 
  uniqueId: string;
};