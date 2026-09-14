import { api } from './api';

export const teacherService = {
  //busca a lista de desafios de uma turma
  getClassroomChallenges: async (classroomId) => {
    try {
      const response = await api.get(`/challenges/classroom/${classroomId}`);
      return response.data;
    } catch (error) {
      console.error("Erro ao buscar desafios da turma:", error);
      throw error;
    }
  },

  //busca as submissões dos alunos de um desafio específico
  getChallengeSubmissions: async (challengeId) => {
    try {
      const response = await api.get(`/challenges/${challengeId}/submissions`);
      return response.data;
    } catch (error) {
      console.error("Erro ao buscar submissões:", error);
      throw error;
    }
  }
};