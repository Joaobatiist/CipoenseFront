import { faAddressBook, faAddressCard, faBars, faBell, faBoxes, faCalendarAlt, faChartLine, faCheck, faFileInvoice, faIdCard, faRobot, faSignOutAlt, faTimes } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StackActions, useNavigation } from '@react-navigation/native';
import { router } from 'expo-router';
import { jwtDecode, JwtPayload } from 'jwt-decode';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, FlatList, Image, LayoutChangeEvent, SafeAreaView, ScrollView, Text, TextInput, TouchableOpacity, View, } from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { TextInputMask } from 'react-native-masked-text';
import { Button } from "../../components/button/index";
import { styles } from '../../Styles/Supervisor'; // Importando seu arquivo de estilos
import { ptBR } from "../../utils/localendarConfig";
import ComunicadosSection from '../funcionarios/Comunicado';

LocaleConfig.locales["pt-br"] = ptBR;
LocaleConfig.defaultLocale = "pt-br";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

interface SectionOffsets {
  agenda?: number; 
  comunicados?: number;
  desempenho?: number;
  perfil?: number;
}

interface Evento {
  id: string;
  data: string;
  descricao: string;
  professor: string;
  local: string;
  horario: string;
}
interface CustomJwtPayload extends JwtPayload {
  sub?: string;
  userId?: number;
  userType?: string;
  userName?: string;
}

const Coordenador: React.FC = () => {
  const navigation = useNavigation();
  const [isTokenLoaded, setIsTokenLoaded] = useState<boolean>(false);
const [authToken, setAuthToken] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const sectionOffsetsRef = useRef<SectionOffsets>({});

 
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    const offset = today.getTimezoneOffset() * 60000;
    return new Date(today.getTime() - offset).toISOString().split('T')[0];
  });
  const [descricao, setDescricao] = useState('');
  const [loggedInUserName, setLoggedInUserName] = useState<string>(''); // Para o usuário logado
