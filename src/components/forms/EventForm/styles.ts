import { StyleSheet, Dimensions, Platform } from 'react-native';

const { width } = Dimensions.get('window');
// Considera "tela grande" (Large Screen) como Tablet ou Desktop
const isLargeScreen = width >= 600; 
const MAX_WIDTH = 1250; // Largura máxima do formulário em telas grandes

export const styles = StyleSheet.create({
  // CONTAINER PRINCIPAL
  container: {
    backgroundColor: '#ffffff',
    padding: isLargeScreen ? 20 : 15,
    borderRadius: isLargeScreen ? 12 : 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    
    // Configuração para Responsividade
    maxWidth: isLargeScreen ? MAX_WIDTH : '100%',
    alignSelf: 'center',
    width: '100%',
    
    // Sombra sutil para Web/Desktop
    ...Platform.select({
        web: isLargeScreen && {
            boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)',
        },
    }),
  },
  
  // TÍTULO
  sectionTitle: {
    fontSize: isLargeScreen ? 22 : 18,
    fontWeight: 'bold',
    marginBottom: isLargeScreen ? 25 : 15,
    color: '#000000ff',
    textAlign: "center"
  },
  
  // CALENDÁRIO
  calendarWrapper: {
    alignItems: 'center',
    marginVertical: isLargeScreen ? 15 : 10,
  },
  calendar: {
    // Garante que o calendário ocupe 100% da largura do container
    width: '100%', 
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5c228',
    // Remove margens adicionais para evitar quebras de layout
  },
  
  // DATA SELECIONADA
  selectedDate: {
    fontSize: isLargeScreen ? 18 : 16,
    color: '#333',
    marginTop: 5,
    marginBottom: isLargeScreen ? 25 : 15,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  
  // INPUTS DE TEXTO
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: isLargeScreen ? 15 : 12,
    marginBottom: isLargeScreen ? 10 : 15,
    backgroundColor: '#fff',
    fontSize: isLargeScreen ? 16 : 15,
    color: '#333',
    // Transição suave de foco para Web
    ...Platform.select({
        web: {
            outlineStyle: 'none',
            transition: 'border-color 0.2s',
        } as any,
    }),
  },
  
  inputContainer: { marginBottom: 15 },
  inputLabel: { fontSize: 14, fontWeight: '600', marginBottom: 5, color: '#555' },


  buttonContainer: {
  flexDirection: isLargeScreen ? 'row' : 'column',
  justifyContent: 'center',
  alignItems: 'center',
  gap: 15,
  marginTop: 15,
  width: '100%',
  maxWidth: 900,
  alignSelf: 'center',
},

  submitButton: {
  flex: 1,
  backgroundColor: "#1c348e",
  borderRadius: 8,
  padding: isLargeScreen ? 10 : 12,
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: isLargeScreen ? 180 : '100%', // lado a lado no desktop, empilhado no mobile
},

cancelButton: {
  flex: 1,
  backgroundColor: '#dc3545',
  borderRadius: 8,
  padding: isLargeScreen ? 10 : 12,
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: isLargeScreen ? 180 : '100%',
},
});