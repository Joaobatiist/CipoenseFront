// src/components/AnaliseCard.tsx
import React, { useState } from 'react';
import { Modal, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

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
    onEdit?: (analise: AnaliseIa) => void;
}

const AnaliseCard: React.FC<AnaliseCardProps> = ({ item, onDelete, onEdit }) => {
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

    const [isEditing, setIsEditing] = useState(false);
    const [respostaText, setRespostaText] = useState(item.respostaIA || '');

    const openEditor = () => {
        setRespostaText(item.respostaIA || '');
        setIsEditing(true);
    };

    const closeEditor = () => setIsEditing(false);

    const saveEdit = () => {
        if (onEdit) {
            const updated: AnaliseIa = { ...item, respostaIA: respostaText };
            onEdit(updated);
        }
        setIsEditing(false);
    };
    return (
        <>
        <View style={styles.analiseCard}>
            <View style={styles.analiseCardHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                    <Text style={styles.analiseTitle}>Análise IA</Text>
                </View>
                <TouchableOpacity 
                    style={[styles.editButton, Platform.OS === 'web' && { cursor: 'pointer' as any }]} 
                    onPress={openEditor}
                >
                    <Text style={styles.actionButtonText}>✏️ Editar</Text>
                </TouchableOpacity>

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

            {/* Modal de edição do prompt */}
            <Modal
                visible={isEditing}
                animationType="slide"
                transparent={true}
                onRequestClose={closeEditor}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Editar Resposta da IA</Text>
                        <TextInput
                            style={styles.modalInput}
                            value={respostaText}
                            onChangeText={setRespostaText}
                            multiline
                            numberOfLines={6}
                        />
                        <View style={styles.modalActions}>
                            <TouchableOpacity onPress={closeEditor} style={styles.modalCancel}>
                                <Text style={styles.modalCancelText}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={saveEdit} style={styles.modalSave}>
                                <Text style={styles.modalSaveText}>Salvar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </>
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
     editButton: {
        backgroundColor: '#e5c228',
         paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
        marginLeft: 5,
    },
     actionButtonText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '600',
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
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '100%',
        maxWidth: 900,

        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 10,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 10,
    },
    modalInput: {
        minHeight: 400,
        borderColor: '#ddd',
        borderWidth: 1,
        borderRadius: 8,
        padding: 10,
        textAlignVertical: 'top',
        marginBottom: 12,
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    modalCancel: {
        padding: 10,
        marginRight: 10,
    },
    modalCancelText: {
        color: '#333',
    },
    modalSave: {
        backgroundColor: '#1c348e',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 6,
    },
    modalSaveText: {
        color: '#fff',
        fontWeight: '600',
    },
});

export default AnaliseCard;