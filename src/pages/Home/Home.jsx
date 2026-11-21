import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, RefreshCw, Route, LayoutList, Calendar } from 'lucide-react';
import { useProgresso } from '../../hooks/useProgresso';
import { useEvento } from '../../context/EventoContext';
import { eventoService } from '../../services/eventoService';
import { parseQrPayload } from '../../utils/qrCode';
import Header from '../../components/Header/Header';
import BottomNav from '../../components/BottomNav/BottomNav';
import Alert from '../../components/Alert/Alert';
import QrScanner from '../../components/QrScanner/QrScanner';
import Modal from '../../components/Modal/Modal';
import ProgressBar from '../../components/ProgressBar/ProgressBar';
import Button from '../../components/Button/Button';
import TrilhaDuolingo from '../../components/TrilhaDuolingo/TrilhaDuolingo';
import ListaSalasMimo from '../../components/ListaSalasMimo/ListaSalasMimo';
import styles from './Home.module.css';

const CLOSE_DELAY_MS = 1400;
const VIEW_STORAGE_KEY = 'senaigo_home_view';

function normalizarSala(item) {
  const idNormalizado = item.salaId ?? item.id;
  return {
    ...item,
    id: idNormalizado,
    salaId: idNormalizado,
    sala: item.sala ?? item.nome ?? 'Área sem nome',
    pontos: Number(item.pontos ?? 0),
    concluida: Boolean(item.concluida),
  };
}

function extrairTokenQrBruto(text, payload) {
  if (typeof text === 'string' && text.trim().startsWith('{')) {
    try {
      const parsed = JSON.parse(text.trim());
      if (parsed.qr_token || parsed.qrToken || parsed.token) {
        return String(parsed.qr_token || parsed.qrToken || parsed.token).trim();
      }
    } catch {
      // ignora erro de parse e segue com o texto puro
    }
  }

  if (payload && typeof payload === 'object') {
    const tokenNoPayload = payload.qr_token || payload.qrToken || payload.token;
    if (tokenNoPayload) return String(tokenNoPayload).trim();
  }

  return typeof text === 'string' ? text.trim() : '';
}

