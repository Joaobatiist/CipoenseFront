import { Sidebar } from '@/components/layout/Sidebar';
import { ToastContainer } from '@/components/Toast';
import { faBars } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import React from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import { TextInputMask } from 'react-native-masked-text';
import { styles } from '../../Styles/realizarRelatorios';

// 1. Importe o hook e a interface de avaliação
import {
  AthleteEvaluation,
  useAthleteEvaluationForm,
} from '../../hooks/useRelatorioForm'; // Ajuste o caminho

// --- Componentes de UI Auxiliares (Movidos para fora) ---

interface RatingOptionsProps {
  attribute: keyof AthleteEvaluation;
  value: number;
  onChange: (attribute: keyof AthleteEvaluation, value: number) => void;
}

// Componente de UI puro
const RatingOptions: React.FC<RatingOptionsProps> = ({ attribute, value, onChange }) => {
  const avaliacaoOptions = [5, 4, 3, 2, 1];
  return (
    <View style={styles.ratingOptionsContainer}>
      {avaliacaoOptions.map((option) => (
        <TouchableOpacity
          key={option}
          style={[
            styles.ratingOption,
            value === option && styles.ratingOptionSelected,
          ]}
          onPress={() => onChange(attribute, option)}
          {...(Platform.OS === 'web' && { cursor: 'pointer', activeOpacity: 0.8 })}
          accessibilityLabel={`Avaliar com nota ${option}`}
        >
          <Text style={value === option ? styles.ratingOptionTextSelected : styles.ratingOptionText}>
            {option}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

// Função de UI pura
const formatAttributeName = (attribute: keyof AthleteEvaluation) => {
  const mapping: { [key in keyof AthleteEvaluation]?: string } = {
    Controle: 'Controle',
    recepcao: 'Recepção',
    dribles: 'Dribles',
    passe: 'Passe',
    tiro: 'Tiro',
    cruzamento: 'Cruzamento',
    giro: 'Giro',
    manuseioBola: 'Manuseio de Bola',
    forcaChute: 'Força no Chute',
    GerenciamentoGols: 'Gerenciamento de Gols',
    jogoOfensivo: 'Jogo Ofensivo',
    jogoDefensivo: 'Jogo Defensivo',
    esportividade: 'Esportividade',
    disciplina: 'Disciplina',
    foco: 'Foco',
    confianca: 'Confiança',
    tomadaDecisoes: 'Tomada de Decisões',
    compromisso: 'Compromisso',
    lideranca: 'Liderança',
    trabalhoEquipe: 'Trabalho em Equipe',
    atributosFisicos: 'Atributos Físicos',
    capacidadeSobPressao: 'Capacidade Sob Pressão',
  };
  return mapping[attribute] || attribute;
};

// Função de UI pura
const renderAvaliacaoTable = (
  title: string,
  attributes: (keyof AthleteEvaluation)[],
  avaliacao: AthleteEvaluation, // Recebe o estado
  handleAvaliacaoChange: (attribute: keyof AthleteEvaluation, value: number) => void // Recebe o handler
) => (
  <View style={styles.card}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <View style={styles.table}>
      <View style={styles.tableHeaderRow}>
        <Text style={styles.tableHead}>Atributo</Text>
        <Text style={styles.tableHead}>Avaliação</Text>
      </View>
      {attributes.map((attr) => (
        <View style={styles.tableRow} key={attr}>
          <Text style={styles.tableCell}>{formatAttributeName(attr)}</Text>
          <RatingOptions
            attribute={attr}
            value={avaliacao[attr]}
            onChange={handleAvaliacaoChange}
          />
        </View>
      ))}
    </View>
  </View>
);

// --- Componente Principal (Agora focado em UI) ---

const AthleteEvaluationForm = () => {
  // 2. Chame o hook para obter todos os estados e lógicas
  const {
    scrollViewRef,
    sidebarOpen,
    userName,
    userRole,
    toggleSidebar,
    closeSidebar,
    nomeAvaliador,
    periodo, setPeriodo,
    dataAvaliacao, setDataAvaliacao,
    avaliacao,
    handleAvaliacaoChange,
    feedbackTreinador, setFeedbackTreinador,
    feedbackAvaliador, setFeedbackAvaliador,
    pontosFortes, setPontosFortes,
    pontosFracos, setPontosFracos,
    areasAprimoramento, setAreasAprimoramento,
    metasObjetivos, setMetasObjetivos,
    openAtletaPicker, setOpenAtletaPicker,
    openSubdivisaoPicker, setOpenSubdivisaoPicker,
    openPosicaoPicker, setOpenPosicaoPicker,
    selectedAtletaId, setSelectedAtletaId,
    selectedSubdivisao, setSelectedSubdivisao,
    selectedPosicao, setSelectedPosicao,
    atletasPickerItems,
    subdivisaoPickerItems,
    posicaoPickerItems,
    handleAtletaChange,
    handleSubdivisaoFilterChange,
    handlePosicaoFilterChange,
    isSubdivisaoPickerDisabled,
    isPosicaoPickerDisabled,
    isLoading,
    isTokenLoaded,
    authToken,
    handleSubmit,
    goBack,
  } = useAthleteEvaluationForm();

  // 3. O JSX permanece quase idêntico, apenas consome os dados do hook
  return (
    <KeyboardAvoidingView
      style={styles.keyboardAvoidingContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
    >
      <View style={styles.header}>
        <TouchableOpacity style={styles.menuButton} onPress={toggleSidebar}>
          <FontAwesomeIcon icon={faBars} size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.titulo}>Avaliação de Desempenho</Text>
      </View>
      <Sidebar
        isOpen={sidebarOpen}
        onClose={closeSidebar}
        userName={userName}
        userRole={userRole as 'SUPERVISOR' | 'COORDENADOR' | 'TECNICO'}
        onNavigateToSection={() => {}}
      />

      <ScrollView
        ref={scrollViewRef}
        style={Platform.OS === 'web' && styles.webScrollView}
        contentContainerStyle={styles.scrollViewContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={Platform.OS !== 'web'}
        nestedScrollEnabled={Platform.OS === 'web'}
        bounces={Platform.OS !== 'web'}
      >
        <View style={styles.mainContentContainer}>
          <View style={[styles.card, { zIndex: 3000 }]}>
            <Text style={styles.label}>Nome do Atleta:</Text>
            <DropDownPicker
              open={openAtletaPicker}
              value={selectedAtletaId}
              items={atletasPickerItems}
              setOpen={setOpenAtletaPicker}
              setValue={setSelectedAtletaId} // O hook lida com isso, mas o picker precisa
              onSelectItem={(item) => handleAtletaChange(item.value as number | null)}
              placeholder="Selecione um Atleta"
              style={styles.dropdown}
              containerStyle={styles.dropdownContainer}
              zIndex={3000}
              listMode="SCROLLVIEW"
              itemSeparator={true}
              itemSeparatorStyle={styles.itemSeparator}
            />

            <Text style={styles.label}>Nome do Avaliador:</Text>
            <TextInput
              style={styles.input}
              value={nomeAvaliador}
              editable={false}
            />

            <Text style={styles.label}>Subdivisão:</Text>
            <DropDownPicker
              open={openSubdivisaoPicker}
              value={selectedSubdivisao}
              items={subdivisaoPickerItems}
              setOpen={setOpenSubdivisaoPicker}
              setValue={setSelectedSubdivisao}
              onSelectItem={(item) => handleSubdivisaoFilterChange(item.value as string)}
              placeholder="Selecione uma Subdivisão"
              style={styles.dropdown}
              containerStyle={styles.dropdownContainer}
              disabled={isSubdivisaoPickerDisabled}
              zIndex={2000}
              listMode="SCROLLVIEW"
              itemSeparator={true}
              itemSeparatorStyle={styles.itemSeparator}
            />

            <Text style={styles.label}>Posição:</Text>
            <DropDownPicker
              open={openPosicaoPicker}
              value={selectedPosicao}
              items={posicaoPickerItems}
              setOpen={setOpenPosicaoPicker}
              setValue={setSelectedPosicao}
              onSelectItem={(item) => handlePosicaoFilterChange(item.value as string)}
              placeholder="Selecione uma Posição"
              style={styles.dropdown}
              containerStyle={styles.dropdownContainer}
              disabled={isPosicaoPickerDisabled}
              zIndex={1000}
              listMode="SCROLLVIEW"
              itemSeparator={true}
              itemSeparatorStyle={styles.itemSeparator}
            />

            <TextInput
              style={styles.input}
              placeholder="Período"
              value={periodo}
              onChangeText={setPeriodo}
            />
          </View>

          {renderAvaliacaoTable('Desempenho do Atleta', [
            'Controle', 'recepcao', 'dribles', 'passe', 'tiro', 'cruzamento', 'giro',
            'manuseioBola', 'forcaChute', 'GerenciamentoGols', 'jogoOfensivo', 'jogoDefensivo',
          ], avaliacao, handleAvaliacaoChange)}

          {renderAvaliacaoTable('Avaliação Tática/Psicológica/Física', [
            'esportividade', 'disciplina', 'foco', 'confianca', 'tomadaDecisoes',
            'compromisso', 'lideranca', 'trabalhoEquipe', 'atributosFisicos', 'capacidadeSobPressao',
          ], avaliacao, handleAvaliacaoChange)}

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Avaliação Geral do Jogador</Text>
            <TextInput
              style={[styles.input, styles.multilineInput]}
              placeholder="Feedback do Treinador"
              value={feedbackTreinador}
              onChangeText={setFeedbackTreinador}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
            <TextInput
              style={[styles.input, styles.multilineInput]}
              placeholder="Feedback do Avaliador"
              value={feedbackAvaliador}
              onChangeText={setFeedbackAvaliador}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
            <TextInput
              style={[styles.input, styles.multilineInput]}
              placeholder="Pontos Fortes"
              value={pontosFortes}
              onChangeText={setPontosFortes}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
            <TextInput
              style={[styles.input, styles.multilineInput]}
              placeholder="Pontos Fracos"
              value={pontosFracos}
              onChangeText={setPontosFracos}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
            <TextInput
              style={[styles.input, styles.multilineInput]}
              placeholder="Áreas de Aprimoramento"
              value={areasAprimoramento}
              onChangeText={setAreasAprimoramento}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
            <TextInput
              style={[styles.input, styles.multilineInput]}
              placeholder="Metas/Planos/Objetivos"
              value={metasObjetivos}
              onChangeText={setMetasObjetivos}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Finalização</Text>
            <TextInputMask
              style={styles.input}
              type={'datetime'}
              options={{ format: 'DD/MM/YYYY' }}
              value={dataAvaliacao}
              onChangeText={setDataAvaliacao}
              placeholder="Data da avaliação (DD/MM/YYYY)"
              keyboardType="numeric"
            />
            
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[
                  styles.button,
                  (isLoading || !authToken || !isTokenLoaded || selectedAtletaId === null || !selectedSubdivisao || !selectedPosicao) && styles.buttonDisabled
                ]}
                onPress={handleSubmit}
                disabled={isLoading || !authToken || !isTokenLoaded || selectedAtletaId === null || !selectedSubdivisao || !selectedPosicao}
                {...(Platform.OS === 'web' && { cursor: 'pointer', activeOpacity: 0.8 })}
                {...(Platform.OS === 'web' && (isLoading || !authToken || !isTokenLoaded || selectedAtletaId === null || !selectedSubdivisao || !selectedPosicao) && { cursor: 'not-allowed' })}
                accessibilityLabel="Salvar avaliação do atleta"
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Salvar Avaliação</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity style={styles.buttonSecondary} onPress={goBack}>
                <Text style={styles.buttonTextSecondary}>Voltar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
      {Platform.OS === 'web' && <ToastContainer />}
    </KeyboardAvoidingView>
  );
};

export default AthleteEvaluationForm;