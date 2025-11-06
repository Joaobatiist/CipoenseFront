import { Sidebar } from '@/components/layout/Sidebar';
import { ToastContainer } from '@/components/Toast';
import { faBars } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';


import AnaliseCard from '@/components/analiseIA/AnaliseCard';
import AtletaCard from '@/components/analiseIA/AtletaCard';
import AtletaSearchInput from '@/components/analiseIA/AtletaSearchInput';
import AtletaInteractiveChart from '@/components/charts/AtletaInteractiveChart';


import { useResponsive } from '@/hooks/useResponsive';
import { useSupervisorAnalises } from '../../hooks/useSupervisorAnalises';
import { AnaliseIa, Atleta, COLORS_ANALISE } from '../../types/analiseTypes';

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
        handleEditAnalise,
        fetchAtletas,
    } = useSupervisorAnalises();

    const [selectedAnaliseId, setSelectedAnaliseId] = useState<number | null>(null);
    const { height, width } = useResponsive();
    const MOBILE_BREAKPOINT = 600; // px - when <= this, stack chart above analyses
    const isMobileLayout = Platform.OS !== 'web' || (width && width <= MOBILE_BREAKPOINT);
    const atletasListMaxHeight = Platform.OS === 'web' ? Math.min(1040, Math.max(620, height * 0.28)) : 300;
    const isLargeDesktop = Platform.OS === 'web' && width && width >= 1200;
    const analisesListMaxHeight = Platform.OS === 'web'
        ? (isLargeDesktop ? Math.min(1150, Math.max(340, height * 0.72)) : Math.min(900, Math.max(300, height * 0.92)))
        : 420;




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
            <TouchableOpacity onPress={() => setSelectedAnaliseId(item.id)} activeOpacity={0.8}>
                <AnaliseCard 
                    item={item} 
                    onDelete={handleDeleteAnalise}
                    onEdit={handleEditAnalise}
                />
            </TouchableOpacity>
        );
    }, [handleDeleteAnalise, handleEditAnalise, setSelectedAnaliseId]);

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
                                contentContainerStyle={{ paddingBottom: 10 }}
                                style={[styles.flatList, { maxHeight: atletasListMaxHeight }]}
                                scrollEnabled={true}
                                showsVerticalScrollIndicator={true}
                                keyboardShouldPersistTaps="handled"
                                nestedScrollEnabled={Platform.OS === 'web'}
                                bounces={Platform.OS !== 'web'}
                            />
                        </View>

                        {selectedAtleta && (
                            // Wrapper que em Web permite que apenas a área de análises+gráfico cresça
                            <View style={Platform.OS === 'web' ? styles.analisesWideWrapper : undefined}>
                                <Text style={styles.subTitle}>Análise de {selectedAtleta.nomeCompleto}</Text>
                                <View style={[styles.analisesContainer, isMobileLayout ? styles.analisesStacked : styles.analisesRow]}>
                                    {isMobileLayout ? (
                                        <>
                                            {/* On mobile: render chart first (above the analyses list) */}
                                            <View style={[styles.chartColumn, styles.chartColumnStacked]}>
                                                <AtletaInteractiveChart
                                                    atletaId={selectedAtleta.id}
                                                    highlightedEvaluationId={selectedAnaliseId}
                                                    onPointPress={(evaluation) => {
                                                        setSelectedAnaliseId(evaluation.id);
                                                    }}
                                                />
                                            </View>

                                            <View style={styles.listColumn}>
                                    
                                    {loadingAnalises ? (
                                        <ActivityIndicator size="large" color={COLORS_ANALISE.secondary} />
                                    ) : analises.length > 0 ? (
                                        <FlatList
                                            data={analises}
                                            keyExtractor={(item) => `analise-${item.id}`}
                                            renderItem={renderAnaliseItem} 
                                            style={[styles.flatList, { maxHeight: analisesListMaxHeight }]}
                                            contentContainerStyle={{ paddingBottom: 12 }}
                                            scrollEnabled={true}
                                            showsVerticalScrollIndicator={true}
                                            keyboardShouldPersistTaps="handled"
                                            nestedScrollEnabled={Platform.OS === 'web'}
                                            bounces={Platform.OS !== 'web'}
                                            ItemSeparatorComponent={() => <View style={styles.separator} />}
                                        />
                                    ) : (
                                        renderEmptyAnalises()
                                    )}
                                </View>
                                        </>
                                    ) : (
                                    <>
                                    <View style={styles.listColumn}>
                                    
                                    {loadingAnalises ? (
                                        <ActivityIndicator size="large" color={COLORS_ANALISE.secondary} />
                                    ) : analises.length > 0 ? (
                                        <FlatList
                                            data={analises}
                                            keyExtractor={(item) => `analise-${item.id}`}
                                            renderItem={renderAnaliseItem} 
                                            style={[styles.flatList, { maxHeight: analisesListMaxHeight }]}
                                            contentContainerStyle={{ paddingBottom: 12 }}
                                            scrollEnabled={true}
                                            showsVerticalScrollIndicator={true}
                                            keyboardShouldPersistTaps="handled"
                                            nestedScrollEnabled={Platform.OS === 'web'}
                                            bounces={Platform.OS !== 'web'}
                                            ItemSeparatorComponent={() => <View style={styles.separator} />}
                                        />
                                    ) : (
                                        renderEmptyAnalises()
                                    )}
                                </View>

                                {/* Right column: interactive chart for the selected athlete */}
                                    <View style={styles.chartColumn}>
                                    <AtletaInteractiveChart
                                        atletaId={selectedAtleta.id}
                                        highlightedEvaluationId={selectedAnaliseId}
                                        onPointPress={(evaluation) => {
                                            // when the chart point is pressed, mark that analysis selected
                                            setSelectedAnaliseId(evaluation.id);
                                        }}
                                    />
                                    </View>
                                </>
                                    )}
                                </View>
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
        paddingHorizontal: 24,
        ...Platform.select({ web: { paddingHorizontal: 0 } }),
    },
    subTitle: { 
        fontSize: 18, 
        fontWeight: 'bold', 
        textAlign: 'center',
        marginBottom: 12,
        color: COLORS_ANALISE.textPrimary, 
    },
    atletasListContainer: { 
        textAlign: 'center',
        marginBottom: 15,
        maxHeight: 700,
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
        height: 9,
    },
    flex1: {
        flex: 1,
    },
    webContainer: {
        ...Platform.select({
            web: {
                
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
    // Reusable style for FlatList areas so we can apply maxHeight dynamically
    flatList: {
        width: '100%',
    } as any,
    analisesWideWrapper: {
        ...Platform.select({
            web: {
                maxWidth: 1000,
                width: '100%',
                alignSelf: 'center',
            },
        }),
    } as any,
    analisesRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 20 as any,
    },
    listColumn: {
        flex: 1,
        ...Platform.select({
            web: {
                minWidth: 300,
                
            },
        }),
    },
    chartColumn: {
      marginTop: 0,
        
    },
    analisesStacked: {
        flexDirection: 'column',
        alignItems: 'stretch',
        gap: 12 as any,
    },
    chartColumnStacked: {
        marginTop: 10,
        marginBottom: 16,
    },
});

export default SupervisorAnalisesScreen;