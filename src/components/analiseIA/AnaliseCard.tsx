// src/components/AnaliseCard.tsx
import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface AnaliseIa {
    id: number;
    atletaEmail: string;
    prompt: string;
    respostaIA: string;
    dataAnalise: string;
}

interface AnaliseCardProps {
    item: AnaliseIa;
    onDelete: (analiseId: number) => void;
}

const AnaliseCard: React.FC<AnaliseCardProps> = ({ item, onDelete }) => {
    const dataFormatada = new Date(item.dataAnalise).toLocaleDateString('pt-BR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    const paragrafos = item.respostaIA
        .split('\n')
        .map(p => p.trim())
        .filter(p => p && p !== '.' && p !== '');

    return (
        <View style={styles.analiseCard}>
            <View style={styles.analiseCardHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                    <Text style={styles.analiseTitle}>Análise de Desempenho</Text>
                </View>

                <TouchableOpacity
                    onPress={() => onDelete(item.id)}
                    style={styles.deleteButton}
                    activeOpacity={0.7}
                    {...(Platform.OS === 'web' && { cursor: 'pointer' as any })}
                    accessibilityLabel="Deletar análise"
                >
                    <Text style={styles.deleteButtonText}>🗑️ Deletar</Text>
                </TouchableOpacity>
            </View>

            <Text style={styles.analiseDate}>{dataFormatada}</Text>

            <View style={styles.analiseContent}>
                {paragrafos.map((paragrafo, index) => (
                    <Text key={index} style={styles.analiseText}>
                        {paragrafo}
                    </Text>
                ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    analiseCard: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 12,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 4,
        elevation: 3,
        borderLeftWidth: 4,
        borderLeftColor: '#1c348e',
    },
    analiseCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#ecf0f1',
    },
    analiseTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginLeft: 12,
        color: '#2c3e50',
        flex: 1
    },
    analiseDate: {
        fontSize: 14,
        color: '#7f8c8d',
        marginBottom: 12,
        fontStyle: 'italic'
    },
    analiseContent: {
        marginTop: 8,
    },
    analiseText: {
        fontSize: 15,
        color: '#34495e',
        lineHeight: 24,
        marginBottom: 8,
        textAlign: 'justify'
    },
    deleteButton: {
        backgroundColor: '#e74c3c',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
        marginLeft: 10,
        ...(Platform.OS === 'web' && { cursor: 'pointer' }),
    },
    deleteButtonText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '600',
    },
});

export default AnaliseCard;