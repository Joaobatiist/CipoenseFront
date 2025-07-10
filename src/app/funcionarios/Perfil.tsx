import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet, // Importar StyleSheet para definir estilos localmente se necessário
  Alert,
  ActivityIndicator
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { MediaType } from 'expo-image-picker';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { styles } from "../../Styles/Perfil"; // Mantém a importação dos estilos principais

const API_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://seu-backend-url.com';

type AtletaProfileDto = {
  id: number;
  matricula: string;
  nome: string;
  email: string;
  subDivisao: string;
  dataNascimento: string;
  foto: string | null;
  contatoResponsavel: string | null; // Adicionado para exibir o contato do responsável
};

const PerfilAtleta = () => {
  const navigation = useNavigation();
  const [atleta, setAtleta] = useState<AtletaProfileDto | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [imagemPreview, setImagemPreview] = useState<string | undefined>();
  const [editando, setEditando] = useState<boolean>(false);
  const [form, setForm] = useState<Partial<AtletaProfileDto>>({});
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

        const fotoParaExibir = dados.foto;

        setAtleta({
          id: dados.id,
          matricula: dados.matricula?.toString() || 'Não informada',
          nome: dados.nome || 'Nome não informado',
          email: dados.email || 'Email não informado',
          subDivisao: dados.subDivisao || 'Não informado',
          dataNascimento: dados.dataNascimento || 'Não informada',
          foto: fotoParaExibir,
          contatoResponsavel: dados.contatoResponsavel || 'Não informado', // Adicionado
        });

        setForm({
          nome: dados.nome || '',
          email: dados.email || '',
          matricula: dados.matricula?.toString() || '',
          dataNascimento: dados.dataNascimento || '',
          subDivisao: dados.subDivisao || '',
          contatoResponsavel: dados.contatoResponsavel || '', // Adicionado
        });
      } catch (error) {
        console.error('Erro ao carregar perfil:', error);
        Alert.alert('Erro', 'Não foi possível carregar os dados do perfil');
      } finally {
        setLoading(false);
      }
    };

    fetchAtletaData();
  }, []);

  const selecionarImagem = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissão necessária', 'Precisamos de acesso à sua galeria para alterar a foto.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'Images' as any,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        const uri = result.assets[0].uri;
        setImagemPreview(uri);
        await uploadImagem(uri);
      }
    } catch (error) {
      console.error('Erro ao selecionar imagem:', error);
      Alert.alert('Erro', 'Não foi possível selecionar a imagem');
    }
  };

  const uploadImagem = async (uri: string) => {
    try {
      setUploading(true);
      const token = await AsyncStorage.getItem('jwtToken');

      const formData = new FormData();
      formData.append('file', {
        uri,
        name: 'profile.jpg',
        type: 'image/jpeg',
      } as any);

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

      Alert.alert('Sucesso', 'Foto atualizada com sucesso!');
    } catch (error) {
      console.error('Erro no upload:', error);
      Alert.alert('Erro', 'Falha ao atualizar a foto');
    } finally {
      setUploading(false);
    }
  };

  const alternarEdicao = () => {
    setEditando(!editando);
    if (!editando && atleta) {
      setForm({
        nome: atleta.nome,
        email: atleta.email,
        matricula: atleta.matricula,
        dataNascimento: atleta.dataNascimento,
        subDivisao: atleta.subDivisao,
        contatoResponsavel: atleta.contatoResponsavel, // Adicionado
      });
    }
  };

  const formatarData = (dataString: string) => {
    if (!dataString || dataString === 'Não informada') return dataString;
    try {
      const [ano, mes, dia] = dataString.split('-');
      if (ano && mes && dia) {
        return `${dia}/${mes}/${ano}`;
      }
      return dataString;
    } catch {
      return dataString;
    }
  };

  const salvarAlteracoes = async () => {
    if (!form.nome || !form.email) {
      Alert.alert('Erro', 'Nome e email são obrigatórios');
      return;
    }

    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('jwtToken');

      const updateDto: Partial<AtletaProfileDto> = {
        nome: form.nome,
        email: form.email,
        dataNascimento: form.dataNascimento,
        subDivisao: form.subDivisao,
        contatoResponsavel: form.contatoResponsavel, // Incluído
      };

      const response = await axios.put<AtletaProfileDto>(`${API_URL}/api/atleta/profile`, updateDto, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setAtleta(prevAtleta => {
        if (prevAtleta) {
          return {
            ...prevAtleta,
            nome: response.data.nome,
            email: response.data.email,
            // A matrícula não é editável, então manter a existente
            matricula: response.data.matricula?.toString() || prevAtleta.matricula,
            dataNascimento: response.data.dataNascimento,
            subDivisao: response.data.subDivisao,
            contatoResponsavel: response.data.contatoResponsavel, // Atualiza contato
            foto: prevAtleta.foto
          };
        }
        return null;
      });

      setEditando(false);
      Alert.alert('Sucesso', 'Perfil atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar:', error);
      Alert.alert('Erro', 'Não foi possível atualizar o perfil');
    } finally {
      setLoading(false);
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
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.btnVoltar}>
          <MaterialIcons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Meu Perfil</Text> {/* Adicionado título */}
      </View>

      <View style={styles.profileContainer}>
        <View style={styles.avatarContainer}>
          <TouchableOpacity onPress={selecionarImagem} disabled={uploading} style={styles.avatarTouchable}> {/* Estilo para o touchable */}
            {imagemPreview || atleta.foto ? (
              <Image
                source={{ uri: imagemPreview || atleta.foto || '' }}
                style={styles.avatar}
                onError={(e) => console.log('Erro ao carregar imagem:', e.nativeEvent.error)}
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <MaterialIcons name="add-a-photo" size={40} color="#666" /> {/* Ícone para adicionar foto */}
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

        {/* Informações do Perfil */}
        <View style={styles.card}> {/* Novo estilo de cartão para agrupar info */}
          <Text style={styles.cardTitle}>Informações Pessoais</Text>
          {!editando ? (
            <>
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

              {atleta.contatoResponsavel && atleta.contatoResponsavel !== 'Não informado' && (
                <>
                  <Text style={styles.infoLabel}>Contato Responsável:</Text>
                  <Text style={styles.infoValue}>{atleta.contatoResponsavel}</Text>
                </>
              )}
            </>
          ) : (
            <View style={styles.formContainer}>
              <Text style={styles.inputLabel}>Nome:</Text>
              <TextInput
                style={styles.input}
                value={form.nome}
                onChangeText={(text) => setForm({ ...form, nome: text })}
                placeholder="Nome completo"
              />
              <Text style={styles.inputLabel}>Email:</Text>
              <TextInput
                style={styles.input}
                value={form.email}
                onChangeText={(text) => setForm({ ...form, email: text })}
                placeholder="email@example.com"
                keyboardType="email-address"
              />
              <Text style={styles.inputLabel}>Matrícula:</Text>
              <TextInput
                style={[styles.input, styles.inputDisabled]} // Estilo para input desabilitado
                value={form.matricula}
                editable={false}
              />
              <Text style={styles.inputLabel}>Data de Nascimento:</Text>
              <TextInput
                style={styles.input}
                value={form.dataNascimento}
                onChangeText={(text) => setForm({ dataNascimento: text })}
                placeholder="DD/MM/AAAA"
                keyboardType="numeric" // Ajuda a digitar data
              />
              <Text style={styles.inputLabel}>Subdivisão:</Text>
              <TextInput
                style={styles.input}
                value={form.subDivisao}
                onChangeText={(text) => setForm({ ...form, subDivisao: text })}
                placeholder="Ex: Categoria, Posição"
              />
              <TextInput
              style={styles.input}
              value={form.contatoResponsavel ?? ''} 
              onChangeText={(text) => setForm({ ...form, contatoResponsavel: text })}
              placeholder="(XX) XXXXX-XXXX"
              keyboardType="phone-pad"
             />
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
};

export default PerfilAtleta;