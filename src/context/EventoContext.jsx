import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { eventoService } from '../services/eventoService';
import { getToken } from '../utils/storage';

const EventoContext = createContext({});
const STORAGE_KEY = 'senaigo_evento_ativo_id';

export function EventoProvider({ children }) {
  const [meusEventos, setMeusEventos] = useState([]);
  const [eventoAtivoId, setEventoAtivoId] = useState(() => localStorage.getItem(STORAGE_KEY));
  const [dadosHome, setDadosHome] = useState(null);
  const [carregando, setCarregando] = useState(false);

  const eventoAtivoRef = useRef(eventoAtivoId);
  eventoAtivoRef.current = eventoAtivoId;

  const selecionarEvento = useCallback((id) => {
    const normalizado = id ? String(id) : null;
    eventoAtivoRef.current = normalizado;
    setEventoAtivoId(normalizado);

    if (normalizado) {
      localStorage.setItem(STORAGE_KEY, normalizado);
    } else {
      localStorage.removeItem(STORAGE_KEY);
      setDadosHome(null);
    }
  }, []);

  const carregarMeusEventos = useCallback(async () => {
    if (!getToken()) {
      setMeusEventos([]);
      selecionarEvento(null);
      return;
    }

    try {
      const lista = await eventoService.listarMeusEventos();
      const eventosArray = Array.isArray(lista) ? lista : [];
      setMeusEventos(eventosArray);

      const atualId = eventoAtivoRef.current;

      if (eventosArray.length === 0) {
        selecionarEvento(null);
      } else if (!atualId || !eventosArray.some((e) => String(e.id) === String(atualId))) {
        selecionarEvento(eventosArray[0].id);
      }
    } catch {
      setMeusEventos([]);
    }
  }, [selecionarEvento]);

  const carregarHome = useCallback(async () => {
    if (!getToken() || !eventoAtivoId) {
      setDadosHome(null);
      return;
    }

    setCarregando(true);
    try {
      const dados = await eventoService.buscarHomeEvento(eventoAtivoId);
      setDadosHome(dados);
    } catch {
      setDadosHome(null);
    } finally {
      setCarregando(false);
    }
  }, [eventoAtivoId]);

  const entrarNoEvento = async (codigoConvite) => {
    const resposta = await eventoService.entrarPorCodigo(codigoConvite);
    await carregarMeusEventos();
    if (resposta?.evento?.id) {
      selecionarEvento(resposta.evento.id);
    }
    return resposta?.evento;
  };

  const criarNovoEvento = async (titulo, descricao) => {
    const novoEvento = await eventoService.criarEvento({ titulo, descricao });
    await carregarMeusEventos();
    if (novoEvento?.id) {
      selecionarEvento(novoEvento.id);
    }
    return novoEvento;
  };

  const sairDoEvento = async (eventoId) => {
    if (!eventoId) return;

    await eventoService.sairDoEvento(eventoId);

    if (String(eventoAtivoRef.current) === String(eventoId)) {
      selecionarEvento(null);
    }

    await carregarMeusEventos();
  };

  const excluirEvento = async (eventoId) => {
    if (!eventoId) return;

    await eventoService.excluirEvento(eventoId);

    if (String(eventoAtivoRef.current) === String(eventoId)) {
      selecionarEvento(null);
    }

    await carregarMeusEventos();
  };

  useEffect(() => {
    carregarMeusEventos();
  }, [carregarMeusEventos]);

  useEffect(() => {
    carregarHome();
  }, [carregarHome]);

  return (
    <EventoContext.Provider
      value={{
        meusEventos,
        eventoAtivoId,
        dadosHome,
        carregando,
        selecionarEvento,
        entrarNoEvento,
        criarNovoEvento,
        sairDoEvento,
        excluirEvento,
        carregarMeusEventos,
        recarregarHome: carregarHome,
      }}
    >
      {children}
    </EventoContext.Provider>
  );
}

export const useEvento = () => useContext(EventoContext);