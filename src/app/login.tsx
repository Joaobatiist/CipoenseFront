import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { router } from 'expo-router';
import { jwtDecode, JwtPayload } from 'jwt-decode';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  Pressable,
  View,
  Dimensions,
} from 'react-native';
import Api from '../Config/Api';

interface CustomJwtPayload extends JwtPayload {
  roles?: string[];
}

const LoginScreen = () => {
  const [emailAluno, setEmailAluno] = useState('');
  const [senhaAluno, setSenhaAluno] = useState('');
  const [loading, setLoading] = useState(false);

  // Hook para responsividade
  const screenData = Dimensions.get('screen');
  const isDesktop = screenData.width >= 1024;
  const isTablet = screenData.width >= 768 && screenData.width < 1024;
  const isMobile = screenData.width < 768;

  const handleCadastro = () => router.navigate('./Cadastro/CadastroAlun');
  const handleVoltar = () => router.back();

  const handleLogin = async () => {
    
    if (!emailAluno || !senhaAluno) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos.');
      return;
    }

    setLoading(true);

    try {
      const response = await Api.post(`/auth/login`, {
        email: emailAluno,
        senha: senhaAluno,
      });

      const { jwt } = response.data;
      if (jwt) {
        await AsyncStorage.setItem('jwtToken', jwt);
        const decodedToken = jwtDecode<CustomJwtPayload>(jwt);
        const userRole = decodedToken.roles?.[0];

        Alert.alert('Sucesso', 'Login realizado com sucesso!');

        if (userRole === 'ATLETA') {
          router.replace('/atletas/Atleta');
        } else {
          router.replace('/administrador/dashboard');
        }
      } else {
        Alert.alert('Erro', 'Token JWT não recebido na resposta.');
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response) {
          if (error.response.status === 401) {
            Alert.alert('Erro', 'Email ou senha incorretos.');
          } else {
            Alert.alert('Erro', `Falha no login: ${error.response.data.message || 'Erro desconhecido.'}`);
          }
        } else if (error.request) {
          Alert.alert('Erro', 'Não foi possível conectar ao servidor.');
        }
      } else {
        Alert.alert('Erro', 'Ocorreu um erro inesperado.');
      }
    } finally {
      setLoading(false);
    }
  };

  const content = (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="always"
      onTouchStart={Keyboard.dismiss} // 👈 substitui Pressable externo
    >
      <Image
        source={require('../../assets/images/escudo.png')}
        style={styles.logo}
      />

      <Text style={styles.title}>Login</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={emailAluno}
        onChangeText={setEmailAluno}
        keyboardType="email-address"
        autoCapitalize="none"
        returnKeyType="next"
      />

      <TextInput
        style={styles.input}
        placeholder="Senha"
        secureTextEntry
        value={senhaAluno}
        onChangeText={setSenhaAluno}
        returnKeyType="done"
        onSubmitEditing={handleLogin}
      />

      <Pressable
        style={({ pressed }) => [
          styles.button,
          pressed && { opacity: 0.8 },
          loading && { opacity: 0.5 }
        ]}
        onPress={handleLogin}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text style={styles.buttonText}>Entrar</Text>
        )}
      </Pressable>

      <View style={styles.signupButton}>
        <Pressable onPress={handleCadastro}>
          <Text style={styles.signupButtonText}>Cadastre-se</Text>
        </Pressable>
        <Pressable onPress={handleVoltar}>
          <Text style={styles.signupButtonText}>Menu</Text>
        </Pressable>
      </View>
    </ScrollView>
  );

  return Platform.OS !== 'web' ? (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {content}
    </KeyboardAvoidingView>
  ) : (
    <View style={{ flex: 1 }}>{content}</View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  logo: {
    width: '100%',
    height: 200,
    borderRadius: 55,
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
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
    fontSize: 16,
  },
  button: {
    backgroundColor: '#1c348e',
    width: '100%',
    paddingVertical: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e8c020',
    alignItems: 'center',
    marginTop: 5,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  signupButton: {
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 25,
    gap: 20,
  },
  signupButtonText: {
    color: '#1c348e',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default LoginScreen;
