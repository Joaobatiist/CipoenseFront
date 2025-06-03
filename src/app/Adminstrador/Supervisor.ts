import { StyleSheet} from "react-native"

export const styles = StyleSheet.create ({
 container: {
    flex: 1,
    backgroundColor: "#181818",
    padding: 24,
  },
  calendar: {
    backgroundColor: "transparent",
  },
  selected: {
    color: "#fff",
    fontSize: 16,
    marginTop: 42,
  },
  dayText: {
    color: "#E8E8E8",
  },
  day: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 7,
  },
  disabled: {
    color: "#717171",
  },
  today: {
    color: "#F06543",
    fontWeight: "bold",
  },
  daySelected: {
    backgroundColor: "#F06543",
  },

     safeArea: {
    flex: 1,
    backgroundColor: '#f0f0f0',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  menuButton: {
    padding: 10,
  },
  sidebar: {
    opacity: 0.95,
    position: 'absolute',
    top: 0,
    left: 0,
    width: 250,
    height: '100%',
    backgroundColor: '#1c348e',
    paddingTop: 60,
    paddingHorizontal: 20,
    zIndex: 1000,
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    left: 20,
    padding: 10,
  },
  logo: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
    marginTop: 40,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e5c228',
  },
  navIcon: {
    marginRight: 10,
  },
  navText: {
    fontSize: 16,
    color: '#fff',
  },
  scrollContainer: {
    flex: 1,
  },
  section: {
    padding: 20,
    marginVertical: 10,
    backgroundColor: '#fff',
    borderRadius: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: "center"
  },
    formContainer: {
    backgroundColor: '#f9f9f9',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#1c348e',
    textAlign: "center"
  },
    label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 5,
    color: '#555',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
    backgroundColor: '#fff',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
   searchInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  dropdownContainer: {
    maxHeight: 150,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    backgroundColor: '#fff',
  },
  usuarioItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  destinatariosContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 15,
  },
  destinatarioTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1c348e',
    padding: 10,
    borderRadius: 15,
    marginRight: 5,
    marginBottom: 5,
  },
  destinatarioText: {
    color: '#fff',
    marginRight: 5,
    fontSize: 12,
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    gap: 10
  },
  cancelButton: {
    backgroundColor: '#dc3545',
    flex: 1,
    borderRadius: 16,

  },
  submitButton: {
    flex: 1,
    backgroundColor: "#1c348e",
    borderRadius: 16,
    
  },

  subTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    color: '#333',
  },
  emptyMessage: {
    color: '#666',
    textAlign: 'center',
    marginVertical: 20,
  },
  comunicadoCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  comunicadoAssunto: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  comunicadoData: {
    fontSize: 12,
    color: '#666',
    marginBottom: 10,
  },
  comunicadoMensagem: {
    fontSize: 14,
    marginBottom: 10,
    color: '#444',
  },
  comunicadoDestinatarios: {
    fontSize: 12,
    color: '#888',
    fontStyle: 'italic',
  },
});
