import Api from '@/Config/Api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PresencaData, PresencaRegistro, Aluno } from '../types/presencaTypes';

const getAuthHeaders = async () => {
    const token = await AsyncStorage.getItem('jwtToken');
    if (!token) {
        throw new Error('Token de autenticação não encontrado.');
    }
    return { Authorization: `Bearer ${token}` };
};

export const presencaService = {
    // Busca a lista de alunos e seus status de presença para um dia específico
    fetchAlunosForDay: async (dateString: string): Promise<Aluno[]> => {
        const headers = await getAuthHeaders();
        const response = await Api.get<any[]>(`/api/presenca/atletas?data=${dateString}`, { headers });

        const alunosCarregados: Aluno[] = response.data.map((aluno: any) => ({
            id: aluno.id,
            nome: aluno.nome,
            presente: aluno.presenca !== undefined ? aluno.presenca : null,
            email: aluno.email,
            subDivisao: aluno.subDivisao,
        }));

        return alunosCarregados;
    },

    // Busca o histórico completo de presenças
    fetchHistoricoPresencas: async (): Promise<PresencaRegistro[]> => {
        const headers = await getAuthHeaders();
        const response = await Api.get<PresencaRegistro[]>('/api/presenca/historico', { headers });
        return response.data;
    },

    // Envia o registro de presenças para a API
    salvarPresenca: async (presencasParaEnviar: PresencaData[]): Promise<void> => {
        const headers = await getAuthHeaders();
        await Api.post('/api/presenca/registrar', presencasParaEnviar, {
            headers: { 'Content-Type': 'application/json', ...headers },
        });
    },
};