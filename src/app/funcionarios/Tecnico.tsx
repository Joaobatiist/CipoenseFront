import React, { useState, useRef } from 'react';
import { SafeAreaView, View, TouchableOpacity, Text, ScrollView, LayoutChangeEvent, TextInput, FlatList } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faBars, faTimes, faCalendarAlt, faChartLine, faBell, faUser, faSignOutAlt, faPlus, faIdCard } from '@fortawesome/free-solid-svg-icons';
import { Button } from "../../components/button"
import { ptBR } from "../../utils/localendarConfig"
import { Calendar, LocaleConfig } from 'react-native-calendars'; 
import { router } from 'expo-router';
import { styles } from "./styles"

LocaleConfig.locales["pt-br"] = ptBR
LocaleConfig.defaultLocale = "pt-br"

interface SectionOffsets {
  desempenho?: number;
  comunicados?: number;
  perfil?: number;
}

interface Usuario {
  id: string;
  nome: string;
}

interface Comunicado {
  id: string;
  destinatarios: Usuario[];
  assunto: string;
  mensagem: string;
  dataEnvio: string;
}

const MinimalScreen: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null); 
  const sectionOffsetsRef = useRef<SectionOffsets>({});

  // Estados para agenda de treinos
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    const offset = today.getTimezoneOffset() * 60000;
    return new Date(today.getTime() - offset).toISOString().split('T')[0];
  });
  const [descricao, setDescricao] = useState('');
  const [eventos, setEventos] = useState<{ data: string; descricao: string }[]>([]);

  // Estados para comunicados
  const [usuarios, getUsuarios] = useState<Usuario[]>([
    { id: '1', nome: 'João Silva' },
    { id: '2', nome: 'Maria Souza' },
    { id: '3', nome: 'Carlos Oliveira' },
    { id: '4', nome: 'Ana Santos' },
    { id: '5', nome: 'Pedro Costa' },
  ]);
  
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

  function Perfil() {
    router.navigate("./Perfil");
  }
  function Relatorio(){
    router.navigate("./Relatorios")
  }
  

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  const scrollToSection = (offsetY: number) => {
    closeSidebar();
    scrollViewRef.current?.scrollTo({ y: offsetY, animated: true });
  };

  const handleLayout = (event: LayoutChangeEvent, sectionName: keyof SectionOffsets) => {
    sectionOffsetsRef.current[sectionName] = event.nativeEvent.layout.y;
  };

  

  const navigateToComunicados = () => {
    const comunicadosOffset = sectionOffsetsRef.current.comunicados || 0;
    scrollToSection(comunicadosOffset);
  };

  const navigateToMeusTreinos = () => {
    scrollToSection(0);
  };

  // Funções para agenda de treinos
  const adicionarTreino = () => {
    if (descricao.trim() === '') return;

    const novoEvento = {
      data: new Date(selectedDate).toLocaleDateString('pt-BR'),
      descricao,
    };

    setEventos([...eventos, novoEvento]);
    setDescricao('');
  };

  // Funções para comunicados
  const adicionarDestinatario = (usuario: Usuario) => {
    if (!novoComunicado.destinatarios.some(d => d.id === usuario.id)) {
      setNovoComunicado({
        ...novoComunicado,
        destinatarios: [...novoComunicado.destinatarios, usuario],
      });
    }
  };

  const removerDestinatario = (usuarioId: string) => {
    setNovoComunicado({
      ...novoComunicado,
      destinatarios: novoComunicado.destinatarios.filter(d => d.id !== usuarioId),
    });
  };

  const enviarComunicado = () => {
    if (
      novoComunicado.assunto.trim() === '' ||
      novoComunicado.mensagem.trim() === '' ||
      novoComunicado.destinatarios.length === 0
    ) {
      alert('Preencha todos os campos obrigatórios');
      return;
    }

    const novoComunicadoCompleto: Comunicado = {
      id: Date.now().toString(),
      ...novoComunicado,
      dataEnvio: new Date().toLocaleDateString('pt-BR'),
    };

    setComunicadosEnviados([...comunicadosEnviados, novoComunicadoCompleto]);
    setNovoComunicado({
      destinatarios: [],
      assunto: '',
      mensagem: '',
      dataEnvio: new Date().toLocaleDateString('pt-BR'),
    });
    setMostrarFormulario(false);
    setSearchTerm('');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.menuButton} onPress={toggleSidebar}>
          <FontAwesomeIcon icon={sidebarOpen ? faTimes : faBars} size={24} color="#333" /> 
        </TouchableOpacity>
      </View>

      {sidebarOpen && (
        <View style={styles.sidebar}>
          <TouchableOpacity style={styles.closeButton} onPress={closeSidebar}>
            <FontAwesomeIcon icon={faTimes} size={24} color="#fff" />
          </TouchableOpacity>

          <Text style={styles.logo}>Associação Desportiva Cipoense</Text>

          <TouchableOpacity style={styles.navItem} onPress={navigateToMeusTreinos}>
            <FontAwesomeIcon icon={faCalendarAlt} size={16} color="#fff" style={styles.navIcon} />
            <Text style={styles.navText}>Agenda de Treinos</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={Relatorio}>
            <FontAwesomeIcon icon={faChartLine} size={16} color="#fff" style={styles.navIcon} />
            <Text style={styles.navText}>Relatorio de Desempenho</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={navigateToComunicados}>
            <FontAwesomeIcon icon={faBell} size={16} color="#fff" style={styles.navIcon} />
            <Text style={styles.navText}>Comunicados</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={Perfil}>
            <FontAwesomeIcon icon={faUser} size={16} color="#fff" style={styles.navIcon} />
            <Text style={styles.navText}>Meu Perfil</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={closeSidebar}>
            <FontAwesomeIcon icon={faSignOutAlt} size={16} color="#fff" style={styles.navIcon} />
            <Text style={styles.navText}>Sair</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView ref={scrollViewRef} style={styles.scrollContainer}>
        {/* Seção Agenda de Treinos */}
        <View style={styles.section}>
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
            style={{
              borderColor: '#ccc',
              borderWidth: 1,
              borderRadius: 5,
              padding: 10,
              marginVertical: 5,
            }}
          />

          <Button  title="Salvar" textColor="#fff"  onPress={adicionarTreino} />

          <View style={{ marginTop: 10 }}>
            <Text style={{ fontSize: 16, fontWeight: 'bold' }}>Treinos marcados:</Text>
            <FlatList
              data={eventos}
              keyExtractor={(_, index) => index.toString()}
              renderItem={({ item }) => (
                <Text style={{ paddingVertical: 5 }}>
                  📅 {item.data} - {item.descricao}
                </Text>
              )}
              ListEmptyComponent={<Text>Nenhum treino marcado ainda.</Text>}
            />
          </View>
        </View>

        {/* Seção Comunicados */}
        <View style={styles.section} onLayout={(event) => handleLayout(event, 'comunicados')}>
          <Text style={styles.sectionTitle}>Comunicados</Text>
          
          {!mostrarFormulario ? (
            <Button 
              title="Adicionar Comunicado"
             onPress={() => setMostrarFormulario(true)}
             icon={faPlus}
              style={{ marginBottom: 15 }}
                />
          ) : (
            <View style={styles.formContainer}>
              <Text style={styles.formTitle}>Adicionando Comunicado</Text>
              
              {/* Data automática */}
              <Text style={styles.label}>
                Data: {new Date().toLocaleDateString('pt-BR')}
              </Text>
              
              {/* Destinatários selecionados */}
              <Text style={styles.label}>Destinatários:</Text>
              <View style={styles.destinatariosContainer}>
                {novoComunicado.destinatarios.map(destinatario => (
                  <View key={destinatario.id} style={styles.destinatarioTag}>
                    <Text style={styles.destinatarioText}>{destinatario.nome}</Text>
                    <TouchableOpacity onPress={() => removerDestinatario(destinatario.id)}>
                      <FontAwesomeIcon icon={faTimes} size={12} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
              
              {/* Barra de pesquisa */}
              <Text style={styles.label}>Adicionar destinatário:</Text>
              <TextInput
                placeholder="Pesquisar usuários..."
                style={styles.searchInput}
                value={searchTerm}
                onChangeText={setSearchTerm}
              />
              
              {/* Lista filtrada de usuários */}
              <ScrollView style={styles.dropdownContainer}>
                {usuarios
                  .filter(u => 
                    !novoComunicado.destinatarios.some(d => d.id === u.id) &&
                    u.nome.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map(usuario => (
                    <TouchableOpacity
                      key={usuario.id}
                      style={styles.usuarioItem}
                      onPress={() => adicionarDestinatario(usuario)}
                    >
                      <Text>{usuario.nome}</Text>
                    </TouchableOpacity>
                  ))}
              </ScrollView>
              
              {/* Campos do formulário */}
              <Text style={styles.label}>Assunto:</Text>
              <TextInput
                value={novoComunicado.assunto}
                onChangeText={text => setNovoComunicado({...novoComunicado, assunto: text})}
                placeholder="Digite o assunto"
                style={styles.input}
              />
              
              <Text style={styles.label}>Mensagem:</Text>
              <TextInput
                value={novoComunicado.mensagem}
                onChangeText={text => setNovoComunicado({...novoComunicado, mensagem: text})}
                placeholder="Digite a mensagem"
                multiline
                numberOfLines={4}
                style={[styles.input, styles.textArea]}
              />
              
              {/* Botões de ação */}
              <View style={styles.buttonGroup}>
                <Button 
                  title="Cancelar" 
                  onPress={() => {
                    setMostrarFormulario(false);
                    setSearchTerm('');
                  }} 
                  textColor='#fff'
                  style={styles.cancelButton}
                />
                <Button 
                  title="Enviar" 
                  onPress={enviarComunicado} 
                  style={styles.submitButton}
                  textColor='#fff'
                />
              </View>
            </View>
          )}
          
          {/* Lista de comunicados enviados */}
          <Text style={styles.subTitle}>Comunicados Enviados</Text>
          {comunicadosEnviados.length === 0 ? (
            <Text style={styles.emptyMessage}>Nenhum comunicado enviado ainda.</Text>
          ) : (
            <FlatList
              data={comunicadosEnviados}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <View style={styles.comunicadoCard}>
                  <Text style={styles.comunicadoAssunto}>{item.assunto}</Text>
                  <Text style={styles.comunicadoData}>Enviado em: {item.dataEnvio}</Text>
                  <Text style={styles.comunicadoMensagem}>{item.mensagem}</Text>
                  <Text style={styles.comunicadoDestinatarios}>
                    Para: {item.destinatarios.map(d => d.nome).join(', ')}
                  </Text>
                </View>
              )}
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default MinimalScreen;