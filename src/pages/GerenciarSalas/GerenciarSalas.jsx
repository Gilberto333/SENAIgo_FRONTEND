import React, { useState } from 'react';
import { useSalasAdmin } from '../../hooks/useSalasAdmin';
import { useEvento } from '../../context/EventoContext';
import { useAuth } from '../../hooks/useAuth';
import Header from '../../components/Header/Header';
import AdminTabs from '../../components/AdminTabs/AdminTabs';
import Card from '../../components/Card/Card';
import Button from '../../components/Button/Button';
import Input from '../../components/Input/Input';
import Modal from '../../components/Modal/Modal';
import Alert from '../../components/Alert/Alert';
import ConfirmModal from '../../components/ConfirmModal/ConfirmModal';
import SalaFormModal from '../../components/SalaFormModal/SalaFormModal';
import QrCodeModal from '../../components/QrCodeModal/QrCodeModal';
import { getSalaIcon } from '../../constants/salaIcons';
import { Plus, Pencil, Trash2, QrCode, RefreshCw, CalendarPlus } from 'lucide-react';
import styles from '../GerenciarLoja/GerenciarLoja.module.css';

const GerenciarSalas = () => {
  const auth = useAuth();
  const {
    meusEventos,
    eventoAtivoId,
    selecionarEvento,
    criarNovoEvento,
    excluirEvento,
  } = useEvento();
  const { salas, loading, error, recarregar, cadastrar, atualizar, remover } = useSalasAdmin();

  const [formAberto, setFormAberto] = useState(false);
  const [salaEmEdicao, setSalaEmEdicao] = useState(null);
  const [salaParaRemover, setSalaParaRemover] = useState(null);
  const [salaDoQr, setSalaDoQr] = useState(null);
  const [removendo, setRemovendo] = useState(false);

  // Estados para criar e excluir evento
  const [modalEventoAberto, setModalEventoAberto] = useState(false);
  const [tituloNovoEvento, setTituloNovoEvento] = useState('');
  const [descricaoNovoEvento, setDescricaoNovoEvento] = useState('');
  const [criandoEvento, setCriandoEvento] = useState(false);
  const [erroModalEvento, setErroModalEvento] = useState('');

  const [confirmarExcluirEvento, setConfirmarExcluirEvento] = useState(false);
  const [excluindoEvento, setExcluindoEvento] = useState(false);

  const [feedback, setFeedback] = useState(null);

  const usuario = auth?.perfil || auth?.usuario || auth?.user || null;
  const eventoSelecionado =
    (meusEventos || []).find((ev) => String(ev.id) === String(eventoAtivoId)) || null;

  const isAdmin =
    Boolean(auth?.isAdmin) ||
    usuario?.admin === true ||
    usuario?.role === 'admin' ||
    usuario?.tipo === 'admin' ||
    usuario?.is_admin === true ||
    usuario?.email?.toLowerCase() === 'admin@senaigo.com';

  const podeExcluirEventoAtivo = Boolean(
    eventoSelecionado &&
      (Boolean(eventoSelecionado.sou_criador) ||
        (usuario?.id && String(eventoSelecionado.criador_id) === String(usuario.id)))
  );

  const abrirNova = () => {
    setSalaEmEdicao(null);
    setFormAberto(true);
  };

  const abrirEdicao = (sala) => {
    setSalaEmEdicao(sala);
    setFormAberto(true);
  };

  const handleSalvar = async (dados) => {
    const resposta = salaEmEdicao
      ? await atualizar(salaEmEdicao.salaId, dados)
      : await cadastrar(dados);

    setFeedback({
      variant: 'success',
      message: resposta?.sucesso || resposta?.mensagem || 'Sala salva com sucesso!',
    });
    setFormAberto(false);
    setSalaEmEdicao(null);
  };

  const handleRemover = async () => {
    if (!salaParaRemover) return;
    setRemovendo(true);
    try {
      const resposta = await remover(salaParaRemover.salaId);
      setFeedback({
        variant: 'success',
        message: resposta?.sucesso || resposta?.mensagem || 'Sala removida com sucesso!',
      });
    } catch (err) {
      setFeedback({
        variant: 'error',
        message: err?.response?.data?.erro || err?.message || 'Erro ao remover sala.',
      });
    } finally {
      setRemovendo(false);
      setSalaParaRemover(null);
    }
  };

  const handleCriarEvento = async (e) => {
    e.preventDefault();
    if (!tituloNovoEvento.trim()) {
      setErroModalEvento('Informe o título do evento.');
      return;
    }

    setCriandoEvento(true);
    setErroModalEvento('');
    setFeedback(null);

    try {
      const criado = await criarNovoEvento(
        tituloNovoEvento.trim(),
        descricaoNovoEvento.trim()
      );
      if (criado?.id) {
        selecionarEvento(criado.id);
      }
      setTituloNovoEvento('');
      setDescricaoNovoEvento('');
      setModalEventoAberto(false);
      setFeedback({
        variant: 'success',
        message: `Evento "${criado?.titulo || tituloNovoEvento.trim()}" criado! Agora você já pode cadastrar as salas dele.`,
      });
    } catch (err) {
      setErroModalEvento(
        err?.response?.data?.erro ||
          err?.response?.data?.mensagem ||
          err?.message ||
          'Não foi possível criar o evento.'
      );
    } finally {
      setCriandoEvento(false);
    }
  };

  const handleExcluirEvento = async () => {
    if (!eventoAtivoId || !excluirEvento) return;
    setExcluindoEvento(true);
    setFeedback(null);
    try {
      await excluirEvento(eventoAtivoId);
      setFeedback({
        variant: 'success',
        message: 'Evento excluído com sucesso.',
      });
    } catch (err) {
      setFeedback({
        variant: 'error',
        message:
          err?.response?.data?.erro ||
          err?.response?.data?.mensagem ||
          err?.message ||
          'Não foi possível excluir o evento.',
      });
    } finally {
      setExcluindoEvento(false);
      setConfirmarExcluirEvento(false);
    }
  };

  return (
    <div className={styles.pageContainer}>
      <Header />
      <main className={styles.mainContent}>
        <AdminTabs />

        <div className={styles.titleRow}>
          <div>
            <h2>Gerenciar Eventos e Salas</h2>
            <p>Crie ou selecione um evento para cadastrar áreas e gerar seus QR Codes exclusivos.</p>
          </div>
          <div className={styles.actions}>
            {isAdmin && (
              <Button
                variant="outline"
                icon={CalendarPlus}
                onClick={() => {
                  setFeedback(null);
                  setErroModalEvento('');
                  setModalEventoAberto(true);
                }}
              >
                Novo evento
              </Button>
            )}
            {podeExcluirEventoAtivo && (
              <Button
                variant="danger"
                icon={Trash2}
                onClick={() => {
                  setFeedback(null);
                  setConfirmarExcluirEvento(true);
                }}
              >
                Excluir evento
              </Button>
            )}
            <Button icon={Plus} onClick={abrirNova} disabled={!eventoAtivoId}>
              Nova sala
            </Button>
          </div>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label
            htmlFor="seletor-evento-admin"
            style={{ display: 'block', marginBottom: '0.35rem', fontWeight: 600 }}
          >
            Evento selecionado:
          </label>
          <select
            id="seletor-evento-admin"
            value={eventoAtivoId || ''}
            onChange={(e) => {
              setFeedback(null);
              selecionarEvento(e.target.value);
            }}
            style={{ width: '100%', padding: '0.6rem', borderRadius: '8px' }}
          >
            <option value="" disabled>
              -- Selecione um evento --
            </option>
            {(meusEventos || []).map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.titulo || ev.nome} {ev.codigo_convite ? `(${ev.codigo_convite})` : ''}
              </option>
            ))}
          </select>
        </div>

        {!eventoAtivoId && (
          <Alert variant="warning">
            Clique em &quot;Novo evento&quot; ou selecione um evento acima para cadastrar salas.
          </Alert>
        )}

        {feedback && <Alert variant={feedback.variant}>{feedback.message}</Alert>}
        {loading && eventoAtivoId && <Alert variant="info">Carregando salas do evento...</Alert>}
        {error && (
          <div className={styles.errorBox}>
            <Alert variant="error">{error}</Alert>
            <Button variant="outline" icon={RefreshCw} onClick={() => recarregar()}>
              Tentar novamente
            </Button>
          </div>
        )}
        {!loading && !error && eventoAtivoId && salas.length === 0 && (
          <Alert variant="info">
            Nenhuma sala cadastrada neste evento ainda. Clique em &quot;Nova sala&quot;.
          </Alert>
        )}

        <ul className={styles.list}>
          {salas.map((sala) => {
            const Icon = getSalaIcon(sala.icone);
            return (
              <li key={sala.salaId}>
                <Card className={styles.row}>
                  <Icon size={30} />
                  <div className={styles.info}>
                    <strong>
                      {sala.sala}
                      {!sala.ativa && ' (desativada)'}
                    </strong>
                    <small>
                      {sala.pontos} pontos · {sala.descricao || 'Sem descrição'}
                      {sala.qr_token ? ` · Token: ${sala.qr_token}` : ''}
                    </small>
                  </div>
                  <div className={styles.actions}>
                    <Button variant="outline" icon={QrCode} onClick={() => setSalaDoQr(sala)}>
                      QR Code
                    </Button>
                    <Button variant="outline" icon={Pencil} onClick={() => abrirEdicao(sala)}>
                      Editar
                    </Button>
                    <Button
                      variant="danger"
                      icon={Trash2}
                      onClick={() => {
                        setFeedback(null);
                        setSalaParaRemover(sala);
                      }}
                    >
                      Remover
                    </Button>
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      </main>

      {/* Modal para criar novo evento */}
      <Modal
        isOpen={modalEventoAberto}
        onClose={() => {
          if (!criandoEvento) setModalEventoAberto(false);
        }}
        title="Novo evento"
      >
        <form onSubmit={handleCriarEvento} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Input
            id="evento-titulo"
            label="Título do evento"
            placeholder="Ex.: Semana da Indústria 2026"
            value={tituloNovoEvento}
            onChange={(e) => {
              setTituloNovoEvento(e.target.value);
              setErroModalEvento('');
            }}
            required
          />
          <Input
            id="evento-descricao"
            label="Descrição (opcional)"
            placeholder="Ex.: Circuito de inovação e robótica"
            value={descricaoNovoEvento}
            onChange={(e) => setDescricaoNovoEvento(e.target.value)}
            maxLength={160}
          />
          {erroModalEvento && <Alert variant="error">{erroModalEvento}</Alert>}
          <div className={styles.actions}>
            <Button
              type="button"
              variant="outline"
              disabled={criandoEvento}
              onClick={() => setModalEventoAberto(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" loading={criandoEvento}>
              Criar evento
            </Button>
          </div>
        </form>
      </Modal>

      <SalaFormModal
        isOpen={formAberto}
        sala={salaEmEdicao}
        onSubmit={handleSalvar}
        onClose={() => {
          setFormAberto(false);
          setSalaEmEdicao(null);
        }}
      />
      <QrCodeModal sala={salaDoQr} onClose={() => setSalaDoQr(null)} />

      <ConfirmModal
        isOpen={Boolean(salaParaRemover)}
        title="Remover sala"
        confirmLabel="Remover"
        variant="danger"
        loading={removendo}
        onConfirm={handleRemover}
        onCancel={() => {
          if (!removendo) setSalaParaRemover(null);
        }}
      >
        {salaParaRemover && (
          <>
            Tem certeza que deseja remover <strong>{salaParaRemover.sala}</strong>? Salas que já têm
            visitas não podem ser removidas, apenas desativadas.
          </>
        )}
      </ConfirmModal>

      <ConfirmModal
        isOpen={confirmarExcluirEvento}
        title="Excluir evento"
        confirmLabel="Excluir evento"
        variant="danger"
        loading={excluindoEvento}
        onConfirm={handleExcluirEvento}
        onCancel={() => {
          if (!excluindoEvento) setConfirmarExcluirEvento(false);
        }}
      >
        {eventoSelecionado && (
          <>
            Tem certeza que deseja excluir o evento{' '}
            <strong>{eventoSelecionado.titulo || eventoSelecionado.nome}</strong>? Essa ação remove
            o evento, suas salas, visitas e participantes.
          </>
        )}
      </ConfirmModal>
    </div>
  );
};

export default GerenciarSalas;