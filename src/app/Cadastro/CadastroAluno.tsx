import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Keyboard,
  TouchableWithoutFeedback,
  View
} from 'react-native';
import { router } from 'expo-router';
import { TextInputMask } from 'react-native-masked-text';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import DropDownPicker from 'react-native-dropdown-picker';


const LoginScreen = () => {
  const navigation = useNavigation();
  const [nomeAluno, setNomeAluno] = useState('');
  const [senhaAluno, setSenhaAluno] = useState('');
  const [emailAluno, setEmailAluno] = useState('');
  const [dataNascimentoAluno, setDataNascimentoAluno] = useState('');
  const [cpfAluno, setCpfAluno] = useState('');

  const [nomeResponsavel, setNomeResponsavel] = useState('');
  const [telefoneResponsavel, setTelefoneResponsavel] = useState('');
  const [emailResponsavel, setEmailResponsavel] = useState('');
  const [cpfResponsavel, setCpfResponsavel] = useState('');

    const [open, setOpen] = useState(false); // Estado para controlar se o dropdown está aberto
      const [role, setRole] = useState(null); // Estado para o cargo selecionado
      const [items, setItems] = useState([
          { label: 'Aluno', value: 'Aluno' },
         
      ]);

  function handleNext (){
   router.navigate("./funcionarios/Tecnico");
   
  }

const formatarData = (data: string): string => {
  const [dia, mes, ano] = data.split('/');
  return `${ano}-${mes}-${dia}`;
};
const PreencherFormulario = async () => {
    if (
        !nomeAluno ||
        !senhaAluno ||
        !emailAluno ||
        !dataNascimentoAluno ||
        !cpfAluno ||
        !nomeResponsavel ||
        !telefoneResponsavel ||
        !emailResponsavel ||
        !cpfResponsavel ||
        !role
    ) {
        alert("Por favor, preencha todos os campos!");
        return;
    }
  }


  const enviarDados = async () => {
     await PreencherFormulario();
     console.log("Dados a serem enviados:", {
    nome: nomeAluno,
    senha: senhaAluno,
    email: emailAluno,
    dataNascimento: formatarData(dataNascimentoAluno),
    cpfResponsavel: cpfAluno,
    cargo: role,
    responsavel: {
      nome: nomeResponsavel,
      telefone: telefoneResponsavel,
      email: emailResponsavel,
      cpf: cpfResponsavel
    }
  });

    try {
     await axios.post('http://192.168.0.10:8080/alunos', {
     nome: nomeAluno,
    senha: senhaAluno,
    email: emailAluno,
     dataNascimento: formatarData(dataNascimentoAluno),
    cpfResponsavel: cpfAluno,  
    cargo: role,                                                                                                                                                                                                                                                                                                                                                                                        
    responsavel: {
    nome: nomeResponsavel,
    telefone: telefoneResponsavel,
    email: emailResponsavel,
    cpf: cpfResponsavel
  }
});

      alert("Cadastro feito com sucesso!");
      router.back();
    } catch (error) {
      console.error(error);
      alert("Erro ao cadastrar aluno.");
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
                <MaterialIcons name="arrow-back" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <Image
            source={require('../../../assets/images/escudo.png')}
            style={{ width: "100%", height: 200, borderRadius: 55 }}
          />

          <Text style={styles.title}>Cadastrar Aluno</Text>
          <TextInput
            style={styles.input}
            placeholder="Nome"
            value={nomeAluno}
            onChangeText={setNomeAluno}
          />
          <TextInput
            style={styles.input}
            placeholder="Senha"
            secureTextEntry={true}
            value={senhaAluno}
            onChangeText={setSenhaAluno}
          />
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={emailAluno}
            onChangeText={setEmailAluno}
            keyboardType="email-address"
          />
          <TextInputMask
            style={styles.input}
            type={'datetime'}
            options={{
              format: 'DD/MM/YYYY',
            }}
            value={dataNascimentoAluno}
            onChangeText={setDataNascimentoAluno}
            placeholder="Data de Nascimento"
            keyboardType="numeric"
          />
          <TextInputMask
            style={styles.input}
            type={'cpf'}
            value={cpfAluno}
            onChangeText={setCpfAluno}
            placeholder="000.000.000-00"
            keyboardType="numeric"
          />
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
                    />
          <Text style={styles.title}>Responsável do Aluno</Text>

          <TextInput
            style={styles.input}
            placeholder="Nome"
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
            placeholder="(99) 99999-9999"
            keyboardType="phone-pad"
          />
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={emailResponsavel}
            onChangeText={setEmailResponsavel}
            keyboardType="email-address"
          />
          <TextInputMask
            style={styles.input}
            type={'cpf'}
            value={cpfResponsavel}
            onChangeText={setCpfResponsavel}
            placeholder="000.000.000-00"
            keyboardType="numeric"
          />

          <TouchableOpacity style={styles.button} onPress={enviarDados}>
            <Text style={styles.buttonText} onPress={handleNext}>Enviar</Text>
          </TouchableOpacity>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
   header: {
    backgroundColor: "#1c348e",
    padding: 10,
    paddingTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e5c228',
  },
  btnVoltar: {
    padding: 5,
    
  },
    dropdown: {
        width: '100%',
        borderColor: '#1c348e',
        borderWidth: 1,
        borderRadius: 8,
        marginBottom: 15,
        backgroundColor: '#fff',
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

export default LoginScreen;
