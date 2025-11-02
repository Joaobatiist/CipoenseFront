import { faPlus } from '@fortawesome/free-solid-svg-icons';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { TextInputMask } from 'react-native-masked-text';
import { toast } from 'react-toastify';
import { SUBDIVISOES } from '../../../types/atletasTypes';
import { Button } from '../../button/index';
import { styles } from './styles';

interface Evento {
  id: string;
  data: string;
  descricao: string;
  professor: string;
  local: string;
  horario: string;
  subDivisao?: string;
  atletas?: string[];
}

interface EventFormProps {
  editingEvent?: Evento | null;
  userName: string;
  // Agora o onSave recebe também subDivisao e atletas
  onSave: (eventData: Omit<Evento, 'id'> & { subDivisao?: string; atletas?: string[] }) => Promise<void>;
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
  
  // --- Novos estados: subdivisão e seleção de atletas ---
  const [atletas, setAtletas] = useState<any[]>([]);
  const [loadingAtletas, setLoadingAtletas] = useState<boolean>(false);
  const [selectedSubdivisao, setSelectedSubdivisao] = useState<string>('');
  const [selectedAtletas, setSelectedAtletas] = useState<string[]>([]);
  const [atletasModalVisible, setAtletasModalVisible] = useState<boolean>(false);
  // temp states used inside modal; changes here are applied only on Ok
  const [tempSelectedAtletas, setTempSelectedAtletas] = useState<string[]>([]);
  const [tempSelectedSubdivisao, setTempSelectedSubdivisao] = useState<string>('');

