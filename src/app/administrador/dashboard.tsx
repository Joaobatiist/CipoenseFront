import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode, JwtPayload } from 'jwt-decode';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, LayoutChangeEvent, Platform, ScrollView, Text, View } from 'react-native';
import { LocaleConfig } from 'react-native-calendars';

import { EventForm, EventList } from '@/components/forms';
import { Header, Sidebar } from '@/components/layout';
import { useAuth, useEventos } from '@/hooks';
import { globalStyles } from '@/Styles/themes/global';
import { Evento } from '@/types';
import ComunicadosScreen from '../../components/comunicados/comunicado';
import { ptBR } from '../../utils/localendarConfig';

interface CustomJwtPayload extends JwtPayload {
  roles?: string[];
}

LocaleConfig.locales["pt-br"] = ptBR;
LocaleConfig.defaultLocale = "pt-br";

interface SectionOffsets {
  agenda?: number; 
  comunicados?: number;
}

const UniversalDashboard: React.FC = () => {
  const { userInfo } = useAuth();
  const { eventos, loading, addEvento, updateEvento, deleteEvento } = useEventos();
  
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Evento | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loadingRole, setLoadingRole] = useState(true);
  const scrollViewRef = useRef<ScrollView>(null);
  const sectionOffsetsRef = useRef<SectionOffsets>({});

  const userName = userInfo?.userName || 'Usuário';

  // Navegação por teclado na web
  useEffect(() => {
    if (Platform.OS === 'web') {
      const handleKeyPress = (event: KeyboardEvent) => {
        if (document.activeElement?.tagName === 'INPUT' || 
            document.activeElement?.tagName === 'TEXTAREA') {
          return; // Não interfere quando há input focado
        }

        switch (event.key) {
          case 'ArrowDown':
            event.preventDefault();
            scrollViewRef.current?.scrollTo({ y: 100, animated: true });
            break;
          case 'ArrowUp':
            event.preventDefault();
            scrollViewRef.current?.scrollTo({ y: -100, animated: true });
            break;
          case 'PageDown':
            event.preventDefault();
            scrollViewRef.current?.scrollTo({ y: 400, animated: true });
            break;
          case 'PageUp':
            event.preventDefault();
            scrollViewRef.current?.scrollTo({ y: -400, animated: true });
            break;
          case 'Home':
            event.preventDefault();
            scrollViewRef.current?.scrollTo({ y: 0, animated: true });
            break;
          case 'End':
            event.preventDefault();
            scrollViewRef.current?.scrollToEnd({ animated: true });
            break;
        }
      };

      document.addEventListener('keydown', handleKeyPress);
      return () => document.removeEventListener('keydown', handleKeyPress);
    }
  }, []);

  // Obter userRole do JWT
  useEffect(() => {
    const getUserRole = async () => {
      try {
        const token = await AsyncStorage.getItem('jwtToken');
        
        if (token) {
          const decodedToken = jwtDecode<CustomJwtPayload>(token);
          const role = decodedToken.roles && decodedToken.roles.length > 0
            ? decodedToken.roles[0]
            : null;
          
          setUserRole(role);
          
        }
      } catch (error) {
        console.error('Erro ao obter userRole do JWT:', error);
      } finally {
        setLoadingRole(false);
      }
    };

    getUserRole();
  }, []);

  const toggleSidebar = (): void => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = (): void => {
    setSidebarOpen(false);
  };

  const scrollToSection = (sectionName: string): void => {
    closeSidebar();
    const section = sectionName as keyof SectionOffsets;
    const offset = sectionOffsetsRef.current[section];
    if (offset !== undefined) {
      scrollViewRef.current?.scrollTo({ y: offset, animated: true });
    }
  };

  const handleLayout = (event: LayoutChangeEvent, sectionName: keyof SectionOffsets): void => {
    sectionOffsetsRef.current[sectionName] = event.nativeEvent.layout.y;
  };

  const handleEventSave = async (eventData: Omit<Evento, 'id'>): Promise<void> => {
    if (editingEvent) {
      await updateEvento(editingEvent.id, eventData);
      setEditingEvent(null);
    } else {
      await addEvento(eventData);
    }
  };

  const handleEventEdit = (evento: Evento): void => {
    setEditingEvent(evento);
    scrollToSection('agenda');
  };

  const handleEventCancel = (): void => {
    setEditingEvent(null);
  };

  // Mostrar loading enquanto carrega o userRole
  if (loadingRole) {
    return (
      <View style={globalStyles.safeArea}>
        <View style={globalStyles.centerContainer}>
          <ActivityIndicator size="large" color="#1c348e" />
          <Text style={globalStyles.bodyText}>Carregando...</Text>
        </View>
      </View>
    );
  }

  // Se não conseguir obter o userRole, mostrar erro
  if (!userRole) {
    return (
      <View style={globalStyles.safeArea}>
        <View style={globalStyles.centerContainer}>
          
          <Text style={globalStyles.bodyText}>
            Não foi possível identificar seu perfil. Por favor, faça login novamente.
          </Text>
        </View>
      </View>
    );
  }

  // Configuração para scroll funcionar na web
  const webScrollStyle = Platform.OS === 'web' ? {
    overflow: 'auto' as any,
    maxHeight: '85vh' as any,
    WebkitOverflowScrolling: 'touch' as any,
    outline: 'none' as any,
  } : {};

  return (
    <View style={globalStyles.safeArea}>
      <Header
        userName={userName}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={toggleSidebar}
      />

      <Sidebar
        isOpen={sidebarOpen}
        onClose={closeSidebar}
        userName={userName}
        userRole={userRole as 'SUPERVISOR' | 'COORDENADOR' | 'TECNICO' }
        onNavigateToSection={scrollToSection}
      />

      <ScrollView 
        ref={scrollViewRef} 
        style={[globalStyles.container, webScrollStyle]}
        contentContainerStyle={{ padding: 16 }}
        // Propriedades para melhor scroll na web
        showsVerticalScrollIndicator={Platform.OS === 'web'}
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled={true}
        bounces={Platform.OS !== 'web'}
      >
        <View onLayout={(event) => handleLayout(event, 'agenda')}>
          
          
          <EventForm
            editingEvent={editingEvent}
            userName={userName}
            onSave={handleEventSave}
            onCancel={handleEventCancel}
            loading={loading}
          />
          
          <EventList
            eventos={eventos}
            onEdit={handleEventEdit}
            onDelete={deleteEvento}
          />
        </View>

        <View onLayout={(event) => handleLayout(event, 'comunicados')}>
          <ComunicadosScreen />
        </View>
      </ScrollView>
    </View>
  );
};

export default UniversalDashboard;