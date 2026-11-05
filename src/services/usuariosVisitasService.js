import api from './api';

export const listarUsuarios = async () => {
  const { data } = await api.get('/admin/usuarios');
  return data.usuarios || data;
};

export const obterVisitasDoUsuario = async (usuarioId) => {
  const { data } = await api.get(`/admin/usuarios/${usuarioId}/visitas`);
  return data.visitas || data;
};