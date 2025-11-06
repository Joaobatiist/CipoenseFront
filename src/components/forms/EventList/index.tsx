import { faCalendar, faHistory, faIdCard, faTimes } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import React, { useMemo, useState } from 'react';
import { FlatList, Text, TouchableOpacity, View } from 'react-native';
import { styles } from './styles';

interface Evento {
  id: string;
  data: string;
  descricao: string;
  professor: string;
  local: string;
  horario: string;
}

interface EventListProps {
  eventos: Evento[];
  onEdit: (evento: Evento) => void;
  onDelete: (id: string) => void;
}

export const EventList: React.FC<EventListProps> = ({
  eventos,
  onEdit,
  onDelete,
}) => {
  const [mostrarPassados, setMostrarPassados] = useState(false);

  // Separa eventos futuros/hoje e eventos passados
  const { eventosFuturos, eventosPassados } = useMemo(() => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const parseDate = (dateStr: string): Date => {
      const [day, month, year] = dateStr.split('/').map(Number);
      const date = new Date(year, month - 1, day);
      date.setHours(0, 0, 0, 0);
      return date;
    };

    const futuros: Evento[] = [];
    const passados: Evento[] = [];

    eventos.forEach(evento => {
      const dataEvento = parseDate(evento.data);
      if (dataEvento >= hoje) {
        futuros.push(evento);
      } else {
        passados.push(evento);
      }
    });

    // Ordena futuros por proximidade (mais próximo primeiro)
    futuros.sort((a, b) => {
      const dateA = parseDate(a.data);
      const dateB = parseDate(b.data);
      return dateA.getTime() - dateB.getTime();
    });

    // Ordena passados do mais recente para o mais antigo
    passados.sort((a, b) => {
      const dateA = parseDate(a.data);
      const dateB = parseDate(b.data);
      return dateB.getTime() - dateA.getTime();
    });

    return { eventosFuturos: futuros, eventosPassados: passados };
  }, [eventos]);

  // Define qual lista mostrar
  const eventosParaMostrar = mostrarPassados ? eventosPassados : eventosFuturos;

  const renderEventItem = ({ item }: { item: Evento }) => (
    <View style={styles.eventCard}>
      <Text style={styles.eventDate}>📅 {item.data}</Text>
      <Text style={styles.eventDescription}>📝 {item.descricao}</Text>
      <Text style={styles.eventDetail}>👨‍🏫 Professor: {item.professor}</Text>
      <Text style={styles.eventDetail}>📍 Local: {item.local}</Text>
      <Text style={styles.eventDetail}>⏰ Horário: {item.horario}</Text>
      
      <View style={styles.eventActions}>
        <TouchableOpacity 
          onPress={() => onEdit(item)} 
          style={styles.editButton}
        >
          <FontAwesomeIcon icon={faIdCard} size={16} color="#fff" />
          <Text style={styles.buttonText}>Editar</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          onPress={() => onDelete(item.id)} 
          style={styles.deleteButton}
        >
          <FontAwesomeIcon icon={faTimes} size={16} color="#fff" />
          <Text style={styles.buttonText}>Excluir</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyMessage}>
        {mostrarPassados 
          ? '📅 Nenhum evento passado encontrado.' 
          : '📅 Nenhum treino marcado ainda.'}
      </Text>
      <Text style={styles.emptySubMessage}>
        {mostrarPassados 
          ? 'Todos os eventos que já aconteceram aparecerão aqui.'
          : 'Adicione um treino usando o formulário acima.'}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <Text style={styles.sectionTitle}>
          {mostrarPassados ? 'Eventos Passados' : 'Próximos Eventos'}
        </Text>
        {eventosPassados.length > 0 && (
          <TouchableOpacity 
            onPress={() => setMostrarPassados(!mostrarPassados)}
            style={{
              backgroundColor: mostrarPassados ? '#1c348e' : '#666',
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 6,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6
            }}
          >
            <FontAwesomeIcon 
              icon={mostrarPassados ? faCalendar : faHistory} 
              size={14} 
              color="#fff" 
            />
            <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>
              {mostrarPassados ? 'Ver Próximos' : `Ver Passados (${eventosPassados.length})`}
            </Text>
          </TouchableOpacity>
        )}
      </View>
      
      <FlatList
        data={eventosParaMostrar}
        keyExtractor={item => item.id}
        renderItem={renderEventItem}
        ListEmptyComponent={renderEmptyComponent}
        scrollEnabled={false}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};
