import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import axios, { isAxiosError } from 'axios';
import { jwtDecode } from 'jwt-decode';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, FlatList, Platform, ScrollView } from 'react-native';
import { toast } from 'react-toastify';
import {
    CustomJwtPayload,
    FuncionarioDto,
    ROLES_OPTIONS
} from '../types/funcionariosTypes';

// Otimização: Pegar URL da API (deve ser importado do seu .env)
const API_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

export const useListaFuncionarios = () => {
    // Refs
    const flatListRef = useRef<FlatList<FuncionarioDto>>(null);
    const modalScrollViewRef = useRef<ScrollView>(null);
    
    // Dados/Estado
    const [funcionarios, setFuncionarios] = useState<FuncionarioDto[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [refreshing, setRefreshing] = useState<boolean>(false);
    const [modalVisible, setModalVisible] = useState<boolean>(false);
    const [selectedFuncionario, setSelectedFuncionario] = useState<FuncionarioDto | null>(null);
    const [editForm, setEditForm] = useState<Partial<FuncionarioDto>>({});
    const [editLoading, setEditLoading] = useState<boolean>(false);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [openRolesPicker, setOpenRolesPicker] = useState<boolean>(false); 
    const [focusIndex, setFocusIndex] = useState<number>(-1);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [userName, setUserName] = useState('Usuário');
    const [userRole, setUserRole] = useState<string>('');
    const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

    // Contexto de Usuário (Sidebar)
    useEffect(() => {
        const loadUserData = async () => {
            try {
                const token = await AsyncStorage.getItem('jwtToken');
                if (token) {
                    const decoded = jwtDecode<CustomJwtPayload>(token);
                    setUserName(decoded.userName || 'Usuário');
                    // Usar o primeiro role como o principal
                    setUserRole(decoded.roles?.[0] || ''); 
                }
            } catch (error) {
                console.error('Erro ao decodificar token:', error);
            }
        };
        loadUserData();
    }, []);

    const toggleSidebar = useCallback(() => setSidebarOpen(prev => !prev), []);
    const closeSidebar = useCallback(() => setSidebarOpen(false), []);

    // Filtragem Otimizada
    const filteredData = useMemo(() => {
        if (!searchTerm) {
            return funcionarios;
        }
        const lowerCaseSearchTerm = searchTerm.toLowerCase();
        return funcionarios.filter((func: FuncionarioDto) =>
            func.nome.toLowerCase().includes(lowerCaseSearchTerm)
        );
    }, [funcionarios, searchTerm]);

    // Função para buscar funcionários na API
    const fetchFuncionarios = useCallback(async () => {
        try {
            setLoading(true);
            const token = await AsyncStorage.getItem('jwtToken');
            const response = await axios.get<FuncionarioDto[]>(`${API_URL}/api/funcionarios/listarfuncionarios`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setFuncionarios(response.data);
            setFocusIndex(0); 
        } catch (error) {
            console.error('Erro ao carregar lista de funcionários:', error);
            const errorMessage = 'Não foi possível carregar a lista de contatos.';
            if (Platform.OS === 'web') {
                toast.error(errorMessage);
            } else {
                Alert.alert('Erro', errorMessage);
            }
            setFuncionarios([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    // Efeito para carregar dados ao focar na tela
    useFocusEffect(
        useCallback(() => {
            fetchFuncionarios();
        }, [fetchFuncionarios])
    );

    // Manipulador para atualização da lista (pull-to-refresh)
    const handleRefresh = useCallback(() => {
        setRefreshing(true);
        fetchFuncionarios();
    }, [fetchFuncionarios]);


    const handleEditAtleta = useCallback((funcionario: FuncionarioDto) => {
        setSelectedFuncionario(funcionario);
        // Garante que o formato da data seja YYYY-MM-DD
        const dataNascimentoFormatada = funcionario.dataNascimento?.split('T')[0] || funcionario.dataNascimento;
        
        setEditForm({
            nome: funcionario.nome,
            email: funcionario.email,
            dataNascimento: dataNascimentoFormatada,
            cpf: funcionario.cpf,
            telefone: funcionario.telefone,
            roles: funcionario.roles,
        });
        setOpenRolesPicker(false);
        setModalVisible(true);
    }, []);

    // Manipulador para salvar as edições
    const handleSaveEdit = useCallback(async () => {
        if (!selectedFuncionario || !editForm.nome || !editForm.roles) {
            const errorMessage = 'Nome e tipo (roles) são obrigatórios.';
            if (Platform.OS === 'web') {
                toast.error(errorMessage);
            } else {
                Alert.alert('Erro', errorMessage);
            }
            return;
        }

        try {
            setEditLoading(true);
            const token = await AsyncStorage.getItem('jwtToken');
            const url = `${API_URL}/api/funcionarios/${selectedFuncionario.id}`;

            const updateDTO = {
                ...editForm,
                id: selectedFuncionario.id,
                roles: editForm.roles,
                dataNascimento: editForm.dataNascimento?.split('T')[0] || editForm.dataNascimento,
            };

            await axios.put(url, updateDTO, {
                headers: { Authorization: `Bearer ${token}` },
            });

            await fetchFuncionarios();

            const successMessage = 'Perfil do funcionário atualizado com sucesso!';
            if (Platform.OS === 'web') {
                toast.success(successMessage);
            } else {
                Alert.alert('Sucesso', successMessage);
            }
            setOpenRolesPicker(false);
            setModalVisible(false);
        } catch (error) {
            console.error('Erro ao salvar edições:', error);
            let errorMessage = 'Não foi possível atualizar o perfil do funcionário.';
            if (isAxiosError(error) && error.response?.data?.message) {
                errorMessage = error.response.data.message;
            }
            if (Platform.OS === 'web') {
                toast.error(errorMessage);
            } else {
                Alert.alert('Erro', errorMessage);
            }
        } finally {
            setEditLoading(false);
        }
    }, [selectedFuncionario, editForm, fetchFuncionarios]);

    // Manipulador para exclusão
    const handleDelete = useCallback((funcionarioId: number, funcionarioRole: string) => {
        const executeDelete = async () => {
            try {
                const token = await AsyncStorage.getItem('jwtToken');
                const url = `${API_URL}/api/funcionarios/${funcionarioId}`;
                
                await axios.delete(url, {
                    headers: { Authorization: `Bearer ${token}` },
                    params: { roles: funcionarioRole }
                });

                await fetchFuncionarios();

                const successMessage = 'Funcionário excluído com sucesso!';
                if (Platform.OS === 'web') {
                    toast.success(successMessage);
                } else {
                    Alert.alert('Sucesso', successMessage);
                }
            } catch (error) {
                console.error('Erro ao excluir funcionário:', error);
                let errorMessage = 'Não foi possível excluir o funcionário.';
                if (isAxiosError(error) && error.response?.data?.message) {
                    errorMessage = error.response.data.message;
                }
                if (Platform.OS === 'web') {
                    toast.error(errorMessage);
                } else {
                    Alert.alert('Erro', errorMessage);
                }
            }
        };

        if (Platform.OS === 'web') {
            if (pendingDeleteId === funcionarioId.toString()) {
                executeDelete();
                setPendingDeleteId(null);
            } else {
                // Primeira tentativa - solicita confirmação
                setPendingDeleteId(funcionarioId.toString());
                toast.warning('⚠️ Tem certeza? Clique em "Excluir" novamente para confirmar', {
                    autoClose: 2000,
                    onClose: () => setPendingDeleteId(null) // Limpa o estado quando o toast fechar
                });
            }
        } else {
            Alert.alert(
                'Confirmar Exclusão',
                'Tem certeza que deseja excluir este funcionário? Esta ação não pode ser desfeita.',
                [
                    { text: 'Cancelar', style: 'cancel' },
                    {
                        text: 'Excluir',
                        onPress: executeDelete,
                        style: 'destructive',
                    },
                ]
            );
        }
    }, [fetchFuncionarios, pendingDeleteId]);

    // Navegação por Teclado na Web
    const scrollItemToView = useCallback((index: number) => {
        if (flatListRef.current) {
            flatListRef.current.scrollToIndex({ index, animated: true, viewPosition: 0.5 });
        }
    }, []);

    useEffect(() => {
        if (Platform.OS === 'web' && focusIndex >= 0) {
            scrollItemToView(focusIndex);
        }
    }, [focusIndex, scrollItemToView]);

    useEffect(() => {
        if (Platform.OS === 'web') {
            const handleKeyDown = (event: KeyboardEvent) => {
                if (modalVisible) {
                    if (event.key === 'Escape') {
                        setOpenRolesPicker(false);
                        setModalVisible(false);
                    }
                    return; 
                }

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
        }
    }, [modalVisible, focusIndex, filteredData, handleEditAtleta]);


    return {
        // Refs
        flatListRef,
        modalScrollViewRef,
        // Dados/Estado
        filteredData,
        selectedFuncionario,
        editForm,
        loading,
        refreshing,
        modalVisible,
        editLoading,
        searchTerm,
        focusIndex,
        sidebarOpen,
        userName,
        userRole,
        pendingDeleteId,
        // Dropdown States e Consts
        openRolesPicker,
        ROLES_OPTIONS,
        // Setters
        setSearchTerm,
        setEditForm,
        setModalVisible,
        setOpenRolesPicker,
        setFocusIndex,
        // Handlers
        toggleSidebar,
        closeSidebar,
        handleRefresh,
        handleEditAtleta,
        handleSaveEdit,
        handleDelete,
        funcionarios,
    };
};