import React, { useEffect } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { MapPin, LogOut, X, ArrowLeft, Users, LayoutDashboard } from 'lucide-react';
import styles from './Sidebar.module.css';

const Sidebar = ({ isOpen, onClose }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Páginas onde o botão "Voltar" deve aparecer
  const mostrarVoltar = ['/salas-visitas', '/admin/dashboard'].includes(location.pathname);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleKeyDown);
    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = overflowAnterior;
    };
  }, [isOpen, onClose]);

  const handleLogout = () => {
    logout();
    navigate('/login');
    onClose();
  };

  return (
    <>
      <div
        className={`${styles.overlay} ${isOpen ? styles.overlayOpen : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        id="sidebar-menu"
        className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}
        aria-label="Menu lateral"
      >
        <div className={styles.sidebarHeader}>
          <span className={styles.title}>Menu</span>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Fechar menu"
          >
            <X size={20} />
          </button>
        </div>

        <nav className={styles.menuList}>
          <NavLink
            to="/admin/dashboard"
            onClick={onClose}
            className={({ isActive }) => `${styles.menuItem} ${isActive ? styles.active : ''}`}
          >
            <LayoutDashboard size={20} className={styles.menuIcon} />
            <span>Dashboard</span>
          </NavLink>

          <Link
            to="/salas-visitas"
            onClick={onClose}
            className={`${styles.menuItem} ${location.pathname === '/salas-visitas' ? styles.active : ''}`}
          >
            <MapPin size={20} className={styles.menuIcon} />
            <span>Salas Visitadas</span>
          </Link>

          <NavLink
            to="/admin/visitas-usuarios"
            onClick={onClose}
            className={({ isActive }) => `${styles.menuItem} ${isActive ? styles.active : ''}`}
          >
            <Users size={20} className={styles.menuIcon} />
            <span>Visitas por Usuário</span>
          </NavLink>

          {mostrarVoltar && (
            <Link
              to="/home"
              onClick={onClose}
              className={`${styles.menuItem} ${styles.backItem}`}
            >
              <ArrowLeft size={20} className={styles.menuIcon} />
              <span>Voltar</span>
            </Link>
          )}
        </nav>

        <div className={styles.footer}>
          <button type="button" className={styles.logoutBtn} onClick={handleLogout}>
            <LogOut size={20} />
            <span>Sair</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;