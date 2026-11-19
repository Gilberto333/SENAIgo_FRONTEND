import React, { useEffect, useState } from 'react';
import { useProgresso } from '../../hooks/useProgresso';
import BottomNav from '../../components/BottomNav/BottomNav';
import { Settings, QrCode, CalendarCheck, Trophy, User } from 'lucide-react';
import styles from './Perfil.module.css';

const Perfil = ({ onOpenSettings }) => {
  const { saldo } = useProgresso();
  const [perfil, setPerfil] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function carregarPerfil() {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(
          `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/usuarios/perfil`,
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const data = await response.json();
        if (data.sucesso) {
          setPerfil(data.perfil);
        }
      } catch (err) {
        console.error('Erro ao buscar perfil:', err);
      } finally {
        setLoading(false);
      }
    }

    carregarPerfil();
  }, []);

  const nome = perfil?.nome || (loading ? 'Carregando...' : 'Aluno SENAI');
  const username = perfil?.username || 'alunosenai';

  return (
    <div className={styles.pageContainer}>
      <header className={styles.profileBanner}>
        <button
          type="button"
          className={styles.settingsButton}
          onClick={onOpenSettings}
          aria-label="Configurações"
        >
          <Settings size={26} />
        </button>

        <div className={styles.avatarContainer}>
          <User size={76} strokeWidth={1.8} />
        </div>
      </header>

      <main className={styles.mainContent}>
        <section className={styles.userInfoSection}>
          <h1 className={styles.userName}>{nome}</h1>
          <p className={styles.userHandle}>@{username}</p>
        </section>

        <hr className={styles.divider} />

        <section className={styles.overviewSection}>
          <h2 className={styles.sectionTitle}>Visão geral</h2>

          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={`${styles.statIcon} ${styles.iconPrimary}`}>
                <QrCode size={22} />
              </div>
              <div className={styles.statData}>
                <strong>{perfil?.qrcodes_lidos ?? 0}</strong>
                <span>QR Codes lidos</span>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={`${styles.statIcon} ${styles.iconSecondary}`}>
                <CalendarCheck size={22} />
              </div>
              <div className={styles.statData}>
                <strong>{perfil?.eventos_participados ?? 0}</strong>
                <span>Eventos que fui</span>
              </div>
            </div>

            <div className={`${styles.statCard} ${styles.statCardFull}`}>
              <div className={`${styles.statIcon} ${styles.iconGold}`}>
                <Trophy size={22} />
              </div>
              <div className={styles.statData}>
                <strong>{saldo ?? perfil?.pontos_totais ?? 0}</strong>
                <span>Saldo disponível</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      <BottomNav />
    </div>
  );
};

export default Perfil;