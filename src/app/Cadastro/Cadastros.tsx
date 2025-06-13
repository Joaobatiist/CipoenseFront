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
    View,
    Alert, // Using Alert from React Native for better UX
} from 'react-native';
import { router } from 'expo-router';
import { TextInputMask } from 'react-native-masked-text';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import DropDownPicker from 'react-native-dropdown-picker';

const Cadastro = () => {
    const navigation = useNavigation();
    const [nome, setNome] = useState('');
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [dataNascimento, setDataNascimento] = useState('');
    const [cpf, setCpf] = useState(''); 
    const [telefone, setTelefone] = useState('');

    const [open, setOpen] = useState(false);
    const [role, setRole] = useState(null);
    const [items, setItems] = useState([
        
        { label: 'Coordenador', value: 'COORDENADOR' },
        { label: 'Tecnico', value: 'TECNICO' },
        { label: 'Supervisor', value: 'SUPERVISOR' },
     
    ]);

  

    const formatarData = (data:string) => { 
        if (!data) return '';
        const [dia, mes, ano] = data.split('/');
        return `${ano}-${mes}-${dia}`; 
    };

    const PreencherFormulario = () => { 
        if (
            !nome ||
            !email ||
            !senha ||
            !dataNascimento ||
            !cpf ||
            !telefone ||
            !role
        ) {
            Alert.alert("Erro", "Por favor, preencha todos os campos!"); 
            return false;
        }
        return true;
    };

    const enviarDados = async () => {
        const formPreenchido = PreencherFormulario(); // Call synchronously
        if (!formPreenchido) return;

        // Ensure the role is normalized to uppercase to match backend Enum
        const normalizedRole = role ? String(role).toUpperCase() : '';

        // *** THIS IS THE KEY CHANGE FOR THE UNIFIED ENDPOINT ***
        // All employees (Coordenador, Tecnico, Supervisor) will use this single endpoint.
        const apiUrl = 'http://192.168.0.10:8080/cadastro/funcionarios'; // Your unified backend endpoint

        const payload = {
            nome: nome,
            email: email,
            senha: senha,
            dataNascimento: formatarData(dataNascimento),
            cpf: cpf, // This CPF is for the employee themselves
            telefone: telefone,
            roles: normalizedRole, // Send the exact uppercase Enum name
        };

        console.log("Enviando para:", apiUrl);
        console.log("Payload:", payload);

         try {
        const response = await axios.post(apiUrl, payload);

        console.log("Resposta do backend:", response.data);
        Alert.alert("Sucesso", `Cadastro de ${String(role).toLowerCase()} feito com sucesso!`);
        router.back();
    } catch (error) {
        // --- MODIFICAÇÃO AQUI ---
        let errorMessage = "Ocorreu um erro desconhecido. Por favor, tente novamente.";

       
        if (axios.isAxiosError(error) && error.response) {
            if (error.response.data && error.response.data.message) {
                errorMessage = error.response.data.message;
            }
            // Se o backend enviar um objeto de erro mais complexo (ex: validação)
            else if (error.response.data) {
                errorMessage = JSON.stringify(error.response.data);
            }
            // Fallback para o status HTTP se não houver corpo de erro específico
            else {
                errorMessage = `Erro do servidor: ${error.response.status} ${error.response.statusText}`;
            }
        } else if (error instanceof Error) {
            // Para outros tipos de erros JavaScript padrão
            errorMessage = error.message;
        }

        console.error("Erro detalhado no cadastro:", error);
        Alert.alert("Erro", `Não foi possível cadastrar ${String(role).toLowerCase()}: ${errorMessage}`);
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

                    <Text style={styles.title}>Cadastrar Funcionario</Text> {/* Updated title */}
                    <TextInput
                        style={styles.input}
                        placeholder="Nome"
                        value={nome}
                        onChangeText={setNome}
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Email"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Senha"
                        secureTextEntry={true}
                        value={senha}
                        onChangeText={setSenha}
                    />
                    <TextInputMask
                        style={styles.input}
                        type={'datetime'}
                        options={{ format: 'DD/MM/YYYY' }}
                        value={dataNascimento}
                        onChangeText={setDataNascimento}
                        placeholder="DD/MM/YYYY" // Changed placeholder
                        keyboardType="numeric"
                    />
                    <TextInputMask
                        style={styles.input}
                        type={'cpf'}
                        value={cpf}
                        onChangeText={setCpf}
                        placeholder="000.000.000-00"
                        keyboardType="numeric"
                    />
                    <TextInputMask
                        style={styles.input}
                        type={'cel-phone'}
                        options={{ maskType: 'BRL', withDDD: true, dddMask: '(99) ' }}
                        value={telefone}
                        onChangeText={setTelefone}
                        placeholder="(99) 99999-9999"
                        keyboardType="phone-pad"
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
                        zIndex={3000} // Adjust zIndex to ensure dropdown appears above other elements
                        zIndexInverse={1000}
                        listMode="SCROLLVIEW" 
                    />

                    <TouchableOpacity style={styles.button} onPress={enviarDados}>
                        <Text style={styles.buttonText}>Enviar</Text>
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
    btnVoltar: { padding: 5 },
    container: {
        flexGrow: 1,
        justifyContent: 'flex-start',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#f5f5f5',
    },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: '#333' },
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
    button: {
        backgroundColor: '#1c348e',
        width: '100%',
        paddingVertical: 15,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e8c020',
        alignItems: 'center',
    },
    buttonText: { color: '#ffffff', fontSize: 18, fontWeight: 'bold' },
    signupButton: { marginTop: 20 },
    signupButtonText: { color: '#1c348e', fontSize: 16 },
});

export default Cadastro;