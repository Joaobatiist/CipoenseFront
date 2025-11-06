import { StyleSheet, Dimensions, Platform, StatusBar } from "react-native";

// --- DEFINIÇÕES DE RESPONSIVIDADE ---
const { width } = Dimensions.get('window');
// Ponto de quebra para tela grande (Desktop/Tablet)
const IS_LARGE_SCREEN = width >= 768;
// Largura máxima para o conteúdo principal na Web
const MAX_WIDTH = 900; 
// ------------------------------------

export const styles = StyleSheet.create({
    // --- Containers de Layout ---
   keyboardAvoidingContainer: {
      flex: 1,
    },
    
    // NOVO: Estilo para limitar a largura em Web e centralizar
    mainContentContainer: {
      width: '100%',
      maxWidth: MAX_WIDTH,
      alignSelf: 'center', 
      // Adiciona padding horizontal apenas em telas grandes/Web
      paddingHorizontal: IS_LARGE_SCREEN ? 30 : 0, 
      paddingVertical: IS_LARGE_SCREEN ? 20 : 0,
    },
  
    // CORREÇÃO: Ajusta o contentContainer para centralizar o mainContentContainer
    scrollViewContent: {
      flexGrow: 1,
      paddingHorizontal: IS_LARGE_SCREEN ? 0 : 20, // Mantém padding em mobile
      paddingBottom: 20,
      alignItems: 'center', // Centraliza o mainContentContainer
    },
  
    // CORREÇÃO: Aplica flex: 1 e overflowY para scroll do mouse no Web
    webScrollView: {
      ...Platform.select({
        web: {
          maxHeight: 700, // Use a numeric value for maxHeight
          overflow: 'visible', // Use only 'visible' or 'hidden'
        },
      }),
    },
    
    // --- Header ---
    header: {
      backgroundColor: "#1c348e",
      padding: IS_LARGE_SCREEN ? 15 : 10,
      // Ajuste de paddingTop para Android e adição de 10px em iOS/Web
      paddingTop: Platform.OS === 'android' ? ((StatusBar.currentHeight ?? 0) + 10) : (IS_LARGE_SCREEN ? 15 : 10),
      flexDirection: 'row',
      alignItems: 'center',
      borderBottomWidth: 1,
      borderBottomColor: '#e5c228',
    },
    menuButton: {
        paddingLeft: 15,
    },
    titulo: {
      flex: 1,
      color: "#ffffffff",
      // Ajuste de margem para telas grandes
      marginLeft: IS_LARGE_SCREEN ? 30 : 40,
      textAlign: "center",
      top: 5,
      paddingLeft: 20,
      fontSize: IS_LARGE_SCREEN ? 24 : 20,
      fontWeight: 'bold',
    },
    btnVoltar: {
      padding: 5,
      top: 5,
    },
    title: {
      fontSize: IS_LARGE_SCREEN ? 28 : 18,
      fontWeight: 'bold',
      color: '#1c348e',
      textAlign: 'center',
      marginBottom: IS_LARGE_SCREEN ? 40 : 24,
      marginTop: IS_LARGE_SCREEN ? 60 : 50,
    },
    
    // --- Card e Seções ---
    card: {
      backgroundColor: '#fff',
      borderRadius: 12,
      padding: IS_LARGE_SCREEN ? 24 : 16, // Mais padding em tela grande
      marginBottom: IS_LARGE_SCREEN ? 20 : 16,
      width: '100%', // Ocupa 100% da largura do mainContentContainer (que tem MAX_WIDTH)
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
        android: {
          elevation: 3,
        },
      }),
    },
    sectionTitle: {
      fontSize: IS_LARGE_SCREEN ? 18 : 16,
      fontWeight: 'bold',
      color: '#333',
      marginBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: '#e5c228',
      paddingBottom: 8,
    },
  
    // --- Formulário (Inputs) ---
    label: {
      fontSize: IS_LARGE_SCREEN ? 16 : 14,
      fontWeight: 'bold',
      color: '#555',
      marginTop: IS_LARGE_SCREEN ? 15 : 10,
      marginBottom: 5,
    },
    // CORREÇÃO: O Input agora respeita a largura de 100% do 'card', 
    // que por sua vez é limitado pelo 'mainContentContainer' (MAX_WIDTH=900px), 
    // resolvendo o problema de inputs "enormes" na web.
    input: {
      borderWidth: 1,
      borderColor: '#1c348e',
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: IS_LARGE_SCREEN ? 12 : 10,
      fontSize: IS_LARGE_SCREEN ? 16 : 15,
      color: '#333',
      backgroundColor: '#f7db6142',
      marginBottom: 10,
      width: '100%', 
    },
    multilineInput: {
      minHeight: IS_LARGE_SCREEN ? 150 : 120,
      textAlignVertical: 'top',
    },
    dropdownContainer: {
      height: 50,
      marginBottom: 10,
    },
    dropdown: {
      backgroundColor: '#fff',
      borderColor: '#ccc',
      borderRadius: 8,
    },
    itemSeparator: {
      height: 1,
      backgroundColor: '#eee',
    },
  
    // --- Tabela e Avaliação ---
    table: {
      width: '100%',
      marginBottom: 10,
    },
    tableHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: '#eee',
      backgroundColor: '#f9f9f9',
      borderRadius: 8,
      marginBottom: 4,
    },
    tableHead: {
      width: '50%',
      fontWeight: 'bold',
      color: '#1c348e',
      paddingHorizontal: 12,
      fontSize: IS_LARGE_SCREEN ? 15 : 14,
    },
    tableRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderBottomWidth: 1,
      borderBottomColor: '#eee',
      paddingVertical: 12,
    },
    tableCell: {
      width: '50%',
      paddingHorizontal: 12,
      fontSize: IS_LARGE_SCREEN ? 15 : 14,
      color: '#555',
    },
    ratingOptionsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      width: '50%',
      alignItems: 'center',
    },
    ratingOption: {
      width: IS_LARGE_SCREEN ? 40 : 32,
      height: IS_LARGE_SCREEN ? 40 : 32,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: IS_LARGE_SCREEN ? 20 : 16,
      backgroundColor: '#e0e0e0',
    },
    ratingOptionSelected: {
      backgroundColor: '#1c348e', 
    },
    ratingOptionText: {
      color: '#555',
      fontSize: 14,
      fontWeight: 'bold',
    },
    ratingOptionTextSelected: {
      color: '#fff',
      fontSize: 14,
      fontWeight: 'bold',
    },
  
    // --- Botões ---
    buttonContainer: {
      flexDirection: IS_LARGE_SCREEN ? 'row' : 'column', // Empilha em telas pequenas
      justifyContent: 'space-between',
      marginTop: IS_LARGE_SCREEN ? 30 : 20,
      gap: 12,
    },
    button: {
      flex: 1,
      backgroundColor: '#1c348e',
      padding: IS_LARGE_SCREEN ? 16 : 12,
      borderRadius: 12,
      alignItems: 'center',
    },
    // CORREÇÃO: Estilo do botão secundário para ter fundo transparente e borda
    buttonSecondary: {
      flex: 1,
      backgroundColor: 'transparent',
      padding: IS_LARGE_SCREEN ? 16 : 12,
      borderRadius: 12,
      alignItems: 'center',
      borderWidth: 2,
      borderColor: '#1c348e',
    },
    buttonText: {
      color: '#ffffffff',
      fontWeight: 'bold',
      fontSize: IS_LARGE_SCREEN ? 18 : 16,
    },
    // CORREÇÃO: Texto do botão secundário deve ser da cor primária
    buttonTextSecondary: {
      color: '#1c348e', 
      fontWeight: 'bold',
      fontSize: IS_LARGE_SCREEN ? 18 : 16,
    },
    // CORREÇÃO: Estilo Disabled mais claro para melhor UX
    buttonDisabled: {
      backgroundColor: '#1c348e',
      borderColor: '#cccccc',
    },
});