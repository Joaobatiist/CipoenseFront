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
    DocumentoForm,
    DocumentoPdf,
} from '../types/documentosTypes'; 

export const useDocumentos = () => {
    // Estado
    const [documentos, setDocumentos] = useState<DocumentoPdf[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    
    // Usado para edição: se null, é uma criação
    const [selectedDocumento, setSelectedDocumento] = useState<DocumentoPdf | null>(null);
    const [form, setForm] = useState<DocumentoForm>({ 
        descricao: '', 
        nomeArquivo: '',
        pdfFile: null 
    });

    // Estado de Usuário para Sidebar
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [userName, setUserName] = useState('Usuário');
    const [userRole, setUserRole] = useState<string>('');

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

            const response = await fetch(`${API_BASE_URL}/api/documentos`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (!response.ok) throw new Error(`Erro ${response.status}: Falha ao buscar documentos.`);

            const data: DocumentoPdf[] = await response.json();
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
    const handleOpenModal = useCallback((documento: DocumentoPdf | null = null) => {
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
            let url = `${API_BASE_URL}/api/documentos`;

            if (!isCreation) {
                // Modo Edição (PUT)
                method = 'PUT';
                url = `${API_BASE_URL}/api/documentos/${selectedDocumento!.id}`;
                // O backend pode usar o ID na URL, mas é bom enviar também no corpo
                // Se o backend exige o ID no corpo, descomente a linha abaixo
                // formData.append('id', selectedDocumento!.id.toString()); 
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

            await fetchDocumentos(); // Recarrega a lista
            
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
    const handleDeleteDocumento = useCallback((documentoId: number) => {
        const executeDelete = async () => {
            try {
                const token = await getToken();
                if (!token) throw new Error('Token não encontrado.');

                const response = await fetch(`${API_BASE_URL}/api/documentos/${documentoId}`, {
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
                const errorMessage = handleApiError(error, 'deletar documento');
                if (Platform.OS === 'web') toast.error(errorMessage);
                else Alert.alert('Erro', errorMessage);
            }
        };

        Alert.alert(
            'Confirmar Exclusão',
            'Tem certeza que deseja deletar este documento? Esta ação é irreversível.',
            [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Deletar', onPress: executeDelete, style: 'destructive' },
            ]
        );
    }, [getToken, handleApiError]);


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