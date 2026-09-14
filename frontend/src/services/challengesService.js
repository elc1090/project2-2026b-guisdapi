import { api } from './api';

export const challengesService = {
  // busca a pergunta ativa do dia para uma turma especifica
  getDailyChallenge: async (classroomId) => {
    try {
      // essa rota bate com aquele GET /challenges/{classroom_id}/active que fizemos no Python!
      const response = await api.get(`/challenges/today`);
      return response.data;
    } catch (error) {
      console.error("Erro ao buscar desafio do dia:", error);
      throw error;
    }
  },
  
  // depois vamos adicionar aqui a funcao de enviar a resposta...
};