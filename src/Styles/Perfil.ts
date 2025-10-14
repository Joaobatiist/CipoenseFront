import { StyleSheet, Platform, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5',
    width: '100%',
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f2f5',
  },

  header: {
    backgroundColor: '#1c348e',
    padding: 15,
    paddingTop: Platform.OS === 'web' ? 20 : 35,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#e5c228',
    justifyContent: 'flex-start',
    paddingHorizontal: 20,
    width: '100%',
  },

  btnVoltar: {
    padding: 5,
    marginRight: 15,
  },

  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },

  profileContainer: {
    padding: 20,
    alignItems: 'center',
    width: '100%',
    maxWidth: 800, // limita largura em desktop
  },

  avatarContainer: {
    position: 'relative',
    marginBottom: 30,
  },

  avatarTouchable: {
    width: 150,
    height: 150,
    borderRadius: 75,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },

  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 75,
    borderWidth: 4,
    borderColor: '#e5c228',
  },

  avatarPlaceholder: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#e5c228',
  },

  avatarPlaceholderText: {
    color: '#666',
    fontWeight: 'bold',
    marginTop: 5,
    textAlign: 'center',
  },

  uploadOverlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 75,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  card: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },

  removeIconContainer: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 2,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },

  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1c348e',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 10,
  },

  infoLabel: {
    fontSize: 14,
    color: '#888',
    marginTop: 10,
    marginBottom: 2,
    fontWeight: '500',
  },

  infoValue: {
    fontSize: 16,
    color: '#333',
    marginBottom: 5,
    paddingBottom: 5,
    borderBottomWidth: 0.5,
    borderBottomColor: '#f0f0f0',
  },

  formContainer: {
    width: '100%',
  },

  inputLabel: {
    fontSize: 14,
    color: '#555',
    marginBottom: 5,
    marginTop: 10,
    fontWeight: '500',
  },

  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#333',
    width: '100%',
  },

  inputDisabled: {
    backgroundColor: '#e9e9e9',
    color: '#777',
  },

  buttonGroup: {
    width: '100%',
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },

  btnSalvar: {
    backgroundColor: '#28a745',
    padding: 12,
    borderRadius: 8,
    flex: 1,
  },

  btnEditar: {
    backgroundColor: '#c7c7c7',
    padding: 12,
    borderRadius: 8,
    flex: 1,
  },

  btnSalvarText: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
  },

  editIconContainer: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: '#4CAF50',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },

  primaryButton: {
    backgroundColor: '#1c348e',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'center',
  },

  secondaryButton: {
    backgroundColor: 'transparent',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1c348e',
    flexDirection: 'row',
    justifyContent: 'center',
  },

  buttonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold',
    marginLeft: 5,
  },

  secondaryButtonText: {
    color: '#1c348e',
    fontSize: 17,
    fontWeight: 'bold',
    marginLeft: 5,
  },
});
