import React from 'react';
import { getSalaIcon } from '../../constants/salaIcons';
import { QrCode, Check } from 'lucide-react';
import styles from './ListaSalasMimo.module.css';

const ListaSalasMimo = ({ salas, visitedRooms, onOpenScanner }) => {
  return (
    <section className={styles.listContainer}>
      <h3 className={styles.listHeading}>Áreas Disponíveis</h3>

      <div className={styles.cardsStack}>
        {salas.map((item) => {
          const isVisited = visitedRooms.includes(item.salaId);
          const RoomIcon = getSalaIcon(item.icone);

          return (
            <div
              key={item.salaId}
              className={`${styles.rowCard} ${isVisited ? styles.rowCardVisited : ''}`}
              onClick={() => {
                if (!isVisited) onOpenScanner(item);
              }}
            >
              {/* Esquerda: Ícone da sala + Nome + Pontos */}
              <div className={styles.leftContent}>
                <div className={styles.roomIconBox}>
                  <RoomIcon size={24} strokeWidth={2.2} />
                </div>

                <div className={styles.roomTextGroup}>
                  <span className={styles.roomName}>{item.sala}</span>
                  <span className={styles.roomPoints}>
                    {isVisited ? 'Concluído' : `+${item.pontos} pts`}
                  </span>
                </div>
              </div>

              {/* Direita: Botão circular só com o ícone do QR Code */}
              <button
                type="button"
                disabled={isVisited}
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenScanner(item);
                }}
                aria-label={
                  isVisited
                    ? `${item.sala} já visitada`
                    : `Escanear QR Code de ${item.sala}`
                }
                className={`${styles.qrCircleBtn} ${
                  isVisited ? styles.qrCircleCompleted : ''
                }`}
              >
                {isVisited ? (
                  <Check size={22} strokeWidth={3} />
                ) : (
                  <QrCode size={22} strokeWidth={2.2} />
                )}
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default ListaSalasMimo;