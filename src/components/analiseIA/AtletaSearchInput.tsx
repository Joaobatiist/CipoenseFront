import { faSearch } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import React from 'react';
import {  StyleSheet, TextInput, View } from 'react-native';

interface AtletaSearchInputProps {
    searchText: string;
    onSearchChange: (text: string) => void;
}

const AtletaSearchInput: React.FC<AtletaSearchInputProps> = ({ searchText, onSearchChange }) => {
    return (
        <View style={styles.searchContainer}>
            <FontAwesomeIcon icon={faSearch} size={20} color="#888" style={styles.searchIcon} />
            <TextInput
                style={styles.searchInput}
                placeholder="Pesquisar atleta..."
                placeholderTextColor="#888"
                value={searchText}
                onChangeText={onSearchChange}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardAppearance="light"
            />
        </View>
    );
};

const styles = StyleSheet.create({
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 25,
        paddingHorizontal: 15,
        marginBottom: 15,
        shadowColor: '#1e64e7ff',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.15,
        shadowRadius: 3,
        elevation: 3,
    },
    searchIcon: {
        marginRight: 12,
    },
    searchInput: {
        flex: 1,
        height: 50,
        fontSize: 16,
        color: '#333',
    },
});

export default AtletaSearchInput;