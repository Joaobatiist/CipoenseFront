// useListaAtletas.ts

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Platform, FlatList } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { jwtDecode } from 'jwt-decode';
import { toast } from 'react-toastify';
import * as DocumentPicker from 'expo-document-picker';
import { atletaService } from '../services/atletaService';
import { 
    AtletaProfileDto, 
    AtletaUpdateDto, 
    CustomJwtPayload, 
    POSICOES, 
    SUBDIVISOES, 
} from '../types/atletasTypes';


// Helper para formatação de data de exibição (mantido no hook como utilitário)
const formatarData = (dataString: string) => {
    if (!dataString || dataString === 'Não informada') return dataString;
    try {
      const datePart = dataString.split('T')[0];
      const [ano, mes, dia] = datePart.split('-');
      if (ano && mes && dia) {
        return `${dia}/${mes}/${ano}`;
      }
      return dataString;
    } catch {
      return dataString;
    }
};

// Helper para tratar erros de API com feedback (simplificado)
const handleApiFeedback = (error: any, defaultMessage: string) => {
    let errorMessage = defaultMessage;
    if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
    }
    
    if (Platform.OS === 'web') {
        toast.error(`Erro. ${errorMessage}`);
    } else {
        Alert.alert('Erro', errorMessage);
    }
    console.error(defaultMessage, error);
};


