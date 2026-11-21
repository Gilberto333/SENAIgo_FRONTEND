import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEvento } from '../../context/EventoContext';
import BottomNav from '../../components/BottomNav/BottomNav';
import styles from './Eventos.module.css';

const getErroMsg = (err, fallback) =>
  err?.response?.data?.erro ||
  err?.response?.data?.mensagem ||
  err?.message ||
  fallback;

const Eventos = () => {
  const navigate = useNavigate();
  const {
    meusEventos,
    eventoAtivoId,
    selecionarEvento,
    entrarNoEvento,
    sairDoEvento,
    carregando,
  } = useEvento();

  const [codigoConvite, setCodigoConvite] = useState('');
  const [mensagem, setMensagem] = useState({ tipo: '', texto: '' });
  const [enviando, setEnviando] = useState(false);
  const [saindoId, setSaindoId] = useState(null);

  const handleEntrar = async (e) => {
    e.preventDefault();
    if (!codigoConvite.trim()) return;

    setMensagem({ tipo: '', texto: '' });
    setEnviando(true);

    try {
      await entrarNoEvento(codigoConvite.trim());
      setCodigoConvite('');
      setMensagem({ tipo: 'sucesso', texto: 'Você entrou no evento com sucesso!' });
    } catch (err) {
      setMensagem({
        tipo: 'erro',
        texto: getErroMsg(err, 'Não foi possível entrar no evento.'),
      });
    } finally {
      setEnviando(false);
    }
  };

  const handleSelecionar = (evento) => {
    selecionarEvento(evento.id);
    navigate('/home');
  };

  const handleSair = async (eventoId) => {
    if (!sairDoEvento || saindoId) return;

    setMensagem({ tipo: '', texto: '' });
    setSaindoId(eventoId);

    try {
      await sairDoEvento(eventoId);
      setMensagem({ tipo: 'sucesso', texto: 'Você saiu do evento.' });
    } catch (err) {
      setMensagem({
        tipo: 'erro',
        texto: getErroMsg(err, 'Não foi possível sair do evento.'),
      });
    } finally {
      setSaindoId(null);
    }
  };

  return (
    <>
      <div className={styles.container}>
        <header className={styles.header}>
          <h1 className={styles.titulo}>Eventos</h1>
          <p className={styles.subtitulo}>
            Selecione um evento ativo ou entre com um código de convite.
          </p>
        </header>

        {mensagem.texto && (
          <div
            className={
              mensagem.tipo === 'erro' ? styles.alertaErro : styles.alertaSucesso
            }
          >
            {mensagem.texto}
          </div>
        )}

        <section className={styles.card}>
          <h2 className={styles.cardTitulo}>Entrar com código de convite</h2>
          <form onSubmit={handleEntrar} className={styles.formLinha}>
            <input
              type="text"
              placeholder="Ex: SENAI26"
              value={codigoConvite}
              onChange={(e) => setCodigoConvite(e.target.value.toUpperCase())}
              className={`${styles.input} ${styles.inputCodigo}`}
              maxLength={20}
              required
            />
            <button
              type="submit"
              disabled={enviando || !codigoConvite.trim()}
              className={styles.botaoPrimario}
            >
              {enviando ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </section>

        <section className={styles.card}>
          <h2 className={styles.cardTitulo}>Meus eventos</h2>

          {carregando ? (
            <p className={styles.estadoVazio}>Carregando eventos...</p>
          ) : meusEventos?.length > 0 ? (
            <div className={styles.listaEventos}>
              {meusEventos.map((ev) => {
                const ativo = String(eventoAtivoId) === String(ev.id);
                const titulo = ev.titulo || ev.nome || 'Evento sem título';
                const saindoEste = String(saindoId) === String(ev.id);

                return (
                  <div
                    key={ev.id}
                    className={`${styles.itemEvento} ${
                      ativo ? styles.itemEventoAtivo : ''
                    }`}
                  >
                    <div className={styles.eventoInfo}>
                      <span className={styles.eventoNome}>{titulo}</span>
                      {ev.codigo_convite && (
                        <span className={styles.eventoCodigo}>
                          Código:{' '}
                          <span className={styles.badgeCodigo}>
                            {ev.codigo_convite}
                          </span>
                        </span>
                      )}
                      {ev.descricao && (
                        <p className={styles.eventoDescricao}>{ev.descricao}</p>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={() => handleSelecionar(ev)}
                        className={`${styles.botaoSelecionar} ${
                          ativo ? styles.botaoAtivo : ''
                        }`}
                      >
                        {ativo ? 'Evento Ativo' : 'Selecionar'}
                      </button>

                      <button
                        type="button"
                        disabled={saindoEste}
                        onClick={() => handleSair(ev.id)}
                        className={styles.botaoSecundario}
                      >
                        {saindoEste ? 'Saindo...' : 'Sair'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className={styles.estadoVazio}>
              Você ainda não participa de nenhum evento.
            </p>
          )}
        </section>
      </div>

      <BottomNav />
    </>
  );
};

export default Eventos;