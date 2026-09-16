import { api } from './api';

export const studentService = {
  // busca o top 10 alunos da turma do usuário logado
  getRanking: async () => {
    try {
      const response = await api.get('/students/ranking');
      return response.data;
    } catch (error) {
      console.error("Erro ao buscar ranking:", error);
      throw error;
    }
  },

    getTimeline: async () => {
    try {
      const response = await api.get('/students/me/timeline');
      return response.data;
    } catch (error) {
      console.error("Erro ao buscar timeline:", error);
      throw error;
    }
  }
};