  const resetForm = useCallback((): void => {
    const today = new Date();
    const offset = today.getTimezoneOffset() * 60000;
    setSelectedDate(new Date(today.getTime() - offset).toISOString().split('T')[0]);
    setDescricao('');
    setProfessor(userName);
    setLocal('');
    setHorario('');
    setSelectedSubdivisao('');
    setSelectedAtletas([]);
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
      // preencha subdivisão e atletas caso o evento venha com esses campos
      if (editingEvent.subDivisao) {
        setSelectedSubdivisao(editingEvent.subDivisao);
      }
      if (editingEvent.atletas && Array.isArray(editingEvent.atletas)) {
        // garante strings
        setSelectedAtletas(editingEvent.atletas.map(a => String(a)));
      }
    } else {
      resetForm();
    }
  }, [editingEvent, userName, resetForm]);

  // Buscar atletas (usar atletaService existente)
  useEffect(() => {
    let mounted = true;
    const fetchAtletas = async () => {
      try {
        setLoadingAtletas(true);
        const { atletaService } = await import('../../../services/atletaService');
        const data = await atletaService.fetchAtletas();
        if (!mounted) return;
        setAtletas(data || []);
        // se estivermos no modo de edição, e o evento já tiver atletas, sincroniza a seleção
        try {
          if (editingEvent && editingEvent.atletas && Array.isArray(editingEvent.atletas)) {
            const ids = editingEvent.atletas.map((a: any) => String(a));
            // garante que os ids existem na lista carregada
            const existingIds = (data || []).map((d: any) => String(d.id));
            const validIds = ids.filter((id: string) => existingIds.includes(id));
            if (validIds.length > 0) {
              setSelectedAtletas(validIds);
              if (editingEvent.subDivisao) setSelectedSubdivisao(editingEvent.subDivisao);
              else {
                // inferir subdivisão a partir do primeiro atleta válido
                const first = (data || []).find((d: any) => String(d.id) === validIds[0]);
                if (first && first.subDivisao) setSelectedSubdivisao(first.subDivisao);
              }
            }
          }
        } catch (e) {
          console.error('Erro ao sincronizar seleção de atletas do evento em edição', e);
        }
      } catch (error) {
        console.error('Erro ao buscar atletas:', error);
        setAtletas([]);
      } finally {
        setLoadingAtletas(false);
      }
    };
    fetchAtletas();
    return () => { mounted = false; };
  }, []);

  // Agrupa atletas por subdivisão para exibição
  const atletasPorSubdivisao = useMemo(() => {
    const map: Record<string, any[]> = {};
    atletas.forEach(a => {
      const key = a.subDivisao || 'Sem Subdivisão';
      if (!map[key]) map[key] = [];
      map[key].push(a);
    });
    return map;
  }, [atletas]);

  const handleSubdivisaoSelect = (sub: string) => {
    // se clicar no mesmo, desmarca
    if (selectedSubdivisao === sub) {
      setSelectedSubdivisao('');
      setSelectedAtletas([]);
      return;
    }
    setSelectedSubdivisao(sub);
    // filtra atletas selecionados para esta subdivisao
    setSelectedAtletas(prev => prev.filter(id => {
      const found = atletas.find(a => a.id === id);
      return found?.subDivisao === sub;
    }));
  };

  const toggleAtletaSelection = (atletaId: string) => {
    const atleta = atletas.find(a => a.id === atletaId);
    if (!atleta) return;

    // Se selecionando e subdivisão diferente, resetar seleção anterior
    if (!selectedAtletas.includes(atletaId)) {
      if (selectedSubdivisao && selectedSubdivisao !== atleta.subDivisao) {
        // força trocar subdivisão e manter apenas este atleta
        setSelectedSubdivisao(atleta.subDivisao);
        setSelectedAtletas([atletaId]);
        return;
      }
      // se não há subdivisão selecionada, ajustar automaticamente
      if (!selectedSubdivisao) setSelectedSubdivisao(atleta.subDivisao);
      setSelectedAtletas(prev => [...prev, atletaId]);
    } else {
      // desmarcando
      const next = selectedAtletas.filter(id => id !== atletaId);
      setSelectedAtletas(next);
      if (next.length === 0) setSelectedSubdivisao('');
    }
  };

  // items helper: lista de atletas (filtrada pela subdivisão, se houver)
  const atletasFiltered = useMemo(() => selectedSubdivisao ? atletas.filter(a => a.subDivisao === selectedSubdivisao) : atletas, [atletas, selectedSubdivisao]);

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

    // Validação: pelo menos uma subdivisão e 1 atleta devem ser selecionados
    if (!selectedSubdivisao || selectedAtletas.length === 0) {
      const msg = 'Por favor selecione a Subdivisão e ao menos 1 Atleta para o evento.';
      if (Platform.OS === 'web') toast.error(msg);
      else Alert.alert('Campos obrigatórios', msg);
      return;
    }

    try {
      await onSave({
        data: selectedDate,
        descricao: descricao.trim(),
        professor: professor.trim(),
        local: local.trim(),
        horario: horario.trim(),
        subDivisao: selectedSubdivisao || undefined,
        atletas: selectedAtletas.length > 0 ? selectedAtletas : undefined,
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

      {/* Subdivisão: definida apenas dentro do modal de seleção de atletas */}

      {/* Atletas: campo que abre um modal de seleção */}
      <Text style={styles.inputLabel}>Atletas</Text>
      {loadingAtletas ? (
        <ActivityIndicator size="small" color="#1c348e" />
      ) : (
        <TouchableOpacity onPress={() => {
          // copy current selection into temp states so modal edits are isolated
          setTempSelectedAtletas(selectedAtletas.slice());
          setTempSelectedSubdivisao(selectedSubdivisao);
          setAtletasModalVisible(true);
        }} style={[styles.input, { justifyContent: 'center', minHeight: 44 }] as any}>
          <Text>{selectedAtletas.length > 0 ? `${selectedAtletas.length} selecionado(s)` : 'Toque para selecionar atletas'}</Text>
        </TouchableOpacity>
      )}

      {/* Modal de seleção de atletas */}
      <Modal
        visible={atletasModalVisible}
        animationType="slide"
        transparent={Platform.OS === 'web' ? true : false}
        onRequestClose={() => setAtletasModalVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: Platform.OS === 'web' ? 'rgba(0,0,0,0.3)' : '#fff', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ maxHeight: '80%', width: Platform.OS === 'web' ? '70%' : '95%', maxWidth: 900, marginVertical: 20, backgroundColor: '#fff', borderRadius: 8, padding: 12, alignSelf: 'center' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <Text style={{ fontWeight: '700', fontSize: 16 }}>Selecionar Atletas</Text>
              <TouchableOpacity onPress={() => setAtletasModalVisible(false)} style={{ padding: 8 }}>
                <Text style={{ color: '#1c348e' }}>Fechar</Text>
              </TouchableOpacity>
            </View>

            {/* Subdivisão dentro do modal (opcional filtro rápido) */}
            {/* Subdivisão buttons: wrap to fit all subdivisões inside modal */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
              <TouchableOpacity onPress={() => { if (tempSelectedSubdivisao === '') { setTempSelectedSubdivisao(''); setTempSelectedAtletas([]); } else { setTempSelectedSubdivisao(''); } }} style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, backgroundColor: !tempSelectedSubdivisao ? '#1c348e' : '#f0f0f0', marginRight: 8 }}>
                <Text style={{ color: !tempSelectedSubdivisao ? '#fff' : '#333' }}>Todas</Text>
              </TouchableOpacity>
              {SUBDIVISOES.map(s => (
                <TouchableOpacity key={s.value} onPress={() => {
                  // select subdivisao in temp
                  if (tempSelectedSubdivisao === s.value) {
                    setTempSelectedSubdivisao('');
                    setTempSelectedAtletas([]);
                  } else {
                    setTempSelectedSubdivisao(s.value);
                    // filter tempSelectedAtletas to those in the chosen subdivisao
                    setTempSelectedAtletas(prev => prev.filter(id => {
                      const found = atletas.find(a => String(a.id) === String(id));
                      return found?.subDivisao === s.value;
                    }));
                  }
                }} style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, backgroundColor: tempSelectedSubdivisao === s.value ? '#1c348e' : '#f0f0f0', marginRight: 8, marginBottom: 6 }}>
                  <Text style={{ color: tempSelectedSubdivisao === s.value ? '#fff' : '#333' }}>{s.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <ScrollView style={{ marginBottom: 8 }}>
              {(tempSelectedSubdivisao ? atletas.filter(a => a.subDivisao === tempSelectedSubdivisao) : Object.keys(atletasPorSubdivisao).flatMap(sub => atletasPorSubdivisao[sub])).map((at: any) => (
                <TouchableOpacity key={at.id} onPress={() => {
                  // toggle in temp selections
                  const id = String(at.id);
                  const atletaObj = atletas.find(a => String(a.id) === id);
                  if (!atletaObj) return;
                  if (!tempSelectedAtletas.includes(id)) {
                    // if temp subdivision exists and different, switch to this athlete's subdivision
                    if (tempSelectedSubdivisao && tempSelectedSubdivisao !== atletaObj.subDivisao) {
                      setTempSelectedSubdivisao(atletaObj.subDivisao);
                      setTempSelectedAtletas([id]);
                    } else {
                      if (!tempSelectedSubdivisao) setTempSelectedSubdivisao(atletaObj.subDivisao || '');
                      setTempSelectedAtletas(prev => [...prev, id]);
                    }
                  } else {
                    const next = tempSelectedAtletas.filter(x => x !== id);
                    setTempSelectedAtletas(next);
                    if (next.length === 0) setTempSelectedSubdivisao('');
                  }
                }} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#eee' }}>
                  <View style={{ width: 22, height: 22, borderRadius: 4, borderWidth: 1, borderColor: '#ccc', marginRight: 12, backgroundColor: tempSelectedAtletas.includes(String(at.id)) ? '#1c348e' : '#fff' }} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: '600' }}>{at.nome}</Text>
                    <Text style={{ color: '#666', fontSize: 12 }}>{at.subDivisao}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
              <TouchableOpacity onPress={() => { setTempSelectedAtletas([]); setTempSelectedSubdivisao(''); }} style={{ padding: 10, backgroundColor: '#f0f0f0', borderRadius: 6 }}>
                <Text>Limpar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => {
                // commit temp selections to actual selections
                setSelectedAtletas(tempSelectedAtletas.slice());
                setSelectedSubdivisao(tempSelectedSubdivisao);
                setAtletasModalVisible(false);
              }} style={{ padding: 10, backgroundColor: '#1c348e', borderRadius: 6 }}>
                <Text style={{ color: '#fff' }}>Ok</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
