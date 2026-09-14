import axios from 'axios';

// cria uma instancia base do axios apontando para o nosso FastAPI
export const api = axios.create({
  baseURL: 'http://localhost:8000', // a porta em que o seu backend Python está rodando
  headers: {
    'Content-Type': 'application/json',
  },
});

// interceptador de requisicao: o toque de mestre da arquitetura!
// ele intercepta TODAS as chamadas para a API antes de saírem do frontend
// e anexa automaticamente o "crachá" (Token JWT) se o aluno estiver logado.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('@DesafioDoDia:token'); 
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  return config;
}, (error) => {
  return Promise.reject(error);
});