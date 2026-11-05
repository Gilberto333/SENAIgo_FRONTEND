import { useCallback, useEffect, useState } from 'react';
import { obterRanking } from '../services/rankingService';

export const useRanking = () => {
  const [ranking, setRanking] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const carregar = useCallback(async ({ silencioso = false } = {}) => {
    if (!silencioso) setLoading(true);
    setError('');
    try {
      const dados = await obterRanking();
      setRanking(dados || []);
    } catch (err) {
      setError(err.message || 'Erro ao carregar o ranking.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  return { ranking, loading, error, recarregar: carregar };
};