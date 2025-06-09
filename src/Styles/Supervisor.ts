import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
 
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
    justifyContent: 'flex-start',
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
    textAlign: 'center', 
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
    textAlign: "center",
    color: '#333', 
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

 
  formContainer: {
    backgroundColor: '#f9f9f9',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#1c348e',
    textAlign: "center"
  },
  trainingButtonsContainer: {
  flexDirection: 'row',
  justifyContent: 'space-between', 
  marginTop: 10,
  gap: 10, 
},
trainingActionButton: {
  flex: 1, 
  borderRadius: 16, 
  backgroundColor: "#1c348e", 
  padding: 10
},
trainingCancelButton: {
  flex: 1, 
  borderRadius: 16, 
  backgroundColor: 'red', 
  padding: 10
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
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top', 
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    gap: 10, 
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
  },
  buttonText: { 
    color: '#fff',
    fontSize: 14,
    marginLeft: 5,
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
    color: '#333',
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