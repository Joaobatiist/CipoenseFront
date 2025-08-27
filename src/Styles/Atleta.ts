import { StyleSheet, Platform,StatusBar } from "react-native";

export const styles = StyleSheet.create ({
    container: {
        flex: 1,
        backgroundColor: "#181818",
        padding: 24,
    },
    
    selected: {
        color: "#fff",
        fontSize: 16,
        marginTop: 42,
    },
 
    safeArea: {
        flex: 1,
       
    },
    title:  {
    marginLeft: 10 ,
    alignItems: 'center',
    color: '#fcfcfcff',
    fontWeight: 'bold',
    fontSize: 12,
    top: -5,
    borderBottomWidth: 1,
    borderBottomColor: '#e5c228', 
  },
   header: {
       flexDirection: 'row',
       alignItems: 'center',
       backgroundColor: '#1c348e',
       paddingVertical: 10,
       paddingHorizontal: 15,
       borderBottomWidth: 1,
       borderBottomColor: '#e5c228',
       justifyContent: 'flex-start',
       // Estilo específico para o Android
       ...Platform.select({
         android: {
           paddingTop: StatusBar.currentHeight, // Adiciona um padding no topo igual à altura da barra de status do Android
         },
       }),
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
    
   

    
    emptyMessage: {
        color: '#666',
        textAlign: 'center',
        marginVertical: 20,
    },
 
    errorMessage: { // Adicionado para mensagens de erro
        textAlign: 'center',
        marginTop: 20,
        fontSize: 16,
        color: 'red',
        fontWeight: 'bold',
    },
    comunicadoCard: {
        backgroundColor: '#f9f9f9', // Cor de fundo mais clara para seções de informação
        borderRadius: 8,
        padding: 15,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#ddd',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2, // Sombra para Android
    },
    comunicadoAssunto: {
        fontSize: 18, // Aumentado para título de análise
        fontWeight: 'bold',
        marginBottom: 8,
        color: '#333',
    },
    comunicadoData: {
        fontSize: 12,
        color: '#888',
        fontStyle: 'italic',
        textAlign: 'right', // Alinha a data à direita
    },
    comunicadoMensagem: {
        fontSize: 15, // Tamanho para o corpo da análise
        lineHeight: 22, // Espaçamento entre linhas para melhor leitura
        color: '#555',
        marginBottom: 10, // Espaçamento antes da data de geração
    },
    comunicadoDestinatarios: { // Mantido, mas não usado diretamente para análise de desempenho
        fontSize: 12,
        color: '#888',
        fontStyle: 'italic',
    },
   
    eventCard: {
        backgroundColor: '#fff', 
        borderRadius: 8,
        padding: 15,
        marginBottom: 10,
        borderLeftWidth: 5,
        borderLeftColor: '#e5c228', 
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 2,
    },
    eventDate: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 5,
        color: '#212121', 
    },
    eventDescription: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#050505ff', 
        marginBottom: 5,
    },
    eventDetail: {
        fontSize: 14,
        color: '#424242', 
        marginBottom: 3,
    },
    eventListContainer: {
        paddingVertical: 10, 
    }
});