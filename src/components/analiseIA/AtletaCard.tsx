import { faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface Atleta {
    id: number;
    nomeCompleto: string;
    email: string;
}

interface AtletaCardProps {
    item: Atleta;
    isSelected: boolean;
    onSelect: (atleta: Atleta) => void;
}

const AtletaCard: React.FC<AtletaCardProps> = ({ item, isSelected, onSelect }) => {
    return (
        <TouchableOpacity
            style={[styles.atletaCard, isSelected && styles.atletaCardSelected]}
            onPress={() => onSelect(item)}
            activeOpacity={0.7}
            {...(Platform.OS === 'web' && {
                cursor: 'pointer',
                activeOpacity: 0.8,
            } as any)} // Adicionado 'as any' para compatibilidade de tipos no Platform.OS === 'web'
            accessibilityLabel={`Selecionar atleta ${item.nomeCompleto}`}
        >
            <View style={styles.atletaInfo}>
                <Text style={styles.atletaName}>{item.nomeCompleto}</Text>
                <Text style={styles.atletaEmail}>{item.email}</Text>
            </View>
            <FontAwesomeIcon
                icon={faChevronRight}
                size={16}
                color={isSelected ? "#1c348e" : "#004A8F"}
            />
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    atletaCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingVertical: 15,
        paddingHorizontal: 20,
        borderRadius: 12,
        marginVertical: 3,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    atletaCardSelected: {
        backgroundColor: '#e3f2fd',
        borderColor: '#1c348e',
        borderWidth: 2,
    },
    atletaInfo: {
        flex: 1,
        marginRight: 10,
    },
    atletaName: {
        fontSize: 16,
        color: '#2c3e50',
        fontWeight: '600',
        marginBottom: 2
    },
    atletaEmail: {
        fontSize: 14,
        color: '#7f8c8d',
        fontStyle: 'italic'
    },
});

export default AtletaCard;