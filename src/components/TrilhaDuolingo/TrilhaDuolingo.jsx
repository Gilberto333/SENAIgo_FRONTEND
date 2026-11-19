import React, { useState, useEffect } from 'react';
import { getSalaIcon } from '../../constants/salaIcons';
import { Check, QrCode, Trophy, X } from 'lucide-react';
import styles from './TrilhaDuolingo.module.css';

const TrilhaDuolingo = ({ salas, visitedRooms, onOpenScanner }) => {
  const [activeNodeId, setActiveNodeId] = useState(null);

  useEffect(() => {
    if (salas.length > 0 && !activeNodeId) {
      const proxima = salas.find((s) => !visitedRooms.includes(s.salaId));
      if (proxima) setActiveNodeId(proxima.salaId);
    }
  }, [salas, visitedRooms, activeNodeId]);

  const getNodeOffset = (index) => {
    const amplitude = 62;
    return Math.round(Math.sin(index * 1.15) * amplitude);
  };

  const firstUnvisitedId = salas.find((s) => !visitedRooms.includes(s.salaId))?.salaId;

  return (
    <section className={styles.pathContainer}>
      {salas.map((item, index) => {
        const isVisited = visitedRooms.includes(item.salaId);
        const isNext = item.salaId === firstUnvisitedId;
        const isSelected = activeNodeId === item.salaId;
        const RoomIcon = getSalaIcon(item.icone);
        const offsetX = getNodeOffset(index);

        const hasNextRoom = index < salas.length - 1;
        const nextOffsetX = hasNextRoom ? getNodeOffset(index + 1) : 0;

        return (
          <React.Fragment key={item.salaId}>
            <div
              className={styles.nodeWrapper}
              style={{ transform: `translateX(${offsetX}px)` }}
            >
              {isNext && !isSelected && (
                <div
                  className={styles.floatingCallout}
                  onClick={() => setActiveNodeId(item.salaId)}
                >
                  COMEÇAR
                </div>
              )}

              <button
                type="button"
                onClick={() => setActiveNodeId(isSelected ? null : item.salaId)}
                aria-label={item.sala}
                className={`${styles.pathNode} ${
                  isVisited
                    ? styles.nodeCompleted
                    : isNext
                    ? styles.nodeCurrent
                    : styles.nodePending
                } ${isSelected ? styles.nodeRing : ''}`}
              >
                {isVisited ? (
                  <Check size={32} strokeWidth={3} />
                ) : (
                  <RoomIcon size={30} strokeWidth={2.2} />
                )}
                <span className={styles.nodePointsBadge}>+{item.pontos}</span>
              </button>

              <span className={styles.nodeLabel}>{item.sala}</span>

              {isSelected && (
                <div
                  className={`${styles.popoverCard} ${
                    isVisited ? styles.popoverCompleted : ''
                  }`}
                  style={{
                    transform: `translateX(${-offsetX * 0.65}px)`,
                  }}
                >
                  <div className={styles.popoverHeader}>
                    <div>
                      <span className={styles.popoverPoints}>
                        {isVisited ? 'CONCLUÍDA' : `VALE +${item.pontos} PTS`}
                      </span>
                      <h4 className={styles.popoverTitle}>{item.sala}</h4>
                    </div>
                    <button
                      type="button"
                      className={styles.popoverClose}
                      onClick={() => setActiveNodeId(null)}
                      aria-label="Fechar"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  {item.descricao && (
                    <p className={styles.popoverDesc}>{item.descricao}</p>
                  )}

                  {isVisited ? (
                    <div className={styles.completedBadge}>
                      <Check size={16} /> Área já visitada!
                    </div>
                  ) : (
                    <button
                      type="button"
                      className={styles.popoverActionBtn}
                      onClick={() => onOpenScanner(item)}
                    >
                      <QrCode size={18} />
                      ESCANEAR QR CODE
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Caminho de 3 bolinhas */}
            <div className={styles.dotsConnector} aria-hidden="true">
              {[0.25, 0.5, 0.75].map((step, dotIndex) => {
                const dotX = Math.round(offsetX + (nextOffsetX - offsetX) * step);
                return (
                  <span
                    key={dotIndex}
                    className={`${styles.pathDot} ${
                      isVisited ? styles.pathDotCompleted : ''
                    }`}
                    style={{ transform: `translateX(${dotX}px)` }}
                  />
                );
              })}
            </div>
          </React.Fragment>
        );
      })}

      {salas.length > 0 && (
        <div className={styles.trophyWrapper}>
          <div
            className={`${styles.trophyNode} ${
              visitedRooms.length === salas.length ? styles.trophyUnlocked : ''
            }`}
          >
            <Trophy size={34} />
          </div>
          <span className={styles.trophyLabel}>
            {visitedRooms.length === salas.length
              ? 'Jornada Completa! Resgate seus brindes'
              : 'Complete todas as áreas'}
          </span>
        </div>
      )}
    </section>
  );
};

export default TrilhaDuolingo;