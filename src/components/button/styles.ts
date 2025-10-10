import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
    button: {
        backgroundColor: '#1c348e', // Cor azul padrão
        padding: 12,
        borderRadius: 5,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    title: {
        color: '#1c348e', // Cor branca padrão
        fontWeight: 'bold',
        fontSize: 16,
        margin: "auto"
    },
    icon: {
        marginRight: 0,
    },
});
