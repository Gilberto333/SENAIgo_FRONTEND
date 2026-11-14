import api from './api';

export const registrarVisita = ({ salaId }) =>
  api.post('/registrarLocal', { salaId }).then(({ data }) => data);

export const listarVisitas = () => api.get('/locais').then(({ data }) => data);

export const avaliarVisita = ({ visitaId, estrelas, comentario }) =>
  api.patch(`/visitas/${visitaId}/avaliacao`, { estrelas, comentario }).then(({ data }) => data);