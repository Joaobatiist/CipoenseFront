import { StyleSheet, Dimensions, Platform, StatusBar } from "react-native";

const { width } = Dimensions.get('window');
// Considera "tela grande" (Large Screen) como Tablet ou Desktop
const IS_LARGE_SCREEN = width >= 768;
const MAX_WIDTH = 1250; // Largura máxima para Cards internos em telas grandes

export const styles = StyleSheet.create({
    // --- Layout Base ---
    safeArea: {
        flex: 1,
        backgroundColor: '#f0f0f0',
    },
    scrollContainer: {
        flex: 1,
    },

    // --- Header e Navegação ---
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingVertical: IS_LARGE_SCREEN ? 20 : 15,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
        justifyContent: 'flex-start',
        ...Platform.select({
            android: {
                paddingTop: StatusBar.currentHeight,
            },
        }),
    },
    menuButton: {
        padding: 10,
        ...Platform.select({
            android: {
                marginTop: 5,
            },
            ios: {
                marginTop: 0,
            },
        }),
    },
    sidebar: {
        opacity: 0.95,
        position: 'absolute',
        top: 0,
        left: 0,
        width: 250,
        height: '100%',
        backgroundColor: '#1c348e',
        paddingTop: IS_LARGE_SCREEN ? 80 : 60,
        paddingHorizontal: 20,
        zIndex: 1000,
    },
    closeButton: {
        position: 'absolute',
        top: 45,
        left: 20,
        padding: 5,
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

    // --- Seção Principal (ENGOBANDO TUDO EM UM CARD CENTRALIZADO) ---
    section: {
        // Estilos de card do original
        backgroundColor: '#fff',
        borderRadius: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 1,
        
        // Responsividade para centralizar e limitar a largura na Web
        padding: IS_LARGE_SCREEN ? 30 : 20,
        marginVertical: IS_LARGE_SCREEN ? 20 : 10,
        maxWidth: MAX_WIDTH + 50, // Largura máxima do container principal
        alignSelf: 'center', // Centraliza o container
        width: '100%',
    },
    sectionTitle: {
        fontSize: IS_LARGE_SCREEN ? 24 : 18,
        fontWeight: 'bold',
        marginBottom: IS_LARGE_SCREEN ? 20 : 10,
        textAlign: "center",
        color: '#333',
    },
    subTitle: {
        fontSize: IS_LARGE_SCREEN ? 20 : 16,
        fontWeight: 'bold',
        marginTop: IS_LARGE_SCREEN ? 30 : 20,
        marginBottom: 10,
        color: '#333',
    },
    emptyMessage: {
        color: '#666',
        textAlign: 'center',
        marginVertical: 20,
        fontSize: IS_LARGE_SCREEN ? 16 : 14,
    },

    // --- Formulário (Estilo de Container INTERNO) ---
    formContainer: {
        backgroundColor: '#f9f9f9', // Fundo levemente diferente do section
        padding: IS_LARGE_SCREEN ? 25 : 15,
        borderRadius: 8,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#ddd',
        width: '100%',
        // Removida a sombra/elevação para evitar aninhamento visual
    },
    formTitle: {
        fontSize: IS_LARGE_SCREEN ? 22 : 18,
        fontWeight: 'bold',
        marginBottom: 15,
        color: '#1c348e',
        textAlign: "center"
    },
    label: {
        fontSize: IS_LARGE_SCREEN ? 15 : 14,
        fontWeight: '600',
        marginBottom: 5,
        color: '#555',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 5,
        padding: IS_LARGE_SCREEN ? 12 : 10,
        marginBottom: 15,
        backgroundColor: '#fff',
        fontSize: IS_LARGE_SCREEN ? 16 : 14,
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },

    // --- Componentes de Pesquisa e Tags (Destinatários) ---
    searchInput: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 5,
        padding: IS_LARGE_SCREEN ? 12 : 10,
        marginBottom: 10,
        backgroundColor: '#fff',
        fontSize: IS_LARGE_SCREEN ? 16 : 14,
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
        padding: IS_LARGE_SCREEN ? 12 : 10,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    destinatariosContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 15,
        padding: 5,
        minHeight: 40,
        borderWidth: 1,
        borderColor: '#eee',
        borderRadius: 5,
        backgroundColor: '#fff',
    },
    destinatarioTag: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1c348e',
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 15,
        marginRight: 5,
        marginBottom: 5,
    },
    destinatarioText: {
        color: '#fff',
        marginRight: 5,
        fontSize: 12,
    },

    // --- Botões ---
    buttonGroup: {
        flexDirection: IS_LARGE_SCREEN ? 'row' : 'column',
        justifyContent: 'space-between',
        marginTop: 10,
        gap: 10,
    },
    cancelButton: {
        flex: 1,
        backgroundColor: '#dc3545',
        borderRadius: 16,
        paddingVertical: IS_LARGE_SCREEN ? 12 : 8,
    },
    submitButton: {
        flex: 1,
        backgroundColor: "#1c348e",
        borderRadius: 16,
        paddingVertical: IS_LARGE_SCREEN ? 12 : 8,
    },

    // --- Cards de Comunicado (Estilo de Container INTERNO) ---
    comunicadoCard: {
        backgroundColor: '#fff',
        padding: IS_LARGE_SCREEN ? 20 : 15,
        borderRadius: 8,
        marginBottom: 15,
        width: '100%',
        borderWidth: 1, // Adicionado uma borda para separação visual dentro do card principal
        borderColor: '#eee',
        // Removida a sombra/elevação para evitar aninhamento visual
    },
    comunicadoAssunto: {
        fontSize: IS_LARGE_SCREEN ? 18 : 16,
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
        fontSize: IS_LARGE_SCREEN ? 15 : 14,
        marginBottom: 10,
        color: '#444',
    },
    comunicadoRemetente: {
        fontSize: 14,
        color: '#555',
        fontStyle: 'italic',
        marginBottom: 5,
    },
    comunicadoDestinatarios: {
        fontSize: 12,
        color: '#888',
        fontStyle: 'italic',
    },
    eventActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 15,
        borderTopWidth: 1,
        borderTopColor: '#eee',
        paddingTop: 10,
        gap: 10,
    },
    editButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#007bff',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 5,
    },
    deleteButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#dc3545',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 5,
    },
    hideButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#5a6268',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 5,
    },
    buttonText: {
        color: '#fff',
        fontSize: 14,
        marginLeft: 5,
    },

    // --- Estilos Não Usados (Mantidos por Referência) ---
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
});