export function useListaAtletas() {
    const navigation = useNavigation<any>();

    // --- Estado de Dados
    const [atletas, setAtletas] = useState<AtletaProfileDto[]>([]);
    const [selectedAtleta, setSelectedAtleta] = useState<AtletaProfileDto | null>(null);
    const [editForm, setEditForm] = useState<AtletaUpdateDto>({
        isAptoParaJogar: false,
        documentoPdfBase64: null,
        documentoPdfContentType: null,
    });
    
    // --- Estado da UI/Loading
    const [loading, setLoading] = useState<boolean>(true);
    const [refreshing, setRefreshing] = useState<boolean>(false);
    const [modalVisible, setModalVisible] = useState<boolean>(false);
    const [editLoading, setEditLoading] = useState<boolean>(false);
    const [uploadingPdf, setUploadingPdf] = useState<boolean>(false);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [focusIndex, setFocusIndex] = useState<number>(-1); 
    const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null); // Para confirmação de exclusão na web
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [userName, setUserName] = useState('Usuário');
    const [userRole, setUserRole] = useState<string>('');
    
    // Dropdown States
    const [openPosicoesPicker, setOpenPosicoesPicker] = useState<boolean>(false);
    const [openSubDivisoesPicker, setOpenSubDivisoesPicker] = useState<boolean>(false);

    // Refs
    const flatListRef = useRef<FlatList<AtletaProfileDto>>(null);
    const modalScrollViewRef = useRef<any>(null);


    // --- Lógica de Dados Derivados (Filtro)
    const filteredData = useMemo(() => {
        if (!searchTerm) {
            return atletas;
        }
        const lowerCaseSearchTerm = searchTerm.toLowerCase();
        return atletas.filter((atleta: AtletaProfileDto) =>
            atleta.nome.toLowerCase().includes(lowerCaseSearchTerm)
        );
    }, [atletas, searchTerm]);
    
    // --- Funções de Estado e UI
    const toggleSidebar = useCallback(() => setSidebarOpen(prev => !prev), []);
    const closeSidebar = useCallback(() => setSidebarOpen(false), []);

    // --- Efeitos de Inicialização e Dados do Usuário
    useEffect(() => {
        const loadUserData = async () => {
            try {
                const token = await AsyncStorage.getItem('jwtToken');
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
    }, []);

    // --- Funções de Busca (Integração com Service)
    const fetchAtletas = useCallback(async () => {
        try {
            setLoading(true);
            const data = await atletaService.fetchAtletas();
            setAtletas(data);
            if (data.length > 0) setFocusIndex(0);
        } catch (error) {
            handleApiFeedback(error, 'Não foi possível carregar a lista de contatos');
            setAtletas([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            fetchAtletas();
        }, [fetchAtletas])
    );

    const handleRefresh = useCallback(() => {
        setRefreshing(true);
        fetchAtletas();
    }, [fetchAtletas]);

    // --- Handlers de Ação (Edição/Exclusão)

    const handleEditAtleta = useCallback((atleta: AtletaProfileDto) => {
        setSelectedAtleta(atleta);
        // Formata a data de volta para AAAA-MM-DD para o input
        const dataNascimentoFormatada = atleta.dataNascimento?.split('T')[0] || atleta.dataNascimento;
        
        setEditForm({
            nome: atleta.nome,
            email: atleta.email,
            dataNascimento: dataNascimentoFormatada,
            subDivisao: atleta.subDivisao,
            contatoResponsavel: atleta.contatoResponsavel,
            isAptoParaJogar: atleta.isAptoParaJogar,
            posicao: atleta.posicao,
            documentoPdfBase64: atleta.documentoPdfBase64 || null,
            documentoPdfContentType: atleta.documentoPdfContentType || null,
        });
        setModalVisible(true);
    }, []);

    const handleSaveEdit = useCallback(async () => {
        if (!selectedAtleta || !editForm.nome || !editForm.email) {
            const message = 'Nome e email são obrigatórios.';
            if (Platform.OS === 'web') toast.error(`Erro. ${message}`);
            else Alert.alert('Erro', message);
            return;
        }

        try {
            setEditLoading(true);
            await atletaService.updateAtleta(selectedAtleta.id, editForm);
            
            await fetchAtletas();
            
            if (Platform.OS === 'web') {
                toast.success('Perfil do atleta atualizado com sucesso!');
            } else {
                Alert.alert('Sucesso', 'Perfil do atleta atualizado com sucesso!');
            }
            setModalVisible(false);
        } catch (error) {
            handleApiFeedback(error, 'Não foi possível atualizar o perfil do atleta.');
        } finally {
            setEditLoading(false);
        }
    }, [selectedAtleta, editForm, fetchAtletas]);

    const handleDeleteAtleta = useCallback((atletaId: string) => {
        const executeDelete = async () => {
            try {
                await atletaService.deleteAtleta(atletaId);
                setAtletas(prevAtletas => prevAtletas.filter(atleta => atleta.id !== atletaId));
                if (Platform.OS === 'web') {
                    toast.success('Atleta excluído com sucesso!');
                } else {
                    Alert.alert('Sucesso', 'Atleta excluído com sucesso!');
                }
            } catch (error) {
                handleApiFeedback(error, 'Não foi possível excluir o atleta.');
            } finally {
                 setPendingDeleteId(null);
            }
        };

        if (Platform.OS === 'web') {
            if (pendingDeleteId === atletaId) {
                executeDelete();
            } else {
                setPendingDeleteId(atletaId);
                toast.warning('⚠️ Tem certeza? Clique em "Excluir" novamente para confirmar', {
                    autoClose: 3000,
                    onClose: () => setPendingDeleteId(null)
                });
            }
        } else {
            Alert.alert(
                'Confirmar Exclusão',
                'Tem certeza que deseja excluir este atleta? Esta ação é irreversível.',
                [
                    { text: 'Cancelar', style: 'cancel' },
                    { text: 'Sim, Excluir', style: 'destructive', onPress: executeDelete },
                ]
            );
        }
    }, [pendingDeleteId]);

    // --- Lógica de Documento PDF (Inclui manipulação de arquivos específicos de plataforma)

    const handleDownloadPdf = useCallback(async (base64Content: string, contentType: string, fileName: string = 'documento.pdf') => {
        if (!base64Content || !contentType) {
            const message = 'Conteúdo do PDF ou tipo não disponível para download.';
            if (Platform.OS === 'web') toast.error(`Erro. ${message}`);
            else Alert.alert('Erro', message);
            return;
        }

        try {
            if (Platform.OS === 'web') {
                const pureBase64 = base64Content.replace(/^data:.*;base64,/, '');
                const byteCharacters = atob(pureBase64);
                const byteNumbers = new Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);
                const blob = new Blob([byteArray], { type: contentType });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = fileName;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
                toast.success('Download iniciado!');
            } else {
                Alert.alert('Aviso', 'Funcionalidade de download disponível apenas na versão web no momento.');
            }
        } catch (error) {
            console.error('Erro ao baixar/compartilhar PDF:', error);
            if (Platform.OS === 'web') toast.error('Erro. Não foi possível baixar o documento. Tente novamente.');
            else Alert.alert('Erro', 'Não foi possível baixar o documento. Tente novamente.');
        }
    }, []);

    const handlePdfUpload = useCallback(async (atletaId: string) => {
        try {
            setUploadingPdf(true);
            let fileToUpload: File | { uri: string, name: string, type: string } | null = null;
            
            if (Platform.OS === 'web') {
                // DOM manipulation para obter o objeto File (Web)
                fileToUpload = await new Promise<File | null>(resolve => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'application/pdf';
                    input.onchange = (e: any) => resolve(e.target.files[0] || null);
                    input.click();
                });
            } else {
                // DocumentPicker (Mobile)
                const result = await DocumentPicker.getDocumentAsync({
                    type: 'application/pdf',
                    copyToCacheDirectory: false,
                });
                if (!result.canceled && result.assets?.[0]?.uri) {
                    fileToUpload = {
                        uri: result.assets[0].uri,
                        name: result.assets[0].name || 'document.pdf',
                        type: 'application/pdf',
                    };
                }
            }

            if (fileToUpload) {
                const { documentoPdfBase64, documentoPdfContentType } = await atletaService.uploadPdf(atletaId, fileToUpload);
                
                // Atualiza o estado
                setAtletas(prevAtletas =>
                    prevAtletas.map(atleta =>
                        atleta.id === atletaId
                            ? { ...atleta, documentoPdfBase64, documentoPdfContentType }
                            : atleta
                    )
                );
                setEditForm(prevForm => ({ ...prevForm, documentoPdfBase64, documentoPdfContentType }));
                
                if (Platform.OS === 'web') toast.success('Documento PDF enviado com sucesso!');
                else Alert.alert('Sucesso', 'Documento PDF enviado com sucesso!');
            }
        } catch (error) {
            handleApiFeedback(error, 'Não foi possível enviar o documento PDF.');
        } finally {
            setUploadingPdf(false);
        }
    }, []);

    const handleDeleteMainPdf = useCallback(async (atletaId: string) => {
        const executeRemovePdf = async () => {
            try {
                await atletaService.deleteMainPdf(atletaId);
                
                setAtletas(prevAtletas =>
                    prevAtletas.map(atleta =>
                        atleta.id === atletaId
                            ? { ...atleta, documentoPdfBase64: null, documentoPdfContentType: null }
                            : atleta
                    )
                );
                setEditForm(prevForm => ({
                    ...prevForm,
                    documentoPdfBase64: null,
                    documentoPdfContentType: null,
                }));
                
                if (Platform.OS === 'web') toast.success('Documento PDF removido com sucesso.');
                else Alert.alert('Sucesso', 'Documento PDF removido com sucesso.');
            } catch (error) {
                handleApiFeedback(error, 'Não foi possível remover o documento PDF.');
            } finally {
                 setPendingDeleteId(null);
            }
        };

        if (Platform.OS === 'web') {
            if (pendingDeleteId === atletaId) {
                executeRemovePdf();
            } else {
                setPendingDeleteId(atletaId);
                toast.warning('⚠️ Tem certeza? Clique em "Remover" novamente para confirmar', {
                    autoClose: 3000,
                    onClose: () => setPendingDeleteId(null)
                });
            }
        } else {
            Alert.alert(
                'Confirmar Remoção',
                'Tem certeza que deseja remover o documento PDF?',
                [
                    { text: 'Cancelar', style: 'cancel' },
                    { text: 'Sim, Remover', style: 'destructive', onPress: executeRemovePdf },
                ]
            );
        }
    }, [pendingDeleteId]);

    // --- Lógica de Navegação por Teclado na Web (Foco e Scroll) ---

    const scrollItemToView = useCallback((index: number) => {
        if (flatListRef.current) {
            flatListRef.current.scrollToIndex({
                index,
                animated: true,
                viewPosition: 0.5,
            });
        }
    }, []);

    useEffect(() => {
        if (Platform.OS === 'web' && focusIndex >= 0) {
            scrollItemToView(focusIndex);
        }
    }, [focusIndex, scrollItemToView]);

    useEffect(() => {
        if (Platform.OS !== 'web') return;

        const handleKeyDown = (event: KeyboardEvent) => {
            const isInputFocused =
                document.activeElement?.tagName === 'INPUT' ||
                document.activeElement?.tagName === 'TEXTAREA' ||
                document.activeElement?.getAttribute('contenteditable') === 'true';

            if (modalVisible) {
                if (event.key === 'Escape') {
                    event.preventDefault();
                    setModalVisible(false);
                }
                return;
            }

            if (isInputFocused) return; 

            const listLength = filteredData.length;
            if (listLength === 0) return;

            let newIndex = focusIndex;

            switch (event.key) {
                case 'ArrowDown':
                    event.preventDefault();
                    newIndex = Math.min(focusIndex + 1, listLength - 1);
                    break;
                case 'ArrowUp':
                    event.preventDefault();
                    newIndex = Math.max(focusIndex - 1, 0);
                    break;
                case 'Enter':
                    if (focusIndex >= 0 && focusIndex < listLength) {
                        event.preventDefault();
                        handleEditAtleta(filteredData[focusIndex]);
                    }
                    return;
                default:
                    return;
            }

            setFocusIndex(newIndex);
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [modalVisible, focusIndex, filteredData, handleEditAtleta]);


    return {
        // Refs
        flatListRef,
        modalScrollViewRef,
        // Dados/Estado
        atletas,
        filteredData,
        selectedAtleta,
        editForm,
        loading,
        refreshing,
        modalVisible,
        editLoading,
        uploadingPdf,
        searchTerm,
        focusIndex,
        sidebarOpen,
        userName,
        userRole,
        pendingDeleteId,
        // Dropdown States e Constantes
        openPosicoesPicker,
        openSubDivisoesPicker,
        POSICOES,
        SUBDIVISOES,
        // Setters
        setSearchTerm,
        setEditForm,
        setModalVisible,
        setOpenPosicoesPicker,
        setOpenSubDivisoesPicker,
        // Handlers
        toggleSidebar,
        closeSidebar,
        handleRefresh,
        handleEditAtleta,
        handleSaveEdit,
        handleDeleteAtleta,
        handleDownloadPdf,
        handlePdfUpload,
        handleDeleteMainPdf,
        // Helpers
        formatarData,
    };
}

export type UseListaAtletasReturn = ReturnType<typeof useListaAtletas>;