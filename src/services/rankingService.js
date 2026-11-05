import api from './api';

export const obterRanking = async () => {
  const { data } = await api.get('/ranking');
  return data.ranking;
};