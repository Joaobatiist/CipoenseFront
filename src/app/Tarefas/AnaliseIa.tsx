import { Sidebar } from '@/components/layout/Sidebar';
import { ToastContainer } from '@/components/Toast';
import { faBars } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import React, { useCallback } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Platform,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ScrollView
} from 'react-native';


import AtletaCard from '@/components/analiseIA/AtletaCard'; 
import AtletaSearchInput from '@/components/analiseIA/AtletaSearchInput'; 
import AnaliseCard from '@/components/analiseIA/AnaliseCard'; 


import { useSupervisorAnalises } from '../../hooks/useSupervisorAnalises'; 
import { Atleta, AnaliseIa, COLORS_ANALISE } from '../../types/analiseTypes'; 

const SupervisorAnalisesScreen: React.FC = () => {
    
    const {
        // Refs
        scrollViewRef,
        flatListRef,
        // Estado e Dados
        filteredAtletas,
        analises,
        loadingAtletas,
        loadingAnalises,
        error,
        selectedAtleta,
        searchText,
        sidebarOpen,
        userName,
        userRole,
        // Handlers
        toggleSidebar,
        closeSidebar,
        handleSearchChange,
        handleSelectAtleta,
        handleDeleteAnalise,
        fetchAtletas,
    } = useSupervisorAnalises();




    // Render Item do FlatList de Atletas
    const renderAtletaItem = useCallback(({ item }: { item: Atleta }) => {
        const isSelected = selectedAtleta?.id === item.id;
        
        return (
            <AtletaCard 
                item={item} 
                isSelected={isSelected} 
                onSelect={handleSelectAtleta} 
            />
        );
    }, [selectedAtleta, handleSelectAtleta]);

    // Render Item do FlatList de Análises
    const renderAnaliseItem = useCallback(({ item }: { item: AnaliseIa }) => {
        return (
            <AnaliseCard 
                item={item} 
                onDelete={handleDeleteAnalise} 
            />
        );
    }, [handleDeleteAnalise]);

    const renderEmptyAtletas = useCallback(() => (
        <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
                {searchText ? 'Nenhum atleta encontrado para a busca.' : 'Nenhum atleta cadastrado.'}
            </Text>
            {!searchText && (
                <TouchableOpacity style={styles.reloadButton} onPress={fetchAtletas}>
                    <Text style={styles.reloadButtonText}>Recarregar Atletas</Text>
                </TouchableOpacity>
            )}
        </View>
    ), [searchText, fetchAtletas]);

    const renderEmptyAnalises = useCallback(() => (
        <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
                Nenhuma análise de IA disponível para {selectedAtleta?.nomeCompleto}.
            </Text>
        </View>
    ), [selectedAtleta]);

    return (
        <SafeAreaView style={styles.safeArea}>
            {Platform.OS === 'web' && <ToastContainer />}
            
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.menuButton} onPress={toggleSidebar}>
                    <FontAwesomeIcon icon={faBars} size={24} color={COLORS_ANALISE.white} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Análises de Desempenho (IA)</Text>
            </View>
            
            {/* Sidebar */}
             <Sidebar 
                isOpen={sidebarOpen} 
                onClose={closeSidebar}
                userName={userName}
                userRole={userRole as 'SUPERVISOR' | 'COORDENADOR' | 'TECNICO'}
                onNavigateToSection={() => {}}
            />
            
            <View style={Platform.OS === 'web' ? styles.webContainer : styles.flex1}>
            
                {loadingAtletas ? (
                    <ActivityIndicator size="large" color={COLORS_ANALISE.secondary} style={styles.centered} />
                ) : error ? (
                    <Text style={styles.errorText}>{error}</Text>
                ) : (
                    <ScrollView 
                        ref={scrollViewRef}
                        style={[styles.content, Platform.OS === 'web' && styles.webScrollView]}
                        showsVerticalScrollIndicator={Platform.OS !== 'web'}
                        keyboardShouldPersistTaps="handled"
                        nestedScrollEnabled={Platform.OS === 'web'}
                        bounces={Platform.OS !== 'web'}
                    >
                        {/* NOVO COMPONENTE: AtletaSearchInput */}
                        <AtletaSearchInput 
                            searchText={searchText} 
                            onSearchChange={handleSearchChange} 
                        />
                        
                        <View style={styles.atletasListContainer}>
                            <Text style={styles.subTitle}>Atletas</Text>
                            <FlatList
                                ref={flatListRef}
                                data={filteredAtletas}
                                keyExtractor={(item) => `atleta-${item.id}`}
                                renderItem={renderAtletaItem} 
                                ListEmptyComponent={renderEmptyAtletas}
                                contentContainerStyle={[{ paddingBottom: 10 }, Platform.OS === 'web' && styles.webFlatList]}
                                scrollEnabled={false}
                                showsVerticalScrollIndicator={Platform.OS !== 'web'}
                                keyboardShouldPersistTaps="handled"
                                nestedScrollEnabled={Platform.OS === 'web'}
                                bounces={Platform.OS !== 'web'}
                            />
                        </View>

                        {selectedAtleta && (
                            <View style={styles.analisesContainer}>
                                <Text style={styles.subTitle}>Análises de {selectedAtleta.nomeCompleto}</Text>
                                {loadingAnalises ? (
                                    <ActivityIndicator size="large" color={COLORS_ANALISE.secondary} />
                                ) : analises.length > 0 ? (
                                    <FlatList
                                        data={analises}
                                        keyExtractor={(item) => `analise-${item.id}`}
                                        renderItem={renderAnaliseItem} 
                                        scrollEnabled={false}
                                        showsVerticalScrollIndicator={Platform.OS !== 'web'}
                                        keyboardShouldPersistTaps="handled"
                                        nestedScrollEnabled={Platform.OS === 'web'}
                                        bounces={Platform.OS !== 'web'}
                                        ItemSeparatorComponent={() => <View style={styles.separator} />}
                                    />
                                ) : (
                                    renderEmptyAnalises()
                                )}
                            </View>
                        )}
                    </ScrollView>
                )}
            </View>
        </SafeAreaView>
    );
};

