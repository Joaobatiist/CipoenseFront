import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TextInput, FlatList, Alert, TouchableOpacity } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faPlus, faTimes, faIdCard, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import { Button } from "../../components/button";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { styles } from "./Tecnico";
import { jwtDecode } from 'jwt-decode';

interface Usuario {
    id: string; // Mantenha como string aqui para corresponder ao que vem do backend inicialmente
    nome: string;
    tipo?: string;
}

interface Comunicado {
    id: string; // Mantenha como string para o keyExtractor e filter
    destinatarios: Usuario[];
    remetente: Usuario;
    assunto: string;
    mensagem: string;
    dataEnvio: string;
}

const ComunicadosScreen: React.FC = () => {
    const getToken = useCallback(async (): Promise<string | null> => {
        try {
            const token = await AsyncStorage.getItem('jwtToken');
            console.log('DEBUG TOKEN (ComunicadosScreen): Chamada getToken()');
            if (token) {
                console.log('DEBUG TOKEN (ComunicadosScreen): Token recuperado. Tamanho:', token.length);
            } else {
                console.log('DEBUG TOKEN (ComunicadosScreen): Token NÃO encontrado.');
            }
            return token;
        } catch (error) {
            console.error('DEBUG TOKEN (ComunicadosScreen): Erro ao obter token do AsyncStorage:', error);
            return null;
        }
    }, []);

    const getUserIdFromToken = useCallback(async (): Promise<string | null> => {
        try {
            const token = await getToken();
            if (token) {
                const decodedToken: any = jwtDecode(token);
                console.log('DEBUG (getUserIdFromToken): Payload JWT Decodificado:', decodedToken);

                if (decodedToken && decodedToken.userId) {
                    // O userId do JWT deve ser tratado como number ou string aqui
                    // Pelo seu log, ele está vindo como '1' (string), o que é bom
                    // Se o seu backend retornar como number, jwt-decode o manterá como number
                    // Para ser seguro, vamos converter para string na extração,
                    // e depois para number na comparação, para flexibilidade.
                    console.log('DEBUG (getUserIdFromToken): userId encontrado no token:', decodedToken.userId);
                    return String(decodedToken.userId); // Garante que currentUserId é sempre string
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

    const [usuarios, setUsuarios] = useState<Usuario[]>([]);
    const [novoComunicado, setNovoComunicado] = useState<{
        destinatarios: Usuario[];
        assunto: string;
        mensagem: string;
        dataEnvio: string;
    }>({
        destinatarios: [],
        assunto: '',
        mensagem: '',
        dataEnvio: new Date().toLocaleDateString('pt-BR'),
    });

    const [comunicadosEnviados, setComunicadosEnviados] = useState<Comunicado[]>([]);
    const [mostrarFormulario, setMostrarFormulario] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const [editingComunicadoId, setEditingComunicadoId] = useState<string | null>(null);
    const [editedComunicado, setEditedComunicado] = useState<{
        assunto: string;
        mensagem: string;
        destinatarios: Usuario[];
    }>({
        assunto: '',
        mensagem: '',
        destinatarios: [],
    });

    const [currentUserId, setCurrentUserId] = useState<string | null>(null); // Mantido como string
    const [hiddenComunicados, setHiddenComunicados] = useState<string[]>([]);

    useEffect(() => {
        const loadUserId = async () => {
            const id = await getUserIdFromToken();
            setCurrentUserId(id);
            console.log('DEBUG (useEffect): currentUserId após carregamento:', id);
        };
        loadUserId();

        const fetchUsersForComunicado = async () => {
            console.log('FETCH_USERS_FOR_COMUNICADO (ComunicadosScreen): Iniciando busca de usuários...');
            try {
                const token = await getToken();
                if (!token) {
                    console.warn('FETCH_USERS_FOR_COMUNICADO (ComunicadosScreen): Token ausente. Não será possível buscar usuários.');
                    return;
                }
                const response = await fetch('http://192.168.0.10:8080/api/usuarios-para-comunicado', {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });
                if (!response.ok) {
                    const errorText = await response.text();
                    console.error(`FETCH_USERS_FOR_COMUNICADO (ComunicadosScreen): Erro HTTP! status: ${response.status}, corpo: ${errorText}`);
                    throw new Error(`Erro ao carregar usuários: ${response.status} - ${errorText}`);
                }
                const data: Usuario[] = await response.json();
                // Certifique-se de que o ID do usuário da API é uma string se você o definir como string na interface Usuario
                const formattedData = data.map(u => ({ ...u, id: String(u.id) })); // Convertendo ID para string
                setUsuarios(formattedData);
                console.log('FETCH_USERS_FOR_COMUNICADO (ComunicadosScreen): Usuários carregados com sucesso. Total:', data.length);
                console.log('DEBUG FRONTEND: Usuários carregados (IDs e Tipos):', JSON.stringify(formattedData.map(u => ({ id: u.id, nome: u.nome, tipo: u.tipo }))));
            } catch (error) {
                console.error("FETCH_USERS_FOR_COMUNICADO (ComunicadosScreen): Falha ao buscar usuários:", error);
                Alert.alert("Erro", `Não foi possível carregar a lista de usuários para comunicados. ${error instanceof Error ? error.message : 'Tente novamente.'}`);
                setUsuarios([]);
            }
        };

        const fetchComunicados = async () => {
            console.log('FETCH_COMUNICADOS (ComunicadosScreen): Iniciando busca de comunicados...');
            try {
                const token = await getToken();
                if (!token) {
                    console.warn('FETCH_COMUNICADOS (ComunicadosScreen): Token não encontrado. Não será possível buscar comunicados.');
                    return;
                }
                const response = await fetch('http://192.168.0.10:8080/api/comunicados', {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });
                if (!response.ok) {
                    const errorText = await response.text();
                    console.error(`FETCH_COMUNICADOS (ComunicadosScreen): Erro HTTP! status: ${response.status}, corpo: ${errorText}`);
                    throw new Error(`Erro ao carregar comunicados: ${response.status} - ${errorText}`);
                }
                const data: Comunicado[] = await response.json();
                const formattedData = data.map(comunicado => ({
                    ...comunicado,
                    id: String(comunicado.id), // Garante que o ID do comunicado é string
                    remetente: { ...comunicado.remetente, id: String(comunicado.remetente.id) }, // Garante que o ID do remetente é string
                    destinatarios: comunicado.destinatarios.map(d => ({ ...d, id: String(d.id) })), // Garante que os IDs dos destinatários são strings
                    dataEnvio: new Date(comunicado.dataEnvio).toLocaleDateString('pt-BR')
                }));
                setComunicadosEnviados(formattedData);
                console.log('FETCH_COMUNICADOS (ComunicadosScreen): Comunicados carregados com sucesso. Total:', data.length);
            } catch (error) {
                console.error("FETCH_COMUNICADOS (ComunicadosScreen): Falha ao buscar comunicados:", error);
                Alert.alert("Erro", `Não foi possível carregar os comunicados. ${error instanceof Error ? error.message : 'Tente novamente.'}`);
                setComunicadosEnviados([]);
            }
        };

        fetchUsersForComunicado();
        fetchComunicados();
    }, [getToken, getUserIdFromToken]); // Adicione dependências para que useEffect saiba quando recarregar

    // Novo useEffect para recarregar comunicados quando o userId estiver disponível
    useEffect(() => {
        // Se currentUserId for relevante para filtrar ou exibir os comunicados
        // que já foram carregados, esta é a parte onde você pode re-filtrá-los.
        // No seu caso, a lógica de isSender/isRecipient já é chamada no renderItem
        // a cada render, então ter currentUserId como estado já é suficiente.
    }, [currentUserId]); // Roda quando currentUserId muda (ou seja, quando é carregado do token)


    const adicionarDestinatario = (usuario: Usuario) => {
        if (editingComunicadoId) {
            setEditedComunicado(prev => {
                if (!prev.destinatarios.some(d => d.id === usuario.id)) {
                    const updatedDest = [...prev.destinatarios, usuario];
                    console.log('DEBUG FRONTEND: Destinatário EDITADO adicionado:', usuario.nome, 'Novos destinatários:', JSON.stringify(updatedDest.map(d => `${d.nome} (${d.tipo})`)));
                    return { ...prev, destinatarios: updatedDest };
                }
                return prev;
            });
        } else {
            if (!novoComunicado.destinatarios.some(d => d.id === usuario.id)) {
                const updatedDest = [...novoComunicado.destinatarios, usuario];
                console.log('DEBUG FRONTEND: Destinatário NOVO adicionado:', usuario.nome, 'Novos destinatários:', JSON.stringify(updatedDest.map(d => `${d.nome} (${d.tipo})`)));
                setNovoComunicado({
                    ...novoComunicado,
                    destinatarios: updatedDest,
                });
            }
        }
    };

    const removerDestinatario = (usuarioId: string) => {
        if (editingComunicadoId) {
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

    // Função auxiliar para agrupar destinatários por tipo para o backend
    const groupDestinatariosByType = (dest: Usuario[]) => {
        const alunoIds: number[] = [];
        const coordenadorIds: number[] = [];
        const supervisorIds: number[] = [];
        const tecnicoIds: number[] = [];

        dest.forEach(d => {
            const idAsNumber = Number(d.id); // Convertendo ID de string para number AQUI
            if (isNaN(idAsNumber)) {
                console.warn(`ID inválido para destinatário ${d.nome}: ${d.id}`);
                return;
            }
            switch (d.tipo?.toUpperCase()) {
                case 'ALUNO':
                    alunoIds.push(idAsNumber);
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
                    console.warn('Tipo de destinatário desconhecido ou inválido:', d.tipo, 'para ID:', d.id);
            }
        });
        return { alunoIds, coordenadorIds, supervisorIds, tecnicoIds };
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

            const { alunoIds, coordenadorIds, supervisorIds, tecnicoIds } = groupDestinatariosByType(novoComunicado.destinatarios);

            const requestBody = {
                assunto: novoComunicado.assunto,
                mensagem: novoComunicado.mensagem,
                alunoIds: alunoIds.length > 0 ? alunoIds : null,
                coordenadorIds: coordenadorIds.length > 0 ? coordenadorIds : null,
                supervisorIds: supervisorIds.length > 0 ? supervisorIds : null,
                tecnicoIds: tecnicoIds.length > 0 ? tecnicoIds : null,
            };
            console.log('DEBUG FRONTEND: Request Body sendo enviado (Criar):', JSON.stringify(requestBody, null, 2));


            const response = await fetch('http://192.168.0.10:8080/api/comunicados', {
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
            setComunicadosEnviados([...comunicadosEnviados, {
                ...comunicadoSalvo,
                id: String(comunicadoSalvo.id), // Garante que o ID é string
                remetente: { ...comunicadoSalvo.remetente, id: String(comunicadoSalvo.remetente.id) }, // Garante que o ID do remetente é string
                destinatarios: comunicadoSalvo.destinatarios.map(d => ({ ...d, id: String(d.id) })), // Garante que os IDs dos destinatários são strings
                dataEnvio: new Date(comunicadoSalvo.dataEnvio).toLocaleDateString('pt-BR')
            }]);

            setNovoComunicado({
                destinatarios: [],
                assunto: '',
                mensagem: '',
                dataEnvio: new Date().toLocaleDateString('pt-BR'),
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
            destinatarios: comunicadoParaEditar.destinatarios,
        });
        setMostrarFormulario(true);
    };

    const saveEditedComunicado = async () => {
        if (editingComunicadoId) {
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

                const { alunoIds, coordenadorIds, supervisorIds, tecnicoIds } = groupDestinatariosByType(editedComunicado.destinatarios);

                const requestBody = {
                    assunto: editedComunicado.assunto,
                    mensagem: editedComunicado.mensagem,
                    alunoIds: alunoIds.length > 0 ? alunoIds : null,
                    coordenadorIds: coordenadorIds.length > 0 ? coordenadorIds : null,
                    supervisorIds: supervisorIds.length > 0 ? supervisorIds : null,
                    tecnicoIds: tecnicoIds.length > 0 ? tecnicoIds : null,
                };
                console.log('DEBUG FRONTEND: Request Body sendo enviado (Atualizar):', JSON.stringify(requestBody, null, 2));


                const response = await fetch(`http://192.168.0.10:8080/api/comunicados/${editingComunicadoId}`, {
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
                    comunicado.id === editingComunicadoId ? {
                        ...comunicadoAtualizadoBackend,
                        id: String(comunicadoAtualizadoBackend.id), // Garante que o ID é string
                        remetente: { ...comunicadoAtualizadoBackend.remetente, id: String(comunicadoAtualizadoBackend.remetente.id) }, // Garante que o ID do remetente é string
                        destinatarios: comunicadoAtualizadoBackend.destinatarios.map(d => ({ ...d, id: String(d.id) })), // Garante que os IDs dos destinatários são strings
                        dataEnvio: new Date(comunicadoAtualizadoBackend.dataEnvio).toLocaleDateString('pt-BR')
                    } : comunicado
                );
                setComunicadosEnviados(updatedComunicados);

                setEditingComunicadoId(null);
                setEditedComunicado({ assunto: '', mensagem: '', destinatarios: [] });
                setMostrarFormulario(false);
                Alert.alert('Sucesso', 'Comunicado atualizado com sucesso!');
            } catch (error) {
                console.error("Erro ao atualizar comunicado:", error);
                Alert.alert("Não é possível atualizar o comunicado.");
            }
        }
    };

    const deleteComunicado = (idComunicado: string) => {
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

                            const response = await fetch(`http://192.168.0.10:8080/api/comunicados/${idComunicado}`, {
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

    const hideComunicado = (comunicadoId: string) => {
        setHiddenComunicados(prev => [...prev, comunicadoId]);
        Alert.alert('Comunicado Oculto', 'Este comunicado não será mais exibido na sua lista.');
    };

    const visibleComunicados = comunicadosEnviados.filter(item => !hiddenComunicados.includes(item.id));

    return (
        <ScrollView style={styles.section}>
            <Text style={styles.sectionTitle}>Comunicados</Text>

            {!mostrarFormulario && !editingComunicadoId ? (
                <Button
                    title="Adicionar Comunicado"
                    onPress={() => {
                        setMostrarFormulario(true);
                        setEditingComunicadoId(null);
                        setEditedComunicado({ assunto: '', mensagem: '', destinatarios: [] });
                    }}
                    icon={faPlus}
                    style={{ marginBottom: 15 }}
                    textColor="#1c348e"
                />
            ) : (
                <View style={styles.formContainer}>
                    <Text style={styles.formTitle}>
                        {editingComunicadoId ? "Editando Comunicado" : "Adicionando Comunicado"}
                    </Text>

                    <Text style={styles.label}>
                        Data: {new Date().toLocaleDateString('pt-BR')}
                    </Text>

                    <Text style={styles.label}>Destinatários:</Text>
                    <View style={styles.destinatariosContainer}>
                        {(editingComunicadoId ? editedComunicado.destinatarios : novoComunicado.destinatarios).map(destinatario => (
                            <View key={destinatario.id} style={styles.destinatarioTag}>
                                <Text style={styles.destinatarioText}>{destinatario.nome} ({destinatario.tipo})</Text>
                                <TouchableOpacity onPress={() => removerDestinatario(destinatario.id)}>
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
                            .filter(u =>
                                !(editingComunicadoId ? editedComunicado.destinatarios : novoComunicado.destinatarios).some(d => d.id === u.id) &&
                                u.nome.toLowerCase().includes(searchTerm.toLowerCase())
                            )
                            .map(usuario => (
                                <TouchableOpacity
                                    key={usuario.id}
                                    style={styles.usuarioItem}
                                    onPress={() => adicionarDestinatario(usuario)}
                                >
                                    <Text>{usuario.nome} ({usuario.tipo})</Text>
                                </TouchableOpacity>
                            ))}
                    </ScrollView>

                    <Text style={styles.label}>Assunto:</Text>
                    <TextInput
                        value={editingComunicadoId ? editedComunicado.assunto : novoComunicado.assunto}
                        onChangeText={text => editingComunicadoId ? setEditedComunicado({ ...editedComunicado, assunto: text }) : setNovoComunicado({ ...novoComunicado, assunto: text })}
                        placeholder="Digite o assunto"
                        style={styles.input}
                    />

                    <Text style={styles.label}>Mensagem:</Text>
                    <TextInput
                        value={editingComunicadoId ? editedComunicado.mensagem : novoComunicado.mensagem}
                        onChangeText={text => editingComunicadoId ? setEditedComunicado({ ...editedComunicado, mensagem: text }) : setNovoComunicado({ ...novoComunicado, mensagem: text })}
                        placeholder="Digite a mensagem"
                        multiline
                        numberOfLines={4}
                        style={[styles.input, styles.textArea]}
                    />

                    <View style={styles.buttonGroup}>
                        <Button
                            title={editingComunicadoId ? "Salvar Alterações" : "Enviar"}
                            onPress={editingComunicadoId ? saveEditedComunicado : enviarComunicado}
                            style={styles.submitButton}
                            textColor='#fff'
                        />
                        <Button
                            title="Cancelar"
                            onPress={() => {
                                setMostrarFormulario(false);
                                setEditingComunicadoId(null);
                                setEditedComunicado({ assunto: '', mensagem: '', destinatarios: [] });
                                setNovoComunicado({ assunto: '', mensagem: '', destinatarios: [], dataEnvio: new Date().toLocaleDateString('pt-BR') });
                                setSearchTerm('');
                            }}
                            textColor='#fff'
                            style={styles.cancelButton}
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
                    keyExtractor={item => item.id}
                    renderItem={({ item }) => {
                        
                        const isSender = currentUserId === item.remetente.id;

                        // Verifica se o usuário logado é um dos destinatários
                        const isRecipient = item.destinatarios.some(d => d.id === currentUserId);

                        console.log(`--- Comunicado ID: ${item.id} ---`);
                        console.log(`currentUserId: '${currentUserId}' (type: ${typeof currentUserId})`);
                        console.log(`item.remetente.id: '${item.remetente.id}' (type: ${typeof item.remetente.id})`);
                        console.log(`isSender: ${isSender}`);
                        console.log(`isRecipient: ${isRecipient}`);
                        console.log('------------------------------');

                        return (
                            <View style={styles.comunicadoCard}>
                                <Text style={styles.comunicadoAssunto}>{item.assunto}</Text>
                                <Text style={styles.comunicadoData}>Enviado em: {item.dataEnvio}</Text>
                                <Text style={styles.comunicadoMensagem}>{item.mensagem}</Text>
                                {item.remetente && (
                                    <Text style={styles.comunicadoRemetente}>
                                        De: {item.remetente.nome} ({item.remetente.tipo})
                                    </Text>
                                )}
                                <Text style={styles.comunicadoDestinatarios}>
                                    Para: {item.destinatarios.map(d => `${d.nome} (${d.tipo})`).join(', ')}
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