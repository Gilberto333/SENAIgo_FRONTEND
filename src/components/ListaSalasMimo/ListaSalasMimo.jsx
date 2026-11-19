import React from 'react';
import { getSalaIcon } from '../../constants/salaIcons';
import { QrCode, CheckCircle2, Circle } from 'lucide-react';
import styles from './ListaSalasMimo.module.css';

const ListaSalasMimo = ({ salas, visitedRooms, onOpenGlobalScanner }) => {
  const todasConcluidas = salas.length > 0 && visitedRooms.length >= salas.length;

  return (
    <section className={styles.listContainer}>
      {/* Botão Único de Leitura */}
      <button
        type="button"
        disabled={todasConcluidas}
        onClick={onOpenGlobalScanner}
        className={styles.globalScanBtn}
      >
        <QrCode size={22} strokeWidth={2.3} />
        <span>
          {todasConcluidas ? 'Todas as Áreas Concluídas!' : 'Escanear QR Code'}
        </span>
      </button>

      <h3 className={styles.listHeading}>Áreas Disponíveis</h3>

      <div className={styles.cardsStack}>
        {salas.map((item) => {
          const isVisited = visitedRooms.includes(item.salaId);
          const RoomIcon = getSalaIcon(item.icone);

          return (
            <div
              key={item.salaId}
              className={`${styles.rowCard} ${isVisited ? styles.rowCardVisited : ''}`}
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

              {/* Direita: Apenas indicador visual de status */}
              <div className={styles.statusIndicator}>
                {isVisited ? (
                  <CheckCircle2 size={22} className={styles.iconCompleted} />
                ) : (
                  <Circle size={20} className={styles.iconPending} />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default ListaSalasMimo;