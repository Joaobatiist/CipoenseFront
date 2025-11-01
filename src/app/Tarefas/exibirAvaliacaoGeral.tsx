// src/screens/RelatoriosScreen/exibirAvaliacaoGeral.tsx

import { Sidebar } from '@/components/layout/Sidebar';
import { ToastContainer } from '@/components/Toast';
import { Ionicons } from '@expo/vector-icons';
import { faBars, faSearch } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
// navigation not used here
import { format, parse } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    Platform,
    Pressable, // <-- ALTERAÇÃO: Importado o Pressable
    RefreshControl,
    SafeAreaView,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { toast } from 'react-toastify';

// Lógica e Estado (Separação de Responsabilidades)
// Assumindo que este caminho está correto para o seu projeto:
import { useRelatoriosList } from '../../hooks/useRelatoriosList';
// Tipos e Constantes (Separação de Responsabilidades)
import {
    AvaliacaoGeral,
    COLORS,
    RelatorioDesempenho,
    RelatorioTaticoPsicologico,
} from '../../types/RelatorioTypes';
// Estilos (Separação de Responsabilidades)
// Ajuste de importação conforme seu código:
import { styles } from '../../Styles/exibirAvaliaçãoGeral';

// --- Componente Auxiliar de Seção de Relatório (UI Helper) ---
interface ReportSectionProps {
    title: string;
    data: RelatorioDesempenho | RelatorioTaticoPsicologico;
    labels: { [key: string]: string };
}

/**
 * Componente de UI para exibir uma seção de relatório.
 */
const ReportSection: React.FC<ReportSectionProps> = ({ title, data, labels }) => {
    if (!data) return null;
    return (
        <View style={styles.sectionReport}>
            <Text style={styles.sectionTitleReport}>{title}</Text>
            {Object.keys(data).map((key) => {
                if (key === 'id') return null;
                const label = labels[key] || key;
                // Acesso seguro para a tipagem dinâmica do objeto de relatório
                const value = (data as any)[key]; 
                return (
                    <View key={key} style={styles.detailRow}>
                        <Text style={styles.detailLabelReport}>{label}:</Text>
                        <Text style={styles.detailValueReport}>{value}</Text>
                    </View>
                );
            })}
        </View>
    );
};

