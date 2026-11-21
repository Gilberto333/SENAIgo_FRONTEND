import api from './api';

export const eventoService = {
  async criarEvento(dados) {
    const { data } = await api.post('/eventos', dados);
    return data;
  },

  async entrarPorCodigo(codigoConvite) {
    const { data } = await api.post('/eventos/entrar', {
      codigo_convite: codigoConvite,
    });
    return data;
  },

  async listarMeusEventos() {
    const { data } = await api.get('/eventos/meus');
    return data;
  },

  async sairDoEvento(eventoId) {
    const { data } = await api.post(`/eventos/${eventoId}/sair`, {});
    return data;
  },

  async excluirEvento(eventoId) {
    const { data } = await api.delete(`/eventos/${eventoId}`);
    return data;
  },

  async listarSalas(eventoId) {
    const { data } = await api.get(`/eventos/${eventoId}/salas`);
    return data;
  },

  async adicionarSala(eventoId, dadosSala) {
    const { data } = await api.post(`/eventos/${eventoId}/salas`, dadosSala);
    return data;
  },

  async removerSala(eventoId, salaId) {
    const { data } = await api.delete(`/eventos/${eventoId}/salas/${salaId}`);
    return data;
  },

  async escanearQrCode(eventoId, qrToken) {
    const { data } = await api.post(`/eventos/${eventoId}/qrcode/escanear`, {
      qr_token: qrToken,
    });
    return data;
  },

  async buscarHomeEvento(eventoId) {
    const { data } = await api.get(`/eventos/${eventoId}/home`);
    return data;
  },
};