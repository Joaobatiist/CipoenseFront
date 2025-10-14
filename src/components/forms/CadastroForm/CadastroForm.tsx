import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import { TextInputMask } from 'react-native-masked-text';
import Api from '../../../Config/Api';
import { styles } from './styles';
import {
  CadastroAtletaData,
  CadastroFormProps,
  CadastroFuncionarioData,
  DropdownFieldProps,
  DropdownItem,
  FormFieldProps
} from './types';
import { formatDate, validateAtletaData, validateFuncionarioData } from './validation';

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

    return <TextInput {...commonProps} />;
  };

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
    <View style={[styles.fieldContainer, { zIndex: open ? zIndex : 1 }]}>
      <Text style={styles.fieldLabel}>
        {label}
        {required && <Text style={styles.requiredIndicator}> </Text>}
      </Text>
      <DropDownPicker
        open={open}
        value={currentValue}
        items={dropdownItems}
        setOpen={setOpen}
        setValue={setCurrentValue}
        setItems={setDropdownItems}
        placeholder={placeholder}
        style={[
          styles.dropdown, 
          open && styles.dropdownFocused,
          Platform.OS === 'web' && { cursor: 'pointer' }
        ]}
        dropDownContainerStyle={[
          styles.dropdownContainer,
          Platform.OS === 'web' && {
            maxHeight: 200,
            backgroundColor: '#ffffff',
            borderColor: '#ddd',
            borderWidth: 1,
            borderRadius: 8,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 3.84,
            elevation: 5,
          }
        ]}
        zIndex={zIndex}
        zIndexInverse={zIndexInverse}
        listMode="SCROLLVIEW"
        searchable={items.length > 5}
        searchPlaceholder="Buscar..."
        closeAfterSelecting={true}
        onChangeValue={onValueChange}
        dropDownDirection="AUTO"
        bottomOffset={100}
        modalProps={{
          animationType: Platform.OS === 'web' ? 'none' : 'slide',
        }}
        modalContentContainerStyle={Platform.OS === 'web' ? {
          backgroundColor: '#ffffff',
          maxHeight: 300,
        } : undefined}
      />
    </View>
  );
};

// Constants for dropdown options
const SUBDIVISOES: DropdownItem[] = [
  { id: 1, label: 'Sub-4', value: 'SUB_4' },
  { id: 1, label: 'Sub-5', value: 'SUB_5' },
  { id: 1, label: 'Sub-6', value: 'SUB_6' },
  { id: 1, label: 'Sub-7', value: 'SUB_7' },
  { id: 1, label: 'Sub-8', value: 'SUB_8' },
  { id: 1, label: 'Sub-9', value: 'SUB_9' },
  { id: 1, label: 'Sub-10', value: 'SUB_10' },
  { id: 2, label: 'Sub-11', value: 'SUB_11' },
  { id: 3, label: 'Sub-12', value: 'SUB_12' },
  { id: 4, label: 'Sub-13', value: 'SUB_13' },
  { id: 5, label: 'Sub-14', value: 'SUB_14' },
  { id: 6, label: 'Sub-15', value: 'SUB_15' },
  { id: 7, label: 'Sub-16', value: 'SUB_16' },
  { id: 8, label: 'Sub-17', value: 'SUB_17' },
  { id: 9, label: 'Sub-18', value: 'SUB_18' },
];

const POSICOES: DropdownItem[] = [
  { id: 10, label: 'Goleiro', value: 'GOLEIRO' },
  { id: 11, label: 'Zagueiro', value: 'ZAGUEIRO' },
  { id: 12, label: 'Lateral Direito', value: 'LATERAL_DIREITO' },
  { id: 13, label: 'Lateral Esquerdo', value: 'LATERAL_ESQUERDO' },
  { id: 14, label: 'Ala Defensiva Direita', value: 'ALA_DEFENSIVA_DIREITA' },
  { id: 15, label: 'Ala Defensiva Esquerda', value: 'ALA_DEFENSIVA_ESQUERDA' },
  { id: 16, label: 'Volante', value: 'VOLANTE' },
  { id: 17, label: 'Meia Central', value: 'MEIA_CENTRAL' },
  { id: 18, label: 'Meia Atacante', value: 'MEIA_ATACANTE' },
  { id: 19, label: 'Ponta Direita', value: 'PONTA_DIREITA' },
  { id: 20, label: 'Ponta Esquerda', value: 'PONTA_ESQUERDA' },
  { id: 21, label: 'Segundo Atacante', value: 'SEGUNDO_ATACANTE' },
  { id: 22, label: 'Atacante', value: 'ATACANTE' },
];

