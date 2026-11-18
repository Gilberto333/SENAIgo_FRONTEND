import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useProgresso } from '../../hooks/useProgresso';
import Header from '../../components/Header/Header';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/Card/Card';
import Alert from '../../components/Alert/Alert';
import ScannerButton from '../../components/ScannerButton/ScannerButton';
import QrScanner from '../../components/QrScanner/QrScanner';
import Modal from '../../components/Modal/Modal';
import ProgressBar from '../../components/ProgressBar/ProgressBar';
import { getSalaIcon } from '../../constants/salaIcons';
import { parseQrPayload } from '../../utils/qrCode';
import Button from '../../components/Button/Button';
import { Sparkles, RefreshCw } from 'lucide-react';
import styles from './Home.module.css';

const CLOSE_DELAY_MS = 1400;

const Home = () => {
  const { salas, visitedRooms, registrarVisita, loading, error, recarregar } = useProgresso();
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [feedback, setFeedback] = useState(null);

  // Estados para o Questionário do Modo Palestra
  const [quizSala, setQuizSala] = useState(null);
  const [opcaoEscolhida, setOpcaoEscolhida] = useState(null);
  const [enviandoQuiz, setEnviandoQuiz] = useState(false);

  const closeTimer = useRef(null);
  const navigate = useNavigate();

  useEffect(() => () => clearTimeout(closeTimer.current), []);

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

  const concluirRegistroVisita = async (sala) => {
    setFeedback({ variant: 'info', message: 'Registrando sua visita...' });
    try {
      const { visitaId } = await registrarVisita({ salaId: sala.salaId });
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

  const handleResponderQuiz = async () => {
    if (!opcaoEscolhida || !quizSala || enviandoQuiz) return;

    setEnviandoQuiz(true);
    const respostaCerta = String(quizSala.questao?.correta || quizSala.respostaCorreta || '')
      .trim()
      .toUpperCase();

    if (opcaoEscolhida !== respostaCerta) {
      setFeedback({
        variant: 'error',
        message: 'Resposta incorreta! Tente novamente para validar sua participação na palestra.',
      });
      setEnviandoQuiz(false);
      return;
    }

    await concluirRegistroVisita(quizSala);
    setEnviandoQuiz(false);
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

  return (
    <div className={styles.pageContainer}>
      <Header />
      <main className={styles.mainContent}>
        {loading && <Alert variant="info">Carregando suas áreas e seu progresso...</Alert>}
        {error && (
          <div className={styles.syncAlert}>
            <Alert variant="warning">{error}</Alert>
            <Button variant="outline" icon={RefreshCw} onClick={recarregar}>Tentar novamente</Button>
          </div>
        )}
        <section className={styles.welcomeBanner}>
          <div className={styles.bannerInfo}>
            <div className={styles.tagGroup}><Sparkles size={16} /><span>Jornada de Gamificação</span></div>
            <h2>Explore as Áreas e Ganhe Pontos</h2>
            <p>Escaneie os QR Codes localizados nos ambientes do SENAI para acumular pontos e resgatar brindes.</p>
          </div>
          <div className={styles.progressCard}>
            <ProgressBar current={visitedRooms.length} total={salas.length} label="Progresso de Visitas" />
          </div>
        </section>

        <section className={styles.cardsSection}>
          <h3 className={styles.sectionTitle}>Áreas Disponíveis para Leitura</h3>
          <div className={styles.gridCards}>
            {salas.map((item) => {
              const isVisited = visitedRooms.includes(item.salaId);
              const RoomIcon = getSalaIcon(item.icone);
              return (
                <Card key={item.salaId} className={`${styles.roomCard} ${isVisited ? styles.cardCompleted : ''}`}>
                  <div className={styles.cardHeader}>
                    <div className={styles.roomBadgeIcon}><RoomIcon size={24} /></div>
                    <div className={styles.pointsTag}>+{item.pontos} Pts</div>
                  </div>
                  <div className={styles.cardBody}>
                    <h4 className={styles.roomTitle}>{item.sala}</h4>
                    <p className={styles.roomDesc}>{item.descricao}</p>
                    <div className={styles.statusIndicator}>
                      <span>Status: </span>
                      <span className={isVisited ? styles.statusVisited : styles.statusPending}>
                        {isVisited ? 'Visitado ' : 'Não visitado'}
                      </span>
                    </div>
                  </div>
                  <div className={styles.cardFooter}>
                    <ScannerButton isVisited={isVisited} onClick={() => handleOpenScanner(item)} disabled={isVisited} />
                  </div>
                </Card>
              );
            })}
          </div>
        </section>
      </main>

      <Modal
        isOpen={Boolean(selectedRoom)}
        onClose={handleCloseScanner}
        title={quizSala ? `Quiz: ${quizSala.sala}` : `Escanear: ${selectedRoom?.sala}`}
      >
        {selectedRoom && !quizSala && (
          <div className={styles.scannerModalContent}>
            <p className={styles.scannerInstructions}>
              Aponte a câmera do seu dispositivo para o QR Code localizado na área de <strong>{selectedRoom.sala}</strong>.
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