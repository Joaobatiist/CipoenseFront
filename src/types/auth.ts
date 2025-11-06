import { JwtPayload } from 'jwt-decode';

export interface CustomJwtPayload extends JwtPayload {
  sub?: string;
  userId?: number;
  userType?: string;
  userName?: string;
  roles?: string[];
}

export interface LoginCredentials {
  email: string;
  senha: string;
}

export interface AuthResponse {
  jwt: string;
  user?: {
    id: number;
    nome: string;
    email: string;
    role: string;
  };
}

export type UserRole = 'ATLETA' | 'TECNICO' | 'COORDENADOR' | 'SUPERVISOR';
