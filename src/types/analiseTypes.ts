import { JwtPayload } from 'jwt-decode';

//  variável de ambiente 
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

// Definindo algumas cores usadas nos estilos para centralizar
export const COLORS_ANALISE = {
    primary: '#1c348e',          
    secondary: '#004A8F',       
    background: '#f0f4f7',      
    textPrimary: '#2c3e50',     
    textSecondary: '#7f8c8d',   
    error: '#e74c3c',          
    errorBackground: '#ffeaea', 
    white: '#fff',
};

export interface CustomJwtPayload extends JwtPayload {
    userType?: string;
    roles?: string[];
    userName?: string;
}

export interface Atleta {
    id: number;
    nomeCompleto: string;
    email: string;
}

export interface AnaliseIa {
    id: number;
    atletaEmail: string;
    prompt: string;
    respostaIA: string;
    dataAnalise: string;
}