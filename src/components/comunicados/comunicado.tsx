import { faEyeSlash, faIdCard, faPlus, faTimes } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Alert,
    FlatList,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { styles } from "../../Styles/Tecnico";
import { Button } from "../button/index";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

// --- Interfaces ---
interface Usuario {
    id: string;
    nome: string;
    tipo?: string;
}

interface Comunicado {
    id: string;
    destinatarios: Usuario[];
    remetente: Usuario;
    assunto: string;
    mensagem: string;
    dataEnvio: string;
}

interface ComunicadosScreenProps {
    userRole?: string;
}

const ComunicadosScreen: React.FC<ComunicadosScreenProps> = ({ userRole }) => {
    // --- Estados ---
    const [usuarios, setUsuarios] = useState<Usuario[]>([]);
    const [novoComunicado, setNovoComunicado] = useState<Omit<Comunicado, 'id' | 'remetente'>>({
        destinatarios: [],
        assunto: '',
        mensagem: '',
        dataEnvio: '',
    });
    const [comunicadosEnviados, setComunicadosEnviados] = useState<Comunicado[]>([]);
    const [mostrarFormulario, setMostrarFormulario] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingComunicadoId, setEditingComunicadoId] = useState<string | null>(null);
    const [editedComunicado, setEditedComunicado] = useState<Omit<Comunicado, 'id' | 'remetente' | 'dataEnvio'>>({
        assunto: '',
        mensagem: '',
        destinatarios: [],
    });
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [hiddenComunicados, setHiddenComunicados] = useState<string[]>([]);
    const [submittingForm, setSubmittingForm] = useState(false);

    // --- Computed Values ---
    const visibleComunicados = useMemo(() => 
        comunicadosEnviados.filter(item => !hiddenComunicados.includes(String(item.id))),
        [comunicadosEnviados, hiddenComunicados]
    );

    const filteredUsuarios = useMemo(() => {
        const currentDestinatarios = editingComunicadoId !== null ? editedComunicado.destinatarios : novoComunicado.destinatarios;
        return usuarios.filter(usuario => {
            const isAlreadySelected = currentDestinatarios.some(d => d.id === usuario.id);
            const matchesSearchTerm = usuario.nome.toLowerCase().includes(searchTerm.toLowerCase().trim());
            return !isAlreadySelected && matchesSearchTerm;
        });
    }, [usuarios, searchTerm, editingComunicadoId, editedComunicado.destinatarios, novoComunicado.destinatarios]);

    // --- Funções Utilitárias ---
    const getReactKey = useCallback((id: string | number | null | undefined, prefix: string = "item", typeIdentifier?: string): string => {
        if (id == null || id === '' || id === '0' || id === 0) {
            const fallbackKey = `${prefix}-fallback-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
            console.warn(`[GET_REACT_KEY WARN] Problematic ID for '${prefix}'. Original ID: ${id}. Generated fallback: ${fallbackKey}`);
            return fallbackKey;
        }
       
        const typePart = typeIdentifier ? `-${typeIdentifier}` : '';
        const uniqueKey = `${prefix}-${String(id)}${typePart}`; 
        return uniqueKey;
    }, []);

    const getToken = useCallback(async (): Promise<string | null> => {
        try {
            return await AsyncStorage.getItem('jwtToken');
        } catch (error) {
            console.error('Erro ao obter token:', error);
            return null;
        }
    }, []);

    const getUserIdFromToken = useCallback(async (): Promise<string | null> => {
        try {
            const token = await getToken();
            if (token) {
                const decodedToken: any = jwtDecode(token);
                if (decodedToken?.userId) {
                    const userId = String(decodedToken.userId);
                    return userId !== 'undefined' ? userId : null;
                }
            }
            return null;
        } catch (error) {
            console.error('Erro ao decodificar token:', error);
            return null;
        }
    }, [getToken]);

    const handleApiError = useCallback((error: any, context: string): string => {
        console.error(`Erro em ${context}:`, error);
        if (error.message?.includes('Token') || error.message?.includes('401')) {
            return 'Sessão expirada. Faça login novamente.';
        }
        if (error.message?.includes('Network') || error.message?.includes('fetch')) {
            return 'Erro de conexão. Verifique sua internet.';
        }
        return error.message || `Erro ao ${context.toLowerCase()}.`;
    }, []);

    const groupDestinatariosByType = useCallback((dest: Usuario[]) => {
        const atletasIds: string[] = [];
        const coordenadorIds: string[] = [];
        const supervisorIds: string[] = [];
        const tecnicoIds: string[] = [];

        dest.forEach(d => {
            const idAsString = String(d.id);

            if (!idAsString || idAsString === '0') {
                console.warn(`ID inválido para destinatário ${d.nome}: '${d.id}'. Ignorando.`);
                return;
            }
            
            switch (d.tipo?.toUpperCase()) {
                case 'ATLETA':
                    atletasIds.push(idAsString);
                    break;
                case 'COORDENADOR':
                    coordenadorIds.push(idAsString);
                    break;
                case 'SUPERVISOR':
                    supervisorIds.push(idAsString);
                    break;
                case 'TECNICO':
                    tecnicoIds.push(idAsString);
                    break;
                default:
                    console.warn('Tipo de destinatário desconhecido:', d.tipo, 'para ID:', d.id);
            }
        });
        
        return { atletasIds, coordenadorIds, supervisorIds, tecnicoIds };
    }, []);

    // --- Funções de API ---
    const fetchUsersForComunicado = useCallback(async () => {
        try {
            const token = await getToken();
            if (!token) {
                throw new Error('Token de autenticação não encontrado.');
            }
            
            const response = await fetch(`${API_BASE_URL}/api/usuarios-para-comunicado`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` },
            });
            
            if (!response.ok) {
                throw new Error(`Erro ${response.status}: Falha ao carregar usuários`);
            }
            
            const data: Usuario[] = await response.json();
            setUsuarios(data);
            
        } catch (error: any) {
            const errorMessage = handleApiError(error, 'carregar usuários');
            Alert.alert("Erro", errorMessage);
            setUsuarios([]);
        }
    }, [getToken, handleApiError]);

    const fetchComunicados = useCallback(async () => {
        try {
            const token = await getToken();
            if (!token) {
                throw new Error('Token de autenticação não encontrado.');
            }
            
            const response = await fetch(`${API_BASE_URL}/api/comunicados`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` },
            });
            
            if (!response.ok) {
                throw new Error(`Erro ${response.status}: Falha ao carregar comunicados`);
            }
            
            const data: Comunicado[] = await response.json();
            setComunicadosEnviados(data);
            
        } catch (error: any) {
            const errorMessage = handleApiError(error, 'carregar comunicados');
            Alert.alert("Erro", errorMessage);
            setComunicadosEnviados([]);
        }
    }, [getToken, handleApiError]);

    // --- Efeitos ---
    useEffect(() => {
        const loadInitialData = async () => {
            const userId = await getUserIdFromToken();
            setCurrentUserId(userId);
            
            await Promise.all([
                fetchUsersForComunicado(),
                fetchComunicados()
            ]);
        };
        
        loadInitialData();
    }, [getUserIdFromToken, fetchUsersForComunicado, fetchComunicados]);

    // --- Funções de Formulário ---
    const adicionarDestinatario = useCallback((usuario: Usuario) => {
        if (editingComunicadoId !== null) {
            setEditedComunicado(prev => {
                if (!prev.destinatarios.some(d => d.id === usuario.id)) {
                    return { ...prev, destinatarios: [...prev.destinatarios, usuario] };
                }
                return prev;
            });
        } else {
            setNovoComunicado(prev => {
                if (!prev.destinatarios.some(d => d.id === usuario.id)) {
                    return { ...prev, destinatarios: [...prev.destinatarios, usuario] };
                }
                return prev;
            });
        }
    }, [editingComunicadoId]);

    const removerDestinatario = useCallback((usuarioId: string) => {
        if (editingComunicadoId !== null) {
            setEditedComunicado(prev => ({
                ...prev,
                destinatarios: prev.destinatarios.filter(usuario => String(usuario.id) !== usuarioId),
            }));
        } else {
            setNovoComunicado(prev => ({
                ...prev,
                destinatarios: prev.destinatarios.filter(d => String(d.id) !== usuarioId),
            }));
        }
    }, [editingComunicadoId]);

    const resetForm = useCallback(() => {
        setMostrarFormulario(false);
        setEditingComunicadoId(null);
        setEditedComunicado({ assunto: '', mensagem: '', destinatarios: [] });
        setNovoComunicado({ assunto: '', mensagem: '', destinatarios: [], dataEnvio: '' });
        setSearchTerm('');
    }, []);

    const startNewComunicado = useCallback(() => {
        setMostrarFormulario(true);
        setEditingComunicadoId(null);
        setEditedComunicado({ assunto: '', mensagem: '', destinatarios: [] });
        setNovoComunicado({ assunto: '', mensagem: '', destinatarios: [], dataEnvio: '' });
        setSearchTerm('');
    }, []);

    const startEditingComunicado = useCallback((comunicado: Comunicado) => {
        setEditingComunicadoId(String(comunicado.id));
        setEditedComunicado({
            assunto: comunicado.assunto,
            mensagem: comunicado.mensagem,
            destinatarios: comunicado.destinatarios.map(d => ({ ...d, id: String(d.id) })),
        });
        setMostrarFormulario(true);
        setSearchTerm('');
    }, []);

    const enviarComunicado = useCallback(async () => {
        if (
            novoComunicado.assunto.trim() === '' ||
            novoComunicado.mensagem.trim() === '' ||
            novoComunicado.destinatarios.length === 0
        ) {
            Alert.alert('Atenção', 'Preencha todos os campos obrigatórios e selecione pelo menos um destinatário.');
            return;
        }

        setSubmittingForm(true);
        try {
            const token = await getToken();
            if (!token) {
                throw new Error('Token de autenticação não encontrado.');
            }

            const { atletasIds, coordenadorIds, supervisorIds, tecnicoIds } = groupDestinatariosByType(novoComunicado.destinatarios);

            const requestBody = {
                assunto: novoComunicado.assunto.trim(),
                mensagem: novoComunicado.mensagem.trim(),
                atletasIds: atletasIds.length > 0 ? atletasIds : null,
                coordenadorIds: coordenadorIds.length > 0 ? coordenadorIds : null,
                supervisorIds: supervisorIds.length > 0 ? supervisorIds : null,
                tecnicoIds: tecnicoIds.length > 0 ? tecnicoIds : null,
            };

            const response = await fetch(`${API_BASE_URL}/api/comunicados`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) {
                throw new Error(`Erro ${response.status}: Falha ao enviar comunicado`);
            }

            const comunicadoSalvo: Comunicado = await response.json();
            setComunicadosEnviados(prev => [...prev, comunicadoSalvo]);

            resetForm();
            Alert.alert('Sucesso', 'Comunicado enviado com sucesso!');
            
        } catch (error: any) {
            const errorMessage = handleApiError(error, 'enviar comunicado');
            Alert.alert("Erro", errorMessage);
        } finally {
            setSubmittingForm(false);
        }
    }, [novoComunicado, getToken, groupDestinatariosByType, resetForm, handleApiError]);



    const saveEditedComunicado = useCallback(async () => {
        if (editingComunicadoId === null) {
            Alert.alert('Erro', 'Nenhum comunicado selecionado para edição.');
            return;
        }

        if (editedComunicado.assunto.trim() === '' || editedComunicado.mensagem.trim() === '') {
            Alert.alert('Erro', 'Assunto e mensagem do comunicado não podem estar vazios.');
            return;
        }

        setSubmittingForm(true);
        try {
            const token = await getToken();
            if (!token) {
                throw new Error('Token de autenticação não encontrado.');
            }

            const { atletasIds, coordenadorIds, supervisorIds, tecnicoIds } = groupDestinatariosByType(editedComunicado.destinatarios);

            const requestBody = {
                assunto: editedComunicado.assunto.trim(),
                mensagem: editedComunicado.mensagem.trim(),
                atletasIds: atletasIds.length > 0 ? atletasIds : null,
                coordenadorIds: coordenadorIds.length > 0 ? coordenadorIds : null,
                supervisorIds: supervisorIds.length > 0 ? supervisorIds : null,
                tecnicoIds: tecnicoIds.length > 0 ? tecnicoIds : null,
            };

            const response = await fetch(`${API_BASE_URL}/api/comunicados/${editingComunicadoId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) {
                throw new Error(`Erro ${response.status}: Falha ao atualizar comunicado`);
            }

            const comunicadoAtualizado: Comunicado = await response.json();
            setComunicadosEnviados(prev =>
                prev.map(comunicado =>
                    String(comunicado.id) === editingComunicadoId ? comunicadoAtualizado : comunicado
                )
            );

            resetForm();
            Alert.alert('Sucesso', 'Comunicado atualizado com sucesso!');
            
        } catch (error: any) {
            const errorMessage = handleApiError(error, 'atualizar comunicado');
            Alert.alert("Erro", errorMessage);
        } finally {
            setSubmittingForm(false);
        }
    }, [editingComunicadoId, editedComunicado, getToken, groupDestinatariosByType, resetForm, handleApiError]);

    const executeDelete = useCallback(async (idComunicado: string) => {
        try {
            const token = await getToken();
            if (!token) {
                throw new Error('Token de autenticação não encontrado.');
            }
            
            const response = await fetch(`${API_BASE_URL}/api/comunicados/${idComunicado}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (!response.ok) {
                throw new Error(`Erro ${response.status}: Falha ao excluir comunicado`);
            }

            setComunicadosEnviados(prev =>
                prev.filter(comunicado => String(comunicado.id) !== idComunicado)
            );
            
            if (Platform.OS === 'web') {
                window.alert('Comunicado excluído com sucesso!');
            } else {
                Alert.alert('Sucesso', 'Comunicado excluído com sucesso!');
            }

        } catch (error: any) {
            const errorMessage = handleApiError(error, 'excluir comunicado');
            if (Platform.OS === 'web') {
                window.alert(`Erro: ${errorMessage}`);
            } else {
                Alert.alert("Erro", errorMessage);
            }
        }
    }, [getToken, handleApiError]);

    const deleteComunicado = useCallback(async (idComunicado: string) => {
        if (Platform.OS === 'web') {
            // Confirmação para web usando window.confirm
            const confirmed = window.confirm(
                "Tem certeza que deseja excluir este comunicado? Esta ação é irreversível."
            );
            
            if (!confirmed) {
                return; // Usuário cancelou
            }
        } else {
            // Alert.alert para mobile (iOS/Android)
            Alert.alert(
                "Confirmar Exclusão",
                "Tem certeza que deseja excluir este comunicado? Esta ação é irreversível.",
                [
                    { text: "Cancelar", style: "cancel" },
                    {
                        text: "Sim, Excluir",
                        style: "destructive",
                        onPress: async () => await executeDelete(idComunicado),
                    },
                ]
            );
            return; // No mobile, a exclusão será feita pelo callback do Alert
        }

        // Se chegou aqui, é web e usuário confirmou
        await executeDelete(idComunicado);
    }, [executeDelete]); 

    const hideComunicado = useCallback((comunicadoId: string) => {
        setHiddenComunicados(prev => [...prev, String(comunicadoId)]);
        Alert.alert('Comunicado Oculto', 'Este comunicado não será mais exibido na sua lista.');
    }, []);

    return (
        <ScrollView style={styles.section}>
            <Text style={styles.sectionTitle}>Comunicados</Text>

            {userRole !== 'ATLETA' && !mostrarFormulario && editingComunicadoId === null && (
                <Button
                    title="Adicionar Comunicado"
                    onPress={startNewComunicado}
                    icon={faPlus}
                    
                />
            )}

            {userRole !== 'ATLETA' && (mostrarFormulario || editingComunicadoId !== null) && (
                <View style={styles.formContainer}>
                    <Text style={styles.formTitle}>
                        {editingComunicadoId !== null ? "Editando Comunicado" : "Adicionando Comunicado"}
                    </Text>

                    <Text style={styles.label}>
                        Data: {new Date().toLocaleDateString('pt-BR')}
                    </Text>

                    <Text style={styles.label}>Destinatários:</Text>
                    <View style={styles.destinatariosContainer}>
                        {(editingComunicadoId !== null ? editedComunicado.destinatarios : novoComunicado.destinatarios).map(destinatario => (
                            <View key={getReactKey(destinatario.id, `dest-tag`, destinatario.tipo)} style={styles.destinatarioTag}>
    <Text style={styles.destinatarioText}>{destinatario.nome} ({destinatario.tipo})</Text>
    <TouchableOpacity onPress={() => removerDestinatario(destinatario.id)} >
        <FontAwesomeIcon icon={faTimes} size={12} color="#fff" />
    </TouchableOpacity>
</View>
                        ))}
                    </View>

                    <Text style={styles.label}>Adicionar destinatário:</Text>
                    <TextInput
                        placeholder="Pesquisar usuários..."
                        style={styles.searchInput}
                        value={searchTerm}
                        onChangeText={setSearchTerm}
                    />

                    <ScrollView style={styles.dropdownContainer}>
                        {filteredUsuarios.map(usuario => (
                            <TouchableOpacity
                                key={getReactKey(usuario.id, `user-item`, usuario.tipo)}
                                style={styles.usuarioItem}
                                onPress={() => adicionarDestinatario(usuario)}
                            >
                                <Text>{usuario.nome} ({usuario.tipo})</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    <Text style={styles.label}>Assunto:</Text>
                    <TextInput
                        value={editingComunicadoId !== null ? editedComunicado.assunto : novoComunicado.assunto}
                        onChangeText={text => editingComunicadoId !== null ? setEditedComunicado({ ...editedComunicado, assunto: text }) : setNovoComunicado({ ...novoComunicado, assunto: text })}
                        placeholder="Digite o assunto"
                        style={styles.input}
                    />

                    <Text style={styles.label}>Mensagem:</Text>
                    <TextInput
                        value={editingComunicadoId !== null ? editedComunicado.mensagem : novoComunicado.mensagem}
                        onChangeText={text => editingComunicadoId !== null ? setEditedComunicado({ ...editedComunicado, mensagem: text }) : setNovoComunicado({ ...novoComunicado, mensagem: text })}
                        placeholder="Digite a mensagem"
                        multiline
                        numberOfLines={4}
                        style={[styles.input, styles.textArea]}
                    />

                    <View style={styles.buttonGroup}>
                        <Button
                                title={editingComunicadoId !== null ? "Salvar Alterações" : "Enviar"}
                                onPress={editingComunicadoId !== null ? saveEditedComunicado : enviarComunicado}
                                style={styles.submitButton}
                                textColor='#fff'
                                disabled={submittingForm}
                        />
                        <Button
                                title="Cancelar"
                                onPress={resetForm}
                                textColor='#fff'
                                style={styles.cancelButton} 
                                disabled={submittingForm}
                        />
                    </View>
                </View>
            )}

            <Text style={styles.subTitle}>Comunicados Enviados</Text>
            {visibleComunicados.length === 0 ? (
                <Text style={styles.emptyMessage}>Nenhum comunicado enviado ainda.</Text>
            ) : (
                <FlatList
                    data={visibleComunicados}
                    keyExtractor={item => getReactKey(item.id, `flatlist-comunicado-${item.id}`)} 
                    renderItem={({ item }) => {
                        const isSender = currentUserId !== null && item.remetente && String(item.remetente.id) === currentUserId;
                       const isRecipient = item.destinatarios.some((d: Usuario) => currentUserId !== null && String(d.id) === currentUserId);

                        // Debug logs para identificar por que os botões não aparecem
                       

                        return (
                            <View key={getReactKey(item.id, `comunicado-card-${item.id}`)} style={styles.comunicadoCard}> 
                                <Text style={styles.comunicadoAssunto}>{item.assunto}</Text>
                                <Text style={styles.comunicadoData}>Enviado em: {item.dataEnvio}</Text>
                                <Text style={styles.comunicadoMensagem}>{item.mensagem}</Text>
                                {item.remetente && (
                                    <Text style={styles.comunicadoRemetente}>
                                        De: {item.remetente.nome} ({item.remetente.tipo})
                                    </Text>
                                )}
                                <Text style={styles.comunicadoDestinatarios}>
                                    Para: {item.destinatarios.map((d: Usuario) => `${d.nome} (${d.tipo})`).join(', ')}
                                </Text>
                                <View style={styles.eventActions}>
                                    {isSender && (
                                        <>
                                            <TouchableOpacity onPress={() => startEditingComunicado(item)} style={styles.editButton}>
                                                <FontAwesomeIcon icon={faIdCard} size={16} color="#fff" />
                                                <Text style={styles.buttonText}> Editar</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity onPress={() => deleteComunicado(item.id)} style={styles.deleteButton}>
                                                <FontAwesomeIcon icon={faTimes} size={16} color="#fff" />
                                                <Text style={styles.buttonText}> Excluir</Text>
                                            </TouchableOpacity>
                                        </>
                                    )}
                                    {!isSender && isRecipient && (
                                        <TouchableOpacity onPress={() => hideComunicado(item.id)} style={styles.hideButton}>
                                            <FontAwesomeIcon icon={faEyeSlash} size={16} color="#fff" />
                                            <Text style={styles.buttonText}> Ocultar</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </View>
                        );
                    }}
                    scrollEnabled={false}
                />
            )}
        </ScrollView>
    );
};

export default ComunicadosScreen;
