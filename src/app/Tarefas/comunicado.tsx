import { faEyeSlash, faIdCard, faPlus, faTimes } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Button } from "../../components/button/index";
import { styles } from "../../Styles/Tecnico";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

interface Usuario {
    id: number;
    nome: string;
    tipo?: string;
}

interface Comunicado {
    id: number;
    destinatarios: Usuario[];
    remetente: Usuario;
    assunto: string;
    mensagem: string;
    dataEnvio: string;
}

const ComunicadosScreen: React.FC = () => {
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
    const [editingComunicadoId, setEditingComunicadoId] = useState<number | null>(null);
    const [editedComunicado, setEditedComunicado] = useState<Omit<Comunicado, 'id' | 'remetente' | 'dataEnvio'>>({
        assunto: '',
        mensagem: '',
        destinatarios: [],
    });
    const [currentUserId, setCurrentUserId] = useState<number | null>(null);
    const [hiddenComunicados, setHiddenComunicados] = useState<number[]>([]);

    
   const getReactKey = useCallback((id: number | null | undefined, prefix: string = "item", typeIdentifier?: string): string => {
    if (id == null || id === 0 || isNaN(id)) {
        const fallbackKey = `${prefix}-fallback-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        console.warn(`[GET_REACT_KEY WARN] Problematic ID for '${prefix}'. Original ID: ${id}. Generated fallback: ${fallbackKey}`);
        return fallbackKey;
    }
   
    const typePart = typeIdentifier ? `-${typeIdentifier}` : '';
    const uniqueKey = `${prefix}-${Number(id)}${typePart}`; 
    return uniqueKey;
}, []);

    const getToken = useCallback(async (): Promise<string | null> => {
        try {
            const token = await AsyncStorage.getItem('jwtToken');
            return token
        } catch (error) {
            console.error('DEBUG TOKEN (ComunicadosScreen): Erro ao obter token do AsyncStorage:', error);
            return null;
        }
    }, []);

    const getUserIdFromToken = useCallback(async (): Promise<number | null> => {
        try {
            const token = await getToken();
            if (token) {
                const decodedToken: any = jwtDecode(token)
                if (decodedToken && decodedToken.userId) {
                    const userId = Number(decodedToken.userId);
                    if (isNaN(userId)) {
                        console.warn('DEBUG (getUserIdFromToken): userId decodificado não é um número:', decodedToken.userId);
                        return null;
                    }
                    return userId;
                } else {
                    console.warn('DEBUG (getUserIdFromToken): Propriedade "userId" não encontrada no payload do token. Verifique o payload real.');
                }
            }
            return null;
        } catch (error) {
            console.error('DEBUG (getUserIdFromToken): Erro ao decodificar token ou obter userId:', error);
            return null;
        }
    }, [getToken]);

    const groupDestinatariosByType = (dest: Usuario[]) => {
        const atletasIds: number[] = [];
        const coordenadorIds: number[] = [];
        const supervisorIds: number[] = [];
        const tecnicoIds: number[] = [];

        dest.forEach(d => {
            const idAsNumber = d.id;

            if (isNaN(idAsNumber) || idAsNumber === 0) {
                console.warn(`[GROUP_DEST] ID inválido ou zero detectado para destinatário ${d.nome}: '${d.id}'. Ignorando.`);
                return;
            }
            switch (d.tipo?.toUpperCase()) {
                case 'ATLETA':
                    atletasIds.push(idAsNumber);
                    break;
                case 'COORDENADOR':
                    coordenadorIds.push(idAsNumber);
                    break;
                case 'SUPERVISOR':
                    supervisorIds.push(idAsNumber);
                    break;
                case 'TECNICO':
                    tecnicoIds.push(idAsNumber);
                    break;
                default:
                    console.warn('[GROUP_DEST] Tipo de destinatário desconhecido ou inválido:', d.tipo, 'para ID:', d.id);
            }
        });
        return { atletasIds, coordenadorIds, supervisorIds, tecnicoIds };
    };

    // --- Data Fetching & Side Effects ---
    useEffect(() => {
        const loadUserId = async () => {
            const id = await getUserIdFromToken();
            setCurrentUserId(id);
        }
        loadUserId();

        const fetchUsersForComunicado = async () => {
            console.log('FETCH_USERS_FOR_COMUNICADO: Iniciando busca de usuários...');
            try {
                const token = await getToken();
                if (!token) {
                    console.warn('FETCH_USERS_FOR_COMUNICADO: Token ausente. Não será possível buscar usuários.');
                    return;
                }
                const response = await fetch(`${API_BASE_URL}/api/usuarios-para-comunicado`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });
                if (!response.ok) {
                    const errorText = await response.text();
                    console.error(`FETCH_USERS_FOR_COMUNICADO: Erro HTTP! status: ${response.status}, corpo: ${errorText}`);
                    throw new Error(`Erro ao carregar usuários: ${response.status} - ${errorText}`);
                }
                const data: Usuario[] = await response.json();
                setUsuarios(data);
                console.log('FETCH_USERS_FOR_COMUNICADO: Usuários carregados com sucesso. Total:', data.length);
            } catch (error) {
                console.error("FETCH_USERS_FOR_COMUNICADO: Falha ao buscar usuários:", error);
                Alert.alert("Erro", `Não foi possível carregar a lista de usuários para comunicados. ${error instanceof Error ? error.message : 'Tente novamente.'}`);
                setUsuarios([]);
            }
        };

        const fetchComunicados = async () => {
            console.log('FETCH_COMUNICADOS: Iniciando busca de comunicados...');
            try {
                const token = await getToken();
                if (!token) {
                    console.warn('FETCH_COMUNICADOS: Token não encontrado. Não será possível buscar comunicados.');
                    return;
                }
                const response = await fetch(`${API_BASE_URL}/api/comunicados`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });
                if (!response.ok) {
                    const errorText = await response.text();
                    console.error(`FETCH_COMUNICADOS: Erro HTTP! status: ${response.status}, corpo: ${errorText}`);
                    throw new Error(`Erro ao carregar comunicados: ${response.status} - ${errorText}`);
                }
                const data: Comunicado[] = await response.json();
              
                setComunicadosEnviados(data);
                console.log('FETCH_COMUNICADOS: Comunicados carregados com sucesso. Total:', data.length);
            } catch (error) {
                console.error("FETCH_COMUNICADOS: Falha ao buscar comunicados:", error);
                Alert.alert("Erro", `Não foi possível carregar os comunicados. ${error instanceof Error ? error.message : 'Tente novamente.'}`);
                setComunicadosEnviados([]);
            }
        };

        fetchUsersForComunicado();
        fetchComunicados();
    }, [getToken, getUserIdFromToken]);

    const adicionarDestinatario = (usuario: Usuario) => {
        const userIdToAdd = usuario.id;

        if (editingComunicadoId !== null) {
            setEditedComunicado(prev => {
                if (!prev.destinatarios.some(d => d.id === userIdToAdd)) {
                    const updatedDest = [...prev.destinatarios, { ...usuario, id: userIdToAdd }];
                    console.log('DEBUG FRONTEND: Destinatário EDITADO adicionado:', usuario.nome, 'Novos destinatários:', JSON.stringify(updatedDest.map(d => `${d.nome} (${d.tipo})`)));
                    return { ...prev, destinatarios: updatedDest };
                }
                return prev;
            });
        } else {
            if (!novoComunicado.destinatarios.some(d => d.id === userIdToAdd)) {
                const updatedDest = [...novoComunicado.destinatarios, { ...usuario, id: userIdToAdd }];
                console.log('DEBUG FRONTEND: Destinatário NOVO adicionado:', usuario.nome, 'Novos destinatários:', JSON.stringify(updatedDest.map(d => `${d.nome} (${d.tipo})`)));
                setNovoComunicado({
                    ...novoComunicado,
                    destinatarios: updatedDest,
                });
            }
        }
    };

    const removerDestinatario = (usuarioId: number) => {
        if (editingComunicadoId !== null) {
            setEditedComunicado(prev => ({
                ...prev,
                destinatarios: prev.destinatarios.filter(d => d.id !== usuarioId),
            }));
        } else {
            setNovoComunicado({
                ...novoComunicado,
                destinatarios: novoComunicado.destinatarios.filter(d => d.id !== usuarioId),
            });
        }
    };

    const enviarComunicado = async () => {
        if (
            novoComunicado.assunto.trim() === '' ||
            novoComunicado.mensagem.trim() === '' ||
            novoComunicado.destinatarios.length === 0
        ) {
            Alert.alert('Atenção', 'Preencha todos os campos obrigatórios e selecione pelo menos um destinatário.');
            return;
        }

        try {
            const token = await getToken();
            if (!token) {
                Alert.alert('Erro', 'Você não está autenticado. Faça login novamente.');
                return;
            }

            const { atletasIds, coordenadorIds, supervisorIds, tecnicoIds } = groupDestinatariosByType(novoComunicado.destinatarios);

            const requestBody = {
                assunto: novoComunicado.assunto,
                mensagem: novoComunicado.mensagem,
                atletasIds: atletasIds.length > 0 ? atletasIds : null,
                coordenadorIds: coordenadorIds.length > 0 ? coordenadorIds : null,
                supervisorIds: supervisorIds.length > 0 ? supervisorIds : null,
                tecnicoIds: tecnicoIds.length > 0 ? tecnicoIds : null,
            };
            console.log('DEBUG FRONTEND: Request Body sendo enviado (Criar):', JSON.stringify(requestBody, null, 2));


            const response = await fetch(`${API_BASE_URL}/api/comunicados`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error("Erro ao enviar comunicado:", errorText);
                throw new Error(`Falha ao enviar comunicado: ${response.status} - ${errorText}`);
            }

            const comunicadoSalvo: Comunicado = await response.json();
            setComunicadosEnviados(prevComunicados => [...prevComunicados, {
                ...comunicadoSalvo,
                dataEnvio: comunicadoSalvo.dataEnvio
            }]);

            setNovoComunicado({
                destinatarios: [],
                assunto: '',
                mensagem: '',
                dataEnvio: '',
            });
            setMostrarFormulario(false);
            setSearchTerm('');
            Alert.alert('Sucesso', 'Comunicado enviado com sucesso!');
        } catch (error) {
            console.error("Erro ao enviar comunicado:", error);
            Alert.alert("Erro", `Não foi possível enviar o comunicado. ${error instanceof Error ? error.message : 'Tente novamente.'}`);
        }
    };

    const startEditingComunicado = (comunicadoParaEditar: Comunicado) => {
        setEditingComunicadoId(comunicadoParaEditar.id);
        setEditedComunicado({
            assunto: comunicadoParaEditar.assunto,
            mensagem: comunicadoParaEditar.mensagem,
            destinatarios: comunicadoParaEditar.destinatarios.map(d => ({ ...d, id: d.id })),
        });
        setMostrarFormulario(true);
        setSearchTerm('');
    };

    const saveEditedComunicado = async () => {
        if (editingComunicadoId === null) {
            Alert.alert('Erro', 'Nenhum comunicado selecionado para edição.');
            return;
        }

        if (editedComunicado.assunto.trim() === '' || editedComunicado.mensagem.trim() === '') {
            Alert.alert('Erro', 'Assunto e mensagem do comunicado não podem estar vazios.');
            return;
        }

        try {
            const token = await getToken();
            if (!token) {
                Alert.alert('Erro', 'Você não está autenticado. Faça login novamente.');
                return;
            }

            const { atletasIds, coordenadorIds, supervisorIds, tecnicoIds } = groupDestinatariosByType(editedComunicado.destinatarios);

            const requestBody = {
                assunto: editedComunicado.assunto,
                mensagem: editedComunicado.mensagem,
                atletasIds: atletasIds.length > 0 ? atletasIds : null,
                coordenadorIds: coordenadorIds.length > 0 ? coordenadorIds : null,
                supervisorIds: supervisorIds.length > 0 ? supervisorIds : null,
                tecnicoIds: tecnicoIds.length > 0 ? tecnicoIds : null,
            };
            console.log('DEBUG FRONTEND: Request Body sendo enviado (Atualizar):', JSON.stringify(requestBody, null, 2));


            const response = await fetch(`${API_BASE_URL}/api/comunicados/${editingComunicadoId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error("Erro ao atualizar comunicado:", errorText);
                throw new Error(`Falha ao atualizar comunicado: ${response.status} - ${errorText}`);
            }

            const comunicadoAtualizadoBackend: Comunicado = await response.json();
            const updatedComunicados = comunicadosEnviados.map(comunicado =>
     comunicado.id === editingComunicadoId ? comunicadoAtualizadoBackend : comunicado
     );
    setComunicadosEnviados(updatedComunicados);
           
            setComunicadosEnviados(updatedComunicados);

            setEditingComunicadoId(null);
            setEditedComunicado({ assunto: '', mensagem: '', destinatarios: [] });
            setMostrarFormulario(false);
            setSearchTerm('');
            Alert.alert('Sucesso', 'Comunicado atualizado com sucesso!');
        } catch (error) {
            console.error("Erro ao atualizar comunicado:", error);
            Alert.alert("Não é possível atualizar o comunicado.");
        }
    };

    const deleteComunicado = (idComunicado: number) => {
        Alert.alert(
            'Confirmar Exclusão',
            'Tem certeza que deseja excluir este comunicado?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Excluir',
                    onPress: async () => {
                        try {
                            const token = await getToken();
                            if (!token) {
                                Alert.alert('Erro', 'Você não está autenticado. Faça login novamente.');
                                return;
                            }
                            const response = await fetch(`${API_BASE_URL}/api/comunicados/${idComunicado}`, {
                                method: 'DELETE',
                                headers: {
                                    'Authorization': `Bearer ${token}`,
                                },
                            });

                            if (!response.ok) {
                                const errorText = await response.text();
                                throw new Error(`Falha ao excluir comunicado: ${response.status} - ${errorText}`);
                            }

                            const updatedComunicados = comunicadosEnviados.filter(comunicado => comunicado.id !== idComunicado);
                            setComunicadosEnviados(updatedComunicados);
                            Alert.alert('Sucesso', 'Comunicado excluído com sucesso!');

                        } catch (error) {
                            console.error("Erro ao excluir comunicado:", error);
                            Alert.alert("Não é possível apagar comunicado.");
                        }
                    },
                    style: 'destructive',
                },
            ],
            { cancelable: true }
        );
    };

    const hideComunicado = (comunicadoId: number) => {
        setHiddenComunicados(prev => [...prev, comunicadoId]);
        Alert.alert('Comunicado Oculto', 'Este comunicado não será mais exibido na sua lista.');
    };

    const visibleComunicados = comunicadosEnviados.filter(item => !hiddenComunicados.includes(item.id));

    return (
        <ScrollView style={styles.section}>
            <Text style={styles.sectionTitle}>Comunicados</Text>

            {!mostrarFormulario && editingComunicadoId === null ? (
                <Button
                    title="Adicionar Comunicado"
                    onPress={() => {
                        setMostrarFormulario(true);
                        setEditingComunicadoId(null);
                        setEditedComunicado({ assunto: '', mensagem: '', destinatarios: [] });
                        setNovoComunicado({ assunto: '', mensagem: '', destinatarios: [], dataEnvio: ''});
                        setSearchTerm('');
                    }}
                    icon={faPlus}
                    style={{ marginBottom: 15 }}
                    textColor="#1c348e"
                />
            ) : (
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
                        {usuarios
                            .filter(u => {
                                const currentDestinatarios = editingComunicadoId !== null ? editedComunicado.destinatarios : novoComunicado.destinatarios;
                                const isAlreadySelected = currentDestinatarios.some(d => d.id === u.id);
                                const matchesSearchTerm = u.nome.toLowerCase().includes(searchTerm.toLowerCase());
                                return !isAlreadySelected && matchesSearchTerm;
                            })
                            .map(usuario => (
                                <TouchableOpacity
    key={getReactKey(usuario.id, `user-item`, usuario.tipo)} // <-- Key change here
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
                                textColor='#fff' icon={undefined}                        />
                        <Button
                                title="Cancelar"
                                onPress={() => {
                                    setMostrarFormulario(false);
                                    setEditingComunicadoId(null);
                                    setEditedComunicado({ assunto: '', mensagem: '', destinatarios: [] });
                                    setNovoComunicado({ assunto: '', mensagem: '', destinatarios: [], dataEnvio: '' });
                                    setSearchTerm('');
                                } }
                                textColor='#fff'
                                style={styles.cancelButton} icon={undefined}                        />
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
                        const isSender = currentUserId !== null && item.remetente && item.remetente.id === currentUserId;
                       const isRecipient = item.destinatarios.some((d: Usuario) => currentUserId !== null && d.id === currentUserId);

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