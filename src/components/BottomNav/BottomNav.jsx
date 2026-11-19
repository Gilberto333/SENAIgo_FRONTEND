import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Gift, Calendar, User } from 'lucide-react';
import styles from './BottomNav.module.css';

const NAV_ITEMS = [
  { id: 'inicio', label: 'Início', path: '/home', icon: Home },
  { id: 'brindes', label: 'Brindes', path: '/loja', icon: Gift },
  { id: 'eventos', label: 'Eventos', path: '/eventos', icon: Calendar },
  { id: 'perfil', label: 'Perfil', path: '/perfil', icon: User },
];

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className={styles.bottomNavWrapper} aria-label="Navegação principal">
      <div className={styles.pillContainer}>
        {NAV_ITEMS.map((item) => {
          const IconComponent = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => navigate(item.path)}
              aria-current={isActive ? 'page' : undefined}
              className={`${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
            >
              <IconComponent
                size={23}
                strokeWidth={isActive ? 2.5 : 1.8}
                className={styles.navIcon}
              />
              <span className={styles.navLabel}>{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;