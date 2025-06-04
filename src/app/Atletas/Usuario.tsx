import React, { useState, useRef } from 'react';
import { SafeAreaView, View, TouchableOpacity, Text, ScrollView, LayoutChangeEvent, TextInput, FlatList } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faBars, faTimes, faCalendarAlt, faChartLine, faBell, faUser, faSignOutAlt, faPlus } from '@fortawesome/free-solid-svg-icons';
import { Button } from "../../components/button"
import { ptBR } from "../../utils/localendarConfig"
import { Calendar, LocaleConfig } from 'react-native-calendars'; 
import { router } from 'expo-router';
import { styles } from "./Usuario"

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

  

  function Perfil() {
    router.navigate("./index");
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

  const navigateToDesempenho = () => {
    const desempenhoOffset = sectionOffsetsRef.current.desempenho || 0;
    scrollToSection(desempenhoOffset);
  };

  const navigateToComunicados = () => {
    const comunicadosOffset = sectionOffsetsRef.current.comunicados || 0;
    scrollToSection(comunicadosOffset);
  };

  const navigateToMeusTreinos = () => {
    scrollToSection(0);
  };

  // Funções para agenda de treinos
  
  

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
          <TouchableOpacity style={styles.navItem} onPress={navigateToDesempenho}>
            <FontAwesomeIcon icon={faChartLine} size={16} color="#fff" style={styles.navIcon} />
            <Text style={styles.navText}>Meu Desempenho</Text>
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

         
          </View>
        

        {/* Seção Meu Desempenho */}
        <View style={styles.section} onLayout={(event) => handleLayout(event, 'desempenho')}>
          <Text style={styles.sectionTitle}>Meu Desempenho</Text>
          <Text>Conteúdo da seção Meu Desempenho...</Text>
        </View>

        {/* Seção Comunicados */}
        <View style={styles.section} onLayout={(event) => handleLayout(event, 'comunicados')}>
          <Text style={styles.sectionTitle}>Comunicados</Text>
          
         </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default MinimalScreen;