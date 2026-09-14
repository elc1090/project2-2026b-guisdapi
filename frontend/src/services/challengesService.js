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
  }
};