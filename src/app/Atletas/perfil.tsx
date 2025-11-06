import { ToastContainer } from '@/components/Toast';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { toast } from 'react-toastify';
import { styles } from "../../Styles/Perfil";

const API_URL = process.env.EXPO_PUBLIC_API_BASE_URL 

type AtletaProfileDto = {
  id: number;
  matricula: string;
  nome: string;
  email: string;
  subDivisao: string;
  dataNascimento: string;
  foto: string | null;
  contatoResponsavel: string | null;
  contatoResponsavelSecundario: string | null;
};

const PerfilAtleta = () => {
  const navigation = useNavigation();
  const [atleta, setAtleta] = useState<AtletaProfileDto | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [imagemPreview, setImagemPreview] = useState<string | undefined>();
  const [uploading, setUploading] = useState<boolean>(false);

  useEffect(() => {
    const fetchAtletaData = async () => {
      try {
        setLoading(true);
        const token = await AsyncStorage.getItem('jwtToken');
        const response = await axios.get<AtletaProfileDto>(`${API_URL}/api/atleta/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const dados = response.data;

        setAtleta({
          id: dados.id,
          matricula: dados.matricula?.toString() || 'Não informada',
          nome: dados.nome || 'Nome não informado',
          email: dados.email || 'Email não informado',
          subDivisao: dados.subDivisao || 'Não informado',
          dataNascimento: dados.dataNascimento || 'Não informada',
          foto: dados.foto,
          contatoResponsavel: dados.contatoResponsavel || 'Não informado',
          contatoResponsavelSecundario: dados.contatoResponsavelSecundario || 'Não informado',
        });
      } catch (error) {
        console.error('Erro ao carregar perfil:', error);
        if (Platform.OS === 'web') {
          toast.error('Não foi possível carregar os dados do perfil');
        } else {
          Alert.alert('Erro', 'Não foi possível carregar os dados do perfil');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchAtletaData();
  }, []);

  const selecionarImagem = async () => {
    try {
      // No web, usamos input file nativo do HTML
      if (Platform.OS === 'web') {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = async (e: any) => {
          const file = e.target?.files?.[0];
          if (file) {
            // Criar preview local
            const reader = new FileReader();
            reader.onloadend = () => {
              setImagemPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
            
            // Fazer upload
            await uploadImagemWeb(file);
          }
        };
        input.click();
        return;
      }

      // No mobile, usa o ImagePicker normal
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissão necessária', 'Precisamos de acesso à sua galeria para alterar a foto.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5, // Reduz a qualidade para 50% (reduz muito o tamanho)
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        const uri = result.assets[0].uri;
        setImagemPreview(uri);
        await uploadImagem(uri);
      }
    } catch (error) {
      console.error('Erro ao selecionar imagem:', error);
      if (Platform.OS === 'web') {
        window.alert('Não foi possível selecionar a imagem');
      } else {
        Alert.alert('Erro', 'Não foi possível selecionar a imagem');
      }
    }
  };

  const uploadImagemWeb = async (file: File) => {
    try {
      setUploading(true);
      const token = await AsyncStorage.getItem('jwtToken');

      // Comprimir a imagem antes de enviar
      const compressedFile = await compressImage(file);

      const formData = new FormData();
      formData.append('file', compressedFile);

      const response = await axios.post<string>(`${API_URL}/api/atleta/profile/photo`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      const uploadedFotoBase64 = response.data;

      if (atleta) {
        setAtleta({
          ...atleta,
          foto: uploadedFotoBase64,
        });
        setImagemPreview(undefined);
      }
      if (Platform.OS === 'web') {
        toast.success('Foto atualizada com sucesso!');
      } else {
        Alert.alert('Sucesso', 'Foto atualizada com sucesso!');
      }
    } catch (error: any) {
      console.error('Erro no upload (web):', error);
      console.error('Detalhes do erro:', error.response?.data);
      toast.error(`Falha ao atualizar a foto: ${error.response?.data?.message || error.message}`);
    } finally {
      setUploading(false);
    }
  };

  // Função para comprimir imagem no web
  const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = document.createElement('img') as HTMLImageElement;
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          // Define tamanho máximo (300x300 pixels para avatar)
          const MAX_WIDTH = 300;
          const MAX_HEIGHT = 300;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          ctx?.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compressedFile = new File([blob], file.name, {
                  type: 'image/jpeg',
                  lastModified: Date.now(),
                });
                console.log('Tamanho original:', (file.size / 1024).toFixed(2), 'KB');
                console.log('Tamanho comprimido:', (compressedFile.size / 1024).toFixed(2), 'KB');
                resolve(compressedFile);
              } else {
                reject(new Error('Erro ao comprimir imagem'));
              }
            },
            'image/jpeg',
            0.7 // Qualidade 70%
          );
        };
        img.onerror = () => reject(new Error('Erro ao carregar imagem'));
      };
      reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
    });
  };

  const uploadImagem = async (uri: string) => {
    try {
      setUploading(true);
      const token = await AsyncStorage.getItem('jwtToken');

      if (!token) {
        Alert.alert('Erro', 'Token de autenticação não encontrado');
        return;
      }

      const formData = new FormData();
      
      // Para mobile, precisamos extrair o nome e tipo do arquivo da URI
      const filename = uri.split('/').pop() || 'profile.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      formData.append('file', {
        uri,
        name: filename,
        type,
      } as any);

     

      const response = await axios.post<string>(`${API_URL}/api/atleta/profile/photo`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('Upload concluído com sucesso');
      console.log('Response:', response.data);
       
      const uploadedFotoBase64 = response.data;

      if (atleta) {
        setAtleta({
          ...atleta,
          foto: uploadedFotoBase64,
        });
        setImagemPreview(undefined);
      }

      Alert.alert('Sucesso', 'Foto atualizada com sucesso!');
    } catch (error: any) {
      console.error('Erro no upload:', error);
      console.error('Response status:', error.response?.status);
      console.error('Response data:', error.response?.data);
      console.error('Error message:', error.message);
      
      let errorMessage = 'Falha ao atualizar a foto';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Erro', errorMessage);
    } finally {
      setUploading(false);
    }
  };





  const formatarData = (dataString: string) => {
    if (!dataString || dataString === 'Não informada') return dataString;
    try {
      const [ano, mes, dia] = dataString.split('-');
      if (ano && mes && dia) return `${dia}/${mes}/${ano}`;
      return dataString;
    } catch {
      return dataString;
    }
  };

 

  if (loading && !atleta) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  if (!atleta) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Erro ao carregar dados do perfil</Text>
      </View>
    );
  }

  return (
    <>
      {Platform.OS === 'web' && <ToastContainer />}
      <ScrollView
        style={styles.container}
        contentContainerStyle={{
          alignItems: 'center',
          paddingBottom: 50,
          width: '100%',
        }}
        showsVerticalScrollIndicator={Platform.OS === 'web'}
        nestedScrollEnabled={Platform.OS === 'web'}
        bounces={Platform.OS !== 'web'}
        {...(Platform.OS === 'web' && {
          style: [styles.container, { overflowY: 'auto' as any, maxHeight: '100vh' as any }]
        })}
      >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.btnVoltar}>
          <FontAwesomeIcon icon={faArrowLeft} size={20} color="#ffffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Meu Perfil</Text>
      </View>

      <View style={styles.profileContainer}>
        <View style={styles.avatarContainer}>
          <TouchableOpacity onPress={selecionarImagem} disabled={uploading} style={styles.avatarTouchable}>
            {imagemPreview || atleta.foto ? (
              <Image
                source={{ uri: imagemPreview || atleta.foto || '' }}
                style={styles.avatar}
                onError={(e) => console.log('Erro ao carregar imagem:', e.nativeEvent.error)}
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarPlaceholderText}>Adicionar Foto</Text>
              </View>
            )}
            {uploading && (
              <View style={styles.uploadOverlay}>
                <ActivityIndicator color="#fff" />
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Botões de gerenciamento de foto */}
        {(atleta.foto || imagemPreview) && (
          <View style={styles.photoButtons}>
            <TouchableOpacity
              onPress={selecionarImagem}
              disabled={uploading}
              style={styles.changePhotoButton}
              accessibilityLabel="Trocar foto"
            >
              <Text style={styles.changePhotoButtonText}>
                📷 Trocar Foto
              </Text>
            </TouchableOpacity>
            
           
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Informações Pessoais</Text>
          <View>
            <Text style={styles.infoLabel}>Nome:</Text>
            <Text style={styles.infoValue}>{atleta.nome}</Text>

            <Text style={styles.infoLabel}>Matrícula:</Text>
            <Text style={styles.infoValue}>{atleta.matricula}</Text>

            <Text style={styles.infoLabel}>Email:</Text>
            <Text style={styles.infoValue}>{atleta.email}</Text>

            <Text style={styles.infoLabel}>Subdivisão:</Text>
            <Text style={styles.infoValue}>{atleta.subDivisao}</Text>

            <Text style={styles.infoLabel}>Data de Nascimento:</Text>
            <Text style={styles.infoValue}>{formatarData(atleta.dataNascimento)}</Text>
            <Text style={styles.infoLabel}>Contato responsável:</Text>
            <Text style={styles.infoValue}>{atleta.contatoResponsavel}</Text>

            {atleta.contatoResponsavel && atleta.contatoResponsavel !== 'Não informado' && (
              <>
                <Text style={styles.infoLabel}>Segundo contato responsável:</Text>
                <Text style={styles.infoValue}>{atleta.contatoResponsavelSecundario}</Text>
              </>
            )}
          </View>
        </View>
      </View>
    </ScrollView>
    </>
  );
};

export default PerfilAtleta;
