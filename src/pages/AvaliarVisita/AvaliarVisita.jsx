import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Send, CheckCircle2 } from 'lucide-react';
import Header from '../../components/Header/Header';
import Card from '../../components/Card/Card';
import Alert from '../../components/Alert/Alert';
import Button from '../../components/Button/Button';
import StarRating from '../../components/StarRating/StarRating';
import * as visitasService from '../../services/visitasService';
import styles from './AvaliarVisita.module.css';

const COMMENT_MAX_LENGTH = 500;
const REDIRECT_DELAY_MS = 1800;

const AvaliarVisita = () => {
  const { visitaId } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const redirectTimer = useRef(null);

  const [estrelas, setEstrelas] = useState(0);
  const [comentario, setComentario] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState('');

  const salaNome = state?.salaNome;

  useEffect(() => () => clearTimeout(redirectTimer.current), []);

  const voltarParaHome = () => navigate('/home', { replace: true });

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!estrelas || enviando) return;

    setEnviando(true);
    setErro('');
    try {
      await visitasService.avaliarVisita({
        visitaId,
        estrelas,
        comentario: comentario.trim() || undefined,
      });
      setEnviado(true);
      redirectTimer.current = setTimeout(voltarParaHome, REDIRECT_DELAY_MS);
    } catch (err) {
      setErro(err.message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className={styles.pageContainer}>
      <Header />
      <main className={styles.mainContent}>
        <Card hoverEffect={false} className={styles.card}>
          {enviado ? (
            <div className={styles.success}>
              <CheckCircle2 size={48} className={styles.successIcon} />
              <h2>Obrigado pela avaliação!</h2>
              <p>Sua opinião ajuda a melhorar a experiência de todos.</p>
              <Button variant="outline" fullWidth onClick={voltarParaHome}>Voltar para o início</Button>
            </div>
          ) : (
            <form className={styles.form} onSubmit={handleSubmit}>
              <div className={styles.headerText}>
                <h2>Como foi sua experiência?</h2>
                <p>{salaNome ? <>Avalie sua visita em <strong>{salaNome}</strong>.</> : 'Avalie sua visita.'}</p>
              </div>

              <StarRating value={estrelas} onChange={setEstrelas} disabled={enviando} />

              <div className={styles.field}>
                <label htmlFor="comentario" className={styles.label}>Comentário (opcional)</label>
                <textarea
                  id="comentario"
                  className={styles.textarea}
                  placeholder="Conte o que você achou desta área..."
                  value={comentario}
                  maxLength={COMMENT_MAX_LENGTH}
                  disabled={enviando}
                  onChange={(event) => setComentario(event.target.value)}
                />
                <span className={styles.counter}>{comentario.length}/{COMMENT_MAX_LENGTH}</span>
              </div>

              {erro && <Alert variant="error">{erro}</Alert>}

              <div className={styles.actions}>
                <Button type="submit" fullWidth icon={Send} loading={enviando} disabled={!estrelas}>
                  Enviar avaliação
                </Button>
                <Button variant="outline" fullWidth disabled={enviando} onClick={voltarParaHome}>
                  Agora não
                </Button>
              </div>
            </form>
          )}
        </Card>
      </main>
    </div>
  );
};

export default AvaliarVisita;