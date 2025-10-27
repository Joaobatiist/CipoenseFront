import { faPlus } from '@fortawesome/free-solid-svg-icons';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Platform, Text, TextInput, View } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { TextInputMask } from 'react-native-masked-text';
import { toast } from 'react-toastify';
import { Button } from '../../button/index';
import { styles } from './styles';

interface Evento {
  id: string;
  data: string;
  descricao: string;
  professor: string;
  local: string;
  horario: string;
}

interface EventFormProps {
  editingEvent?: Evento | null;
  userName: string;
  onSave: (eventData: Omit<Evento, 'id'>) => Promise<void>;
  onCancel?: () => void;
  loading?: boolean;
}

export const EventForm: React.FC<EventFormProps> = ({
  editingEvent,
  userName,
  onSave,
  onCancel,
  loading = false,
}) => {
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    const offset = today.getTimezoneOffset() * 60000;
    return new Date(today.getTime() - offset).toISOString().split('T')[0];
  });
  
  const [descricao, setDescricao] = useState('');
  const [professor, setProfessor] = useState(userName);
  const [local, setLocal] = useState('');
  const [horario, setHorario] = useState('');

  const resetForm = useCallback((): void => {
    const today = new Date();
    const offset = today.getTimezoneOffset() * 60000;
    setSelectedDate(new Date(today.getTime() - offset).toISOString().split('T')[0]);
    setDescricao('');
    setProfessor(userName);
    setLocal('');
    setHorario('');
  }, [userName]);

  // Carrega dados do evento para edição
  useEffect(() => {
    if (editingEvent) {
      const dateParts = editingEvent.data.split('/');
      const formattedDate = `${dateParts[2]}-${dateParts[1].padStart(2, '0')}-${dateParts[0].padStart(2, '0')}`;
      
      setSelectedDate(formattedDate);
      setDescricao(editingEvent.descricao);
      setProfessor(editingEvent.professor);
      setLocal(editingEvent.local);
      setHorario(editingEvent.horario);
    } else {
      resetForm();
    }
  }, [editingEvent, userName, resetForm]);

  const handleSave = async (): Promise<void> => {
    // Validação: verifica se todos os campos obrigatórios estão preenchidos
    if (!descricao.trim() || !professor.trim() || !local.trim() || !horario.trim()) {
      if (Platform.OS === 'web') {
        toast.error('Por favor, preencha todos os campos obrigatórios:\n- Descrição\n- Professor\n- Local\n- Horário');
      } else {
        Alert.alert(
          'Campos obrigatórios',
          'Por favor, preencha todos os campos obrigatórios:\n- Descrição\n- Professor\n- Local\n- Horário'
        );
      }
      return;
    }

    try {
      await onSave({
        data: selectedDate,
        descricao: descricao.trim(),
        professor: professor.trim(),
        local: local.trim(),
        horario: horario.trim(),
      });
      
      if (!editingEvent) {
        resetForm();
      }
    } catch {
      // Error handling is done in the hook
    }
  };

  const handleCancel = (): void => {
    resetForm();
    onCancel?.();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>
        {editingEvent ? 'Editando evento' : 'Agenda'}
      </Text>

      <Calendar
        onDayPress={day => setSelectedDate(day.dateString)}
        markedDates={{
          [selectedDate]: {
            selected: true,
            selectedColor: 'blue',
            selectedTextColor: 'white'
          }
        }}
        minDate={new Date().toISOString().split('T')[0]}
        theme={{
          todayTextColor: 'blue',
          arrowColor: 'blue',
        }}
      />

      <Text style={styles.selectedDate}>
        Data selecionada: {new Date(selectedDate + 'T00:00:00').toLocaleDateString('pt-BR')}
      </Text>

      <TextInput
        value={descricao}
        onChangeText={setDescricao}
        placeholder="Descrição do treino"
        style={styles.input}
      />
      
      <TextInput
        value={professor}
        onChangeText={setProfessor}
        placeholder="Nome do Professor"
        style={styles.input}
        editable={false}
      />
      
      <TextInput
        value={local}
        onChangeText={setLocal}
        placeholder="Local do Treino"
        style={styles.input}
      />
      
      <TextInputMask
        style={styles.input}
        type={'datetime'}
        options={{
          format: 'HH:MM',
        }}
        onChangeText={setHorario}
        value={horario}
        placeholder="Horário (ex: 10:00)"
        keyboardType="numeric"
      />

    <View style={styles.buttonContainer}>
  {!editingEvent && (
    <Button
      title="Adicionar evento"
      icon={faPlus}
      onPress={handleSave}
      textColor="#fff"
      disabled={loading}
    />
  )}

  {editingEvent && (
    <>
      <Button
        title="Atualizar evento"
        textColor="#fff"
        onPress={handleSave}
        style={styles.submitButton}
        disabled={loading}
      />
      <Button
        title="Cancelar Edição"
        textColor="#fff"
        onPress={handleCancel}
        style={styles.cancelButton}
        disabled={loading}
      />
    </>
  )}
</View>
    </View>
  );
};
