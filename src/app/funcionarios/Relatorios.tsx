import React, { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';


const AthleteEvaluationForm = () => {
  const navigation = useNavigation();
  const [nomeCompleto, setNomeCompleto] = useState('');
  const [nomeAvaliador, setNomeAvaliador] = useState('');
  const [nascimento, setNascimento] = useState('');
  const [periodo, setPeriodo] = useState('');
  const [avaliacao, setAvaliacao] = useState({
    Controle: 3,
    recepcao: 3,
    dribles: 3,
    passe: 3,
    tiro: 3,
    cruzamento: 3,
    giro: 3,
    manuseioBola: 3,
    forcaChute: 3,
    GerenciamentoGols: 3,
    jogoOfensivo: 3,
    jogoDefensivo: 3,
    esportividade: 3,
    disciplina: 3,
    foco: 3,
    confianca: 3,
    tomadaDecisoes: 3,
    compromisso: 3,
    lideranca: 3,
    trabalhoEquipe: 3,
    atributosFisicos: 3,
    capacidadeSobPressao: 3,
  });
  const [feedbackTreinador, setFeedbackTreinador] = useState('');
  const [feedbackAvaliador, setFeedbackAvaliador] = useState('');
  const [pontosFortes, setPontosFortes] = useState('');
  const [pontosFracos, setPontosFracos] = useState('');
  const [areasAprimoramento, setAreasAprimoramento] = useState('');
  const [metasPlanosObjetivos, setMetasPlanosObjetivos] = useState('');
  const [dataAvaliacao, setDataAvaliacao] = useState('');

  const handleAvaliacaoChange = (attribute: string, value: number) => {
    setAvaliacao({ ...avaliacao, [attribute]: value });
  };

  const handleSubmit = () => {
    console.log({
      nomeCompleto,
      nomeAvaliador,
      nascimento,
      periodo,
      avaliacao,
      feedbackTreinador,
      feedbackAvaliador,
      pontosFortes,
      pontosFracos,
      areasAprimoramento,
      metasPlanosObjetivos,
      dataAvaliacao,
    });
  };

  interface RatingOptionsProps {
    attribute: string;
    value: number;
    onChange: (attribute: string, value: number) => void;
  }

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
          >
            <Text style={styles.ratingOptionText}>{option}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  // Função para formatar os nomes para exibição legível
  const formatAttributeName = (attribute: string) => {
    const mapping: { [key: string]: string } = {
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

  const renderAvaliacaoTable = (title: string, attributes: string[]) => (
    <View style={styles.section}>
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
              value={avaliacao[attr as keyof typeof avaliacao]}
              onChange={handleAvaliacaoChange}
            />
          </View>
        ))}
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>
        ASSOCIAÇÃO DESPORTIVA CIPOENSE - ESCOLINHA DE FUTEBOL DA ADC
      </Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Dados do Atleta</Text>
        <TextInput
          style={styles.input}
          placeholder="Nome Completo"
          value={nomeCompleto}
          onChangeText={setNomeCompleto}
        />
        <TextInput
          style={styles.input}
          placeholder="Nome do Avaliador"
          value={nomeAvaliador}
          onChangeText={setNomeAvaliador}
        />
        <TextInput
          style={styles.input}
          placeholder="Nascimento (DD/MM/AAAA)"
          value={nascimento}
          onChangeText={setNascimento}
        />
        <TextInput
          style={styles.input}
          placeholder="Período"
          value={periodo}
          onChangeText={setPeriodo}
        />
      </View>

      {renderAvaliacaoTable('Desempenho do Atleta', [
        'Controle',
        'recepcao',
        'dribles',
        'passe',
        'tiro',
        'cruzamento',
        'giro',
        'manuseioBola',
        'forcaChute',
        'GerenciamentoGols',
        'jogoOfensivo',
        'jogoDefensivo',
      ])}

      {renderAvaliacaoTable('Avaliação Tática/Psicológica/Física', [
        'esportividade',
        'disciplina',
        'foco',
        'confianca',
        'tomadaDecisoes',
        'compromisso',
        'lideranca',
        'trabalhoEquipe',
        'atributosFisicos',
        'capacidadeSobPressao',
      ])}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Avaliação Geral do Jogador</Text>
        <TextInput
          style={styles.input}
          placeholder="Feedback do Treinador"
          value={feedbackTreinador}
          onChangeText={setFeedbackTreinador}
          multiline
          numberOfLines={6}
        />
        <TextInput
          style={styles.input}
          placeholder="Feedback do Avaliador"
          value={feedbackAvaliador}
          onChangeText={setFeedbackAvaliador}
          multiline
          numberOfLines={6}
        />
        <TextInput
          style={styles.input}
          placeholder="Pontos Fortes"
          value={pontosFortes}
          onChangeText={setPontosFortes}
          multiline
          numberOfLines={6}
        />
        <TextInput
          style={styles.input}
          placeholder="Pontos Fracos"
          value={pontosFracos}
          onChangeText={setPontosFracos}
          multiline
          numberOfLines={6}
        />
        <TextInput
          style={styles.input}
          placeholder="Áreas de Aprimoramento"
          value={areasAprimoramento}
          onChangeText={setAreasAprimoramento}
          multiline
          numberOfLines={6}
        />
        <TextInput
          style={styles.input}
          placeholder="Metas/Planos/Objetivos"
          value={metasPlanosObjetivos}
          onChangeText={setMetasPlanosObjetivos}
          multiline
          numberOfLines={6}
        />
      </View>

    <View style={styles.section}>
  <Text style={styles.sectionTitle}>Finalização</Text>
  <TextInput
    style={styles.input}
    placeholder="Data da Avaliação (DD/MM/AAAA)"
    value={dataAvaliacao}
    onChangeText={setDataAvaliacao}
  />
  <Text style={styles.label}>Assinatura do Avaliador/Treinador</Text>
  {/* Adicione aqui um componente para captura de assinatura, se necessário */}

  {/* Container flex para botões lado a lado */}
  <View style={{ flexDirection: 'row', gap: 10,justifyContent: 'space-between', marginTop: 10 }}>
    <TouchableOpacity style={styles.button} onPress={handleSubmit}>
      <Text style={styles.buttonText}>Salvar Avaliação</Text>
    </TouchableOpacity>
    <TouchableOpacity style={styles.button} onPress={() => navigation.goBack()}>
      <Text style={styles.buttonText}>Voltar</Text>
    </TouchableOpacity>
  </View>
</View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  section: {
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    paddingBottom: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
  },
  table: {
    width: '100%',
    marginBottom: 10,
    marginTop: 5,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  tableHead: {
    width: '50%',
    fontWeight: 'bold',
    padding: 8,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  tableCell: {
    width: '50%',
    padding: 8,
  },
  ratingOptionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '50%',
  },
  ratingOption: {
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 5,
  },
  ratingOptionSelected: {
    backgroundColor: '#e5c228',
  },
  ratingOptionText: {
    color: '#000',
    fontSize: 14,
  },
  button: {
  flex: 1,  
  backgroundColor: '#1c348e',
  padding: 15,
  borderRadius: 15,
  alignItems: 'center',
 
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default AthleteEvaluationForm;
