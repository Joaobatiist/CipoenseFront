import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    color: '#333',
  },
  eventCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#eee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  eventDate: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#555',
  },
  eventDescription: {
    fontSize: 16,
    marginBottom: 5,
    color: '#333',
  },
  eventDetail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 3,
  },
  eventActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 10,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007bff',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 5,
    marginRight: 10,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dc3545',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 5,
    marginRight: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    marginLeft: 5,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyMessage: {
    color: '#666',
    textAlign: 'center',
    marginVertical: 20,
  },
  emptySubMessage: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
});
