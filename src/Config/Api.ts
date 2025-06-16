import axios from 'axios';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

if(!API_BASE_URL){
    console.warn('Variável de ambiente EXPO_API_BASE_URL não definida!!')
}

const Api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
    headers: {
        'Content-Typer': 'application/json',
    },
});

export default Api;