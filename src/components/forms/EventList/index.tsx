import { faIdCard, faTimes } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import React from 'react';
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
      <Text style={styles.emptyMessage}>📅 Nenhum treino marcado ainda.</Text>
      <Text style={styles.emptySubMessage}>
        Adicione um treino usando o formulário acima.
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Treinos Marcados</Text>
      
      <FlatList
        data={eventos}
        keyExtractor={item => item.id}
        renderItem={renderEventItem}
        ListEmptyComponent={renderEmptyComponent}
        scrollEnabled={false}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};
