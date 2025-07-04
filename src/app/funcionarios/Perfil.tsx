import React, { useState, useEffect } from 'react'; // Import useEffect
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
  Alert,
  Platform,
  ActivityIndicator 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Api from '../../Config/Api';
import axios from 'axios'; 
import * as ImagePicker from 'expo-image-picker';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage'; 
import { router } from 'expo-router'; 



type Usuario = {
  nome: string;
  email: string;
  bio: string;
  foto: string;
};

const PerfilInstrutor = () => {
  const navigation = useNavigation();

  const [usuario, setUsuario] = useState<Usuario>({
    nome: '', // Initialize empty, will be fetched from API
    email: '',
    bio: '',
    foto: 'https://www.gstatic.com/images/branding/product/1x/avatar_circle_blue_512dp.png' // Default placeholder
  });

  const [imagemPreview, setImagemPreview] = useState<string | null>(null);
  const [editando, setEditando] = useState<boolean>(false);
  const [form, setForm] = useState<Usuario>({ ...usuario }); // Initialize form with dummy data
  const [loading, setLoading] = useState<boolean>(true); // Add loading state for data fetch

  // Function to retrieve the JWT token from AsyncStorage
  const getToken = async (): Promise<string | null> => {
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      return token;
    } catch (error) {
      console.error('Erro ao buscar token no AsyncStorage:', error);
      return null;
    }
  };

  // Function to fetch user data
  const fetchUserData = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      if (!token) {
        Alert.alert('Erro', 'Você não está logado ou sua sessão expirou. Por favor, faça login novamente.');
        // Optionally redirect to login screen
        router.navigate('../../'); // Replace with your actual login screen route
        return;
      }

      // Assuming your backend has a GET endpoint like /user/profile that returns the logged-in user's data
      const response = await Api.get<Usuario>('/user/profile');
      const fetchedUser = response.data;

      setUsuario(fetchedUser);
      setForm(fetchedUser); // Set form fields with fetched data
    } catch (error) {
      console.error('Erro ao buscar dados do usuário:', error);
      if (axios.isAxiosError(error) && error.response) {
        Alert.alert('Erro', `Não foi possível carregar o perfil: ${error.response.data.message || 'Erro desconhecido.'}`);
      } else {
        Alert.alert('Erro', 'Não foi possível carregar os dados do perfil.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch user data on component mount
  useEffect(() => {
    fetchUserData();
  }, []);

  // Selecionar imagem com tratamento de erros
  const selecionarImagem = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert('Permissão necessária', 'Precisamos de acesso à sua galeria para alterar a foto.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7, 
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImagemPreview(result.assets[0].uri);
   
      }
    } catch (error) {
      console.error('Erro ao selecionar imagem:', error);
      Alert.alert('Erro', 'Não foi possível selecionar a imagem');
    }
  };

 
  const alternarEdicao = () => {
    setEditando(!editando);
    if (!editando) {
    
      setForm(usuario);
      setImagemPreview(null);
    } else {
  
      setForm(usuario);
    }
  };

  // Salvar alterações com validação e upload de imagem
  const salvarAlteracoes = async () => {
    if (!form.nome.trim() || !form.email.trim()) {
      Alert.alert('Erro', 'Nome e email são obrigatórios');
      return;
    }

    setLoading(true); 
    try {
      const token = await getToken();
      if (!token) {
        Alert.alert('Erro', 'Sua sessão expirou. Por favor, faça login novamente.');
        router.navigate("../../"); 
        return;
      }

      const formData = new FormData();
      formData.append('nome', form.nome);
      formData.append('email', form.email);
      formData.append('bio', form.bio);


      if (imagemPreview) {
        const uriParts = imagemPreview.split('.');
        const fileType = uriParts[uriParts.length - 1];
        const fileName = `profile.${fileType}`; 

        formData.append('foto', {
          uri: imagemPreview,
          name: fileName,
          type: `image/${fileType}`,
        } as any); 
      }

      
      const response = await Api.put<Usuario>('/api', formData, {
        headers: {
          'Content-Type': 'multipart/form-data', 
        },
      });

      if (response.data) {
        const updatedUser: Usuario = {
          nome: response.data.nome || form.nome,
          email: response.data.email || form.email,
          bio: response.data.bio || form.bio,
          
          foto: response.data.foto || usuario.foto,
        };
        setUsuario(updatedUser); 
        setEditando(false);
        setImagemPreview(null); 
        Alert.alert('Sucesso', 'Perfil atualizado com sucesso!');
      }
    } catch (error) {
      console.error('Erro ao salvar alterações:', error);
      if (axios.isAxiosError(error) && error.response) {
        Alert.alert('Erro', `Não foi possível salvar as alterações: ${error.response.data.message || 'Erro desconhecido.'}`);
      } else {
        Alert.alert('Erro', 'Ocorreu um erro inesperado ao salvar o perfil.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1c348e" />
        <Text style={styles.loadingText}>Carregando perfil...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Cabeçalho */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.btnVoltar}
          accessibilityLabel="Voltar"
        >
          <MaterialIcons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Conteúdo do perfil */}
      <View style={styles.perfilContainer}>
        {/* Foto de Perfil */}
        <View style={styles.fotoContainer}>
          <Image
            source={{ uri: imagemPreview || usuario.foto }}
            style={styles.foto}
            accessibilityIgnoresInvertColors
          />
          {/* Show upload icon only when in editing mode */}
          {editando && (
            <TouchableOpacity
              style={styles.uploadIcone}
              onPress={selecionarImagem}
              accessibilityLabel="Alterar foto de perfil"
            >
              <MaterialIcons name="photo-camera" size={24} color="#fff" />
            </TouchableOpacity>
          )}
        </View>

        {/* Informações */}
        <View style={styles.infoContainer}>
          {editando ? (
            <>
              <TextInput
                style={styles.input}
                value={form.nome}
                onChangeText={(text) => setForm(prev => ({ ...prev, nome: text }))}
                placeholder="Nome"
                accessibilityLabel="Campo para editar nome"
              />
              <TextInput
                style={styles.input}
                value={form.email}
                onChangeText={(text) => setForm(prev => ({ ...prev, email: text }))}
                placeholder="Email"
                keyboardType="email-address"
                autoCapitalize="none"
                accessibilityLabel="Campo para editar email"
              />
              <TextInput
                style={[styles.input, styles.textArea]}
                value={form.bio}
                onChangeText={(text) => setForm(prev => ({ ...prev, bio: text }))}
                placeholder="Bio"
                multiline
                numberOfLines={4}
                accessibilityLabel="Campo para editar biografia"
              />
            </>
          ) : (
            // Display user info when not editing
            <>
              <Text style={styles.nome} accessibilityRole="header">{usuario.nome}</Text>
              <Text style={styles.email}>{usuario.email}</Text>
              <Text style={styles.bio}>{usuario.bio}</Text>
            </>
          )}
        </View>

        {/* Botões de Ação (Editar/Salvar/Cancelar) */}
        {editando ? (
          <View style={styles.botoesEdicao}>
            <TouchableOpacity
              onPress={salvarAlteracoes}
              style={[styles.botaoSalvar, styles.botaoEdicaoFlex]}
              accessibilityRole="button"
            >
              <Text style={styles.botaoTexto}>Salvar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={alternarEdicao} // This now acts as Cancel
              style={[styles.botaoCancelar, styles.botaoEdicaoFlex]}
              accessibilityRole="button"
            >
              <Text style={styles.botaoTexto}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            onPress={alternarEdicao}
            style={styles.botaoEditar}
            accessibilityRole="button"
          >
            <Text style={styles.botaoTexto}>Editar Perfil</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20, // Add some padding at the bottom for scroll
  },
  header: {
    backgroundColor: "#1c348e",
    padding: 10,
    paddingTop: Platform.OS === 'android' ? 30 : 0, // Adjust for Android status bar
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#e5c228',
  },
  btnVoltar: {
    padding: 5,
  },
  perfilContainer: {
    padding: 20,
    alignItems: 'center',
  },
  fotoContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  foto: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 3,
    borderColor: '#e5c228',
  },
  uploadIcone: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    backgroundColor: '#1c348e',
    borderRadius: 20,
    padding: 8,
    borderWidth: 1, // Add border to the icon
    borderColor: '#fff', // White border for contrast
  },
  infoContainer: {
    alignItems: 'center',
    marginBottom: 20,
    width: '100%',
  },
  nome: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
    textAlign: 'center',
    color: '#333',
  },
  email: {
    fontSize: 16,
    color: '#666',
    marginBottom: 10,
    textAlign: 'center',
  },
  bio: {
    fontSize: 16,
    textAlign: 'center',
    color: '#444',
    paddingHorizontal: 20,
    lineHeight: 24, // Improve readability for multi-line text
  },
  botaoEditar: {
    backgroundColor: '#1c348e',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    width: '80%',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000', // Add shadow for better visual depth
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  formulario: {
    width: '100%',
    paddingHorizontal: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
    width: '100%',
    backgroundColor: '#fff', // Ensure input background is white
    shadowColor: '#000', // Add shadow to inputs
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 2,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top', // Aligns text to the top for multiline input
  },
  botaoSalvar: {
    backgroundColor: '#28a745', // Green for Save
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  botaoCancelar: {
    backgroundColor: '#dc3545', // Red for Cancel
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  botaoTexto: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#555',
  },
  botoesEdicao: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 20,
    marginBottom: 20, // Space below buttons
  },
  botaoEdicaoFlex: {
    flex: 1,
    marginHorizontal: 5, // Space between buttons
  }
});

export default PerfilInstrutor;