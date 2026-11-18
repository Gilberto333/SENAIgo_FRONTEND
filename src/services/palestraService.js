import api from './api';

// Busca a pergunta e alternativas A/B da palestra no banco
export const buscarQuizPalestra = async (palestraId) => {
  const { data } = await api.get(`/palestras/${palestraId}/quiz`);
  return data;
  // Formato esperado do seu backend:
  // { id: 1, pergunta: "...", opcaoA: "...", opcaoB: "...", respostaCorreta: "A" }
};

// Opcional: envia a resposta do usuário para registrar no banco
export const registrarRespostaPalestra = async (palestraId, resposta) => {
  const { data } = await api.post(`/palestras/${palestraId}/responder`, { resposta });
  return data;
};