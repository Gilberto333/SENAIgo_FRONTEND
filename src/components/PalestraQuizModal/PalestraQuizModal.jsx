import React, { useState, useEffect } from 'react';
import Modal from '../Modal/Modal';
import Button from '../Button/Button';
import Alert from '../Alert/Alert';
import { HelpCircle, CheckCircle2, XCircle, Trophy } from 'lucide-react';
import styles from './PalestraQuizModal.module.css';

const ALTERNATIVAS_LETRAS = ['A', 'B', 'C', 'D', 'E'];

const PalestraQuizModal = ({ isOpen, sala, onResponder, onClose }) => {
  const [selecionada, setSelecionada] = useState(null);
  const [respondido, setRespondido] = useState(false);
  const [acertou, setAcertou] = useState(false);
  const [corretaApi, setCorretaApi] = useState(null);
  const [loading, setLoading] = useState(false);
  const [erroApi, setErroApi] = useState('');

  useEffect(() => {
    if (isOpen) {
      setSelecionada(null);
      setRespondido(false);
      setAcertou(false);
      setCorretaApi(null);
      setLoading(false);
      setErroApi('');
    }
  }, [isOpen, sala]);

  if (!sala || !sala.questao) return null;

  const { pergunta, alternativas } = sala.questao;
  const gabarito = corretaApi || sala.questao.correta;

  const handleConfirmar = async () => {
    if (!selecionada || respondido) return;

    setLoading(true);
    setErroApi('');

    try {
      // Envia a resposta para o backend validar (/responderQuiz/:id) ou usa simulação local
      const resultado = await onResponder({
        salaId: sala.salaId || sala.id,
        respostaEscolhida: selecionada,
      });

      setAcertou(Boolean(resultado.acertou));
      setCorretaApi(resultado.correta);
      setRespondido(true);
    } catch (err) {
      setErroApi(err.message || 'Erro ao validar resposta.');
    } finally {
      setLoading(false);
    }
  };

  const getOptionClassName = (letra) => {
    const classes = [styles.opcaoBtn];

    if (!respondido) {
      if (selecionada === letra) classes.push(styles.selecionada);
      return classes.join(' ');
    }

    if (letra === gabarito) {
      classes.push(styles.correta);
    } else if (letra === selecionada) {
      classes.push(styles.errada);
    } else {
      classes.push(styles.desabilitada);
    }

    return classes.join(' ');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={sala.sala || 'Modo Palestra'}>
      <div className={styles.container}>
        <div className={styles.topInfo}>
          <span className={styles.badgePalestra}>
            <HelpCircle size={15} /> Quiz da Palestra
          </span>
          {sala.pontos && (
            <span className={styles.badgePontos}>
              <Trophy size={15} /> +{sala.pontos} pts
            </span>
          )}
        </div>

        <p className={styles.pergunta}>{pergunta}</p>

        <div className={styles.listaAlternativas} role="radiogroup" aria-label="Alternativas">
          {ALTERNATIVAS_LETRAS.map((letra) => {
            const texto = alternativas?.[letra];
            if (!texto) return null;

            return (
              <button
                key={letra}
                type="button"
                disabled={respondido || loading}
                onClick={() => setSelecionada(letra)}
                className={getOptionClassName(letra)}
              >
                <span className={styles.letraBadge}>{letra}</span>
                <span className={styles.opcaoTexto}>{texto}</span>

                {respondido && letra === gabarito && (
                  <CheckCircle2 size={20} className={styles.iconCorreta} />
                )}
                {respondido && letra === selecionada && letra !== gabarito && (
                  <XCircle size={20} className={styles.iconErrada} />
                )}
              </button>
            );
          })}
        </div>

        {respondido && (
          <Alert variant={acertou ? 'success' : 'error'}>
            {acertou
              ? `Resposta correta! Você ganhou ${sala.pontos} pontos.`
              : `Resposta incorreta. A alternativa certa era a letra ${gabarito}.`}
          </Alert>
        )}

        {erroApi && <Alert variant="error">{erroApi}</Alert>}

        <div className={styles.actions}>
          {!respondido ? (
            <>
              <Button variant="outline" onClick={onClose} disabled={loading}>
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handleConfirmar}
                disabled={!selecionada}
                loading={loading}
              >
                Confirmar resposta
              </Button>
            </>
          ) : (
            <Button type="button" onClick={onClose}>
              Concluir
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default PalestraQuizModal;