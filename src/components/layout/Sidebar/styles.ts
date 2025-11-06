import { Platform, StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 999,
    // Para web, usa position fixed para cobrir toda a tela independente do scroll
    ...(Platform.OS === 'web' && {
      position: 'fixed' as any,
    }),
  },
  sidebar: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 290,
    height: '100%',
    backgroundColor: '#1c348e',
    paddingTop: 50,
    paddingHorizontal: 20,
    zIndex: 1000,
    // Garante que o sidebar tenha scroll próprio quando necessário
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    // Para web, usa position fixed para não descer com o scroll da página
    ...(Platform.OS === 'web' && {
      position: 'fixed' as any,
      // Isolamento adicional para evitar interferência de scroll
      contain: 'layout style paint' as any,
      willChange: 'transform' as any,
      // Previne scroll chaining
      overscrollBehavior: 'contain' as any,
    }),
  },
  closeButton: {
    position: 'absolute',
    top: 25,
    left: 20,
    padding: 5,
  },
  logo: {
    top: -10,
    width: "80%",
    height: 100,
    borderRadius: 55,
    marginLeft: 20,
  },
  title: {
    marginLeft: 10,
    alignItems: 'center',
    color: '#fcfcfcff',
    fontWeight: 'bold',
    fontSize: 12,
    top: -5,
    borderBottomWidth: 1,
    borderBottomRightRadius: 24,
    borderBottomColor: '#e5c228',
  },
  scrollContainer: {
    flex: 1,
    maxHeight: '80%', // Limita altura para forçar scroll quando necessário
    // Configurações específicas para web para scroll independente
    ...(Platform.OS === 'web' && {
      overflowY: 'auto' as any,
      overflowX: 'hidden' as any,
      // CSS containment para isolamento de scroll
      contain: 'layout style paint size' as any,
      // Força um novo contexto de empilhamento
      isolation: 'isolate' as any,
      // Impede bubbling de eventos de scroll
      touchAction: 'pan-y' as any,
      // Garante que o scroll seja contido
      overscrollBehavior: 'contain' as any,
    }),
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomRightRadius: 6,
    borderBottomColor: '#e5c228',
  },
  navIcon: {
    marginRight: 10,
  },
  navText: {
    fontSize: 16,
    color: '#fff',
  },
});
