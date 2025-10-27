import { JwtPayload } from 'jwt-decode';
import { Platform, StatusBar } from 'react-native';

// --- Constantes de Tema e Configuração ---
export const COLORS = {
  primary: '#0E2A5C', // Azul Escuro (base do escudo)
  secondary: '#FDCB01', // Amarelo Ouro (destaques)
  white: '#FFFFFF',
  textPrimary: '#333333', // Texto principal
  textSecondary: '#555555', // Texto secundário
  success: '#28a745', // Verde para sucesso
  danger: '#DC3545', // Vermelho para perigo/excluir
  info: '#007BFF', // Azul para ações informativas/botões
  background: '#F0F2F5', // Um cinza claro para o fundo geral
  cardBackground: '#FFFFFF',
  borderColor: '#E0E0E0', 
  blueBorder: '#1E4E8A',
};

// URL da API
export const API_URL = process.env.EXPO_PUBLIC_API_BASE_URL;


export const HEADER_HEIGHT = Platform.OS === 'web' ? 70 : 60 + (Platform.OS === 'android' ? StatusBar.currentHeight || 20 : 0);



export interface CustomJwtPayload extends JwtPayload {
    userType?: string;
    roles?: string[];
    userName?: string;
}

export type AtletaProfileDto = {
  id: string;
  matricula: string;
  nome: string;
  email: string;
  subDivisao: string;
  dataNascimento: string;
  foto: string | null;
  posicao: string;
  contatoResponsavel: string | null;
  isAptoParaJogar: boolean;
  documentoPdfBase64: string | null;
  documentoPdfContentType: string | null;
  documentos?: { id: string; nome: string; url: string; tipo: string }[];
};

// DTO para atualização (campos parciais)
export type AtletaUpdateDto = Partial<AtletaProfileDto>;

// Tipo para os itens do DropDownPicker (assumindo que DropdownItem vem de um arquivo externo)
export type DropdownItem = {
    id: number;
    label: string;
    value: string;
    parentValue?: any;
};


// --- Constantes de Seleção ---

export const POSICOES: DropdownItem[] = [
    { id: 10, label: 'Goleiro', value: 'GOLEIRO' },
    { id: 11, label: 'Zagueiro', value: 'ZAGUEIRO' },
    { id: 12, label: 'Lateral Direito', value: 'LATERAL_DIREITO' },
    { id: 13, label: 'Lateral Esquerdo', value: 'LATERAL_ESQUERDO' },
    { id: 14, label: 'Ala Defensiva Direita', value: 'ALA_DEFENSIVA_DIREITA' },
    { id: 15, label: 'Ala Defensiva Esquerda', value: 'ALA_DEFENSIVA_ESQUERDA' },
    { id: 16, label: 'Volante', value: 'VOLANTE' },
    { id: 17, label: 'Meia Central', value: 'MEIA_CENTRAL' },
    { id: 18, label: 'Meia Atacante', value: 'MEIA_ATACANTE' },
    { id: 19, label: 'Ponta Direita', value: 'PONTA_DIREITA' },
    { id: 20, label: 'Ponta Esquerda', value: 'PONTA_ESQUERDA' },
    { id: 21, label: 'Segundo Atacante', value: 'SEGUNDO_ATACANTE' },
    { id: 22, label: 'Atacante', value: 'ATACANTE' },
];

export const SUBDIVISOES: DropdownItem[] = [
    { id: 1, label: 'Sub-4', value: 'SUB_4' },
    { id: 1, label: 'Sub-5', value: 'SUB_5' },
    { id: 1, label: 'Sub-6', value: 'SUB_6' },
    { id: 1, label: 'Sub-7', value: 'SUB_7' },
    { id: 1, label: 'Sub-8', value: 'SUB_8' },
    { id: 1, label: 'Sub-9', value: 'SUB_9' },
    { id: 1, label: 'Sub-10', value: 'SUB_10' },
    { id: 2, label: 'Sub-11', value: 'SUB_11' },
    { id: 3, label: 'Sub-12', value: 'SUB_12' },
    { id: 4, label: 'Sub-13', value: 'SUB_13' },
    { id: 5, label: 'Sub-14', value: 'SUB_14' },
    { id: 6, label: 'Sub-15', value: 'SUB_15' },
    { id: 7, label: 'Sub-16', value: 'SUB_16' },
    { id: 8, label: 'Sub-17', value: 'SUB_17' },
    { id: 9, label: 'Sub-18', value: 'SUB_18' },
];


// --- Tipos de Navegação ---

export type RootStackParamList = {
  ListaContatosAtletas: undefined;
};