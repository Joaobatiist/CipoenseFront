import { IconDefinition } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import React from 'react';
import { Text, TouchableOpacity, TouchableOpacityProps, View } from 'react-native';
import { styles } from './styles';

export interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'small' | 'medium' | 'large';
  icon?: IconDefinition;
  iconPosition?: 'left' | 'right';
  iconColor?: string;
  iconSize?: number;
  textColor?: string;
  fullWidth?: boolean;
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  variant = 'primary',
  size = 'medium',
  icon,
  iconPosition = 'left',
  iconColor,
  iconSize = 16,
  textColor,
  fullWidth = false,
  loading = false,
  disabled,
  style,
  ...rest
}) => {
  const buttonStyle = [
    styles.button,
    styles[variant],
    styles[size],
    fullWidth && styles.fullWidth,
    disabled && styles.disabled,
    style,
  ];

  const textStyle = [
    styles.text,
    styles[`${variant}Text`],
    styles[`${size}Text`],
    textColor && { color: textColor },
    disabled && styles.disabledText,
  ];

  const renderIcon = () => {
    if (!icon || loading) return null;
    
    return (
      <FontAwesomeIcon
        icon={icon}
        size={iconSize}
        color={iconColor || (variant === 'primary' ? '#ffffff' : '#1c348e')}
        style={[
          styles.icon,
          iconPosition === 'right' && styles.iconRight,
        ]}
      />
    );
  };

  const renderContent = () => (
    <View style={styles.buttonContent}>
      {iconPosition === 'left' && renderIcon()}
      <Text style={textStyle}>
        {loading ? 'Carregando...' : title}
      </Text>
      {iconPosition === 'right' && renderIcon()}
    </View>
  );

  return (
    <TouchableOpacity
      style={buttonStyle}
      disabled={disabled || loading}
      activeOpacity={0.7}
      {...rest}
    >
      {renderContent()}
    </TouchableOpacity>
  );
};