const [formProfessor, setFormProfessor] = useState<string>(''); 
  const [local, setLocal] = useState('');
  const [horario, setHorario] = useState('');
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);

  const getToken = async (): Promise<string | null> => {
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      console.log('DEBUG TOKEN : Chamada getToken()');
      if (token) {
        console.log('DEBUG TOKEN : Token recuperado do AsyncStorage. Tamanho:', token.length, 'Inicia com:', token.substring(0, 20), '...');
      } else {
        console.log('DEBUG TOKEN : Token NÃO encontrado no AsyncStorage (é null ou undefined).');
      }
      return token;
    } catch (error) {
      console.error('DEBUG TOKEN : Erro ao obter token do AsyncStorage:', error);
      return null;
    }
  };

  useEffect(() => {
    const fetchEvents = async () => {
      console.log('FETCH_EVENTS : Iniciando busca de eventos...');
      try {
        const token = await getToken();
        if (!token) {
          console.warn('FETCH_EVENTS : Token não encontrado para buscar eventos. Interrompendo a busca.');
          Alert.alert('Erro de Autenticação', 'Sua sessão expirou ou você não está logado. Por favor, faça login novamente para ver os treinos.');
          return;
        }
        console.log('FETCH_EVENTS: Token presente para requisição GET de eventos.');

        const response = await fetch(`${API_BASE_URL}/api/eventos`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('FETCH_EVENTS: Erro ao buscar eventos do backend:', response.status, errorText);
          throw new Error(`Falha ao carregar eventos: ${response.status} - ${errorText}`);
        }

        const data: Evento[] = await response.json();
        const formattedData = data.map(event => ({
          ...event,
          data: new Date(event.data + 'T00:00:00').toLocaleDateString('pt-BR'),
        }));
        setEventos(formattedData);
        console.log('FETCH_EVENTS: Eventos carregados com sucesso.');
      } catch (error) {
        console.error("FETCH_EVENTS : Falha ao buscar eventos:", error);
        Alert.alert("Erro", `Não foi possível carregar a agenda de treinos. ${error instanceof Error ? error.message : 'Tente novamente.'}`);
        setEventos([]);
      }
    };

    fetchEvents();
  }, []);

  function Presenca () {
    router.navigate("../Tarefas/Presenca")
  }
  function AnaliseIa ( ){
  router.navigate("../Tarefas/AnaliseIa")
  }
  function AvaliacaoGeral () {
    router.navigate("../Tarefas/AvaliacaoGeral")
  }
  function listaAtletas (){
    router.navigate("../Tarefas/ListaAtletas")
  }
  function Relatorio() {
    router.navigate("../funcionarios/Relatorios");
  }

  function CadastrarAluno(){
    router.navigate("../Cadastro/CadastroAluno")
  }
  function Estoque (){
    router.navigate('../Tarefas/ControleEstoque')
  }
  function listaDeFuncionarios(){
    router.navigate("../Tarefas/listarFuncionarios")
  }

  function CadastrarFuncionario(){
    router.navigate("../Cadastro/Cadastros")
  }
  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('jwtToken');
      console.log('LOGOUT : Token JWT removido com sucesso!');
      closeSidebar();
      router.replace('../../');
    } catch (error) {
      console.error('LOGOUT : Erro ao fazer logout:', error);
      Alert.alert('Erro ao Sair', 'Não foi possível sair no momento. Tente novamente.');
    }
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  const scrollToSection = (sectionName: keyof SectionOffsets) => {
    closeSidebar();
    const offset = sectionOffsetsRef.current[sectionName];
    if (offset !== undefined) {
      scrollViewRef.current?.scrollTo({ y: offset, animated: true });
    } else {
      console.warn(`Seção '${sectionName}' offset não encontrado.`);
    }
  };

  const handleLayout = (event: LayoutChangeEvent, sectionName: keyof SectionOffsets) => {
    sectionOffsetsRef.current[sectionName] = event.nativeEvent.layout.y;
  };

  const navigateToMeusTreinos = () => {
    scrollToSection('agenda');
  };

  const navigateToComunicados = () => {
    scrollToSection('comunicados');
  };

  const adicionarTreino = async () => {
    if (descricao.trim() === '' || formProfessor.trim() === '' || local.trim() === '' || horario.trim() === '') {
      Alert.alert('Erro', 'Preencha todos os campos do treino: Descrição, Professor, Local e Horário.');
      return;
    }

    const formattedDateForBackend = new Date(selectedDate + 'T00:00:00').toISOString().split('T')[0];

    const novoEventoBackend = {
      data: formattedDateForBackend,
      descricao: descricao,
      professor: loggedInUserName,
      local: local,
      horario: horario,
    };

    try {
      const token = await getToken();
      if (!token) {
        Alert.alert('Erro', 'Você não está autenticado. Faça login novamente.');
        return;
      }
      console.log('ADICIONAR_TREINO: Token presente para requisição POST.');

      const response = await fetch(`${API_BASE_URL}/api/eventos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(novoEventoBackend),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('ADICIONAR_TREINO: Erro ao adicionar treino no backend:', response.status, errorText);
        throw new Error(`Falha ao adicionar treino: ${response.status} - ${errorText}`);
      }

      const eventoSalvo: Evento = await response.json();

      const formattedEventoSaved: Evento = {
        ...eventoSalvo,
        data: new Date(eventoSalvo.data + 'T00:00:00').toLocaleDateString('pt-BR'),
      };

      setEventos(prevEventos => [...prevEventos, formattedEventoSaved]);

      setDescricao('');
      setFormProfessor(loggedInUserName);
      setLocal('');
      setHorario('');
      Alert.alert('Sucesso', 'Treino adicionado com sucesso!');
      console.log('ADICIONAR_TREINO: Treino adicionado com sucesso.');

    } catch (error) {
      console.error("ADICIONAR_TREINO: Erro ao adicionar treino:", error);
      Alert.alert("Erro", `Não foi possível adicionar o treino. ${error instanceof Error ? error.message : 'Tente novamente.'}`);
    }
  };
  const checkAuthAndRedirect = useCallback(async () => {
    try {
      const storedToken = await AsyncStorage.getItem('jwtToken');
      if (!storedToken) {
        Alert.alert(
          'Autenticação Necessária',
          'Sua sessão expirou ou você não está logado. Você será redirecionado para a tela de login.',
          [{
            text: 'OK',
            onPress: () => {
              navigation.dispatch(StackActions.replace('Login'));
            }
          }]
        );
        return false;
      }
      return true;
    } catch (error) {
      console.error('Erro ao verificar token para redirecionamento:', error);
      Alert.alert('Erro', 'Ocorreu um erro ao verificar sua autenticação.');
      return false;
    }
  }, [navigation]);
  useEffect(() => {
    const loadAuthData = async () => {
      setIsTokenLoaded(false);
      try {
        const storedToken = await AsyncStorage.getItem('jwtToken');
        if (storedToken) {
          setAuthToken(storedToken);
          try {
            const decodedToken = jwtDecode<CustomJwtPayload>(storedToken);

            if (decodedToken.userName) {
              setLoggedInUserName(decodedToken.userName); // Define o nome do usuário logado
            setFormProfessor(decodedToken.userName);    // Inicializa o formulário com o nome do logado
            } else if (decodedToken.sub) {
             setLoggedInUserName(decodedToken.sub);
             setFormProfessor(decodedToken.sub);
            }
          } catch (decodeError) {
            console.error('Erro ao decodificar o token:', decodeError);
            Alert.alert('Erro de Token', 'Não foi possível decodificar o token de autenticação.');
            await AsyncStorage.removeItem('jwtToken');
            await checkAuthAndRedirect();
          }
        } else {
          await checkAuthAndRedirect();
        }
      } catch (error) {
        console.error('Erro ao carregar token de autenticação do AsyncStorage:', error);
        Alert.alert('Erro', 'Não foi possível carregar o token de autenticação. Tente novamente.');
      } finally {
        setIsTokenLoaded(true);
      }
    };
    loadAuthData();
  }, [checkAuthAndRedirect]);

  const startEditingTreino = (eventToEdit: Evento) => {
    setEditingEventId(eventToEdit.id);
    
    const dateParts = eventToEdit.data.split('/');
    const formattedDateForInput = `${dateParts[2]}-${dateParts[1].padStart(2, '0')}-${dateParts[0].padStart(2, '0')}`;
    setSelectedDate(formattedDateForInput);
    setDescricao(eventToEdit.descricao);
    setFormProfessor(eventToEdit.professor);
    setLocal(eventToEdit.local);
    setHorario(eventToEdit.horario);
  };

  const saveEditedTreino = async () => {
    if (editingEventId === null) return;
    if (descricao.trim() === '' || formProfessor.trim() === '' || local.trim() === '' || horario.trim() === '') {
      Alert.alert('Erro', 'Preencha todos os campos do treino para atualizar.');
      return;
    }

    const formattedDateForBackend = new Date(selectedDate + 'T00:00:00').toISOString().split('T')[0];

    const updatedEventBackend = {
      id: editingEventId,
      data: formattedDateForBackend,
      descricao: descricao,
      professor: formProfessor,
      local: local,
      horario: horario,
    };

    try {
      const token = await getToken();
      if (!token) {
        Alert.alert('Erro', 'Você não está autenticado. Faça login novamente.');
        return;
      }
      console.log('SALVAR_EDITAR_TREINO: Token presente para requisição PUT.');

      const response = await fetch(`${API_BASE_URL}/api/eventos/${editingEventId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updatedEventBackend),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('SALVAR_EDITAR_TREINO: Erro ao atualizar treino no backend:', response.status, errorText);
        throw new Error(`Falha ao atualizar treino: ${response.status} - ${errorText}`);
      }

      const eventoAtualizado: Evento = await response.json();

      const formattedEventoUpdated: Evento = {
        ...eventoAtualizado,
        data: new Date(eventoAtualizado.data + 'T00:00:00').toLocaleDateString('pt-BR'),
      };

      setEventos(prevEventos =>
        prevEventos.map(event => (event.id === editingEventId ? formattedEventoUpdated : event))
      );

      setEditingEventId(null);
      setDescricao('');
      setFormProfessor(loggedInUserName);
      setLocal('');
      setHorario('');
      Alert.alert('Sucesso', 'Treino atualizado com sucesso!');
      console.log('SALVAR_EDITAR_TREINO: Treino atualizado com sucesso.');

    } catch (error) {
      console.error("SALVAR_EDITAR_TREINO: Erro ao atualizar treino:", error);
      Alert.alert("Erro", `Não foi possível atualizar o treino. ${error instanceof Error ? error.message : 'Tente novamente.'}`);
    }
  };

  const excluirTreino = (idTreino: string) => {
    Alert.alert(
      'Confirmar Exclusão',
      'Tem certeza que deseja excluir este treino?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Excluir',
          onPress: async () => {
            try {
              const token = await getToken();
              if (!token) {
                Alert.alert('Erro', 'Você não está autenticado. Faça login novamente.');
                return;
              }
              console.log('EXCLUIR_TREINO: Token presente para requisição DELETE.');

              const response = await fetch(`${API_BASE_URL}/api/eventos/${idTreino}`, {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${token}`,
                },
              });

              if (!response.ok) {
                const errorText = await response.text();
                console.error('EXCLUIR_TREINO: Erro ao deletar treino no backend:', response.status, errorText);
                throw new Error(`Falha ao deletar treino: ${response.status} - ${errorText}`);
              }

              setEventos(prevEventos => prevEventos.filter(evento => evento.id !== idTreino));
              Alert.alert('Sucesso', 'Treino excluído com sucesso!');
              console.log('EXCLUIR_TREINO: Treino excluído com sucesso.');

            } catch (error) {
              console.error("EXCLUIR_TREINO: Erro ao excluir treino:", error);
              Alert.alert("Erro", `Não foi possível excluir o treino. ${error instanceof Error ? error.message : 'Tente novamente.'}`);
            }
          },
          style: 'destructive',
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      
      <View style={styles.header}>
        <TouchableOpacity style={styles.menuButton} onPress={toggleSidebar}>
          <FontAwesomeIcon icon={sidebarOpen ? faTimes : faBars} size={24} color="#ffffffff" />
          
        </TouchableOpacity>
        <Text style={styles.titleheader}>Olá, {loggedInUserName}!</Text>
      </View>

      {sidebarOpen && (
        
        <View style={styles.sidebar}>
           
          <TouchableOpacity style={styles.closeButton} onPress={closeSidebar}>
            <FontAwesomeIcon icon={faTimes} size={24} color="#fff" />
          </TouchableOpacity>

          <Image
                      source={require("../../../assets/images/escudo.png")}
                      style={{ width: "80%", height: 90, borderRadius: 55, marginLeft: 20 }}
                    />
                    <Text style={styles.title}>Associação Desportiva Cipoense</Text>
        <ScrollView ref={scrollViewRef} style={styles.scrollContainer}>
          <TouchableOpacity style={styles.navItem} onPress={() => scrollToSection('agenda')}>
            <FontAwesomeIcon icon={faCalendarAlt} size={16} color="#fff" style={styles.navIcon} />
            <Text style={styles.navText}>Agenda de Treinos</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={Relatorio}>
            <FontAwesomeIcon icon={faChartLine} size={16} color="#fff" style={styles.navIcon} />
            <Text style={styles.navText}>Avaliação de Desempenho</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => scrollToSection('comunicados')}>
            <FontAwesomeIcon icon={faBell} size={16} color="#fff" style={styles.navIcon} />
            <Text style={styles.navText}>Comunicados</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={Presenca}>
            <FontAwesomeIcon icon={faCheck} size={16} color="#fff" style={styles.navIcon} />
            <Text style={styles.navText}>Lista de Presença</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.navItem} onPress={CadastrarFuncionario}>
            <FontAwesomeIcon icon={faIdCard} size={16} color="#fff" style={styles.navIcon} />
            <Text style={styles.navText}>Cadastrar Funcionario</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={CadastrarAluno}>
            <FontAwesomeIcon icon={faAddressCard} size={16} color="#fff" style={styles.navIcon} />
            <Text style={styles.navText}>Cadastrar Aluno</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navItem} onPress={Estoque}>
            <FontAwesomeIcon icon={faBoxes} size={16} color="#fff" style={styles.navIcon} />
            <Text style={styles.navText}>estoque</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={AvaliacaoGeral}>
            <FontAwesomeIcon icon={faFileInvoice}  size={16} color="#fff" style={styles.navIcon} />
            <Text style={styles.navText}>Relatorio de Desempenho</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={AnaliseIa}>
            <FontAwesomeIcon icon={faRobot} size={16} color="#fff" style={styles.navIcon} />
            <Text style={styles.navText}>Analise do atleta pela IA</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={listaAtletas}>
            <FontAwesomeIcon icon={faAddressBook}  size={16} color="#fff" style={styles.navIcon} />
            <Text style={styles.navText}>Lista de Atletas</Text>
          </TouchableOpacity>
           <TouchableOpacity style={styles.navItem} onPress={listaDeFuncionarios}>
            <FontAwesomeIcon icon={faAddressBook}  size={16} color="#fff" style={styles.navIcon} />
            <Text style={styles.navText}>Lista de Funcionarios</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={handleLogout}>
            <FontAwesomeIcon icon={faSignOutAlt} size={16} color="#fff" style={styles.navIcon} />
            <Text style={styles.navText}>Sair</Text>
          </TouchableOpacity>
          </ScrollView>
        </View>
        
      )}

      <ScrollView ref={scrollViewRef} style={styles.scrollContainer}>
        <View style={styles.section} onLayout={(event) => handleLayout(event, 'agenda')}>
          <Text style={styles.sectionTitle}>Agenda de Treinos</Text>

          <Calendar
            onDayPress={day => {
              setSelectedDate(day.dateString);
            }}
            markedDates={{
              [selectedDate]: {
                selected: true,
                selectedColor: 'blue',
                selectedTextColor: 'white'
              }
            }}
            minDate={new Date().toISOString().split('T')[0]}
            theme={{
              todayTextColor: 'blue',
              arrowColor: 'blue',
            }}
          />

          <Text style={{ marginVertical: 10 }}>
            Data selecionada: {new Date(selectedDate + 'T00:00:00').toLocaleDateString('pt-BR')}
          </Text>

          <TextInput
            value={descricao}
            onChangeText={setDescricao}
            placeholder="Descrição do treino"
            style={styles.input}
          />
          <TextInput
            value={formProfessor}    
            onChangeText={setFormProfessor}
            placeholder="Nome do Professor"
            style={styles.input}
            editable={false}
          />
          <TextInput
            value={local}
            onChangeText={setLocal}
            placeholder="Local do Treino"
            style={styles.input}
          />
          <TextInputMask
           style={styles.input}
            type={'datetime'}
            options={{
              format: 'HH:MM',
            }}
            onChangeText={setHorario}
            value={horario}
            placeholder="Horário (ex: 10:00)"
            keyboardType="numeric"
          />

          <View style={styles.trainingButtonsContainer}>
            <Button
              title={editingEventId ? "Atualizar treino" : "Adicionar treino"}
              textColor="#fff"
              onPress={editingEventId ? saveEditedTreino : adicionarTreino}
              style={styles.trainingActionButton} icon={undefined}            />
            {editingEventId && (
              <Button
                title="Cancelar Edição"
                textColor="#fff"
                onPress={() => {
                  setEditingEventId(null);
                  setDescricao('');
                 setFormProfessor(loggedInUserName);
                  setLocal('');
                  setHorario('');
                } }
                style={styles.trainingCancelButton} icon={undefined}              />
            )}
          </View>

          <View style={{ marginTop: 20 }}>
            <Text style={styles.subTitle}>Treinos Marcados:</Text>
            <FlatList
              data={eventos}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <View style={styles.eventCard}>
                  <Text style={styles.eventDate}>📅 {item.data}</Text>
                  <Text style={styles.eventDescription}>📝 {item.descricao}</Text>
                  <Text style={styles.eventDetail}>👨‍🏫 Professor: {item.professor}</Text>
                  <Text style={styles.eventDetail}>📍 Local: {item.local}</Text>
                  <Text style={styles.eventDetail}>⏰ Horário: {item.horario}</Text>
                  <View style={styles.eventActions}>
                    <TouchableOpacity onPress={() => startEditingTreino(item)} style={styles.editButton}>
                      <FontAwesomeIcon icon={faIdCard} size={16} color="#fff" />
                      <Text style={styles.buttonText}>Editar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => excluirTreino(item.id)} style={styles.deleteButton}>
                      <FontAwesomeIcon icon={faTimes} size={16} color="#fff" />
                      <Text style={styles.buttonText}>Excluir</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
              ListEmptyComponent={<Text style={styles.emptyMessage}>Nenhum treino marcado ainda.</Text>}
              scrollEnabled={false}
            />
          </View>
        </View>

      

        <View onLayout={(event) => handleLayout(event, 'comunicados')}>
          <ComunicadosSection />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Coordenador;