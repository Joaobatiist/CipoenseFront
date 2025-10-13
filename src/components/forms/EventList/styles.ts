import { StyleSheet, Dimensions, Platform } from 'react-native';

const { width } = Dimensions.get('window');
const isLargeScreen = width >= 768; 
const MAX_WIDTH = 1250; // Alinhado com o formulário

export const styles = StyleSheet.create({
  container: {
    marginTop: isLargeScreen ? 30 : 20,
    maxWidth: isLargeScreen ? MAX_WIDTH : '100%',
    alignSelf: 'center',
    width: '100%',
    paddingHorizontal: isLargeScreen ? 0 : 10,
  },
  sectionTitle: {
    fontSize: isLargeScreen ? 20 : 18,
    fontWeight: 'bold',
    marginBottom: isLargeScreen ? 15 : 10,
    color: '#1c348e',
    textAlign: 'center',
  },
  eventCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: isLargeScreen ? 20 : 15,
    marginBottom: isLargeScreen ? 15 : 10,
    borderLeftWidth: 5,
    borderLeftColor: '#e5c228',
    
    // Sombra responsiva
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 4,
    ...Platform.select({
        web: {
            transition: 'transform 0.2s',
        } as any,
    }),
  },
  eventDate: {
    fontSize: isLargeScreen ? 17 : 16,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#1c348e',
  },
  eventDescription: {
    fontSize: isLargeScreen ? 16 : 15,
    marginBottom: 8,
    color: '#333',
  },
  eventDetail: {
    fontSize: isLargeScreen ? 14 : 13,
    color: '#666',
    marginBottom: 3,
  },
  eventActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 10,
    gap: 10,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007bff',
    paddingVertical: isLargeScreen ? 10 : 8,
    paddingHorizontal: isLargeScreen ? 15 : 12,
    borderRadius: 5,
    // Removido marginRight para usar gap no eventActions
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dc3545',
    paddingVertical: isLargeScreen ? 10 : 8,
    paddingHorizontal: isLargeScreen ? 15 : 12,
    borderRadius: 5,
    // Removido marginRight para usar gap no eventActions
  },
  buttonText: {
    color: '#fff',
    fontSize: isLargeScreen ? 14 : 13,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: isLargeScreen ? 50 : 30,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  emptyMessage: {
    fontSize: isLargeScreen ? 18 : 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 10,
  },
  emptySubMessage: {
    fontSize: isLargeScreen ? 14 : 12,
    color: '#999',
    textAlign: 'center',
  },
});