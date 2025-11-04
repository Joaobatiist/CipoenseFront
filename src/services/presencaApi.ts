// Arquivo: presencaApi.ts (FINAL E CORRIGIDO)

import Api from '@/Config/Api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Aluno, Evento, PresencaData, PresencaRegistro } from '../types/presencaTypes';

const getAuthHeaders = async () => {
    const token = await AsyncStorage.getItem('jwtToken');
    if (!token) {
        throw new Error('Token de autenticação não encontrado.');
    }
    return { Authorization: `Bearer ${token}` };
};

// Interface para o dado bruto que o backend envia (Registro)
interface AlunoBackendResponse {
    id: string | null;
    atletaId: string;
    nome: string;
    presenca: boolean; // <--- O nome do campo do backend
    eventoId: string;
    eventoDescricao: string; // <--- O nome do campo do backend
}

// Interface para o dado bruto que o backend envia (Histórico)
interface HistoricoBackendResponse {
    id: string;
    data: string;
    presente: boolean; // Presumindo que o Histórico use 'presente' ou 'presenca'
    atletaId: string;
    nomeAtleta: string;
    eventoId: string;
    eventoDescricao: string; // <--- O nome do campo do backend (Histórico)
}

export const presencaService = {
    fetchEventosDisponiveis: async (): Promise<Evento[]> => {
        const headers = await getAuthHeaders();
        const response = await Api.get<Evento[]>('/api/eventos', { headers });
        return response.data;
    },
    
    // CORREÇÃO 1: Mapeamento de 'presenca' para 'presente' e 'eventoDescricao' para 'descricaoEvento'
    fetchAlunosForEvent: async (eventoId: string): Promise<Aluno[]> => { 
        const headers = await getAuthHeaders();
        const response = await Api.get<AlunoBackendResponse[]>(`/api/presenca/evento/${eventoId}`, { headers });
        
        // Mapeamento CRÍTICO para o front-end entender os dados
        return response.data.map(item => ({
            id: item.id,
            atletaId: item.atletaId,
            nome: item.nome,
            presente: item.presenca ?? null, // Mapeia 'presenca' (backend) para 'presente' (frontend)
            eventoId: item.eventoId,
            descricaoEvento: item.eventoDescricao, // Mapeia 'eventoDescricao' (backend) para 'descricaoEvento' (frontend)
        }));
    },

    // CORREÇÃO 2: Mapeamento da descrição do evento para o histórico
    fetchHistoricoPresencas: async (): Promise<PresencaRegistro[]> => {
        const headers = await getAuthHeaders();
        // Usamos HistoricoBackendResponse[] no GET
        const response = await Api.get<HistoricoBackendResponse[]>('/api/presenca/historico', { headers });
        
        // Mapeamento CRÍTICO para o Histórico
        return response.data.map(item => ({
            id: item.id,
            data: item.data,
            presente: item.presente,
            atletaId: item.atletaId,
            nomeAtleta: item.nomeAtleta,
            eventoId: item.eventoId,
            descricaoEvento: item.eventoDescricao, // Mapeia 'eventoDescricao' (backend) para 'descricaoEvento' (frontend)
        }));
    },

    salvarPresenca: async (presencasParaEnviar: PresencaData[]): Promise<void> => {
        const headers = await getAuthHeaders();
        await Api.post('/api/presenca/registrar', presencasParaEnviar, { headers });
    },
};