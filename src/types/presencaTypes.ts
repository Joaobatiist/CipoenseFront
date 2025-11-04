// Arquivo: presencaTypes.ts (CORRIGIDO)

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
  eventoId: string;
  // O FRONTEND espera 'descricaoEvento', mas o BACKEND pode enviar 'eventoDescricao' no histórico.
  descricaoEvento: string; 
}

// Estrutura de um Evento (para a lista de escolha)
export interface Evento {
  id: string;
  data: string;
  descricao: string;
  local: string;
  horario: string;
  subDivisao: string;
}

// ATUALIZADO: Estrutura do Aluno / Resposta da Lista de Presença por Evento
// O frontend usa 'presente', o backend envia 'presenca'. O mapeamento será feito na API.
export interface Aluno {
  id: string | null; // ID da Presença (pode ser null se não marcada)
  atletaId: string; 
  nome: string; 
  presente: boolean | null; // <-- O Frontend usa este nome
  eventoId: string;
  descricaoEvento: string; // <-- O Frontend usa este nome
}

// ATUALIZADO: Estrutura de dados para envio à API (mantido)
export interface PresencaData {
  atletaId: string;
  presente: boolean;
  eventoId: string;
}

// ... (Restante dos tipos)
export type ViewMode = 'registro' | 'historico' | 'detalhe';
export type PresencasAgrupadas = Record<string, PresencaRegistro[]>;