const Home = () => {
  const navigate = useNavigate();
  const { registrarVisita } = useProgresso();
  const {
    meusEventos,
    eventoAtivoId,
    dadosHome,
    carregando: carregandoEventos,
    recarregarHome,
    carregarMeusEventos,
  } = useEvento();

  const [viewMode, setViewMode] = useState(
    () => localStorage.getItem(VIEW_STORAGE_KEY) || 'trilha'
  );
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [detectedSala, setDetectedSala] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [erroHome, setErroHome] = useState(null);

  const [quizSala, setQuizSala] = useState(null);
  const [opcaoEscolhida, setOpcaoEscolhida] = useState(null);
  const [enviandoQuiz, setEnviandoQuiz] = useState(false);

  const closeTimer = useRef(null);

  useEffect(() => () => clearTimeout(closeTimer.current), []);

  const semEventos = !carregandoEventos && (!meusEventos || meusEventos.length === 0);

  const salas = useMemo(() => {
    const bruta = Array.isArray(dadosHome?.salas) ? dadosHome.salas : [];
    return bruta.map(normalizarSala);
  }, [dadosHome]);

  const visitedRooms = useMemo(
    () => salas.filter((s) => s.concluida).map((s) => s.salaId),
    [salas]
  );

  const recarregarTudoDoEvento = useCallback(async () => {
    setErroHome(null);
    try {
      await Promise.all([recarregarHome(), carregarMeusEventos()]);
    } catch {
      setErroHome('Não foi possível atualizar os dados deste evento.');
    }
  }, [recarregarHome, carregarMeusEventos]);

  const handleChangeView = (mode) => {
    setViewMode(mode);
    localStorage.setItem(VIEW_STORAGE_KEY, mode);
  };

  const abrirScanner = useCallback((sala = null) => {
    clearTimeout(closeTimer.current);
    setFeedback(null);
    setSelectedRoom(sala);
    setDetectedSala(null);
    setQuizSala(null);
    setOpcaoEscolhida(null);
    setIsScannerOpen(true);
  }, []);

  const handleOpenGlobalScanner = () => abrirScanner(null);

  const handleOpenRoomScanner = (sala) => {
    if (visitedRooms.includes(sala.salaId)) return;
    abrirScanner(sala);
  };

  const handleCloseScanner = useCallback(() => {
    clearTimeout(closeTimer.current);
    setIsScannerOpen(false);
    setSelectedRoom(null);
    setDetectedSala(null);
    setQuizSala(null);
    setOpcaoEscolhida(null);
    setFeedback(null);
  }, []);

  const registrarScanNoEvento = async (sala, qrTokenLido) => {
    setFeedback({
      variant: 'info',
      message: `Área identificada: ${sala.sala}! Registrando sua visita no evento...`,
    });

    try {
      const resposta = await eventoService.escanearQrCode(eventoAtivoId, qrTokenLido);
      await recarregarTudoDoEvento();

      setFeedback({
        variant: 'success',
        message:
          resposta?.mensagem ||
          `Área "${sala.sala}" concluída! +${sala.pontos} pontos.`,
      });

      closeTimer.current = setTimeout(() => {
        handleCloseScanner();
      }, CLOSE_DELAY_MS);
    } catch (err) {
      const msg =
        err?.response?.data?.erro ||
        err?.response?.data?.mensagem ||
        err?.message ||
        'Não foi possível validar o QR Code neste evento.';
      setFeedback({ variant: 'error', message: msg });
    }
  };

  const concluirRegistroVisita = async (sala, resposta = undefined) => {
    setFeedback({
      variant: 'info',
      message: `Área identificada: ${sala.sala}! Registrando sua visita...`,
    });

    try {
      const { visitaId } = await registrarVisita({ salaId: sala.salaId, resposta });
      await recarregarTudoDoEvento();

      setFeedback({
        variant: 'success',
        message: `Área "${sala.sala}" concluída! +${sala.pontos} pontos.`,
      });

      closeTimer.current = setTimeout(() => {
        if (visitaId) {
          navigate(`/avaliar-visita/${visitaId}`, { state: { salaNome: sala.sala } });
        } else {
          handleCloseScanner();
        }
      }, CLOSE_DELAY_MS);
    } catch (err) {
      setFeedback({ variant: 'error', message: err.message });
    }
  };

  const handleDetect = async (text) => {
    if (quizSala || detectedSala || !eventoAtivoId) return;

    const payload = parseQrPayload(text);
    const tokenLido = extrairTokenQrBruto(text, payload);

    const sala =
      salas.find((item) => item.qr_token && item.qr_token === tokenLido) ||
      salas.find(
        (item) =>
          payload?.id !== undefined &&
          payload?.id !== null &&
          String(item.salaId) === String(payload.id)
      );

    if (!sala) {
      setFeedback({
        variant: 'warning',
        message: 'Este QR Code não pertence a nenhuma área do evento selecionado.',
      });
      return;
    }

    if (selectedRoom && String(sala.salaId) !== String(selectedRoom.salaId)) {
      setFeedback({
        variant: 'warning',
        message: `Você leu o QR Code de "${sala.sala}", mas selecionou "${selectedRoom.sala}".`,
      });
      return;
    }

    if (visitedRooms.includes(sala.salaId)) {
      setFeedback({
        variant: 'warning',
        message: `QR Code lido: "${sala.sala}". Você já concluiu esta área neste evento!`,
      });
      return;
    }

    setDetectedSala(sala);

    const ehModoPalestra = Boolean(
      sala.modoPalestra && (sala.questao?.pergunta || sala.pergunta)
    );

    if (ehModoPalestra) {
      setFeedback({
        variant: 'info',
        message: `Área identificada: ${sala.sala}! Responda à pergunta para ganhar +${sala.pontos} pts.`,
      });
      setQuizSala(sala);
      return;
    }

    const tokenParaEnvio = sala.qr_token || tokenLido;
    if (tokenParaEnvio) {
      await registrarScanNoEvento(sala, tokenParaEnvio);
    } else {
      await concluirRegistroVisita(sala);
    }
  };

  const obterOpcoesQuiz = (sala) => {
    if (!sala) return [];
    if (sala.questao?.alternativas) {
      return Object.entries(sala.questao.alternativas).filter(([, texto]) => Boolean(texto));
    }
    return [
      ['A', sala.opcaoA],
      ['B', sala.opcaoB],
    ].filter(([, texto]) => Boolean(texto));
  };

  const handleResponderQuiz = async () => {
    if (!opcaoEscolhida || !quizSala || enviandoQuiz) return;

    setEnviandoQuiz(true);
    try {
      await concluirRegistroVisita(quizSala, opcaoEscolhida);
    } finally {
      setEnviandoQuiz(false);
    }
  };

  const modalTitle = quizSala
    ? `Quiz: ${quizSala.sala}`
    : selectedRoom
    ? `Escanear: ${selectedRoom.sala}`
    : detectedSala
    ? `Área: ${detectedSala.sala}`
    : 'Escanear QR Code';

  const tituloEvento = dadosHome?.evento?.titulo || dadosHome?.evento?.nome;

  return (
    <div className={styles.pageContainer}>
      <Header />

      <main className={styles.mainContent}>
        {semEventos ? (
          <section className={styles.unitHeader} style={{ textAlign: 'center' }}>
            <h2 className={styles.unitTitle}>Você não participa de nenhum evento ainda</h2>
            <p className={styles.unitSubtitle} style={{ marginBottom: '1.25rem' }}>
              Entre com um código de convite ou selecione um evento para começar a explorar as áreas.
            </p>
            <Button
              type="button"
              icon={Calendar}
              onClick={() => navigate('/eventos')}
            >
              Ir para Eventos
            </Button>
          </section>
        ) : (
          <>
            {carregandoEventos && (
              <Alert variant="info">Carregando áreas e progresso do evento...</Alert>
            )}

            {erroHome && (
              <div className={styles.syncAlert}>
                <Alert variant="warning">{erroHome}</Alert>
                <Button variant="outline" icon={RefreshCw} onClick={recarregarTudoDoEvento}>
                  Tentar novamente
                </Button>
              </div>
            )}

            <section className={styles.unitHeader}>
              <div className={styles.unitHeaderTop}>
                <span className={styles.unitTag}>
                  <Sparkles size={14} /> {tituloEvento ? tituloEvento.toUpperCase() : 'JORNADA DE GAMIFICAÇÃO'}
                </span>
                <span className={styles.unitCount}>
                  {visitedRooms.length}/{salas.length} concluídas
                </span>
              </div>
              <h2 className={styles.unitTitle}>Explore as Áreas e Ganhe Pontos</h2>
              <p className={styles.unitSubtitle}>
                Escaneie os QR Codes nos ambientes deste evento para acumular pontos.
              </p>
              <div className={styles.unitProgressWrapper}>
                <ProgressBar current={visitedRooms.length} total={salas.length} />
              </div>
            </section>

            <div className={styles.viewSwitcher} role="tablist" aria-label="Modo de exibição">
              <button
                type="button"
                role="tab"
                aria-selected={viewMode === 'trilha'}
                className={`${styles.switchBtn} ${viewMode === 'trilha' ? styles.switchBtnActive : ''}`}
                onClick={() => handleChangeView('trilha')}
              >
                <Route size={17} />
                Trilha
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={viewMode === 'lista'}
                className={`${styles.switchBtn} ${viewMode === 'lista' ? styles.switchBtnActive : ''}`}
                onClick={() => handleChangeView('lista')}
              >
                <LayoutList size={17} />
                Lista Rápida
              </button>
            </div>

            {salas.length === 0 && !carregandoEventos ? (
              <section className={styles.unitHeader} style={{ textAlign: 'center' }}>
                <h3 className={styles.unitTitle}>Nenhuma área cadastrada neste evento</h3>
                <p className={styles.unitSubtitle}>
                  Quando novas áreas forem adicionadas a este evento, elas aparecerão aqui.
                </p>
              </section>
            ) : viewMode === 'trilha' ? (
              <TrilhaDuolingo
                salas={salas}
                visitedRooms={visitedRooms}
                onOpenScanner={handleOpenRoomScanner}
              />
            ) : (
              <ListaSalasMimo
                salas={salas}
                visitedRooms={visitedRooms}
                onOpenGlobalScanner={handleOpenGlobalScanner}
              />
            )}
          </>
        )}
      </main>

      <BottomNav />

      <Modal
        isOpen={isScannerOpen}
        onClose={handleCloseScanner}
        title={modalTitle}
      >
        {isScannerOpen && !quizSala && (
          <div className={styles.scannerModalContent}>
            <p className={styles.scannerInstructions}>
              {selectedRoom ? (
                <>
                  Aponte a câmera para o QR Code da área <strong>{selectedRoom.sala}</strong>.
                </>
              ) : (
                <>
                  Aponte a câmera para o QR Code de uma área deste evento para registrá-la.
                </>
              )}
            </p>
            <QrScanner onDetect={handleDetect} />
            {feedback && <Alert variant={feedback.variant}>{feedback.message}</Alert>}
          </div>
        )}

        {quizSala && (
          <div className={styles.scannerModalContent}>
            <p className={styles.scannerInstructions}>
              <strong>{quizSala.questao?.pergunta || quizSala.pergunta}</strong>
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', margin: '1rem 0' }}>
              {obterOpcoesQuiz(quizSala).map(([letra, texto]) => (
                <Button
                  key={letra}
                  type="button"
                  variant={opcaoEscolhida === letra ? 'primary' : 'outline'}
                  fullWidth
                  disabled={enviandoQuiz}
                  onClick={() => {
                    setOpcaoEscolhida(letra);
                    setFeedback(null);
                  }}
                >
                  {letra}) {texto}
                </Button>
              ))}
            </div>

            {feedback && <Alert variant={feedback.variant}>{feedback.message}</Alert>}

            <Button
              type="button"
              fullWidth
              loading={enviandoQuiz}
              disabled={!opcaoEscolhida || enviandoQuiz}
              onClick={handleResponderQuiz}
            >
              Confirmar Resposta
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Home;