import React, { useState } from 'react';
import { Text, View } from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import { TextInputMask } from 'react-native-masked-text';
import { styles } from './styles';
import { DropdownFieldProps, FormFieldProps } from './types';

export const FormField: React.FC<FormFieldProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  secureTextEntry = false,
  mask,
  required = false,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = () => setIsFocused(true);
  const handleBlur = () => setIsFocused(false);

  const renderInput = () => {
    const inputStyle = [
      styles.input,
      isFocused && styles.inputFocused,
    ];

    const commonProps = {
      style: inputStyle,
      value,
      onChangeText,
      placeholder,
      keyboardType,
      secureTextEntry,
      onFocus: handleFocus,
      onBlur: handleBlur,
      ...props,
    };

    if (mask === 'cpf') {
      return (
        <TextInputMask
          {...commonProps}
          type="cpf"
          keyboardType="numeric"
        />
      );
    }

    if (mask === 'phone') {
      return (
        <TextInputMask
          {...commonProps}
          type="cel-phone"
          options={{
            maskType: 'BRL',
            withDDD: true,
            dddMask: '(99) ',
          }}
          keyboardType="phone-pad"
        />
      );
    }

    if (mask === 'date') {
      return (
        <TextInputMask
          {...commonProps}
          type="datetime"
          options={{
            format: 'DD/MM/YYYY',
          }}
          keyboardType="numeric"
        />
      );
    }
  }
  
  return (
    <View style={styles.fieldContainer}>
      <Text style={styles.fieldLabel}>
        {label}
        {required && <Text style={styles.requiredIndicator}> *</Text>}
      </Text>
      {renderInput()}
    </View>
  );
};

export const DropdownField: React.FC<DropdownFieldProps> = ({
  label,
  value,
  items,
  onValueChange,
  placeholder,
  zIndex = 1000,
  zIndexInverse = 1000,
  required = false,
}) => {
  const [open, setOpen] = useState(false);
  const [currentValue, setCurrentValue] = useState(value);
  const [dropdownItems, setDropdownItems] = useState(items);

  React.useEffect(() => {
    setCurrentValue(value);
  }, [value]);

  React.useEffect(() => {
    setDropdownItems(items);
  }, [items]);

  return (
    <View style={styles.fieldContainer}>
      <Text style={styles.fieldLabel}>
        {label}
        {required && <Text style={styles.requiredIndicator}> *</Text>}
      </Text>
      <DropDownPicker
        open={open}
        value={currentValue}
        items={dropdownItems}
        setOpen={setOpen}
        setValue={setCurrentValue}
        setItems={setDropdownItems}
        placeholder={placeholder}
        style={[styles.dropdown, open && styles.dropdownFocused]}
        dropDownContainerStyle={styles.dropdownContainer}
        zIndex={zIndex}
        zIndexInverse={zIndexInverse}
        listMode="SCROLLVIEW"
        searchable={items.length > 5}
        searchPlaceholder="Buscar..."
        closeAfterSelecting={true}
        onChangeValue={onValueChange}
      />
    </View>
  );
};