// --- Componente Principal (UI Pura) ---
const RelatoriosScreen: React.FC = () => {
    // 1. UTILIZAÇÃO DO HOOK: Importa todo o estado e lógica de filtro/API
    const {
        filteredEvaluations,
        // atletasList, // Removido por não ser usado diretamente na UI
        loading,
        error,
        refreshing,
        searchText,
        modalVisible,
        selectedEvaluationDetails,
        detailsLoading,
        detailsError,
        userName,
        userRole,
        // pendingDeleteId not needed in this component
        loadEvaluationsAndAthletes,
        setSearchText,
        // handleAtletaFilterChange, // Removido por não ser usado no snippet
        openDetailsModal,
        closeDetailsModal,
        handleDeleteEvaluation,
    } = useRelatoriosList();

    // 2. ESTADO DE UI LOCAL: Apenas estados visuais (Sidebar, Refs)
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const flatListRef = useRef<FlatList<AvaliacaoGeral>>(null);
    const modalScrollViewRef = useRef<ScrollView>(null);
    const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
    const closeSidebar = () => setSidebarOpen(false); 

    // 3. CONSTANTES/LABELS DE UI: Descrições estáticas para exibição
    const desempenhoLabels = useMemo(() => ({
        controle: "Controle", recepcao: "Recepção", dribles: "Dribles", passe: "Passe", tiro: "Tiro",
        cruzamento: "Cruzamento", giro: "Giro", manuseioDeBola: "Manuseio de Bola", forcaChute: "Força de Chute",
        gerenciamentoDeGols: "Gerenciamento de Gols", jogoOfensivo: "Jogo Ofensivo", jogoDefensivo: "Jogo Defensivo",
    }), []);

    const taticoPsicologicoLabels = useMemo(() => ({
        esportividade: "Esportividade", disciplina: "Disciplina", foco: "Foco", confianca: "Confiança",
        tomadaDecisoes: "Tomada de Decisões", compromisso: "Compromisso", lideranca: "Liderança",
        trabalhoEmEquipe: "Trabalho em Equipe", atributosFisicos: "Atributos Físicos", atuarSobPressao: "Atuar Sob Pressão",
    }), []);

    useEffect(() => {
        if (Platform.OS === 'web') {
            const handleKeyPress = (event: KeyboardEvent) => {
                const isInputFocused =
                    document.activeElement?.tagName === 'INPUT' ||
                    document.activeElement?.tagName === 'TEXTAREA';

                if (modalVisible) {
                    if (event.key === 'Escape') {
                        event.preventDefault();
                        closeDetailsModal();
                        return;
                    }
                    if ((event.key === 'Home' || event.key === 'End') && modalScrollViewRef.current && !isInputFocused) {
                        event.preventDefault();
                        const scrollTo = event.key === 'Home' ? 0 : 99999;
                        modalScrollViewRef.current.scrollTo({ y: scrollTo, animated: true }); 
                        return;
                    }
                    return;
                }
                
                if ((event.key === 'Home' || event.key === 'End') && flatListRef.current && !isInputFocused) {
                    event.preventDefault();
                    if (event.key === 'Home') {
                         flatListRef.current.scrollToOffset({ offset: 0, animated: true });
                    } else if (event.key === 'End') {
                        flatListRef.current.scrollToEnd({ animated: true });
                    }
                    return;
                }
            };
            document.addEventListener('keydown', handleKeyPress);
            return () => document.removeEventListener('keydown', handleKeyPress);
        }
    }, [modalVisible, closeDetailsModal]);

    // 5. RENDERIZAÇÃO DE ITEM (UI)
    const renderEvaluationCard = ({ item }: { item: AvaliacaoGeral }) => (
        <View style={styles.cardRow}>
            <TouchableOpacity 
                style={[ 
                    styles.cardContent, 
                    Platform.OS === 'web' && { cursor: 'pointer' as any } 
                ]} 
                onPress={() => openDetailsModal(item.id)} 
                activeOpacity={0.7}
                accessibilityLabel={`Ver detalhes da avaliação de ${item.nomeAtleta}`}
            >
                <Text style={styles.cardTitle}>Avaliação de {item.nomeAtleta}</Text>
                <Text style={styles.cardText}>Data: {format(parse(item.dataAvaliacao, 'dd-MM-yyyy', new Date()), 'dd/MM/yyyy', { locale: ptBR })} </Text>
                <Text style={styles.cardText}>Avaliador: {item.userName}</Text>
                {item.subDivisao && <Text style={styles.cardText}>Subdivisão: {item.subDivisao}</Text>}
            </TouchableOpacity>
                    <View style={{flexDirection: 'column', alignItems: 'center'}}>
                        <TouchableOpacity
                            style={{ padding: 6, marginBottom: 6 }}
                            onPress={() => exportEvaluationCSV(item)}
                            activeOpacity={0.7}
                            accessibilityLabel={`Exportar avaliação de ${item.nomeAtleta} como CSV`}
                        >
                            <Ionicons name="download-outline" size={22} color={COLORS.primary} />
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={[ 
                                styles.deleteButton, 
                                Platform.OS === 'web' && { cursor: 'pointer' as any },
                            ]} 
                            onPress={() => handleDeleteEvaluation(item.id)} 
                            activeOpacity={0.7}
                            accessibilityLabel={`Excluir avaliação de ${item.nomeAtleta}`}
                        >
                            <Ionicons 
                                name="trash-outline" 
                                size={28} 
                                color={ COLORS.danger} 
                            />
                        </TouchableOpacity>
                    </View>
                </View>

            );

            // --- Export Helpers ---
    const downloadBlob = (blob: Blob, filename: string) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    };

    const evaluationToCsv = (ev: AvaliacaoGeral) => {
        const rows: string[] = [];
        const push = (k: string, v: any) => rows.push(`"${k.replace(/"/g,'""')}","${String(v ?? '').replace(/"/g,'""')}"`);

        push('id', ev.id);
        push('Atleta', ev.nomeAtleta);
        push('Avaliador', ev.userName);
        push('DataAvaliacao', ev.dataAvaliacao);
        push('PeriodoTreino', ev.periodoTreino);
        push('SubDivisao', ev.subDivisao);
        push('Posicao', ev.posicao || '');

        // Relatorio Desempenho
        if (ev.relatorioDesempenho) {
            Object.keys(ev.relatorioDesempenho).forEach(k => {
                if (k === 'id') return;
                push(`desempenho.${k}`, (ev.relatorioDesempenho as any)[k]);
            });
        }

        // Relatorio Tatico/Psicologico
        if (ev.relatorioTaticoPsicologico) {
            Object.keys(ev.relatorioTaticoPsicologico).forEach(k => {
                if (k === 'id') return;
                push(`tatico.${k}`, (ev.relatorioTaticoPsicologico as any)[k]);
            });
        }

        push('FeedbackTreinador', ev.feedbackTreinador || '');
        push('FeedbackAvaliador', ev.feedbackAvaliador || '');
        push('PontosFortes', ev.pontosFortes || '');
        push('PontosFracos', ev.pontosFracos || '');
        push('AreasAprimoramento', ev.areasAprimoramento || '');
        push('MetasObjetivos', ev.metasObjetivos || '');

        return rows.join('\n');
    };

    const exportEvaluationCSV = (ev: AvaliacaoGeral) => {
        try {
            const csv = evaluationToCsv(ev);
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            downloadBlob(blob, `avaliacao_${ev.id}.csv`);
            if (Platform.OS === 'web') toast.success('CSV gerado.');
        } catch (err: any) {
            console.error('Erro exportando CSV', err);
            if (Platform.OS === 'web') toast.error('Erro ao gerar CSV'); else Alert.alert('Erro', 'Não foi possível gerar CSV.');
        }
    };

    const exportAllFilteredCSV = () => {
        try {
            const parts: string[] = [];
            filteredEvaluations.forEach(ev => {
                parts.push(`--- Avaliacao ID: ${ev.id} ---`);
                parts.push(evaluationToCsv(ev));
                parts.push('');
            });
            const blob = new Blob([parts.join('\n')], { type: 'text/csv;charset=utf-8;' });
            downloadBlob(blob, `avaliacoes_export_${new Date().toISOString().slice(0,10)}.csv`);
            if (Platform.OS === 'web') toast.success('CSV com todas avaliações gerado.');
        } catch (err: any) {
            console.error('Erro exportando CSV todas', err);
            if (Platform.OS === 'web') toast.error('Erro ao gerar CSV'); else Alert.alert('Erro', 'Não foi possível gerar CSV.');
        }
    };

    // PDF export via print dialog was removed in favor of CSV/XLSX table exports

    // --- Renderização de Status (UI) ---
    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color={COLORS.secondary} />
                <Text style={styles.loadingText}>Carregando relatórios...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.centered}>
                <Text style={styles.errorText}>Ops! {error}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={loadEvaluationsAndAthletes}>
                    <Text style={styles.retryButtonText}>Tentar Novamente</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // --- Renderização Principal (UI) ---
    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.menuButton} onPress={toggleSidebar}>
                    <FontAwesomeIcon icon={faBars} size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.titulo}>Relatórios de Avaliações</Text>
            </View>
            
            {/* Sidebar e Toast */}
            <Sidebar 
                isOpen={sidebarOpen} 
                onClose={closeSidebar} 
                userName={userName} 
                userRole={userRole as 'SUPERVISOR' | 'COORDENADOR' | 'TECNICO'} 
                onNavigateToSection={() => {}} 
            />
            {Platform.OS === 'web' && <ToastContainer />}

            {/* Conteúdo Principal */}
            <View style={styles.mainContent}>
                
                {/* Busca (Input usa o handler do hook) */}
                <View style={styles.searchContainer}>
                    <FontAwesomeIcon icon={faSearch} size={20} color="#888" style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Pesquisar por atleta, avaliador ou subdivisão..."
                        placeholderTextColor="#888"
                        value={searchText}
                        onChangeText={setSearchText} 
                        autoCapitalize="none"
                        autoCorrect={false}
                    />
                </View>

                    {/* Botões de exportação */}
                    <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 12 }}>
                        <TouchableOpacity
                            style={[styles.retryButton, Platform.OS === 'web' && { cursor: 'pointer' as any }]}
                            onPress={exportAllFilteredCSV}
                        >
                            <Text style={styles.retryButtonText}>Exportar todas (CSV)</Text>
                        </TouchableOpacity>
                    </View>

                {/* Lista de Avaliações */}
                {filteredEvaluations.length === 0 ? (
                    <Text style={styles.noEvaluationsText}>Nenhuma avaliação encontrada.</Text>
                ) : (
                    <FlatList
                        ref={flatListRef}
                        data={filteredEvaluations}
                        keyExtractor={(item) => item.id.toString()}
                        renderItem={renderEvaluationCard}
                        contentContainerStyle={styles.listContentContainer}
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={loadEvaluationsAndAthletes} tintColor={COLORS.primary} />
                        }
                        style={Platform.OS === 'web' ? styles.webFlatList : undefined}
                        showsVerticalScrollIndicator={Platform.OS === 'web'}
                    />
                )}
            </View>

            {/* Modal de Detalhes da Avaliação */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={modalVisible}
                onRequestClose={closeDetailsModal}
            >
                {/* // <-- ALTERAÇÃO: View trocada por Pressable para fechar ao clicar fora */}
                <Pressable 
                    style={styles.modalOverlay}
                    onPress={closeDetailsModal} // <-- ALTERAÇÃO: Fecha o modal
                >
                    {/* // <-- ALTERAÇÃO: View trocada por Pressable para parar o clique */}
                    <Pressable 
                        style={styles.modalContent}
                        onPress={(e) => e.stopPropagation()} // <-- ALTERAÇÃO: Impede o clique de fechar
                    >
                        <TouchableOpacity 
                            style={[ styles.modalCloseButton, Platform.OS === 'web' && { cursor: 'pointer' as any } ]} 
                            onPress={closeDetailsModal} 
                            activeOpacity={0.7}
                            accessibilityLabel="Fechar detalhes"
                        >
                            <Ionicons name="close-circle-outline" size={32} color={COLORS.textSecondary} />
                        </TouchableOpacity>

                        {detailsLoading ? (
                            <View style={styles.centeredModal}> {/* CENTREDMODAL CORRIGIDO */}
                                <ActivityIndicator size="large" color={COLORS.primary} />
                                <Text style={styles.loadingText}>Carregando detalhes...</Text>
                            </View>
                        ) : detailsError ? (
                            <View style={styles.centeredModal}> {/* CENTREDMODAL CORRIGIDO */}
                                <Text style={styles.errorTextModal}>{detailsError}</Text>
                                <TouchableOpacity style={styles.retryButton} onPress={() => openDetailsModal(selectedEvaluationDetails?.id ?? 0)}>
                                    <Text style={styles.retryButtonText}>Tentar Novamente</Text>
                                </TouchableOpacity>
                            </View>
                        ) : selectedEvaluationDetails && (
                            <ScrollView 
                                ref={modalScrollViewRef} 
                                contentContainerStyle={styles.modalScrollViewContent}
                                keyboardShouldPersistTaps="handled"
                            >
                                <Text style={styles.modalTitle}>Detalhes da Avaliação</Text>
                                
                                {/* Informações Básicas */}
                                <View style={styles.detailCard}> {/* DETAILCARD CORRIGIDO */}
                                    <Text style={styles.detailText}>Atleta: {selectedEvaluationDetails.nomeAtleta}</Text>
                                    <Text style={styles.detailText}>Avaliador: {selectedEvaluationDetails.userName}</Text>
                                    <Text style={styles.detailText}>Data: {format(parse(selectedEvaluationDetails.dataAvaliacao, 'dd-MM-yyyy', new Date()), 'dd/MM/yyyy', { locale: ptBR })}</Text>
                                    {selectedEvaluationDetails.subDivisao && <Text style={styles.detailText}>Subdivisão: {selectedEvaluationDetails.subDivisao}</Text>}
                                    {selectedEvaluationDetails.posicao && <Text style={styles.detailText}>Posição: {selectedEvaluationDetails.posicao}</Text>}
                                </View>

                                {/* Relatórios Detalhados */}
                                {selectedEvaluationDetails.relatorioDesempenho && (
                                    <ReportSection 
                                        title="Relatório de Desempenho Técnico" 
                                        data={selectedEvaluationDetails.relatorioDesempenho} 
                                        labels={desempenhoLabels} 
                                    />
                                )}
                                
                                {selectedEvaluationDetails.relatorioTaticoPsicologico && (
                                    <ReportSection 
                                        title="Relatório Tático e Psicológico" 
                                        data={selectedEvaluationDetails.relatorioTaticoPsicologico} 
                                        labels={taticoPsicologicoLabels} 
                                    />
                                )}
                                
                                {/* Feedbacks */}
                                <View style={styles.sectionReport}>
                                    <Text style={styles.sectionTitleReport}>Feedbacks</Text>
                                    <Text style={styles.detailLabel}>Feedback do Treinador:</Text>
                                    <Text style={styles.feedbackText}>{selectedEvaluationDetails.feedbackTreinador || 'Não fornecido.'}</Text>
                                    
                                    <Text style={styles.detailLabel}>Feedback do Avaliador:</Text>
                                    <Text style={styles.feedbackText}>{selectedEvaluationDetails.feedbackAvaliador || 'Não fornecido.'}</Text>
                                    
                                    <Text style={styles.detailLabel}>Pontos Fortes:</Text>
                                    <Text style={styles.feedbackText}>{selectedEvaluationDetails.pontosFortes || 'Não fornecido.'}</Text>
                                    
                                    <Text style={styles.detailLabel}>Pontos Fracos:</Text>
                                    <Text style={styles.feedbackText}>{selectedEvaluationDetails.pontosFracos || 'Não fornecido.'}</Text>
                                </View>
                                
                                <View style={styles.sectionReport}>
                                    <Text style={styles.sectionTitleReport}>Metas e Aprimoramento</Text>
                                    <Text style={styles.detailLabel}>Áreas de Aprimoramento:</Text>
                                    <Text style={styles.feedbackText}>{selectedEvaluationDetails.areasAprimoramento || 'Não fornecido.'}</Text>
                                    
                                    <Text style={styles.detailLabel}>Metas e Objetivos:</Text>
                                    <Text style={styles.feedbackText}>{selectedEvaluationDetails.metasObjetivos || 'Não fornecido.'}</Text>
                                </View>
                            </ScrollView>
                        )}
                    </Pressable> {/* // <-- ALTERAÇÃO: Fechamento do Pressable (modalContent) */}
                </Pressable> {/* // <-- ALTERAÇÃO: Fechamento do Pressable (modalOverlay) */}
            </Modal>
        </SafeAreaView>
    );
};

export default RelatoriosScreen;