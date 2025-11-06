
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AtletaProfileDto, AtletaUpdateDto, API_URL } from '../types/atletasTypes';

// Função utilitária para obter headers de autenticação
const getAuthHeaders = async () => {
    const token = await AsyncStorage.getItem('jwtToken');
    if (!token) {
        throw new Error('Token de autenticação não encontrado.');
    }
    return { Authorization: `Bearer ${token}` };
};

export const atletaService = {
    /** 1. Busca a lista completa de atletas */
    fetchAtletas: async (): Promise<AtletaProfileDto[]> => {
        const headers = await getAuthHeaders();
        const response = await axios.get<AtletaProfileDto[]>(`${API_URL}/api/supervisor/atletas`, { headers });
        console.log(response.data);
        return response.data;
        
    },

    /** 2. Salva as edições do perfil de um atleta */
    updateAtleta: async (atletaId: string, updateDTO: AtletaUpdateDto): Promise<void> => {
        const headers = await getAuthHeaders();
        // Garante que a data está no formato esperado pelo backend (AAAA-MM-DD)
        const formattedDTO = {
            ...updateDTO,
            dataNascimento: updateDTO.dataNascimento?.split('T')[0] || updateDTO.dataNascimento,
        };
        await axios.put(
            `${API_URL}/api/supervisor/atletas/${atletaId}`,
            formattedDTO,
            { headers }
        );
    },

    /** 3. Exclui um atleta */
    deleteAtleta: async (atletaId: string): Promise<void> => {
        const headers = await getAuthHeaders();
        await axios.delete(`${API_URL}/api/supervisor/atletas/deletar/${atletaId}`, { headers });
    },

    /** 4. Envia um novo PDF */
    // O tipo 'file' foi simplificado no service, o tratamento de File/DocumentPicker é feito no hook.
    uploadPdf: async (atletaId: string, file: File | { uri: string, name: string, type: string }): Promise<{ documentoPdfBase64: string, documentoPdfContentType: string }> => {
        const headers = await getAuthHeaders();
        const formData = new FormData();
        
        if (typeof file === 'object' && 'uri' in file) {
             // Mobile (RN)
             formData.append('file', file as any);
        } else {
             // Web
             formData.append('file', file as File);
        }

        const response = await axios.post<string>(
            `${API_URL}/api/supervisor/atletas/${atletaId}/documento-pdf`,
            formData,
            {
                headers: {
                    ...headers,
                    'Content-Type': 'multipart/form-data',
                },
            }
        );
        
        return {
            documentoPdfBase64: response.data,
            documentoPdfContentType: "application/pdf"
        };
    },

    /** 5. Remove o PDF principal */
    deleteMainPdf: async (atletaId: string): Promise<void> => {
        const headers = await getAuthHeaders();
        await axios.delete(`${API_URL}/api/supervisor/atletas/${atletaId}/documento-pdf`, { headers });
    },
};