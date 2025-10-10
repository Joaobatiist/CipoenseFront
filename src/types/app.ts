export interface Evento {
  id: string;
  data: string;
  descricao: string;
  professor: string;
  local: string;
  horario: string;
}

export interface ComunicadoResponse {
  id: number;
  assunto: string;
  mensagem: string;
  dataEnvio: string;
  destinatarios: DestinatarioResponse[];
  remetente: RemetenteResponse;
}

export interface DestinatarioResponse {
  id: number;
  nome: string;
  tipo: string;
}

export interface RemetenteResponse {
  id: number;
  nome: string;
  tipo: string;
}

export interface AnaliseIa {
  id: number;
  atletaEmail: string;
  prompt: string;
  respostaIA: string;
  dataAnalise: string;
}

export interface AnaliseApiResponse {
  atletaEmail: string;
  nomeAtleta: string;
  analiseDesempenhoIA: string;
  dataAnalise?: string;
}

export interface ApiResponse<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}
