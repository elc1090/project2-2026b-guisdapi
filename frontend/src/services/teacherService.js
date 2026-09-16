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
  },

  // edita o nome de uma turma existente
  updateClassroom: async (classroomId, newName) => {
    try {
      const response = await api.put(`/classrooms/${classroomId}`, { name: newName });
      return response.data;
    } catch (error) {
      console.error("erro ao atualizar turma:", error);
      throw error;
    }
  },

  // exclui a turma e todas as dependencias (cascade)
  deleteClassroom: async (classroomId) => {
    try {
      const response = await api.delete(`/classrooms/${classroomId}`);
      return response.data;
    } catch (error) {
      console.error("erro ao deletar turma:", error);
      throw error;
    }
  },

  // edita um desafio existente
  updateChallenge: async (challengeId, challengeData) => {
    try {
      const response = await api.put(`/challenges/${challengeId}`, challengeData);
      return response.data;
    } catch (error) {
      console.error("Erro ao atualizar desafio:", error);
      throw error;
    }
  },

  // deleta um desafio e as respostas vinculadas
  deleteChallenge: async (challengeId) => {
    try {
      const response = await api.delete(`/challenges/${challengeId}`);
      return response.data;
    } catch (error) {
      console.error("Erro ao deletar desafio:", error);
      throw error;
    }
  },
};