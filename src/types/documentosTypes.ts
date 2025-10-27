// src/types/documentosTypes.ts

import * as DocumentPicker from 'expo-document-picker';
import { JwtPayload } from 'jwt-decode';
import { Platform, StatusBar } from 'react-native';

// Assumindo a importação correta da variável de ambiente
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

// Definindo cores consistentes
export const COLORS_DOCUMENTOS = {
    primary: '#0E2A5C',         
    secondary: '#FDCB01',       
    white: '#FFFFFF',
    textPrimary: '#333333',     
    textSecondary: '#555555',   
    danger: '#DC3545',          
    success: '#28A745',
    background: '#F0F2F5',      
    cardBackground: '#FFFFFF',
    borderColor: '#E0E0E0',
    headerColor: '#1c348e',     
    info: '#17A2B8',
};

export const STATUS_BAR_HEIGHT = Platform.OS === 'android' ? StatusBar.currentHeight || 20 : 0;
export const HEADER_HEIGHT = Platform.OS === 'web' ? 70 : 60 + STATUS_BAR_HEIGHT; 


export interface CustomJwtPayload extends JwtPayload {
    userType?: string;
    roles?: string[];
    userName?: string;
}

// Interface para o documento retornado pela API
export interface DocumentoPdf {
    id: number;
    descricao: string;
    urlDocumento: string; // URL para download/visualização
    nomeArquivo: string;
    dataUpload: string; // Data no formato ISO
}

// Tipo para o estado de formulário (inclui o arquivo local)
export type DocumentoForm = {
    descricao: string;
    nomeArquivo: string;
    pdfFile: DocumentPicker.DocumentPickerResult | null;
};