// --- Estilos (Referenciando as constantes do novo arquivo de tipos) ---
const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: COLORS_ANALISE.background,
    },
    header: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        padding: 15, 
        backgroundColor: COLORS_ANALISE.primary,
        paddingTop: Platform.OS === 'android' ? 50 : 10,
        paddingLeft: Platform.OS === 'android' ? 15 : 0,
        borderBottomLeftRadius: 1,
        borderBottomRightRadius: 1,
        marginBottom: 10,
    },
    menuButton: {
        paddingLeft: 15,
    },
    headerTitle: { 
        color: COLORS_ANALISE.white, 
        fontSize: 20, 
        fontWeight: 'bold', 
        marginLeft: 15, 
        textAlign: 'center',
        paddingLeft: 30,
        flex: 1
    },
    centered: { 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center' 
    },
    errorText: { 
        textAlign: 'center', 
        color: COLORS_ANALISE.error, 
        margin: 20,
        fontSize: 16,
        backgroundColor: COLORS_ANALISE.errorBackground,
        padding: 15,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: COLORS_ANALISE.error
    },
    content: { 
        flex: 1,
        paddingHorizontal: 15,
    },
    subTitle: { 
        fontSize: 18, 
        fontWeight: 'bold', 
        marginBottom: 12,
        color: COLORS_ANALISE.textPrimary, 
    },
    atletasListContainer: { 
        marginBottom: 15,
    },
    analisesContainer: { 
        marginTop: 15,
    },
    emptyContainer: {
        alignItems: 'center',
        padding: 30,
        backgroundColor: COLORS_ANALISE.white,
        borderRadius: 12,
        marginVertical: 10,
    },
    emptyText: {
        textAlign: 'center',
        fontSize: 16,
        color: COLORS_ANALISE.textSecondary,
        fontStyle: 'italic'
    },
    reloadButton: {
      backgroundColor: COLORS_ANALISE.primary,
      padding: 10,
      borderRadius: 8,
      marginTop: 15,
      ...(Platform.OS === 'web' && { cursor: 'pointer' as any }),
    },
    reloadButtonText: {
        color: COLORS_ANALISE.white,
        fontWeight: 'bold',
        fontSize: 15,
    },
    separator: {
        height: 8,
    },
    flex1: {
        flex: 1,
    },
    webContainer: {
        ...Platform.select({
            web: {
                maxWidth: 800, 
                width: '100%', 
                alignSelf: 'center', 
                flex: 1,
            },
        }),
    },
    webScrollView: {
        ...Platform.select({
            web: {
                overflowY: 'auto',
                maxHeight: '90vh',
            },
        }),
    } as any,
    webFlatList: {
        ...Platform.select({
            web: {
                maxHeight: undefined, 
            },
        }),
    } as any,
});

export default SupervisorAnalisesScreen;