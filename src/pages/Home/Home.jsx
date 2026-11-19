import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useProgresso } from '../../hooks/useProgresso';
import Header from '../../components/Header/Header';
import BottomNav from '../../components/BottomNav/BottomNav';
import { useNavigate } from 'react-router-dom';
import Alert from '../../components/Alert/Alert';
import QrScanner from '../../components/QrScanner/QrScanner';
import Modal from '../../components/Modal/Modal';
import ProgressBar from '../../components/ProgressBar/ProgressBar';
import { parseQrPayload } from '../../utils/qrCode';
import Button from '../../components/Button/Button';
import { Sparkles, RefreshCw, Route, LayoutList } from 'lucide-react';
import TrilhaDuolingo from '../../components/TrilhaDuolingo/TrilhaDuolingo';
import ListaSalasMimo from '../../components/ListaSalasMimo/ListaSalasMimo';
import styles from './Home.module.css';

const CLOSE_DELAY_MS = 1400;

const Home = () => {
  const { salas, visitedRooms, registrarVisita, loading, error, recarregar } = useProgresso();

  const [viewMode, setViewMode] = useState(() => {
    return localStorage.getItem('senaigo_home_view') || 'trilha';
  });

  const [selectedRoom, setSelectedRoom] = useState(null);
  const [feedback, setFeedback] = useState(null);

  // Estados para o Questionário do Modo Palestra
  const [quizSala, setQuizSala] = useState(null);
  const [opcaoEscolhida, setOpcaoEscolhida] = useState(null);
  const [enviandoQuiz, setEnviandoQuiz] = useState(false);

  const closeTimer = useRef(null);
  const navigate = useNavigate();

  useEffect(() => () => clearTimeout(closeTimer.current), []);

  const handleChangeView = (mode) => {
    setViewMode(mode);
    localStorage.setItem('senaigo_home_view', mode);
  };

  const handleOpenScanner = (sala) => {
    if (visitedRooms.includes(sala.salaId)) return;
    setFeedback(null);
    setQuizSala(null);
    setOpcaoEscolhida(null);
    setSelectedRoom(sala);
  };

  const handleCloseScanner = useCallback(() => {
    clearTimeout(closeTimer.current);
    setSelectedRoom(null);
    setQuizSala(null);
    setOpcaoEscolhida(null);
    setFeedback(null);
  }, []);

  const concluirRegistroVisita = async (sala, resposta = undefined) => {
    setFeedback({ variant: 'info', message: 'Registrando sua visita...' });
    try {
      const { visitaId } = await registrarVisita({ salaId: sala.salaId, resposta });
      setFeedback({ variant: 'success', message: `Visita registrada com sucesso! +${sala.pontos} pontos.` });
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
    if (quizSala) return;

    const payload = parseQrPayload(text);
    const salaId = payload?.id;
    const sala = salas.find((item) => Number(item.salaId) === Number(salaId));

    if (!sala) {
      setFeedback({ variant: 'warning', message: 'Este QR Code não pertence ao SENAIgo.' });
      return;
    }
    if (Number(sala.salaId) !== Number(selectedRoom.salaId)) {
      setFeedback({
        variant: 'warning',
        message: `Este QR Code é da área ${sala.sala}. Escaneie o QR Code de ${selectedRoom.sala}.`,
      });
      return;
    }

    const ehModoPalestra = Boolean(sala.modoPalestra && (sala.questao?.pergunta || sala.pergunta));

    if (ehModoPalestra) {
      setFeedback(null);
      setQuizSala(sala);
      return;
    }

    await concluirRegistroVisita(sala);
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

  return (
    <div className={styles.pageContainer}>
      <Header />
      <main className={styles.mainContent}>
        {loading && <Alert variant="info">Carregando suas áreas e seu progresso...</Alert>}
        {error && (
          <div className={styles.syncAlert}>
            <Alert variant="warning">{error}</Alert>
            <Button variant="outline" icon={RefreshCw} onClick={recarregar}>
              Tentar novamente
            </Button>
          </div>
        )}

        {/* Banner Superior */}
        <section className={styles.unitHeader}>
          <div className={styles.unitHeaderTop}>
            <span className={styles.unitTag}>
              <Sparkles size={14} /> JORNADA DE GAMIFICAÇÃO
            </span>
            <span className={styles.unitCount}>
              {visitedRooms.length}/{salas.length} concluídas
            </span>
          </div>
          <h2 className={styles.unitTitle}>Explore as Áreas e Ganhe Pontos</h2>
          <p className={styles.unitSubtitle}>
            Escaneie os QR Codes nos ambientes do SENAI para acumular pontos.
          </p>
          <div className={styles.unitProgressWrapper}>
            <ProgressBar current={visitedRooms.length} total={salas.length} />
          </div>
        </section>

        {/* Seletor de Visualização (Trilha vs Lista) */}
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

        {/* Renderização Condicional dos Dois Componentes */}
        {viewMode === 'trilha' ? (
          <TrilhaDuolingo
            salas={salas}
            visitedRooms={visitedRooms}
            onOpenScanner={handleOpenScanner}
          />
        ) : (
          <ListaSalasMimo
            salas={salas}
            visitedRooms={visitedRooms}
            onOpenScanner={handleOpenScanner}
          />
        )}
      </main>

      {/* Navegação Inferior Flutuante */}
      <BottomNav />

      {/* Modal do Scanner e Quiz */}
      <Modal
        isOpen={Boolean(selectedRoom)}
        onClose={handleCloseScanner}
        title={quizSala ? `Quiz: ${quizSala.sala}` : `Escanear: ${selectedRoom?.sala}`}
      >
        {selectedRoom && !quizSala && (
          <div className={styles.scannerModalContent}>
            <p className={styles.scannerInstructions}>
              Aponte a câmera do seu dispositivo para o QR Code localizado na área de{' '}
              <strong>{selectedRoom.sala}</strong>.
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