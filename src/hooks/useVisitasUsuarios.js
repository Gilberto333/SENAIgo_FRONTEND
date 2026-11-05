import { useCallback, useEffect, useState } from 'react';
import { listarUsuarios, obterVisitasDoUsuario } from '../services/usuariosVisitasService';

export const useVisitasUsuarios = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [usuarioSelecionado, setUsuarioSelecionado] = useState(null);
  const [visitas, setVisitas] = useState([]);
  const [loadingUsuarios, setLoadingUsuarios] = useState(true);
  const [loadingVisitas, setLoadingVisitas] = useState(false);
  const [error, setError] = useState('');
  const [erroVisitas, setErroVisitas] = useState('');

  const carregarUsuarios = useCallback(async () => {
    setLoadingUsuarios(true);
    setError('');
    try {
      const dados = await listarUsuarios();
      setUsuarios(dados || []);
    } catch (err) {
      setError(err.message || 'Erro ao carregar lista de usuários.');
    } finally {
      setLoadingUsuarios(false);
    }
  }, []);

  useEffect(() => {
    carregarUsuarios();
  }, [carregarUsuarios]);

  const selecionarUsuario = useCallback(async (usuario) => {
    setUsuarioSelecionado(usuario);
    setVisitas([]);
    setErroVisitas('');
    if (!usuario) return;

    setLoadingVisitas(true);
    try {
      const dadosVisitas = await obterVisitasDoUsuario(usuario.id);
      setVisitas(dadosVisitas || []);
    } catch (err) {
      setErroVisitas(err.message || 'Erro ao carregar visitas do usuário.');
    } finally {
      setLoadingVisitas(false);
    }
  }, []);

  return {
    usuarios,
    usuarioSelecionado,
    visitas,
    loadingUsuarios,
    loadingVisitas,
    error,
    erroVisitas,
    carregarUsuarios,
    selecionarUsuario,
  };
};