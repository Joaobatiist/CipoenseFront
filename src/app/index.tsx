import { ToastContainer } from '@/components/Toast';
import { router } from 'expo-router';
import React from 'react';
import {
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions
} from 'react-native';

// --- Componente Principal da Tela ---
const WelcomeScreen: React.FC = () => {
  const { width } = useWindowDimensions();

  // Evita layout incorreto na primeira renderização
  if (width === 0) {
    return <View style={{ flex: 1, backgroundColor: '#F0F4F8' }} />;
  }

  // Calcula quantas colunas mostrar baseado na largura
  const getColumns = () => {
    if (width >= 1280) return 4; // Desktop grande
    if (width >= 900) return 3;  // Tablet/Notebook
    if (width >= 600) return 2;  // Celular grande
    return 1;                    // Celular pequeno
  };

  const columns = getColumns();
  const cardWidth = width >= 768
    ? (Math.min(1200, width) - 48 - (columns - 1) * 16) / columns
    : (width - 48 - (columns - 1) * 16) / columns;

  // Função para navegar para a tela de login
  const goToLogin = () => {
    router.push("/login");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        style={styles.webScrollView}
        showsVerticalScrollIndicator={Platform.OS !== 'web'}
      >

        {/* Seção Principal (Herói) */}
        <View style={styles.heroSection}>
          <Text style={styles.title}>Evolution</Text>
          <Text style={styles.subtitle}>Gestão Esportiva Inteligente</Text>

          <TouchableOpacity
            style={styles.ctaButton}
            onPress={goToLogin}
            {...(Platform.OS === 'web' && {
              cursor: 'pointer' as any,
              activeOpacity: 0.8,
            })}
          >
            <Text style={styles.ctaButtonText}>Começar Agora</Text>
          </TouchableOpacity>
        </View>

        {/* Conteúdo principal */}
        <View style={[styles.contentWrapper, width >= 400 && styles.contentWrapperLarge]}>
          <Text style={styles.sectionTitle}>Funcionalidades</Text>

          <View style={styles.gridContainer}>
            {/* --- Card 1 --- */}
            <View
              style={[
                styles.featureCard,
                { width: cardWidth },
                width >= 1024 && styles.largeScreenCard
              ]}
            >
              <View style={styles.iconContainer}>
                <Text style={styles.icon}>👥</Text>
              </View>
              <Text
                style={[
                  styles.featureTitle,
                  width >= 1024 && styles.largeFeatureTitle
                ]}
              >
                Elenco Completo
              </Text>
              <Text
                style={[
                  styles.featureText,
                  width >= 1024 && styles.largeFeatureText
                ]}
              >
                Gerencie perfis, estatísticas e o desenvolvimento de cada atleta.
              </Text>
            </View>

            {/* --- Card 2 --- */}
            <View
              style={[
                styles.featureCard,
                { width: cardWidth },
                width >= 1024 && styles.largeScreenCard
              ]}
            >
              <View style={styles.iconContainer}>
                <Text style={styles.icon}>📊</Text>
              </View>
              <Text
                style={[
                  styles.featureTitle,
                  width >= 1024 && styles.largeFeatureTitle
                ]}
              >
                Análise de Desempenho
              </Text>
              <Text
                style={[
                  styles.featureText,
                  width >= 1024 && styles.largeFeatureText
                ]}
              >
                Use métricas e relatórios técnicos para tomar decisões táticas mais inteligentes.
              </Text>
            </View>

            {/* --- Card 3 --- */}
            <View
              style={[
                styles.featureCard,
                { width: cardWidth },
                width >= 1024 && styles.largeScreenCard
              ]}
            >
              <View style={styles.iconContainer}>
                <Text style={styles.icon}>📅</Text>
              </View>
              <Text
                style={[
                  styles.featureTitle,
                  width >= 1024 && styles.largeFeatureTitle
                ]}
              >
                Agenda do Time
              </Text>
              <Text
                style={[
                  styles.featureText,
                  width >= 1024 && styles.largeFeatureText
                ]}
              >
                Organize treinos, jogos e eventos em um calendário centralizado e prático.
              </Text>
            </View>

            {/* --- Card 4 --- */}
            <View
              style={[
                styles.featureCard,
                { width: cardWidth },
                width >= 1024 && styles.largeScreenCard
              ]}
            >
              <View style={styles.iconContainer}>
                <Text style={styles.icon}>💬</Text>
              </View>
              <Text
                style={[
                  styles.featureTitle,
                  width >= 1024 && styles.largeFeatureTitle
                ]}
              >
                Comunicação Interna
              </Text>
              <Text
                style={[
                  styles.featureText,
                  width >= 1024 && styles.largeFeatureText
                ]}
              >
                Envie comunicados e mantenha toda a equipe alinhada de forma eficiente.
              </Text>
            </View>
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
    backgroundColor: '#F0F4F8',
  },
  webScrollView: {
    ...Platform.select({
      web: {
        height: '100vh',
        overflowY: 'auto' as any,
      },
    }),
  } as any,
  container: {
    paddingBottom: 32,
    alignItems: 'center',
  },
  contentWrapper: {
    width: '100%',
    maxWidth: 1200,
    alignItems: 'center',
    alignSelf: 'center',
    paddingHorizontal: 16,
  },
  contentWrapperLarge: {
    paddingHorizontal: 32,
  },
  heroSection: {
    backgroundColor: '#0A2463',
    width: '100%',
    alignItems: 'center',
    paddingVertical: 50,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  title: {
    fontSize: 44,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 20,
    color: '#FFD60A',
    marginTop: 8,
    marginBottom: 24,
  },
  ctaButton: {
    backgroundColor: '#FFD60A',
    paddingVertical: 14,
    paddingHorizontal: 44,
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
    color: '#0A2463',
  },
  sectionTitle: {
    fontSize: 26,
    textAlign: 'center',
    fontWeight: 'bold',
    color: '#0A2463',
    marginTop: 40,
    marginBottom: 20,
    width: '100%',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
     gap: 12,
    justifyContent: 'space-between',
    width: '100%',
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
    marginBottom: 16,
    alignItems: 'center',
    minHeight: 200,
    flexGrow: 1,
    gap: 12,
    flexBasis: '45%',
  },
  iconContainer: {
    marginBottom: 12,
    backgroundColor: '#E3F2FD',
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
  // --- Ajustes para Desktop ---
  largeScreenCard: {
    padding: 24,
    minHeight: 220,
  },
  largeFeatureTitle: {
    fontSize: 20,
  },
  largeFeatureText: {
    fontSize: 16,
    lineHeight: 24,
  },
});

export default function App() {
  return (
    <>
      <ToastContainer />
      <WelcomeScreen />
    </>
  );
}
