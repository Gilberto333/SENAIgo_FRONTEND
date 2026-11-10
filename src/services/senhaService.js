import api from './api';

export const esqueciSenha = async (email) => {
  const response = await api.post('/auth/esqueciSenha', { email }, { timeout: 20000 });
  return response.data;
};

export const redefinirSenha = async (email, codigo, novaSenha) => {
  const response = await api.post(
    '/auth/redefinirSenha',
    { email, codigo, novaSenha },
    { timeout: 20000 }
  );
  return response.data;
};