import React, { useState } from 'react';
import { Star } from 'lucide-react';
import styles from './StarRating.module.css';

const TOTAL_STARS = 5;
const LABELS = ['Muito ruim', 'Ruim', 'Regular', 'Bom', 'Excelente'];

const StarRating = ({ value, onChange, disabled = false }) => {
  const [hover, setHover] = useState(0);
  const active = hover || value;

  const handleSelect = (n) => {
    setHover(0);
    onChange(n);
  };

  return (
    <div className={styles.wrapper}>
      <div
        className={styles.stars}
        role="radiogroup"
        aria-label="Avaliação de 1 a 5 estrelas"
        onMouseLeave={() => setHover(0)}
      >
        {Array.from({ length: TOTAL_STARS }, (_, index) => {
          const n = index + 1;
          return (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={value === n}
              aria-label={`${n} ${n === 1 ? 'estrela' : 'estrelas'}`}
              disabled={disabled}
              className={styles.starBtn}
              onClick={() => handleSelect(n)}
              onMouseEnter={() => setHover(n)}
            >
              <Star size={38} className={n <= active ? styles.filled : styles.empty} />
            </button>
          );
        })}
      </div>
      <span className={styles.label}>{active ? LABELS[active - 1] : 'Toque em uma estrela'}</span>
    </div>
  );
};

export default StarRating;