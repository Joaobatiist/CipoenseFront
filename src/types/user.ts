export interface Atleta {
  id: number;
  nomeCompleto: string;
  email: string;
  telefone?: string;
  idade?: number;
  posicao?: string;
  altura?: number;
  peso?: number;
}

export interface Funcionario {
  id: number;
  nome: string;
  email: string;
  telefone?: string;
  cargo: string;
  
}

export interface PerfilUsuario {
  id: number;
  nome: string;
  email: string;
  telefone?: string;
  foto?: string;
  ativo: boolean;
}
