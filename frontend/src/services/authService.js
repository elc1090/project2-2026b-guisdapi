import { api } from './api';

export const authService = {
  // === LOGIN ===
  studentLogin: async (enrollment, pin) => {
    try {
      const response = await api.post('/auth/student-login', { matricula: enrollment, pin: pin });
      return response.data;
    } catch (error) { throw error; }
  },

  teacherLogin: async (email, password) => {
    try {
      const params = new URLSearchParams();
      params.append('username', email);
      params.append('password', password);
      const response = await api.post('/auth/login', params, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });
      return response.data;
    } catch (error) { throw error; }
  },

  // === CADASTRO ===
  registerStudent: async (name, enrollment, classroomCode, pin) => {
    try {
      // O payload casa exatamente com o StudentCreate do Pydantic no backend
      const response = await api.post('/students/', {
        name: name,
        matricula: enrollment,
        classroom_code: classroomCode,
        pin: pin
      });
      return response.data;
    } catch (error) {
      console.error("Erro no cadastro do aluno:", error);
      throw error;
    }
  },

  registerTeacher: async (name, email, password) => {
    try {
      // O payload casa exatamente com o TeacherCreate do backend
      const response = await api.post('/teachers/', {
        name: name,
        email: email,
        password: password
      });
      return response.data;
    } catch (error) {
      console.error("Erro no cadastro do professor:", error);
      throw error;
    }
  }
};