import { JwtPayload } from 'jwt-decode';


export const COLORS = {
    primary: '#1c348e', 
    secondary: '#e5c228', 
    background: '#f0f4f8', 
    white: '#ffffff',
    textPrimary: '#2c3e50',
    textSecondary: '#555',
    danger: '#e74c3c',
    border: '#b0c4de',
};

// --- Configuração da API (Centralizada) ---
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;



// Token JWT customizado
export interface CustomJwtPayload extends JwtPayload {
    userType?: string;
    roles?: string[];
    userName?: string;
    sub?: string;
    userId?: number;
}

// Atleta (Usado para listagem e seleção)
export interface Atleta {
    id: number;
    nomeCompleto: string;
    subDivisao: string;
    posicao?: string; // Posição está em 'realizarRelatorios.tsx' e é útil aqui
}

// Avaliação de Desempenho (Nomes harmonizados para camelCase)
export interface RelatorioDesempenho {
    id: number;
    controle: number;
    recepcao: number;
    dribles: number;
    passe: number;
    tiro: number;
    cruzamento: number;
    giro: number;
    manuseioDeBola: number; // manuseioBola -> manuseioDeBola
    forcaChute: number;
    gerenciamentoDeGols: number; // GerenciamentoGols -> gerenciamentoDeGols
    jogoOfensivo: number;
    jogoDefensivo: number;
    [key: string]: number; // Permite acesso dinâmico
}

// Avaliação Tático/Psicológico (Nomes harmonizados para camelCase)
export interface RelatorioTaticoPsicologico {
    id: number;
    esportividade: number;
    disciplina: number;
    foco: number;
    confianca: number;
    tomadaDecisoes: number;
    compromisso: number;
    lideranca: number;
    trabalhoEmEquipe: number; // trabalhoEquipe -> trabalhoEmEquipe
    atributosFisicos: number;
    atuarSobPressao: number; // capacidadeSobPressao -> atuarSobPressao
    [key: string]: number; // Permite acesso dinâmico
}

// Avaliação Geral Completa (Estrutura principal)
export interface AvaliacaoGeral {
    id: number;
    atletaId: number;
    nomeAtleta: string;
    userName: string; // Nome do avaliador
    dataAvaliacao: string; // Formato 'dd-MM-yyyy' na listagem, mas 'YYYY-MM-DD' na API
    periodoTreino: string;
    subDivisao: string;
    posicao?: string;
    feedbackTreinador: string;
    feedbackAvaliador: string;
    pontosFortes: string;
    pontosFracos: string;
    areasAprimoramento: string;
    metasObjetivos: string;
    relatorioDesempenho: RelatorioDesempenho | null;
    relatorioTaticoPsicologico: RelatorioTaticoPsicologico | null;
}

// DTO para Criação/Edição (apenas os campos necessários)
export type AvaliacaoGeralForm = Omit<AvaliacaoGeral, 'id' | 'nomeAtleta' | 'relatorioDesempenho' | 'relatorioTaticoPsicologico'> & {
    relatorioDesempenho: Omit<RelatorioDesempenho, 'id'>;
    relatorioTaticoPsicologico: Omit<RelatorioTaticoPsicologico, 'id'>;
};