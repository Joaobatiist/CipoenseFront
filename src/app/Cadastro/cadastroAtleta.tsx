import React, { useState } from 'react';

import AsyncStorage from '@react-native-async-storage/async-storage'; // Importar AsyncStorage
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import { router } from 'expo-router';
import {
  Alert,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import { TextInputMask } from 'react-native-masked-text';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Api from '../../Config/Api';



const CadastroAlunoScreen = () => {
  const navigation = useNavigation();
  const [nomeAluno, setNomeAluno] = useState('');
  const [senhaAluno, setSenhaAluno] = useState('');
  const [emailAluno, setEmailAluno] = useState('');
  const [dataNascimentoAluno, setDataNascimentoAluno] = useState('');
  const [cpfAluno, setCpfAluno] = useState('');
  const [subOpen, setSubOpen] = useState(false);

  // Estados para o DropDownPicker de Posição
  const [posicaoOpen, setPosicaoOpen] = useState(false);
  const [posicao, setPosicao] = useState(null);

  // Estados para o DropDownPicker de Isenção
  const [isencaoOpen, setIsencaoOpen] = useState(false);
  const [isencao, setIsencao] = useState(null);

  const [subDivisao, setSubDivisao] = useState(null);
  const [subItems, setSubItems] = useState([
    { label: 'Sub-10', value: 'SUB_10' },
    { label: 'Sub-11', value: 'SUB_11' },
    { label: 'Sub-12', value: 'SUB_12' },
    { label: 'Sub-13', value: 'SUB_13' },
    { label: 'Sub-14', value: 'SUB_14' },
    { label: 'Sub-15', value: 'SUB_15' },
    { label: 'Sub-16', value: 'SUB_16' },
    { label: 'Sub-17', value: 'SUB_17' },
    { label: 'Sub-18', value: 'SUB_18' },
  ]);

  const [massa, setMassa] = useState('');

  const [nomeResponsavel, setNomeResponsavel] = useState('');
  const [telefoneResponsavel, setTelefoneResponsavel] = useState('');
  const [emailResponsavel, setEmailResponsavel] = useState('');
  const [cpfResponsavel, setCpfResponsavel] = useState(''); // CPF do Responsável

  const [open, setOpen] = useState(false);
  const [role, setRole] = useState(null);
  const [items, setItems] = useState([
    { label: 'Atleta', value: 'ATLETA' },
  ]);

  // Itens para o DropDownPicker de Isenção
  const [isencaoItems, setIsencaoItems] = useState([
    { label: 'Sim', value: 'SIM' },
    { label: 'Não', value: 'NAO' },
  ]);

  // Itens para o DropDownPicker de Posição, baseados no seu Enum `Posicao`
  const [posicaoItems, setPosicaoItems] = useState([
    { label: 'Atacante', value: 'ATACANTE' },
    { label: 'Segundo Atacante', value: 'SEGUNDO_ATACANTE' },
    { label: 'Ponta Esquerda', value: 'PONTA_ESQUERDA' },
    { label: 'Ponta Direita', value: 'PONTA_DIREITA' },
    { label: 'Meia Atacante', value: 'MEIA_ATACANTE' },
    { label: 'Meia Central', value: 'MEIA_CENTRAL' },
    { label: 'Volante', value: 'VOLANTE' },
    { label: 'Ala Defensiva Direita', value: 'ALA_DEFENSIVA_DIREITA' },
    { label: 'Ala Defensiva Esquerda', value: 'ALA_DEFENSIVA_ESQUERDA' },
    { label: 'Lateral Esquerdo', value: 'LATERAL_ESQUERDO' },
    { label: 'Lateral Direito', value: 'LATERAL_DIREITO' },
    { label: 'Zagueiro', value: 'ZAGUEIRO' },
    { label: 'Goleiro', value: 'GOLEIRO' }, 
  ]);


  const formatarData = (data: string): string => {
    const [dia, mes, ano] = data.split('/');
    return `${ano}-${mes}-${dia}`;
  };

  const validarCampos = () => {
    if (
      !nomeAluno ||
      !senhaAluno ||
      !emailAluno ||
      !dataNascimentoAluno ||
      !cpfAluno ||
      !subDivisao ||
      !massa ||
      !nomeResponsavel ||
      !telefoneResponsavel ||
      !emailResponsavel ||
      !cpfResponsavel ||
      !role ||
      posicao === null || 
      isencao === null 
    ) {
      Alert.alert("Erro", "Por favor, preencha todos os campos!");
      return false;
    }
    return true;
  };

  const enviarDados = async () => {
    if (!validarCampos()) {
      return;
    }

    // Converter 'SIM'/'NAO' para true/false para o backend
    const isencaoParaBackend = isencao === 'SIM';

    const alunoData = {
      nome: nomeAluno,
      senha: senhaAluno,
      email: emailAluno,
      dataNascimento: formatarData(dataNascimentoAluno),
      cpf: cpfAluno,
      subDivisao: subDivisao,
      massa: massa,
      roles: role,
      posicao: posicao, 
      isencao: isencaoParaBackend, 

      responsavel: {
        nome: nomeResponsavel,
        telefone: telefoneResponsavel,
        email: emailResponsavel,
        cpf: cpfResponsavel,
      }
    };

    console.log("Dados a serem enviados:", alunoData);

    try {
      const token = await AsyncStorage.getItem('jwtToken');

      if (!token) {
        Alert.alert("Erro de Autenticação", "Token de autenticação não encontrado. Por favor, faça login novamente.");
        router.replace('../../');
        return;
      }

      const response = await Api.post(`/api/cadastro`, alunoData, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      console.log("Resposta do backend:", response.data);
      Alert.alert("Sucesso", "Cadastro feito com sucesso!");
      router.back();
    } catch (error) {
      console.error("Erro ao cadastrar aluno:", error);
      if (axios.isAxiosError(error)) {
        if (error.response) {
          console.error("Dados do erro:", error.response.data);
          console.error("Status do erro:", error.response.status);
          Alert.alert("Erro", `Falha no cadastro: ${error.response.data.message || 'Erro desconhecido do servidor.'}`);
        } else if (error.request) {
          Alert.alert("Erro", "Não foi possível conectar ao servidor. Verifique sua conexão ou tente mais tarde.");
        } else {
          Alert.alert("Erro", `Erro na requisição: ${error.message}`);
        }
      } else {
        Alert.alert("Erro", "Ocorreu um erro inesperado. Tente novamente.");
      }
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.btnVoltar}
          accessibilityLabel="Voltar"
        >
          <MaterialIcons name="arrow-back" size={24} color="#ffffffff" />
        
        </TouchableOpacity>
        <Text style={styles.titulo}>Cadastrar Aluno</Text>
      </View>
      <Pressable onPress={Keyboard.dismiss} style={{flex: 1}}>
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <Image
            source={require('../../../assets/images/escudo.png')}
            style={{ width: "100%", height: 200, borderRadius: 55, top: -20 }}
          />

          <TextInput
            style={styles.input}
            placeholder="Nome"
            value={nomeAluno}
            onChangeText={setNomeAluno}
          />
          
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={emailAluno}
            onChangeText={setEmailAluno}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TextInput
            style={styles.input}
            placeholder="Senha"
            secureTextEntry={true}
            value={senhaAluno}
            onChangeText={setSenhaAluno}
          />
          <TextInputMask
            style={styles.input}
            type={'datetime'}
            options={{
              format: 'DD/MM/YYYY',
            }}
            value={dataNascimentoAluno}
            onChangeText={setDataNascimentoAluno}
            placeholder="Data de Nascimento (DD/MM/YYYY)"
            keyboardType="numeric"
          />
          <TextInputMask
            style={styles.input}
            type={'cpf'}
            value={cpfAluno}
            onChangeText={setCpfAluno}
            placeholder="CPF do Aluno (000.000.000-00)"
            keyboardType="numeric"
          />

          <TextInput
            style={styles.input}
            onChangeText={setMassa}
            value={massa}
            keyboardType="numeric"
            placeholder="Massa (Ex: 75.5)"
            maxLength={6}
          />

          {/* DropDownPicker para Posição */}
          <DropDownPicker
            open={posicaoOpen}
            value={posicao}
            items={posicaoItems}
            setOpen={setPosicaoOpen}
            setValue={setPosicao}
            setItems={setPosicaoItems}
            placeholder="Selecione a Posição..."
            style={styles.dropdown}
            dropDownContainerStyle={styles.dropdownContainer}
            // Z-index mais alto para que este dropdown apareça na frente de todos
            zIndex={4000}
            zIndexInverse={1000}
            listMode="SCROLLVIEW"
          />

          {/* DropDownPicker para Cargo (Role) */}
          <DropDownPicker
            open={open}
            value={role}
            items={items}
            setOpen={setOpen}
            setValue={setRole}
            setItems={setItems}
            placeholder="Selecione um cargo..."
            style={styles.dropdown}
            dropDownContainerStyle={styles.dropdownContainer}
            // Z-index ligeiramente menor que a posição
            zIndex={3000}
            zIndexInverse={2000}
            listMode="SCROLLVIEW"
          />
          {/* DropDownPicker para SubDivisao */}
          <DropDownPicker
            open={subOpen}
            value={subDivisao}
            items={subItems}
            setOpen={setSubOpen}
            setValue={setSubDivisao}
            setItems={setSubItems}
            placeholder="Selecione SubDivisao..."
            style={styles.dropdown}
            dropDownContainerStyle={styles.dropdownContainer}
            // Z-index menor que cargo
            zIndex={2000}
            zIndexInverse={3000}
            listMode="SCROLLVIEW"
          />

          {/* DropDownPicker para Isenção */}
          <DropDownPicker
            open={isencaoOpen}
            value={isencao}
            items={isencaoItems}
            setOpen={setIsencaoOpen}
            setValue={setIsencao}
            setItems={setIsencaoItems}
            placeholder="Possui Isenção?"
            style={styles.dropdown}
            dropDownContainerStyle={styles.dropdownContainer}
            // Z-index menor que subDivisao
            zIndex={1000}
            zIndexInverse={4000}
            listMode="SCROLLVIEW"
          />

          <Text style={styles.title}>Dados do Responsável</Text>

          <TextInput
            style={styles.input}
            placeholder="Nome do Responsável"
            value={nomeResponsavel}
            onChangeText={setNomeResponsavel}
          />
          <TextInputMask
            style={styles.input}
            type={'cel-phone'}
            options={{
              maskType: 'BRL',
              withDDD: true,
              dddMask: '(99) '
            }}
            value={telefoneResponsavel}
            onChangeText={setTelefoneResponsavel}
            placeholder="Telefone do Responsável (99) 99999-9999"
            keyboardType="phone-pad"
          />
          <TextInput
            style={styles.input}
            placeholder="Email do Responsável"
            value={emailResponsavel}
            onChangeText={setEmailResponsavel}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TextInputMask
            style={styles.input}
            type={'cpf'}
            value={cpfResponsavel}
            onChangeText={setCpfResponsavel}
            placeholder="CPF do Responsável (000.000.000-00)"
            keyboardType="numeric"
          />

          <TouchableOpacity style={styles.button} onPress={enviarDados}>
            <Text style={styles.buttonText}>Cadastrar</Text>
          </TouchableOpacity>
        </ScrollView>
      </Pressable>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  header: {
    backgroundColor: "#1c348e",
    padding: 10,
    paddingTop: Platform.OS === 'android' ? 40 : 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e5c228',
  },
  titulo:{
    flex: 1,
    color: "#ffffffff",
     marginLeft: 80,
     top: 5,
     paddingLeft: 20,
    fontSize: 20,
    fontWeight: 'bold',
  
  },
  btnVoltar: {
    padding: 5,
    top: 5,
  },
  dropdown: {
    width: '100%',
    borderColor: '#1c348e',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 15,
    backgroundColor: '#fff',
    minHeight: 50,
  },
  dropdownContainer: {
    width: '100%',
    borderColor: '#1c348e',
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: '#fafafa',
  },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  input: {
    width: '100%',
    height: 50,
    borderColor: '#1c348e',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    backgroundColor: '#fff',
  },
  button: {
    backgroundColor: '#1c348e',
    width: '100%',
    paddingVertical: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e8c020',
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  signupButton: {
    marginTop: 20,
  },
  signupButtonText: {
    color: '#1c348e',
    fontSize: 16,
  },
});

export default CadastroAlunoScreen;