import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// interceptador de requisicao: anexa o token jwt em todas as chamadas
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('@DesafioDoDia:token');
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// interceptador de resposta: tratamento global de seguranca
api.interceptors.response.use(
  (response) => {
    // se a resposta foi um sucesso (200, 201), apenas repassa os dados para o componente
    return response;
  },
  (error) => {
    // se o backend retornar 401, significa que o token expirou, foi fraudado ou nao existe
    if (error.response && error.response.status === 401) {
      console.warn("token expirado ou invalido. ejetando usuario da sessao...");
      
      // limpa a sessao
      localStorage.removeItem('@DesafioDoDia:token');
      
      // ejeta para a tela de login apenas se ja nao estiver la (evita loop infinito)
      if (window.location.pathname !== '/login' && window.location.pathname !== '/') {
        window.location.href = '/login';
      }
    }
    
    // repassa o erro para o catch() do componente poder exibir um alerta especifico se necessario
    return Promise.reject(error);
  }
);