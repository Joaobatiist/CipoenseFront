import AsyncStorage from '@react-native-async-storage/async-storage';
import { isAxiosError } from 'axios';
import { router } from 'expo-router';
import { jwtDecode, JwtPayload } from 'jwt-decode';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { toast } from 'react-toastify';
import Api from '../Config/Api';
import { ToastContainer } from '../components/Toast';

interface CustomJwtPayload extends JwtPayload {
  roles?: string[];
}

const screenData = Dimensions.get('screen');
const isDesktop = screenData.width >= 1024;

const LoginScreen = () => {
  const [emailAluno, setEmailAluno] = useState('');
  const [senhaAluno, setSenhaAluno] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState(false);
  const [senhaError, setSenhaError] = useState(false);

  const handleVoltar = () => router.back();

  const handleLogin = async () => {
    // Reset errors
    setEmailError(false);
    setSenhaError(false);
    
    // Validação de campos
    if (!emailAluno || !senhaAluno) {
      if (!emailAluno) setEmailError(true);
      if (!senhaAluno) setSenhaError(true);
      
      if (Platform.OS === 'web') {
        toast.error('Por favor, preencha todos os campos.');
      } else {
        Alert.alert('Erro', 'Por favor, preencha todos os campos.');
      }
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

        // Mostra toast de sucesso e navega automaticamente
        if (Platform.OS === 'web') {
          toast.success('Login realizado com sucesso!', {
            autoClose: 1500, // Fecha em 1.5 segundos
          });
          
          // Navega após um pequeno delay para mostrar o toast
          setTimeout(() => {
            if (userRole === 'ATLETA') {
              router.replace('/Atletas/Atleta');
            } else {
              router.replace('/administrador/dashboard');
            }
          }, 1000); // 1 segundo de delay
        } else {
          Alert.alert('Sucesso', 'Login realizado com sucesso!', [
            {
              text: 'OK',
              onPress: () => {
                if (userRole === 'ATLETA') {
                  router.replace('/Atletas/Atleta');
                } else {
                  router.replace('/administrador/dashboard');
                }
              }
            }
          ]);
        }
      } else {
        if (Platform.OS === 'web') {
          toast.error('Token JWT não recebido na resposta.');
        } else {
          Alert.alert('Erro', 'Token JWT não recebido na resposta.');
        }
      }
    } catch (error) {
      if (isAxiosError(error)) {
        if (error.response) {
          if (error.response.status === 401) {
            setEmailError(true);
            setSenhaError(true);
            if (Platform.OS === 'web') {
              toast.error('Email ou senha incorretos.');
            } else {
              Alert.alert('Erro', 'Email ou senha incorretos.');
            }
          } else {
            const errorMsg = `Falha no login: ${error.response.data.message || 'Erro desconhecido.'}`;
            if (Platform.OS === 'web') {
              toast.error(errorMsg);
            } else {
              Alert.alert('Erro', errorMsg);
            }
          }
        } else if (error.request) {
          if (Platform.OS === 'web') {
            toast.error('Não foi possível conectar ao servidor.');
          } else {
            Alert.alert('Erro', 'Não foi possível conectar ao servidor.');
          }
        }
      } else {
        if (Platform.OS === 'web') {
          toast.error('Ocorreu um erro inesperado.');
        } else {
          Alert.alert('Erro', 'Ocorreu um erro inesperado.');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const content = (
    <>
      {Platform.OS === 'web' && <ToastContainer />}
      <ScrollView
        contentContainerStyle={styles.mainContainer}
        keyboardShouldPersistTaps="always"
        onTouchStart={Keyboard.dismiss}
        style={Platform.OS === 'web' ? styles.webScrollView : undefined}
        showsVerticalScrollIndicator={true}
        nestedScrollEnabled={true}
      >
        <View style={styles.cardContainer}> 
          <Image
            source={require('../../assets/images/escudo.png')}
            style={styles.logo}
          />

          <Text style={styles.title}>Seja Bem vindo!</Text>

          <TextInput
            style={[
              styles.input,
              emailError && styles.inputError
            ]}
            placeholder="Email"
            placeholderTextColor={emailError ? '#e74c3c' : '#999'}
            value={emailAluno}
            onChangeText={(text) => {
              setEmailAluno(text);
              setEmailError(false); // Remove erro ao digitar
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            returnKeyType="next"
          />

          <TextInput
            style={[
              styles.input,
              senhaError && styles.inputError
            ]}
            placeholder="Senha"
            placeholderTextColor={senhaError ? '#e74c3c' : '#999'}
            secureTextEntry
            value={senhaAluno}
            onChangeText={(text) => {
              setSenhaAluno(text);
              setSenhaError(false); // Remove erro ao digitar
            }}
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
          <Pressable onPress={handleVoltar}>
            <Text style={styles.signupButtonText}>Menu</Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
    </>
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

  mainContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#f5f5f5',
  },
  
  cardContainer: {
    width: '100%',
    maxWidth: Platform.select({
      web: isDesktop ? 500 : '100%',
      default: '100%',
    }),
    alignSelf: 'center',
    padding: isDesktop ? 30 : 0,
    borderRadius: isDesktop ? 12 : 0,
    backgroundColor: isDesktop ? '#fff' : 'transparent',
    
    ...Platform.select({
      web: isDesktop && {
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      },
    }),
  },
  
  logo: {
    width: '100%',
    height: Platform.OS === 'web' ? 400 : 350, 
    resizeMode: 'contain',
    marginBottom: -60, // Removido ou reduzido para aproximar do título
  },
  
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 20, // Aumentado para dar espaço entre o título e o primeiro input
    color: '#333',
    textAlign: 'center',
    marginTop: 0, // Removido para garantir proximidade com a logo
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
  inputError: {
    borderColor: '#e74c3c',
    borderWidth: 2,
    backgroundColor: '#ffeaea',
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
    flexDirection: isDesktop ? 'row' : 'column',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginTop: 25,
    gap: 20,
  },
  signupButtonText: {
    color: '#1c348e',
    fontSize: 16,
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
   webScrollView: {
    ...Platform.select({
      web: {
        height: '100vh',
        overflowY: 'auto' as any,
      },
    }),
  } as any,
  container: {
    paddingBottom: 22,
    alignItems: 'center',
  },
});

export default LoginScreen;