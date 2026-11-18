import React, { useState } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import Button from '../Button/Button';
import Alert from '../Alert/Alert';
import styles from './ModalQuizPalestra.module.css';

const ModalQuizPalestra = ({ quiz, onClose, onConfirmar }) => {
  const [escolha, setEscolha] = useState(null);
  const [statusResposta, setStatusResposta] = useState(null); // 'correta' | 'incorreta' | null
  const [enviando, setEnviando] = useState(false);

  if (!quiz) return null;

  const handleVerificar = async () => {
    if (!escolha || enviando) return;
    setEnviando(true);

    try {
      const acertou = escolha.toUpperCase() === String(quiz.respostaCorreta).toUpperCase();
      setStatusResposta(acertou ? 'correta' : 'incorreta');

      if (onConfirmar) {
        await onConfirmar(quiz.id, escolha, acertou);
      }
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true">
      <div className={styles.modal}>
        <span className={styles.badge}>Modo Palestra</span>
        <h2 className={styles.pergunta}>{quiz.pergunta}</h2>

        <div className={styles.opcoes}>
          {['A', 'B'].map((letra) => {
            const texto = letra === 'A' ? quiz.opcaoA : quiz.opcaoB;
            const selecionada = escolha === letra;

            return (
              <button
                key={letra}
                type="button"
                disabled={statusResposta !== null}
                onClick={() => setEscolha(letra)}
                className={`${styles.opcaoBtn} ${selecionada ? styles.selecionada : ''}`}
              >
                <span className={styles.letra}>{letra}</span>
                <span>{texto}</span>
              </button>
            );
          })}
        </div>

        {statusResposta === 'correta' && (
          <Alert variant="success">
            <CheckCircle2 size={18} /> Resposta correta!
          </Alert>
        )}

        {statusResposta === 'incorreta' && (
          <Alert variant="error">
            <XCircle size={18} /> Resposta incorreta. A alternativa certa era a <strong>{quiz.respostaCorreta}</strong>.
          </Alert>
        )}

        <div className={styles.acoes}>
          {statusResposta === null ? (
            <>
              <Button variant="outline" onClick={onClose} disabled={enviando}>
                Cancelar
              </Button>
              <Button onClick={handleVerificar} disabled={!escolha || enviando}>
                Confirmar Resposta
              </Button>
            </>
          ) : (
            <Button fullWidth onClick={onClose}>
              Concluir
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModalQuizPalestra;