export interface CadastroAtletaData {
  nome: string;
  email: string;
  senha: string;
  dataNascimento: string;
  cpf: string;
  subDivisao: string;
  massa: string;
  posicao: string;
  isencao: boolean;
  roles?: string[];
  responsavel: {
    nome: string;
    telefone: string;
    email: string;
    cpf: string;
  };
}

export interface CadastroFuncionarioData {
  nome: string;
  email: string;
  senha: string;
  dataNascimento: string;
  cpf: string;
  telefone: string;
  roles: string;
}

export interface DropdownItem {
  id?: number;
  label: string;
  value: string;
}

export interface FormFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  secureTextEntry?: boolean;
  mask?: 'cpf' | 'phone' | 'date';
  required?: boolean;
}

export interface DropdownFieldProps {
  label: string;
  value: string | null;
  items: DropdownItem[];
  onValueChange: (value: string | null) => void;
  placeholder?: string;
  zIndex?: number;
  zIndexInverse?: number;
  required?: boolean;
}

export type CadastroType = 'atleta' | 'funcionario';

export interface CadastroFormProps {
  type: CadastroType;
  initialData?: Partial<CadastroAtletaData | CadastroFuncionarioData>;
  onSubmit?: (data: CadastroAtletaData | CadastroFuncionarioData) => Promise<void>;
  userRole?: 'SUPERVISOR' | 'COORDENADOR' | 'TECNICO';
  hideHeader?: boolean;
}
