import { api } from './api';

export const teacherService = {

  // busca a lista de turmas vinculadas ao professor logado
  getClassrooms: async () => {
    try {
      const response = await api.get('/classrooms/');
      return response.data;
    } catch (error) {
      console.error("erro ao buscar turmas:", error);
      throw error;
    }
  },

  // cria uma nova turma para o professor logado
  createClassroom: async (name) => {
    try {
      const response = await api.post('/classrooms/', { name });
      return response.data;
    } catch (error) {
      console.error("Erro ao criar turma:", error);
      throw error;
    }
  },

  // cria um novo desafio vinculado a uma turma específica
  createChallenge: async (classroomId, challengeData) => {
    try {
      const response = await api.post(`/challenges/${classroomId}`, challengeData);
      return response.data;
    } catch (error) {
      console.error("Erro ao criar desafio:", error);
      throw error;
    }
  },

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