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

// Validação de Atleta
export const validateAtletaData = (data: CadastroAtletaData): ValidationResult => {
  const errors: ValidationError[] = [];

  // Validações obrigatórias
  if (!data.nome || data.nome.trim() === '') {
    errors.push({ field: 'nome', message: 'Nome é obrigatório' });
  }

  if (!data.email || data.email.trim() === '') {
    errors.push({ field: 'email', message: 'Email é obrigatório' });
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push({ field: 'email', message: 'Email inválido' });
  }

  if (!data.senha || data.senha.trim() === '') {
    errors.push({ field: 'senha', message: 'Senha é obrigatória' });
  } else if (data.senha.length < 6) {
    errors.push({ field: 'senha', message: 'Senha deve ter no mínimo 6 caracteres' });
  }

  if (!data.dataNascimento || data.dataNascimento.trim() === '') {
    errors.push({ field: 'dataNascimento', message: 'Data de nascimento é obrigatória' });
  }

  if (!data.cpf || data.cpf.replace(/\D/g, '').length !== 11) {
    errors.push({ field: 'cpf', message: 'CPF inválido (deve conter 11 dígitos)' });
  }

  if (!data.subDivisao || data.subDivisao.trim() === '') {
    errors.push({ field: 'subDivisao', message: 'Subdivisão é obrigatória' });
  }

  if (!data.massa || data.massa.trim() === '') {
    errors.push({ field: 'massa', message: 'Massa é obrigatória' });
  }

  if (!data.posicao || data.posicao.trim() === '') {
    errors.push({ field: 'posicao', message: 'Posição é obrigatória' });
  }

  // Validações do responsável
  if (!data.responsavel.nome || data.responsavel.nome.trim() === '') {
    errors.push({ field: 'responsavel.nome', message: 'Nome do responsável é obrigatório' });
  }

  if (!data.responsavel.telefone || data.responsavel.telefone.replace(/\D/g, '').length < 10) {
    errors.push({ field: 'responsavel.telefone', message: 'Telefone do responsável inválido' });
  }

  if (!data.responsavel.email || data.responsavel.email.trim() === '') {
    errors.push({ field: 'responsavel.email', message: 'Email do responsável é obrigatório' });
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.responsavel.email)) {
    errors.push({ field: 'responsavel.email', message: 'Email do responsável inválido' });
  }

  if (!data.responsavel.cpf || data.responsavel.cpf.replace(/\D/g, '').length !== 11) {
    errors.push({ field: 'responsavel.cpf', message: 'CPF do responsável inválido' });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Validação de Funcionário
export const validateFuncionarioData = (data: CadastroFuncionarioData): ValidationResult => {
  const errors: ValidationError[] = [];

  // Validações obrigatórias
  if (!data.nome || data.nome.trim() === '') {
    errors.push({ field: 'nome', message: 'Nome é obrigatório' });
  }

  if (!data.email || data.email.trim() === '') {
    errors.push({ field: 'email', message: 'Email é obrigatório' });
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push({ field: 'email', message: 'Email inválido' });
  }

  if (!data.senha || data.senha.trim() === '') {
    errors.push({ field: 'senha', message: 'Senha é obrigatória' });
  } else if (data.senha.length < 6) {
    errors.push({ field: 'senha', message: 'Senha deve ter no mínimo 6 caracteres' });
  }

  if (!data.dataNascimento || data.dataNascimento.trim() === '') {
    errors.push({ field: 'dataNascimento', message: 'Data de nascimento é obrigatória' });
  }

  if (!data.cpf || data.cpf.replace(/\D/g, '').length !== 11) {
    errors.push({ field: 'cpf', message: 'CPF inválido (deve conter 11 dígitos)' });
  }

  if (!data.telefone || data.telefone.replace(/\D/g, '').length < 10) {
    errors.push({ field: 'telefone', message: 'Telefone inválido' });
  }

  if (!data.role || data.role.trim() === '') {
    errors.push({ field: 'role', message: 'Cargo é obrigatório' });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};
