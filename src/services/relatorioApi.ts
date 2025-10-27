import axios, { isAxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
    AvaliacaoGeral, 
    Atleta, 
    AvaliacaoGeralForm, 
    API_BASE_URL 
} from '../types/RelatorioTypes';


if (!API_BASE_URL) {
    console.error("ERRO: Variável de ambiente EXPO_PUBLIC_API_BASE_URL não definida!");
    // Pode adicionar um alerta/toast aqui se necessário
}

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(
    async (config) => {
        try {
            const token = await AsyncStorage.getItem('jwtToken');
            if (token) {
                config.headers.Authorization = `Bearer ${token.trim()}`;
            }
            return config;
        } catch (error) {
            console.error('Erro ao configurar token de autorização:', error);
            return config;
        }
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Função auxiliar para tratamento de erros
const handleApiError = (error: unknown, defaultMessage: string): string => {
    console.error(defaultMessage, error);
    if (isAxiosError(error) && error.message.includes("Network Error")) {
        return "Erro de conexão. Verifique se o servidor está rodando e acessível.";
    }
    return defaultMessage;
};

// --- 2. Funções de Fetch/CRUD (Centralizadas) ---

// 2.1. Listar Avaliações Históricas (exibirAvaliacaoGeral.tsx)
export const fetchHistoricalEvaluations = async (): Promise<AvaliacaoGeral[]> => {
    try {
        const response = await api.get<AvaliacaoGeral[]>('/api/relatoriogeral/listar');
        if (!Array.isArray(response.data)) {
            throw new TypeError("Os dados da lista de avaliações estão em formato inválido.");
        }
        return response.data;
    } catch (error) {
        throw new Error(handleApiError(error, "Não foi possível carregar a lista de avaliações."));
    }
};

// 2.2. Buscar Avaliação por ID (exibirAvaliacaoGeral.tsx)
export const fetchAvaliacaoGeralById = async (id: number): Promise<AvaliacaoGeral> => {
    try {
        const response = await api.get<AvaliacaoGeral>(`/api/relatoriogeral/buscarporid/${id}`);
        return response.data;
    } catch (error) {
        throw new Error(handleApiError(error, `Erro ao buscar AvaliacaoGeral pelo ID ${id}.`));
    }
};

// 2.3. Excluir Avaliação (exibirAvaliacaoGeral.tsx)
export const deleteAvaliacaoGeral = async (id: number): Promise<void> => {
    try {
        await api.delete(`api/relatoriogeral/deletarporid/${id}`);
    } catch (error) {
        throw new Error(handleApiError(error, "Erro ao excluir relatório."));
    }
};

// 2.4. Cadastrar/Criar Avaliação (realizarRelatorios.tsx)
export const createAvaliacaoGeral = async (data: AvaliacaoGeralForm): Promise<AvaliacaoGeral> => {
    try {
        const response = await api.post<AvaliacaoGeral>('/api/relatoriogeral/cadastrar', data);
        return response.data;
    } catch (error) {
        throw new Error(handleApiError(error, "Erro ao cadastrar a avaliação."));
    }
};

// 2.5. Buscar Lista de Atletas (Ambos os arquivos)
export const fetchAthletesList = async (): Promise<Atleta[]> => {
    try {
        const response = await api.get<Atleta[]>('/api/atletas/listagem');
        if (!Array.isArray(response.data)) {
            throw new TypeError("Os dados da lista de atletas estão em formato inválido.");
        }
        return response.data;
    } catch (error) {
        throw new Error(handleApiError(error, "Erro ao buscar lista de atletas."));
    }
};

// 2.6. Buscar Subdivisões (realizarRelatorios.tsx)
export const fetchSubdivisoes = async (): Promise<string[]> => {
    try {
        const response = await api.get<string[]>('/api/atletas/subdivisoes');
        return response.data;
    } catch (error) {
        throw new Error(handleApiError(error, "Erro ao buscar subdivisões."));
    }
};

// 2.7. Buscar Posições (realizarRelatorios.tsx)
export const fetchPosicoes = async (): Promise<string[]> => {
    try {
        const response = await api.get<string[]>('/api/atletas/posicoes');
        return response.data;
    } catch (error) {
        throw new Error(handleApiError(error, "Erro ao buscar posições."));
    }
};