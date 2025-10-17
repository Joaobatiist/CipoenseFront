import { router } from 'expo-router';
import React from 'react';
import {
  Dimensions,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';


// Hook para obter a largura da tela e tornar o design responsivo
const { width } = Dimensions.get('window');

// --- Componente de Ilustração SVG ---
// Um componente simples para renderizar a ilustração do jogador.
// Usar SVG em vez de uma imagem deixa o app mais leve e rápido.



// --- Componente Principal da Tela ---
const WelcomeScreen: React.FC = () => {

  // Função para navegar para a tela de login
  const goToLogin = () => {
    router.navigate("./login");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView 
        contentContainerStyle={styles.container}
        style={styles.webScrollView}
      >
        
        {/* Seção Principal (Herói) com a ilustração e chamada para ação */}
        <View style={styles.heroSection}>
          <Text style={styles.title}>Evolution</Text>
          <Text style={styles.subtitle}>Gestão Esportiva Inteligente</Text>
          
          <TouchableOpacity style={styles.ctaButton} onPress={goToLogin}>
            <Text style={styles.ctaButtonText}>Começar Agora</Text>
          </TouchableOpacity>
        </View>

        {/* Seção de Funcionalidades Principais */}
        <Text style={styles.sectionTitle}>Funcionalidades</Text>
        <View style={styles.gridContainer}>
          {/* Card de Gerenciamento de Atletas */}
          <View style={styles.featureCard}>
            <View style={styles.iconContainer}>
              <Text style={styles.icon}>👥</Text>
            </View>
            <Text style={styles.featureTitle}>Elenco Completo</Text>
            <Text style={styles.featureText}>
              Gerencie perfis, estatísticas e o desenvolvimento de cada atleta.
            </Text>
          </View>

          {/* Card de Estatísticas Detalhadas */}
          <View style={styles.featureCard}>
            <View style={styles.iconContainer}>
              <Text style={styles.icon}>📊</Text>
            </View>
            <Text style={styles.featureTitle}>Análise de Desempenho</Text>
            <Text style={styles.featureText}>
              Use métricas de desempenho para tomar decisões táticas mais inteligentes.
            </Text>
          </View>

          {/* Card de Calendário de Eventos */}
          <View style={styles.featureCard}>
            <View style={styles.iconContainer}>
              <Text style={styles.icon}>📅</Text>
            </View>
            <Text style={styles.featureTitle}>Agenda do Time</Text>
            <Text style={styles.featureText}>
              Organize treinos, jogos e eventos em um calendário centralizado.
            </Text>
          </View>

           {/* Card de Comunicação */}
           <View style={styles.featureCard}>
            <View style={styles.iconContainer}>
              <Text style={styles.icon}>💬</Text>
            </View>
            <Text style={styles.featureTitle}>Comunicação</Text>
            <Text style={styles.featureText}>
              Envie comunicados e mantenha toda a equipe alinhada.
            </Text>
          </View>
        </View>



      </ScrollView>
    </SafeAreaView>
  );
};

// --- Estilos ---
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F0F4F8', // Um azul bem claro para o fundo
  },
  webScrollView: {
    ...Platform.select({
      web: {
        // Permite scroll com o mouse na web
        overflowY: 'auto' as any,
        maxHeight: '90vh',
      },
    }),
  } as any,
  container: {
    paddingBottom: 32,
    alignItems: 'center',
  },
  heroSection: {
    backgroundColor: '#0A2463', // Azul Escuro Principal
    width: '100%',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  title: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 18,
    color: '#FFD60A', // Amarelo
    marginTop: 8,
    marginBottom: 24,
  },
  ctaButton: {
    backgroundColor: '#FFD60A', // Amarelo
    paddingVertical: 6,
    paddingHorizontal: 40,
    borderRadius: 30,
    marginTop: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 8,
  },
  ctaButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0A2463', // Azul Escuro Principal
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0A2463', // Azul Escuro
    marginTop: 32,
    marginBottom: 16,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 16,
  },
  featureCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
    width: (width - 48) / 2, // Calcula a largura para 2 colunas com espaço
    marginBottom: 16,
    alignItems: 'center',
    minHeight: 180,
  },
  iconContainer: {
    marginBottom: 12,
    backgroundColor: '#E3F2FD', // Azul bem clarinho
    borderRadius: 50,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: 28,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#0A2463',
    marginBottom: 8,
  },
  featureText: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    color: '#555',
  },
  footer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 32,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#DDD'
  },
  footerText: {
    fontSize: 16,
    color: '#555',
  },
  footerLink: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0A2463', // Azul Escuro
    marginTop: 8,
  },
  
});

export default WelcomeScreen;
