import React, { forwardRef } from 'react';
import {
    Text,
    TextInput,
    TextInputProps,
    View
} from 'react-native';
import { styles } from './styles';

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  variant?: 'default' | 'outlined';
}

export const Input = forwardRef<TextInput, InputProps>(
  ({ label, error, variant = 'default', style, ...props }, ref) => {
    const inputStyle = [
      styles.input,
      styles[variant],
      error && styles.inputError,
      style,
    ];

    return (
      <View style={styles.container}>
        {label && (
          <Text style={styles.label}>{label}</Text>
        )}
        <TextInput
          ref={ref}
          style={inputStyle}
          {...props}
        />
        {error && (
          <Text style={styles.errorText}>{error}</Text>
        )}
      </View>
    );
  }
);

Input.displayName = 'Input';
