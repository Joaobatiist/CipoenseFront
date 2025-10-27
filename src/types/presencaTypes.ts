import { JwtPayload } from 'jwt-decode';


export interface CustomJwtPayload extends JwtPayload {
    userType?: string;
    roles?: string[];
    userName?: string;
}

// Estrutura de registro de presença individual no histórico
export interface PresencaRegistro {
  id: string;
  data: string;
  presente: boolean;
  atletaId: string;
  nomeAtleta: string;
}

// Estrutura do Aluno para a tela de registro
export interface Aluno {
  id: string;
  nome: string;
  presente: boolean | null; // true, false ou null (não marcado)
  email?: string;
  subDivisao?: string;
}

// Estrutura de dados para envio à API
export interface PresencaData {
  atletaId: string;
  presente: boolean;
  data: string;
}

// Tipos de navegação (mantido, mas precisa ser ajustado se o arquivo for movido)
export type RootStackParamList = {
  ListaPresenca: undefined;
};

// Modos de visualização
export type ViewMode = 'registro' | 'historico' | 'detalhe';

// Tipo para as presenças agrupadas por data no histórico
export type PresencasAgrupadas = Record<string, PresencaRegistro[]>;