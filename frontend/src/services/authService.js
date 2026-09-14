import { api } from './api';

export const authService = {
  // login do aluno: FastAPI espera um JSON com 'matricula' e 'pin'
  studentLogin: async (enrollment, pin) => {
    try {
      const response = await api.post('/auth/student-login', {
        matricula: enrollment, // nome exato que o backend Python espera
        pin: pin               // nome exato que o backend Python espera
      });
      return response.data;
    } catch (error) {
      console.error("erro no login do aluno:", error);
      throw error;
    }
  },

  // login do professor: FastAPI espera um FORMULARIO na rota /auth/login
  teacherLogin: async (email, password) => {
    try {
      const params = new URLSearchParams();
      params.append('username', email); // oauth2 exige o nome 'username'
      params.append('password', password);

      // corrigida a URL para bater com o router do FastAPI
      const response = await api.post('/auth/login', params); 
      return response.data;
    } catch (error) {
      console.error("erro no login do professor:", error);
      throw error;
    }
  }
};