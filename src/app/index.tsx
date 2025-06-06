import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Keyboard,
  TouchableWithoutFeedback,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import axios from 'axios';
import { jwtDecode, JwtPayload } from 'jwt-decode';
import AsyncStorage from '@react-native-async-storage/async-storage';


interface CustomJwtPayload extends JwtPayload {
  roles?: string[];
}


const BASE_URL = 'http://192.168.0.10:8080';

const LoginScreen = () => {
  const [emailAluno, setEmailAluno] = useState('');
  const [senhaAluno, setSenhaAluno] = useState('');
  const [loading, setLoading] = useState(false);

  function handleNext() {
    router.navigate("./Cadastro/CadastroAlun");
  }

  const handleLogin = async () => {
    if (!emailAluno || !senhaAluno) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos.');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(`${BASE_URL}/auth/login`, {
        email: emailAluno,
        senha: senhaAluno,
      });

      console.log('Resposta COMPLETA do servidor:', response.data);
      console.log('Status da resposta HTTP:', response.status);

      const { jwt } = response.data; 

      if (jwt) { 
        // ***** AQUI ESTÁ A CORREÇÃO PRINCIPAL *****
        // Usamos 'jwtToken' para ser consistente com o nome da chave usada em MinimalScreen.tsx
        await AsyncStorage.setItem('jwtToken', jwt); 
        console.log('Token armazenado no AsyncStorage (chave jwtToken):', jwt); 

        const decodedToken = jwtDecode<CustomJwtPayload>(jwt); 
        console.log('Token decodificado:', decodedToken);

        const userRole = decodedToken.roles && decodedToken.roles.length > 0
          ? decodedToken.roles[0]
          : undefined;

        console.log('Cargo do usuário:', userRole);

        Alert.alert('Sucesso', 'Login realizado com sucesso!');

        if (userRole === 'ALUNO') {
          router.replace('./Atletas/Usuario');
        } else if (userRole === 'TECNICO') {
          // Este é o redirecionamento para o seu MinimalScreen
          router.replace('./funcionarios/Tecnico'); 
        } else if (userRole === 'COORDENADOR') {
          router.replace('./Adminstrador/Coordenador');
        } else if (userRole === 'SUPERVISOR') {
          router.replace('./Adminstrador/Supervisor');
        } else {
          console.warn('Login não reconhecido ou inexistente:', userRole);
          Alert.alert('Aviso', 'Seu login não foi reconhecido. Redirecionando para a tela inicial.');
          router.replace('./index');
        }

      } else {
        Alert.alert('Erro', 'Token JWT não recebido na resposta do servidor.');
        console.log('Propriedade "jwt" não encontrada na resposta do servidor ou é nula/vazia.'); 
      }

    } catch (error) {
      console.error('Erro no login:', error);
      if (axios.isAxiosError(error)) {
        if (error.response) {
          console.error('Detalhes da resposta de ERRO do servidor:', error.response.data);
          console.error('Status de ERRO do servidor:', error.response.status);

          if (error.response.status === 401) {
            Alert.alert('Erro', 'Email ou senha incorretos.');
          } else {
            Alert.alert('Erro', `Falha no login: ${error.response.data.message || 'Erro desconhecido.'}`);
          }
        } else if (error.request) {
          Alert.alert('Erro', 'Não foi possível conectar ao servidor. Verifique sua conexão ou tente mais tarde.');
        }
      } else {
        Alert.alert('Erro', 'Ocorreu um erro inesperado. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <Image
            source={require("../../assets/images/escudo.png")}
            style={{ width: "100%", height: 200, borderRadius: 55 }}
          />

          <Text style={styles.title}>Login</Text>
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

          <TouchableOpacity
            style={styles.button}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.buttonText}>Entrar</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.signupButton}>
            <Text style={styles.signupButtonText} onPress={handleNext}>
              Cadastre-se
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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