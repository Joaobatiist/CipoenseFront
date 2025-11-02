import { Dimensions, Platform, StyleSheet } from 'react-native';

const { width } = Dimensions.get('window');
const isLargeScreen = width >= 768; 
const MAX_WIDTH = 1250; // Alinhado com o formulário

export const styles = StyleSheet.create({
  container: {
    marginTop: isLargeScreen ? 16 : 12,
    maxWidth: isLargeScreen ? MAX_WIDTH : '100%',
    padding: isLargeScreen ? 16 : 12,
    alignSelf: 'center',
    width: '100%',
    paddingHorizontal: isLargeScreen ? 10 : 10,
    borderRadius: 17,
     ...Platform.select({
                    web: isLargeScreen && {
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                    },
                }),
  },
  sectionTitle: {
    fontSize: isLargeScreen ? 21 : 18,
    fontWeight: 'bold',
    
    marginBottom: isLargeScreen ? 15 : 10,
    color: '#000000ff',
    textAlign: 'center',
  },
  eventCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: isLargeScreen ? 12 : 10,
    marginBottom: isLargeScreen ? 10 : 8,
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
    fontSize: isLargeScreen ? 16 : 15,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#1c348e',
  },
  eventDescription: {
    fontSize: isLargeScreen ? 15 : 14,
    marginBottom: 6,
    color: '#333',
  },
  eventDetail: {
    fontSize: isLargeScreen ? 13 : 12,
    color: '#666',
    marginBottom: 2,
  },
  eventActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 10,
    gap: 10,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007bff',
    paddingVertical: isLargeScreen ? 8 : 6,
    paddingHorizontal: isLargeScreen ? 12 : 10,
    borderRadius: 5,
    // Removido marginRight para usar gap no eventActions
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dc3545',
    paddingVertical: isLargeScreen ? 8 : 6,
    paddingHorizontal: isLargeScreen ? 12 : 10,
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
    paddingVertical: isLargeScreen ? 50 : 20,
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