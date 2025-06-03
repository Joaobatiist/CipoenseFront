import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
  Alert,
  Platform
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

// Definindo tipos para o usuário
type Usuario = {
  nome: string;
  email: string;
  bio: string;
  foto: string;
};

const PerfilInstrutor = () => {
  const navigation = useNavigation();
  
  // Dados do usuário com tipagem explícita
  const [usuario, setUsuario] = useState<Usuario>({
    nome: 'João Victor',
    email: 'joao@email.com',
    bio: 'Desenvolvedor apaixonado por código!',
    foto: 'https://www.gstatic.com/images/branding/product/1x/avatar_circle_blue_512dp.png'
  });

  // Tipagem para os estados
  const [imagemPreview, setImagemPreview] = useState<string | null>(null);
  const [editando, setEditando] = useState<boolean>(false);
  const [form, setForm] = useState<Usuario>({ ...usuario });

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
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImagemPreview(result.assets[0].uri);
        setForm(prev => ({ ...prev, foto: result.assets[0].uri }));
      }
    } catch (error) {
      console.error('Erro ao selecionar imagem:', error);
      Alert.alert('Erro', 'Não foi possível selecionar a imagem');
    }
  };

  // Alternar modo de edição
  const alternarEdicao = () => {
    setEditando(!editando);
    if (!editando) {
      setForm(usuario); // Reseta o formulário quando começa a editar
    }
  };

  // Salvar alterações com validação
  const salvarAlteracoes = () => {
    if (!form.nome.trim() || !form.email.trim()) {
      Alert.alert('Erro', 'Nome e email são obrigatórios');
      return;
    }
    
    setUsuario(form);
    setEditando(false);
    setImagemPreview(null);
  };

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
          <TouchableOpacity 
            style={styles.uploadIcone} 
            onPress={selecionarImagem}
            accessibilityLabel="Alterar foto de perfil"
          >
            <MaterialIcons name="photo-camera" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Informações */}
        <View style={styles.infoContainer}>
          <Text style={styles.nome} accessibilityRole="header">{usuario.nome}</Text>
          <Text style={styles.email}>{usuario.email}</Text>
          <Text style={styles.bio}>{usuario.bio}</Text>
        </View>

        {/* Botão Editar */}
        <TouchableOpacity 
          onPress={alternarEdicao} 
          style={styles.botaoEditar}
          accessibilityRole="button"
        >
          <Text style={styles.botaoTexto}>{editando ? 'Cancelar' : 'Editar Perfil'}</Text>
        </TouchableOpacity>

        {/* Formulário de Edição */}
        {editando && (
          <View style={styles.formulario}>
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
            <TouchableOpacity 
              onPress={salvarAlteracoes} 
              style={styles.botaoSalvar}
              accessibilityRole="button"
            >
              <Text style={styles.botaoTexto}>Salvar</Text>
            </TouchableOpacity>
          </View>
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
  },
  header: {
    backgroundColor: "#1c348e",
    padding: 10,
    paddingTop: 10,
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
  },
  botaoEditar: {
    backgroundColor: '#1c348e',
    padding: 12,
    borderRadius: 8,
    width: '80%',
    alignItems: 'center',
    marginBottom: 20,
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
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  botaoSalvar: {
    backgroundColor: '#1c348e',
    padding: 12,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    marginTop: 10,
  },
  botaoTexto: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default PerfilInstrutor;