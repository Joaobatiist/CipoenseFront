import { Dimensions, Platform, StatusBar, StyleSheet } from "react-native";

const { width } = Dimensions.get('window');
// Ponto de quebra para telas maiores (tablets/laptops menores)
const BREAKPOINT_TABLET = 768; 
// Largura máxima do conteúdo no Desktop
const MAX_CONTENT_WIDTH = 1200; 
// Padding lateral padrão para mobile
const HORIZONTAL_PADDING_MOBILE = 15;

const isLargeScreen = width >= BREAKPOINT_TABLET;

export const styles = StyleSheet.create({
    // --- Containers de Layout ---
    container: { 
        flex: 1, 
        backgroundColor: '#f5f5f5',
        width: '100%',
    },
    
    // Wrapper principal do conteúdo, limita a largura e compensa o header/footer
    contentWrapper: {
        flex: 1,
        width: '100%',
        maxWidth: MAX_CONTENT_WIDTH, 
        alignSelf: 'center', 
        
        // Padding superior para compensar o header fixo na Web
        paddingTop: Platform.select({ 
            web: 80, 
            default: 0 
        }), 
        
        // Padding inferior para compensar o footer fixo na Web
        paddingBottom: Platform.select({ 
            web: 100, 
            default: 15 
        }), 
        
        // Adiciona padding horizontal leve em mobile para evitar bordas grudadas
        paddingHorizontal: Platform.select({ 
            web: 0, 
            default: HORIZONTAL_PADDING_MOBILE 
        }), 
    },
    
    listContent: {
        paddingVertical: 10,
    },

    // --- Header ---
    header: {
        backgroundColor: '#1c348e',
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 15,
        minHeight: Platform.select({ web: 70, default: 60 }),
        borderBottomWidth: 1,
        borderBottomColor: '#e5c228',

        ...Platform.select({
            web: {
                position: 'fixed' as any,
                top: 0,
                zIndex: 10,
                boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.2)',
            },
            default: {
                paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 20) + 10 : 20,
                elevation: 3,
            },
        }),
    },
    headerTitle: {
        color: '#fff',
        fontSize: isLargeScreen ? 20 : 18,
        fontWeight: 'bold',
        textAlign: 'center',
        flex: 1, 
    },
    btnVoltar: {
        position: 'absolute',
        left: isLargeScreen ? 30 : HORIZONTAL_PADDING_MOBILE,
        padding: 5,
        zIndex: 11,
        top: '50%',
        transform: [{ translateY: -10 }],
    },
    calendarButton: {
        position: 'absolute',
        right: isLargeScreen ? 30 : HORIZONTAL_PADDING_MOBILE,
        padding: 5,
        zIndex: 11,
        top: '50%',
        transform: [{ translateY: -10 }],
    },

    // --- Itens da Lista (Alunos) ---
    alunoItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 15,
        paddingHorizontal: 15, 
        borderBottomWidth: 1,
        borderBottomColor: '#eee', 
        backgroundColor: '#fff',
        marginVertical: 4,
        borderRadius: 8,
        minHeight: 70, // Garante altura mínima
        ...Platform.select({
            web: {
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
            },
            android: {
                elevation: 1, 
            }
        }),
    },
    alunoNome: {
        fontSize: isLargeScreen ? 16 : 14,
        fontWeight: '500',
        color: '#333',
        flex: 1, 
        paddingRight: 10,
        flexShrink: 1, // Permite que o texto encolha se necessário
    },
    iconContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingLeft: 10,
        // Garante que os ícones sempre sejam visíveis
        minWidth: 90, // Espaço mínimo para dois ícones + espaçamento
        justifyContent: 'flex-end',
        flexShrink: 0, // Impede que o container encolha
    },

    // --- Rodapé (Footer) ---
    actionsFooter: {
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#ddd',
        width: '100%', 

        ...Platform.select({
            web: {
                position: 'fixed' as any,
                bottom: 0,
                zIndex: 9,
                boxShadow: '0px -2px 4px rgba(0, 0, 0, 0.1)',
            },
        }),
    },
    // CORRIGIDO: Agora sempre é 'row' para forçar os botões lado a lado no mobile também
    footerContent: {
        flexDirection: 'row', 
        // Centraliza os botões fixos no desktop (ou onde há espaço)
        justifyContent: 'center', 
        alignItems: 'center',
        width: '100%',
        maxWidth: MAX_CONTENT_WIDTH, 
        alignSelf: 'center',
        paddingVertical: isLargeScreen ? 15 : 10,
        paddingHorizontal: isLargeScreen ? 20 : HORIZONTAL_PADDING_MOBILE, 
        // Espaçamento entre os botões
        gap: 10, 
    },

    // Botões dentro do Footer
    previousListsButton: {
        backgroundColor: '#e5c228',
        padding: isLargeScreen ? 12 : 14,
        borderRadius: 8,
        // CORRIGIDO: Usa width fixa no desktop, flex 1 no mobile para dividir o espaço
        width: isLargeScreen ? 200 : undefined, 
        flex: isLargeScreen ? undefined : 1, 
        marginTop: 0, // Garante que não há margem de empilhamento
    },
    previousListsButtonText: {
        color: '#1c348e',
        fontWeight: 'bold',
        textAlign: 'center',
        fontSize: isLargeScreen ? 16 : 15,
    },
    saveButton: {
        backgroundColor: '#1c348e',
        padding: isLargeScreen ? 12 : 14,
        borderRadius: 8,
        // CORRIGIDO: Usa width fixa no desktop, flex 1 no mobile para dividir o espaço
        width: isLargeScreen ? 200 : undefined, 
        flex: isLargeScreen ? undefined : 1, 
    },
    saveButtonDisabled: {
        opacity: 0.6,
    },
    saveButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        textAlign: 'center',
        fontSize: isLargeScreen ? 16 : 15,
    },

    // --- Histórico ---
    diaCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 15,
        marginVertical: 5,
        borderRadius: 8,
        borderLeftWidth: 5,
        borderLeftColor: '#1c348e', 
        ...Platform.select({
            web: {
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
            },
            android: {
                elevation: 1,
            }
        }),
    },
    diaCardContent: {
        flex: 1,
    },
    diaCardTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#000000ff',
    },
    diaCardSummary: {
        fontSize: 14,
        color: '#666',
        marginTop: 5,
    },
    
    // --- Utilitários/Feedback/Modal ---
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 50,
    },
    emptyListContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 50,
    },
    emptyListText: {
        fontSize: 16,
        color: '#666',
        marginBottom: 10,
    },
    reloadButton: {
        backgroundColor: '#e5c228',
        padding: 10,
        borderRadius: 5,
        marginTop: 10,
    },
    reloadButtonText: {
        color: '#1c348e',
        fontWeight: 'bold',
    },
    modalBackground: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    datePickerContainer: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 10,
        borderTopRightRadius: 10,
        padding: 15,
    },
    confirmButton: {
        backgroundColor: '#1c348e',
        padding: 10,
        borderRadius: 5,
        marginTop: 10,
    },
    confirmButtonText: {
        color: '#fff',
        textAlign: 'center',
        fontWeight: 'bold',
    },
});