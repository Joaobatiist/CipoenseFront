import { CadastroAtletaData, CadastroFuncionarioData } from './types';

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// Funções de formatação simples
export const formatCPF = (cpf: string): string => {
  return cpf.replace(/\D/g, '');
};
export const formatRG = (rg: string): string => {
  return rg.replace(/\D/g, '');
};
export const formatPhone = (phone: string): string => {
  return phone.replace(/\D/g, '');
};

export const formatDate = (date: string): string => {
  // Remove caracteres não numéricos
  const numbersOnly = date.replace(/\D/g, '');
  
  // Se tem 8 dígitos (DDMMYYYY), formatar para YYYY-MM-DD (ISO format)
  if (numbersOnly.length === 8) {
    const day = numbersOnly.substring(0, 2);
    const month = numbersOnly.substring(2, 4);
    const year = numbersOnly.substring(4, 8);
    return `${year}-${month}-${day}`; // Formato ISO que o Spring Boot espera
  }
  
  // Se não conseguir formatar, retornar como está
  return date;
};

// Validações simplificadas - sempre retornam válido
export const validateAtletaData = (data: CadastroAtletaData): ValidationResult => {
  return {
    isValid: true,
    errors: []
  };
};

export const validateFuncionarioData = (data: CadastroFuncionarioData): ValidationResult => {
  return {
    isValid: true,
    errors: []
  };
};
