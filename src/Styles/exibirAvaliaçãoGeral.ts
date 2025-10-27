// src/Styles/exibirAvaliaçãoGeral.ts

import { COLORS } from '@/types/RelatorioTypes';
import { StyleSheet, Dimensions, Platform, StatusBar } from 'react-native';

const HEADER_HEIGHT = Platform.OS === 'web' ? 70 : 60 + (Platform.OS === 'android' ? StatusBar.currentHeight || 20 : 0);
const MAX_WIDTH_WEB = 1000;
const { height: screenHeight } = Dimensions.get('window');

export const styles = StyleSheet.create({
    // --- Geral ---
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.background,
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: COLORS.textSecondary,
    },
    errorText: {
        color: COLORS.danger,
        fontSize: 17,
        textAlign: 'center',
        marginBottom: 20,
        fontWeight: 'bold',
    },
    retryButton: {
        backgroundColor: COLORS.primary,
        paddingVertical: 12,
        paddingHorizontal: 25,
        borderRadius: 8,
        marginTop: 10,
        ...(Platform.OS === 'web' && { cursor: 'pointer' as any }),
    },
    retryButtonText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: 'bold',
    },

    // --- Header e Sidebar ---
    header: {
        height: HEADER_HEIGHT,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        backgroundColor: COLORS.primary,
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0,
        justifyContent: 'flex-start',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    menuButton: {
        padding: 5,
        marginRight: 15,
        ...(Platform.OS === 'web' && { cursor: 'pointer' as any }),
    },
    titulo: {
        fontSize: 22,
        fontWeight: 'bold',
        color: COLORS.white,
        flex: 1,
        textAlign: 'center',
        marginRight: Platform.OS === 'web' ? 40 : 0, // Ajuste para centralizar
    },

    // --- Conteúdo Principal e Busca ---
    mainContent: {
        flex: 1,
        width: '100%',
        alignSelf: 'center',
        paddingHorizontal: 15,
        paddingTop: 15,
        ...(Platform.OS === 'web' && {
            maxWidth: MAX_WIDTH_WEB,
        }),
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        borderRadius: 25,
        paddingHorizontal: 15,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: COLORS.border,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 1.5,
    },
    searchIcon: {
        marginRight: 10,
    },
    searchInput: {
        flex: 1,
        height: 45,
        fontSize: 16,
        color: COLORS.textPrimary,
        // No React Native Web, isso pode ser necessário:
        ...(Platform.OS === 'web' && { outlineStyle: 'none' as any }),
    },
    noEvaluationsText: {
        fontSize: 18,
        textAlign: 'center',
        marginTop: 50,
        color: COLORS.textSecondary,
    },

    // --- Lista de Avaliações (Cards) ---
    listContentContainer: {
        paddingBottom: 20,
    },
    webFlatList: {
        flex: 1,
        // Garante que o scrollbar apareça corretamente no desktop
        maxHeight: screenHeight - HEADER_HEIGHT - 90, 
    },
    cardRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        borderRadius: 10,
        marginBottom: 12,
        borderLeftWidth: 5,
        borderLeftColor: COLORS.secondary,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.15,
        shadowRadius: 2,
    },
    cardContent: {
        flex: 1,
        padding: 15,
    },
    cardTitle: {
        fontSize: 17,
        fontWeight: 'bold',
        color: '#000000c2',
        marginBottom: 5,
    },
    cardText: {
        fontSize: 14,
        color: '#353535ff',
    },
    deleteButton: {
        padding: 15,
        // Cor do hover se for web
        ...(Platform.OS === 'web' && { 
            transition: 'background-color 0.2s',
            ':hover': { 
                backgroundColor: '#fdd', 
                borderRadius: 10 
            } 
        } as any),
    },

    // --- Modal de Detalhes ---
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: Platform.OS === 'web' ? '90%' : '95%',
        maxWidth: 700,
        maxHeight: Platform.OS === 'web' ? '90%' : '80%',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        elevation: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 15,
    },
    modalCloseButton: {
        position: 'absolute',
        top: 25,
        right: 35,
        zIndex: 5,
        padding: 5,
        ...(Platform.OS === 'web' && { cursor: 'pointer' as any }),
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#303030ff',
        marginBottom: 15,
        textAlign: 'center',
        borderBottomWidth: 2,
        borderBottomColor: COLORS.border,
        paddingBottom: 10,
    },
    modalScrollViewContent: {
        paddingVertical: 10,
        paddingHorizontal: Platform.OS === 'web' ? 5 : 0,
    },
    
    // ESTILOS FALTANTES (Corrigindo o erro TS)
    /**
     * @description Contêiner para as informações básicas no topo do modal.
     */
    detailCard: { 
        backgroundColor: COLORS.background,
        borderRadius: 8,
        padding: 15,
        marginBottom: 20,
        borderLeftWidth: 4,
        borderLeftColor: COLORS.secondary,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 1,
    },
    /**
     * @description Estilo para centralizar o loading/erro dentro do modal.
     */
    centeredModal: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 200, 
    },
    errorTextModal: {
        color: COLORS.danger,
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 10,
    },
    
    // --- Estilos de ReportSection ---
    sectionReport: { 
        backgroundColor: '#f9f9f9',
        borderRadius: 8,
        padding: 18,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#eee',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
    },
    sectionTitleReport: { 
        fontSize: 18,
        fontWeight: 'bold',
        color: '#444',
        marginBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
        paddingBottom: 5,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
        paddingVertical: 2,
    },
    detailLabelReport: {
        fontSize: 15,
        fontWeight: '500',
        color: COLORS.textPrimary,
    },
    detailValueReport: {
        fontSize: 15,
        color: COLORS.textSecondary,
        fontWeight: '600',
    },
    // ... outros estilos de detalhe, se houver:
    detailText: {
        fontSize: 15,
        marginBottom: 6,
        color: '#444444ff',
    },
    detailLabel: {
        fontWeight: 'bold',
        color: COLORS.textPrimary,
    },
    feedbackText: {
        fontSize: 15,
        marginBottom: 8,
        color: COLORS.textSecondary,
        lineHeight: 22,
    },
});