const ISENCAO_OPTIONS: DropdownItem[] = [
  { id: 23, label: 'Sim', value: 'SIM' },
  { id: 24, label: 'Não', value: 'NAO' },
];

// Role options based on user permission
const getRoleOptions = (userRole?: string): DropdownItem[] => {
  if (userRole === 'SUPERVISOR') {
    return [
      { id: 25, label: 'Coordenador', value: 'COORDENADOR' },
      { id: 26, label: 'Técnico', value: 'TECNICO' },
      { id: 27, label: 'Supervisor', value: 'SUPERVISOR' },
    ];
  } else if (userRole === 'COORDENADOR') {
    return [
      { id: 25, label: 'Coordenador', value: 'COORDENADOR' },
      { id: 26, label: 'Técnico', value: 'TECNICO' },
    ];
  }
  return [
    { id: 26, label: 'Técnico', value: 'TECNICO' },
  ];
};

export const CadastroForm: React.FC<CadastroFormProps> = ({
  type,
  initialData,
  onSubmit,
  userRole,
}) => {
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);
  const [loading, setLoading] = useState(false);
  const [backButtonPressed, setBackButtonPressed] = useState(false);
  
  // Common fields
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [cpf, setCpf] = useState('');
  
  // Atleta specific fields
  const [subDivisao, setSubDivisao] = useState<string | null>(null);
  const [massa, setMassa] = useState('');
  const [posicao, setPosicao] = useState<string | null>(null);
  const [isencao, setIsencao] = useState<string | null>(null);
  
  // Responsável fields
  const [nomeResponsavel, setNomeResponsavel] = useState('');
  const [telefoneResponsavel, setTelefoneResponsavel] = useState('');
  const [emailResponsavel, setEmailResponsavel] = useState('');
  const [cpfResponsavel, setCpfResponsavel] = useState('');
  
  // Funcionário specific fields
  const [telefone, setTelefone] = useState('');
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      // Populate fields with initial data
      setNome(initialData.nome || '');
      setEmail(initialData.email || '');
      setSenha(initialData.senha || '');
      setDataNascimento(initialData.dataNascimento || '');
      setCpf(initialData.cpf || '');
      
      if (type === 'atleta' && 'subDivisao' in initialData) {
        const atletaData = initialData as Partial<CadastroAtletaData>;
        setSubDivisao(atletaData.subDivisao || null);
        setMassa(atletaData.massa || '');
        setPosicao(atletaData.posicao || null);
        setIsencao(atletaData.isencao ? 'SIM' : 'NAO');
        
        if (atletaData.responsavel) {
          setNomeResponsavel(atletaData.responsavel.nome || '');
          setTelefoneResponsavel(atletaData.responsavel.telefone || '');
          setEmailResponsavel(atletaData.responsavel.email || '');
          setCpfResponsavel(atletaData.responsavel.cpf || '');
        }
      }
      
      if (type === 'funcionario' && 'telefone' in initialData) {
        const funcionarioData = initialData as Partial<CadastroFuncionarioData>;
        setTelefone(funcionarioData.telefone || '');
        setRole(funcionarioData.roles || null);
      }
    }
  }, [initialData, type]);

  // Navegação por teclado para web
  useEffect(() => {
    if (Platform.OS === 'web') {
      let currentScrollPosition = 0;

      const handleKeyDown = (event: KeyboardEvent) => {
        // Só aplica scroll com setas se não há input focado
        const activeElement = document.activeElement;
        const isInputFocused = activeElement && (
          activeElement.tagName === 'INPUT' || 
          activeElement.tagName === 'TEXTAREA' ||
          (activeElement instanceof HTMLElement && activeElement.contentEditable === 'true')
        );

        if ((event.key === 'ArrowDown' || event.key === 'ArrowUp') && !isInputFocused) {
          event.preventDefault();
          if (scrollViewRef.current) {
            const scrollDirection = event.key === 'ArrowDown' ? 80 : -80;
            currentScrollPosition = Math.max(0, currentScrollPosition + scrollDirection);
            scrollViewRef.current.scrollTo({
              y: currentScrollPosition,
              animated: true,
            });
          }
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, []);

  const handleSubmit = async () => {
    setLoading(true);
    
    try {
      let data: CadastroAtletaData | CadastroFuncionarioData;
      let validation;
      
      if (type === 'atleta') {
        data = {
          nome,
          email,
          senha,
          dataNascimento,
          cpf,
          subDivisao: subDivisao!,
          massa,
          posicao: posicao!,
          isencao: isencao === 'SIM',
          roles: ['ATLETA'],
          responsavel: {
            nome: nomeResponsavel,
            telefone: telefoneResponsavel,
            email: emailResponsavel,
            cpf: cpfResponsavel,
          },
        };
        validation = validateAtletaData(data);
      } else {
        data = {
          nome,
          email,
          senha,
          dataNascimento,
          cpf,
          telefone,
          roles: role!,
        };
        validation = validateFuncionarioData(data);
      }
      
      if (!validation.isValid) {
        const errorMessages = validation.errors.map(error => error.message).join('\n');
        Alert.alert('Erro de Validação', errorMessages);
        return;
      }
      
      if (onSubmit) {
        await onSubmit(data);
      } else {
        await defaultSubmitHandler(data);
      }
      
      Alert.alert('Sucesso', `${type === 'atleta' ? 'Atleta' : 'Funcionário'} cadastrado com sucesso!`);
      router.back();
      
    } catch (error) {
      console.error('Erro no cadastro:', error);
      Alert.alert('Erro', 'Ocorreu um erro ao realizar o cadastro. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };
  
  const defaultSubmitHandler = async (data: CadastroAtletaData | CadastroFuncionarioData) => {
    const token = await AsyncStorage.getItem('jwtToken');
    
    if (!token) {
      Alert.alert('Erro de Autenticação', 'Token não encontrado. Faça login novamente.');
      router.replace('/login');
      return;
    }

    let payload;
    let endpoint;

    if (type === 'atleta') {
      const atletaData = data as CadastroAtletaData;
      // Formato igual ao que funcionava antes
      payload = {
        nome: atletaData.nome,
        senha: atletaData.senha,
        email: atletaData.email,
        dataNascimento: formatDate(atletaData.dataNascimento),
        cpf: atletaData.cpf,
        subDivisao: atletaData.subDivisao,
        massa: atletaData.massa,
        roles: 'ATLETA', // Backend espera string, não array
        posicao: atletaData.posicao,
        isencao: atletaData.isencao,
        responsavel: {
          nome: atletaData.responsavel.nome,
          telefone: atletaData.responsavel.telefone,
          email: atletaData.responsavel.email,
          cpf: atletaData.responsavel.cpf,
        }
      };
      endpoint = '/api/cadastro';
    } else {
      const funcionarioData = data as CadastroFuncionarioData;
      payload = {
        nome: funcionarioData.nome,
        senha: funcionarioData.senha,
        email: funcionarioData.email,
        dataNascimento: formatDate(funcionarioData.dataNascimento),
        cpf: funcionarioData.cpf,
        telefone: funcionarioData.telefone,
        roles: funcionarioData.roles,
      };
      endpoint = '/cadastro/funcionarios';
    }

    console.log("Dados a serem enviados:", payload);
    console.log("Endpoint:", endpoint);
    console.log("Token sendo usado:", token);
    console.log("Header Authorization:", `Bearer ${token}`);

    try {
      // O interceptor já adiciona o token automaticamente
      const response = await Api.post(endpoint, payload);
      
      console.log("Resposta da API:", response.data);
      return response.data;
      
    } catch (error: any) {
      console.error('Erro na requisição:', error);
      console.error('Status do erro:', error.response?.status);
      console.error('Dados do erro:', error.response?.data);
      
      if (error.response?.status === 401 || error.response?.status === 403) {
        Alert.alert('Sessão Expirada', 'Sua sessão expirou. Faça login novamente.');
        await AsyncStorage.removeItem('jwtToken');
        router.replace('/login');
        return;
      }
      
      throw error;
    }
  };

  const getTitle = () => {
    return type === 'atleta' ? 'Cadastrar Atleta' : 'Cadastrar Funcionário';
  };

  return (
    <>
      <StatusBar 
        barStyle="light-content" 
        backgroundColor="#1c348e"
        translucent={false}
      />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          onPressIn={() => setBackButtonPressed(true)}
          onPressOut={() => setBackButtonPressed(false)}
          style={[
            styles.backButton,
            backButtonPressed && styles.backButtonPressed,
            Platform.OS === 'web' && { cursor: 'pointer' }
          ]}
          activeOpacity={Platform.select({ web: 0.6, default: 0.8 })}
          accessibilityRole="button"
          accessibilityLabel="Voltar"
          accessibilityHint="Volta para a tela anterior"
          disabled={loading}
        >
          <Ionicons 
            name="arrow-back" 
            size={Platform.select({ ios: 24, android: 24, web: 26, default: 24 })} 
            color={loading ? "rgba(255, 255, 255, 0.5)" : "#ffffff"} 
          />
        </TouchableOpacity>
        
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>{getTitle()}</Text>
          {loading && (
            <ActivityIndicator 
              size="small" 
              color="#ffffff" 
              style={styles.headerLoadingIndicator}
            />
          )}
        </View>
        
        <View style={styles.headerSpacer} />
      </View>
      
      <Pressable onPress={Keyboard.dismiss} style={{ flex: 1 }}>
        <ScrollView 
          ref={scrollViewRef}
          style={[{ flex: 1 }, Platform.OS === 'web' && styles.webScrollView]}
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={Platform.OS !== 'web'}
          nestedScrollEnabled={Platform.OS === 'web'}
          bounces={Platform.OS !== 'web'}
        >
          

          {/* Common Fields */}
          <FormField
            label="Nome Completo"
            value={nome}
            onChangeText={setNome}
            placeholder="Digite o nome completo"
            required
          />
          
          <FormField
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="Digite o email"
            keyboardType="email-address"
            required
          />
          
          <FormField
            label="Senha"
            value={senha}
            onChangeText={setSenha}
            placeholder="Digite a senha (mín. 6 caracteres)"
            secureTextEntry
            required
          />
          
          <FormField
            label="Data de Nascimento"
            value={dataNascimento}
            onChangeText={setDataNascimento}
            placeholder="DD/MM/AAAA"
            mask="date"
            required
          />
          
          <FormField
            label="CPF"
            value={cpf}
            onChangeText={setCpf}
            placeholder="000.000.000-00"
            mask="cpf"
            required
          />

          {/* Atleta Specific Fields */}
          {type === 'atleta' && (
            <>
              <FormField
                label="Massa (kg)"
                value={massa}
                onChangeText={setMassa}
                placeholder="Ex: 75.5"
                keyboardType="numeric"
                required
              />

              <DropdownField
                label="Posição"
                value={posicao}
                items={POSICOES}
                onValueChange={setPosicao}
                placeholder="Selecione a posição..."
                zIndex={5000}
                zIndexInverse={4000}
                required
              />

              <DropdownField
                label="Subdivisão"
                value={subDivisao}
                items={SUBDIVISOES}
                onValueChange={setSubDivisao}
                placeholder="Selecione a subdivisão..."
                zIndex={4000}
                zIndexInverse={3000}
                required
              />

              <DropdownField
                label="Possui Isenção?"
                value={isencao}
                items={ISENCAO_OPTIONS}
                onValueChange={setIsencao}
                placeholder="Selecione..."
                zIndex={3000}
                zIndexInverse={2000}
                required
              />

              {/* Responsável Section */}
              <View style={styles.responsavelSection}>
                <Text style={styles.responsavelTitle}>Dados do Responsável</Text>
                
                <FormField
                  label="Nome do Responsável"
                  value={nomeResponsavel}
                  onChangeText={setNomeResponsavel}
                  placeholder="Digite o nome do responsável"
                  required
                />
                
                <FormField
                  label="Telefone do Responsável"
                  value={telefoneResponsavel}
                  onChangeText={setTelefoneResponsavel}
                  placeholder="(99) 99999-9999"
                  mask="phone"
                  required
                />
                
                <FormField
                  label="Email do Responsável"
                  value={emailResponsavel}
                  onChangeText={setEmailResponsavel}
                  placeholder="Digite o email do responsável"
                  keyboardType="email-address"
                  required
                />
                
                <FormField
                  label="CPF do Responsável"
                  value={cpfResponsavel}
                  onChangeText={setCpfResponsavel}
                  placeholder="000.000.000-00"
                  mask="cpf"
                  required
                />
              </View>
            </>
          )}

          {/* Funcionário Specific Fields */}
          {type === 'funcionario' && (
            <>
              <FormField
                label="Telefone"
                value={telefone}
                onChangeText={setTelefone}
                placeholder="(99) 99999-9999"
                mask="phone"
                required
              />

              <DropdownField
                label="Cargo"
                value={role}
                items={getRoleOptions(userRole)}
                onValueChange={setRole}
                placeholder="Selecione o cargo..."
                zIndex={2000}
                zIndexInverse={1000}
                required
              />
            </>
          )}

          <TouchableOpacity
            style={[
              styles.submitButton,
              loading && styles.submitButtonDisabled,
              Platform.OS === 'web' && { cursor: loading ? 'not-allowed' : 'pointer' } as any
            ]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={Platform.select({ web: 0.6, default: 0.8 })}
            accessibilityRole="button"
            accessibilityLabel={`Cadastrar ${type === 'atleta' ? 'Atleta' : 'Funcionário'}`}
            accessibilityHint="Finaliza o cadastro e salva os dados informados"
          >
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color="#ffffff" size="small" />
                <Text style={styles.loadingText}>Cadastrando...</Text>
              </View>
            ) : (
              <Text style={styles.submitButtonText}>
                Cadastrar {type === 'atleta' ? 'Atleta' : 'Funcionário'}
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </Pressable>
    </KeyboardAvoidingView>
    </>
  );
};
