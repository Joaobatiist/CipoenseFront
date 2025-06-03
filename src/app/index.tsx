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
} from 'react-native';
import { router } from 'expo-router';

const LoginScreen = () => {
  const [emailAluno, getEmailAluno] = useState('');
  const [senhaAluno, getSenhaAluno] = useState('');

  function handleNext() {
    router.navigate("./Cadastro/CadastroAlun"); 
  }

  const handleLogin = () => {
    if (emailAluno === 'usuario' && senhaAluno === 'senha') {
      Alert.alert('Sucesso', 'Login realizado com sucesso!');
    } else {
      Alert.alert('Erro', 'Nome de usuário ou senha incorretos.');
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
            onChangeText={getEmailAluno}
          />
          <TextInput
            style={styles.input}
            placeholder="Senha"
            secureTextEntry={true}
            value={senhaAluno}
            onChangeText={getSenhaAluno}
          />
          <TouchableOpacity style={styles.button} onPress={handleLogin}>
            <Text style={styles.buttonText}>Entrar</Text>
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