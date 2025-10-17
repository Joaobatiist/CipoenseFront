import { faAddressBook, faAddressCard, faBell, faBoxes, faCalendarAlt, faChartLine, faCheck, faFileInvoice, faIdCard, faRobot, faSignOutAlt, faTimes, faUser } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React from 'react';
import { Alert, Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { styles } from './styles';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  userRole: 'SUPERVISOR' | 'COORDENADOR' | 'TECNICO' ;
  onNavigateToSection: (sectionName: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  userName,
  userRole,
  onNavigateToSection,
}) => {
  
  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('jwtToken');
      console.log('LOGOUT : Token JWT removido com sucesso!');
      onClose();
      router.replace('../../');
    } catch (error) {
      console.error('LOGOUT : Erro ao fazer logout:', error);
      Alert.alert('Erro ao Sair', 'Não foi possível sair no momento. Tente novamente.');
    }
  };

  const listaPresenca = () => {
    router.navigate("../tarefas/listaPresenca");
  };

  const analiseIa = () => {
    router.navigate("/tarefas/AnaliseIa");
  };

  const exibirAvaliacaoGeral = () => {
    router.navigate("../tarefas/exibirAvaliacaoGeral");
  };

  const listaAtletas = () => {
    router.navigate("/tarefas/ListaAtletas");
  };

  const realizarRelatorio = () => {
    router.navigate("../tarefas/realizarRelatorios");
  };

  const cadastrarAtleta = () => {
    router.navigate("../cadastro/cadastroAtleta");
  };

  const controleEstoque = () => {
    router.navigate('/tarefas/ControleEstoque');
  };

  const listaDeFuncionarios = () => {
    router.navigate('/tarefas/listarFuncionarios');
  };

  const cadastrarFuncionario = () => {
    router.navigate('/cadastro/cadastrarFuncionario');
  };

  if (!isOpen) return null;

  return (
    <View style={styles.sidebar}>
      <TouchableOpacity style={styles.closeButton} onPress={onClose}>
        <FontAwesomeIcon icon={faTimes} size={24} color="#fff" />
      </TouchableOpacity>

      <Image
        source={require("../../../../assets/images/escudo.png")}
        style={styles.logo}
      />
      <Text style={styles.title}>Associação Desportiva Cipoense</Text>
      
      <ScrollView style={styles.scrollContainer}>
        {/* Agenda de Treinos - Todos os tipos */}
        <TouchableOpacity style={styles.navItem} onPress={() => onNavigateToSection('agenda')}>
          <FontAwesomeIcon icon={faCalendarAlt} size={16} color="#fff" style={styles.navIcon} />
          <Text style={styles.navText}>Agenda de Treinos</Text>
        </TouchableOpacity>
        
        {/* Avaliação de Desempenho - Supervisor, Coordenador, Técnico */}
        {(userRole === 'SUPERVISOR' || userRole === 'COORDENADOR' || userRole === 'TECNICO') && (
          <TouchableOpacity style={styles.navItem} onPress={realizarRelatorio}>
            <FontAwesomeIcon icon={faChartLine} size={16} color="#fff" style={styles.navIcon} />
            <Text style={styles.navText}>Avaliação de Desempenho</Text>
          </TouchableOpacity>
        )}

       
        
        {/* Comunicados - Todos os tipos */}
        <TouchableOpacity style={styles.navItem} onPress={() => onNavigateToSection('comunicados')}>
          <FontAwesomeIcon icon={faBell} size={16} color="#fff" style={styles.navIcon} />
          <Text style={styles.navText}>Comunicados</Text>
        </TouchableOpacity>
        
        {/* Lista de Presença - Supervisor, Coordenador, Técnico */}
        {(userRole === 'SUPERVISOR' || userRole === 'COORDENADOR' || userRole === 'TECNICO') && (
          <TouchableOpacity style={styles.navItem} onPress={listaPresenca}>
            <FontAwesomeIcon icon={faCheck} size={16} color="#fff" style={styles.navIcon} />
            <Text style={styles.navText}>Lista de Presença</Text>
          </TouchableOpacity>
        )}
        
        {/* Cadastrar Funcionário - Só Supervisor e Coordenador */}
        {(userRole === 'SUPERVISOR' || userRole === 'COORDENADOR') && (
          <TouchableOpacity style={styles.navItem} onPress={cadastrarFuncionario}>
            <FontAwesomeIcon icon={faIdCard} size={16} color="#fff" style={styles.navIcon} />
            <Text style={styles.navText}>Cadastrar Funcionario</Text>
          </TouchableOpacity>
        )}
        
        {/* Cadastrar Aluno - Supervisor, Coordenador, Técnico */}
        {(userRole === 'SUPERVISOR' || userRole === 'COORDENADOR' || userRole === 'TECNICO') && (
          <TouchableOpacity style={styles.navItem} onPress={cadastrarAtleta}>
            <FontAwesomeIcon icon={faAddressCard} size={16} color="#fff" style={styles.navIcon} />
            <Text style={styles.navText}>Cadastrar Aluno</Text>
          </TouchableOpacity>
        )}

        {/* Estoque - Supervisor, Coordenador, Técnico */}
        {(userRole === 'SUPERVISOR' || userRole === 'COORDENADOR' || userRole === 'TECNICO') && (
          <TouchableOpacity style={styles.navItem} onPress={controleEstoque}>
            <FontAwesomeIcon icon={faBoxes} size={16} color="#fff" style={styles.navIcon} />
            <Text style={styles.navText}>estoque</Text>
          </TouchableOpacity>
        )}
        
        {/* Relatório de Desempenho - Supervisor, Coordenador, Técnico */}
        {(userRole === 'SUPERVISOR' || userRole === 'COORDENADOR' || userRole === 'TECNICO') && (
          <TouchableOpacity style={styles.navItem} onPress={exibirAvaliacaoGeral}>
            <FontAwesomeIcon icon={faFileInvoice} size={16} color="#fff" style={styles.navIcon} />
            <Text style={styles.navText}>Relatorio de Desempenho</Text>
          </TouchableOpacity>
        )}
        
        {/* Análise IA - Supervisor, Coordenador, Técnico */}
        {(userRole === 'SUPERVISOR' || userRole === 'COORDENADOR' || userRole === 'TECNICO') && (
          <TouchableOpacity style={styles.navItem} onPress={analiseIa}>
            <FontAwesomeIcon icon={faRobot} size={16} color="#fff" style={styles.navIcon} />
            <Text style={styles.navText}>Analise do atleta pela IA</Text>
          </TouchableOpacity>
        )}
        
        {/* Lista de Atletas - Supervisor, Coordenador, Técnico */}
        {(userRole === 'SUPERVISOR' || userRole === 'COORDENADOR' ) && (
          <TouchableOpacity style={styles.navItem} onPress={listaAtletas}>
            <FontAwesomeIcon icon={faAddressBook} size={16} color="#fff" style={styles.navIcon} />
            <Text style={styles.navText}>Lista de Atletas</Text>
          </TouchableOpacity>
        )}
        
        {/* Lista de Funcionários - Só Supervisor e Coordenador */}
        {(userRole === 'SUPERVISOR' || userRole === 'COORDENADOR') && (
          <TouchableOpacity style={styles.navItem} onPress={listaDeFuncionarios}>
            <FontAwesomeIcon icon={faAddressBook} size={16} color="#fff" style={styles.navIcon} />
            <Text style={styles.navText}>Lista de Funcionarios</Text>
          </TouchableOpacity>
        )}

       
        
        {/* Sair - Todos os tipos */}
        <TouchableOpacity style={styles.navItem} onPress={handleLogout}>
          <FontAwesomeIcon icon={faSignOutAlt} size={16} color="#fff" style={styles.navIcon} />
          <Text style={styles.navText}>Sair</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};
