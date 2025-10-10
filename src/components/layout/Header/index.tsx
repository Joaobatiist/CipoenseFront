import { faBars, faTimes } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { styles } from './styles';

interface HeaderProps {
  userName: string;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  userName,
  sidebarOpen,
  onToggleSidebar,
}) => {
  return (
    <View style={styles.header}>
      <TouchableOpacity style={styles.menuButton} onPress={onToggleSidebar}>
        <FontAwesomeIcon 
          icon={sidebarOpen ? faTimes : faBars} 
          size={24} 
          color="#ffffff" 
        />
      </TouchableOpacity>
      <Text style={styles.title}>Olá, {userName}!</Text>
    </View>
  );
};
