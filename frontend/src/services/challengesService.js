import { api } from './api';

export const challengesService = {
  getTodayChallenge: async () => {
    try {
      const response = await api.get('/challenges/today');
      return response.data;
    } catch (error) {
      console.error("erro ao buscar desafio de hoje:", error);
      throw error;
    }
  },

  submitAnswer: async (challengeId, optionText, reasoningText) => {
    try {
      const response = await api.post(`/submissions/${challengeId}`, {
        option_selected: optionText, // mandando a string da alternativa
        reasoning: reasoningText
      });
      return response.data;
    } catch (error) {
      console.error("erro ao enviar resposta:", error);
      throw error;
    }
  },

  getChallengeById: async (challengeId) => {
    try {
      const response = await api.get(`/challenges/${challengeId}/student`);
      return response.data;
    } catch (error) {
      console.error("erro ao buscar desafio especifico:", error);
      throw error;
    }
  },

};