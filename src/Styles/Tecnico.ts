import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  // --- General Layout and Header ---
  safeArea: {
    flex: 1,
    backgroundColor: '#f0f0f0', // Light background for the main content
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    justifyContent: 'flex-start', // Ensures the menu button is on the left
  },
  menuButton: {
    padding: 10,
  },

  // --- Sidebar Styles ---
  sidebar: {
    opacity: 0.95, // Slightly transparent
    position: 'absolute',
    top: 0,
    left: 0,
    width: 250,
    height: '100%', // Takes full height
    backgroundColor: '#1c348e', // Dark blue background
    paddingTop: 60,
    paddingHorizontal: 20,
    zIndex: 1000, // Ensures sidebar is on top of other content
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
    textAlign: 'center', // Centered logo in sidebar
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e5c228', // Yellow separator
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

  // --- Section General Styles (e.g., Agenda, Comunicados) ---
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
    color: '#333', // Adjusted color for better contrast on white background
  },
  subTitle: { // Used for "Treinos Marcados" and "Comunicados Enviados"
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

  // --- Form Elements (shared by Agenda and Comunicados) ---
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
    justifyContent: 'space-between', // Distributes space between buttons
    marginTop: 10,
    gap: 10, // Adds space between the buttons
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
    fontSize: 16, // Consistent font size
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top', // Ensures text starts from the top in multiline input
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    gap: 10, // Modern way to add space between buttons
  },
  cancelButton: {
    backgroundColor: '#dc3545', // Red for cancel/destructive actions
    flex: 1,
    borderRadius: 16,
  },
  submitButton: { // Used for saving/sending forms
    flex: 1,
    backgroundColor: "#1c348e", // Primary blue
    borderRadius: 16,
  },

  // --- Agenda de Treinos Specific Styles ---
  // Styles for the Calendar component itself (from original code, kept for consistency)
  calendar: {
    backgroundColor: "transparent", // Or remove if react-native-calendars handles background
  },
  // Note: 'selected', 'dayText', 'day', 'disabled', 'today', 'daySelected' are typically
  // passed directly to the Calendar's 'theme' prop, not used as direct styles on views.
  // I've kept them here as they were in your original, but they might not apply directly
  // to elements as normal StyleSheet styles.
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

  // Styles for individual training event cards
  eventCard: {
    backgroundColor: '#fff', // White background for event cards
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
  eventDate: { // For the date of the event
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#555',
  },
  eventDescription: { // For the main description of the event
    fontSize: 16,
    marginBottom: 5,
    color: '#333',
  },
  eventDetail: { // For professor, local, and horario
    fontSize: 14,
    color: '#666',
    marginBottom: 3,
  },
  eventActions: { // Container for edit and delete buttons
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 10,
  },
  editButton: { // Style for the edit button
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007bff', // Blue for edit
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 5,
    marginRight: 10,
  },
  deleteButton: { // Style for the delete button
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dc3545', // Red for delete
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 5,
  },
  buttonText: { // Text style for action buttons (Edit, Delete)
    color: '#fff',
    fontSize: 14,
    marginLeft: 5,
  },

  // --- Comunicados Specific Styles ---
  searchInput: { // Search bar for adding recipients
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  dropdownContainer: { // Container for the user list in recipient selection
    maxHeight: 150,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    backgroundColor: '#fff',
  },
  usuarioItem: { // Individual user item in the recipient dropdown
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  destinatariosContainer: { // Container for selected recipient tags
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 15,
  },
  destinatarioTag: { // Individual recipient tag
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1c348e',
    padding: 10,
    borderRadius: 15,
    marginRight: 5,
    marginBottom: 5,
  },
  destinatarioText: { // Text within recipient tags
    color: '#fff',
    marginRight: 5,
    fontSize: 12,
  },
  comunicadoCard: { // Style for sent announcement cards
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
  comunicadoRemetente: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
    fontStyle: 'italic',
  },
  // NEW STYLES ADDED
  hideButton: { // Style for the hide button in ComunicadosScreen
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffc107', // A warning/info color for "hide"
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 5,
    marginRight: 10, // Keep some margin
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
});