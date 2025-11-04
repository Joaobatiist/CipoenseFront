// src/hooks/useDocumentos.ts

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import * as DocumentPicker from 'expo-document-picker';
import { jwtDecode } from 'jwt-decode';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Platform } from 'react-native';
import { toast } from 'react-toastify';
import {
    API_BASE_URL,
    CustomJwtPayload,
    Documento,
    DocumentoForm,
} from '../types/documentosTypes';

export const useDocumentos = () => {
    // Estado
    const [documentos, setDocumentos] = useState<Documento[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    
    // Usado para edição: se null, é uma criação
    const [selectedDocumento, setSelectedDocumento] = useState<Documento | null>(null);
    const [form, setForm] = useState<DocumentoForm>({ 
        descricao: '', 
        nomeArquivo: '',
        pdfFile: null 
    });

    // Estado de Usuário para Sidebar
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [userName, setUserName] = useState('Usuário');
    const [userRole, setUserRole] = useState<string>('');
    
    // Estado para exclusão dupla confirmação
    const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

    
    // --- Helpers ---
    const getToken = useCallback(async (): Promise<string | null> => {
        try {
            return await AsyncStorage.getItem('jwtToken');
        } catch (error) {
            console.error('Erro ao obter token:', error);
            return null;
        }
    }, []);

    const handleApiError = useCallback((error: any, context: string): string => {
        console.error(`Erro em ${context}:`, error);
        const errorMessage = error.message; 
        if (errorMessage?.includes('Token')) {
            return 'Sessão expirada. Faça login novamente.';
        }
        if (errorMessage?.includes('Network') || errorMessage?.includes('Failed to fetch')) {
            return 'Erro de conexão. Verifique sua internet.';
        }
        return errorMessage || `Erro ao ${context.toLowerCase()}.`;
    }, []);

    // --- Lógica de Usuário e Sidebar ---
    useEffect(() => {
        const loadUserData = async () => {
            try {
                const token = await getToken();
                if (token) {
                    const decoded = jwtDecode<CustomJwtPayload>(token);
                    setUserName(decoded.userName || 'Usuário');
                    setUserRole(decoded.roles?.[0] || '');
                }
            } catch (error) {
                console.error('Erro ao decodificar token:', error);
            }
        };
        loadUserData();
    }, [getToken]);

    const toggleSidebar = useCallback(() => setSidebarOpen(prev => !prev), []);
    const closeSidebar = useCallback(() => setSidebarOpen(false), []);


    // --- Operações de Documentos ---

    const fetchDocumentos = useCallback(async () => {
        setLoading(true);
        setRefreshing(false);
        try {
            const token = await getToken();
            if (!token) throw new Error('Token não encontrado.');

            const response = await fetch(`${API_BASE_URL}/api/buscar`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (!response.ok) throw new Error(`Erro ${response.status}: Falha ao buscar documentos.`);

            const data: Documento[] = await response.json();
            setDocumentos(Array.isArray(data) ? data : []);
        } catch (error: any) {
            const errorMessage = handleApiError(error, 'carregar documentos');
            if (Platform.OS === 'web') toast.error(errorMessage);
            else Alert.alert('Erro', errorMessage);
            setDocumentos([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [getToken, handleApiError]);

    // Recarregar dados ao focar na tela
    useFocusEffect(
        useCallback(() => {
            fetchDocumentos();
        }, [fetchDocumentos])
    );
    
    const handleRefresh = useCallback(() => {
        setRefreshing(true);
        fetchDocumentos();
    }, [fetchDocumentos]);


    // Ação: Abrir o Modal para Criação/Edição
    const handleOpenModal = useCallback((documento: Documento | null = null) => {
        setSelectedDocumento(documento);
        if (documento) {
            // Edição
            setForm({
                descricao: documento.descricao,
                nomeArquivo: documento.nomeArquivo,
                pdfFile: null, // Arquivo só será selecionado se for para trocar
            });
        } else {
            // Criação
            setForm({ descricao: '', nomeArquivo: '', pdfFile: null });
        }
        setModalVisible(true);
    }, []);

    // Ação: Selecionar o Arquivo PDF
    const handlePickDocument = useCallback(async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: 'application/pdf',
                copyToCacheDirectory: true,
            });

            if (result.canceled) return;
            
            // Sucesso na seleção
            const file = result.assets?.[0] || null;

            if (file) {
                setForm(prev => ({ 
                    ...prev, 
                    pdfFile: result, // Guarda o objeto completo do resultado
                    nomeArquivo: file.name // Atualiza o nome para visualização no formulário
                }));
                const successMsg = `Arquivo selecionado: ${file.name}`;
                 if (Platform.OS === 'web') toast.info(successMsg);
                 else Alert.alert('Arquivo Selecionado', successMsg);
            }

        } catch (err) {
            console.error('Erro ao selecionar documento:', err);
            const errMsg = 'Falha ao selecionar o arquivo PDF.';
            if (Platform.OS === 'web') toast.error(errMsg);
            else Alert.alert('Erro', errMsg);
        }
    }, []);

    // Ação: Salvar (Criação ou Edição)
    const handleSaveDocumento = useCallback(async () => {
        if (!form.descricao.trim()) {
            const msg = 'A descrição do documento é obrigatória.';
            if (Platform.OS === 'web') toast.error(msg);
            else Alert.alert('Atenção', msg);
            return;
        }

        const isCreation = selectedDocumento === null;
        if (isCreation && form.pdfFile === null) {
            const msg = 'É obrigatório selecionar um arquivo PDF para criar um novo documento.';
            if (Platform.OS === 'web') toast.error(msg);
            else Alert.alert('Atenção', msg);
            return;
        }

        setIsSaving(true);

        try {
            const token = await getToken();
            if (!token) throw new Error('Token não encontrado.');

            // 1. Construir o FormData
            const formData = new FormData();
            formData.append('descricao', form.descricao);
            
            let method = 'POST';
            let url = `${API_BASE_URL}/api/cadastrar`;

            if (!isCreation) {
                // Modo Edição (PUT)
                method = 'PUT';
                url = `${API_BASE_URL}/api/atualizar`;
                // Adicionar o ID para atualização
                formData.append('id', selectedDocumento!.id.toString()); 
            }

            // 2. Anexar o arquivo (se houver um selecionado)
            if (form.pdfFile && form.pdfFile.assets?.[0]) {
                 const file = form.pdfFile.assets[0];
                
                // Conversão de URI para o formato de upload
                const uri = file.uri;
                const name = file.name;
                const type = file.mimeType || 'application/pdf';

                if (Platform.OS === 'web') {
                    // Web: usar a Blob/File nativa do browser
                    const blob = await fetch(uri).then(res => res.blob());
                    formData.append('file', blob, name);
                } else {
                    // Mobile: usar o formato de objeto File do React Native
                    formData.append('file', {
                        uri: uri,
                        name: name,
                        type: type,
                    } as any);
                }
            }


            // 3. Fazer a requisição
            const response = await fetch(url, {
                method: method,
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    // IMPORTANTE: NÃO defina 'Content-Type': 'multipart/form-data', o RN/Browser faz isso automaticamente
                },
                body: formData,
            });

            const responseText = await response.text();

            if (!response.ok) {
                let errorMsg = `Erro ${response.status} ao ${isCreation ? 'criar' : 'atualizar'} documento.`;
                try {
                    // Tenta extrair a mensagem de erro do corpo JSON, se houver
                    errorMsg = JSON.parse(responseText)?.message || errorMsg;
                } catch (e) { /* ignore */ }
                throw new Error(errorMsg);
            }

            console.log('Atualização bem-sucedida, recarregando lista...');
            await fetchDocumentos(); // Recarrega a lista
            console.log('Lista recarregada após atualização');
            
            const successMsg = isCreation 
                ? 'Documento criado com sucesso!' 
                : 'Documento atualizado com sucesso!';
            
            if (Platform.OS === 'web') toast.success(successMsg);
            else Alert.alert('Sucesso', successMsg);

            setModalVisible(false); // Fecha o modal

        } catch (error: any) {
            const errorMessage = handleApiError(error, isCreation ? 'criar documento' : 'atualizar documento');
            if (Platform.OS === 'web') toast.error(errorMessage);
            else Alert.alert('Erro', errorMessage);
        } finally {
            setIsSaving(false);
        }
    }, [form, selectedDocumento, getToken, handleApiError, fetchDocumentos]);


    // Ação: Deletar Documento
    const handleDeleteDocumento = useCallback((documentoId: string) => {
        const documentoIdStr = documentoId;
        
        // Primeiro clique: "arma" a exclusão
        if (pendingDeleteId !== documentoIdStr) {
            setPendingDeleteId(documentoIdStr);
            
            if (Platform.OS === 'web') {
                toast.warning('⚠️ Clique novamente na lixeira para confirmar a exclusão', {
                    autoClose: 3000,
                    onClose: () => setPendingDeleteId(null)
                });
            } else {
                Alert.alert('Atenção', 'Clique novamente na lixeira para confirmar a exclusão');
            }
            
            // Remove o estado pendente após 5 segundos se não confirmado
            setTimeout(() => {
                setPendingDeleteId(prev => prev === documentoIdStr ? null : prev);
            }, 5000);
            
            return;
        }
        
        // Segundo clique: executa a exclusão
        const executeDelete = async () => {
            try {
                const token = await getToken();
                if (!token) throw new Error('Token não encontrado.');

                
                
                const response = await fetch(`${API_BASE_URL}/api/apagar/${documentoId}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` },
                });

                

                if (!response.ok) {
                    const responseText = await response.text();
                    let errorMsg = `Erro ${response.status} ao deletar documento.`;
                    try {
                        errorMsg = JSON.parse(responseText)?.message || errorMsg;
                    } catch (e) { /* ignore */ }
                    throw new Error(errorMsg);
                }

                setDocumentos(prev => prev.filter(doc => doc.id !== documentoId));

                const successMsg = 'Documento deletado com sucesso!';
                if (Platform.OS === 'web') toast.success(successMsg);
                else Alert.alert('Sucesso', successMsg);

            } catch (error: any) {
                console.error('Erro ao deletar documento:', error);
                console.error('Detalhes do erro:', error.message);
                const errorMessage = handleApiError(error, 'deletar documento');
                if (Platform.OS === 'web') toast.error(errorMessage);
                else Alert.alert('Erro', errorMessage);
            } finally {
                // Limpa o estado pendente após execução
                setPendingDeleteId(null);
            }
        };

        // Executa a exclusão (segundo clique confirmado)
        executeDelete();
    }, [getToken, handleApiError, pendingDeleteId]);


    return {
        // Estado e Dados
        documentos,
        loading,
        refreshing,
        modalVisible,
        isSaving,
        selectedDocumento,
        form,
        sidebarOpen,
        userName,
        userRole,
        pendingDeleteId,

        // Setters
        setModalVisible,
        setForm,

        // Handlers
        toggleSidebar,
        closeSidebar,
        handleRefresh,
        handleOpenModal,
        handlePickDocument,
        handleSaveDocumento,
        handleDeleteDocumento,
    };
};