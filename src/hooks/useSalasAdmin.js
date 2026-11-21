import { useCallback, useEffect, useState } from 'react';
import * as salasService from '../services/salasService';
import { eventoService } from '../services/eventoService';
import { useEvento } from '../context/EventoContext';
import { useProgresso } from './useProgresso';

function normalizarListaSalas(lista) {
  return (Array.isArray(lista) ? lista : []).map((s) => ({
    ...s,
    salaId: s.salaId ?? s.id,
    sala: s.sala ?? s.nome ?? 'Área sem nome',
  }));
}

export const useSalasAdmin = (eventoIdOverride = null) => {
  const { recarregar: recarregarProgresso } = useProgresso();
  const { eventoAtivoId, recarregarHome } = useEvento();

  const eventoAlvoId = eventoIdOverride ?? eventoAtivoId ?? null;

  const [salas, setSalas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const carregar = useCallback(
    async ({ silencioso = false } = {}) => {
      if (!silencioso) setLoading(true);
      setError('');
      try {
        const dados = eventoAlvoId
          ? await eventoService.listarSalas(eventoAlvoId)
          : await salasService.listarTodasSalas();
        setSalas(normalizarListaSalas(dados));
      } catch (err) {
        setError(
          err?.response?.data?.erro ||
            err?.response?.data?.mensagem ||
            err?.message ||
            'Erro ao carregar salas.'
        );
      } finally {
        setLoading(false);
      }
    },
    [eventoAlvoId]
  );

  useEffect(() => {
    carregar();
  }, [carregar]);

  const executar = useCallback(
    async (operacao) => {
      const resultado = await operacao();
      await carregar({ silencioso: true });
      recarregarProgresso?.();
      await recarregarHome?.();
      return resultado;
    },
    [carregar, recarregarProgresso, recarregarHome]
  );

  const cadastrar = useCallback(
    (dados) =>
      executar(() =>
        eventoAlvoId
          ? eventoService.adicionarSala(eventoAlvoId, {
              ...dados,
              nome: dados.sala ?? dados.nome,
            })
          : salasService.cadastrarSala(dados)
      ),
    [executar, eventoAlvoId]
  );

  const atualizar = useCallback(
    (id, dados) =>
      executar(() =>
        salasService.atualizarSala(id, {
          ...dados,
          ...(eventoAlvoId ? { eventoId: eventoAlvoId } : {}),
        })
      ),
    [executar, eventoAlvoId]
  );

  const remover = useCallback(
    (id) =>
      executar(() =>
        eventoAlvoId
          ? eventoService.removerSala(eventoAlvoId, id)
          : salasService.removerSala(id)
      ),
    [executar, eventoAlvoId]
  );

  return {
    salas,
    loading,
    error,
    eventoAtivoId: eventoAlvoId,
    recarregar: carregar,
    cadastrar,
    atualizar,
    remover,
  };
};