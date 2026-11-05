import React, { useEffect } from 'react';
import Header from '../../components/Header/Header';
import AdminTabs from '../../components/AdminTabs/AdminTabs';
import { useRanking } from '../../hooks/useRanking';
import styles from './Ranking.module.css';

const Ranking = () => {
  const { ranking, loading, error, recarregar } = useRanking();

  useEffect(() => {
    const intervalo = setInterval(() => {
      recarregar({ silencioso: true });
    }, 5000);

    return () => clearInterval(intervalo);
  }, [recarregar]);

  const renderPosicao = (posicao) => {
    if (posicao === 1) return <span className={styles.medalha}>🥇 1º</span>;
    if (posicao === 2) return <span className={styles.medalha}>🥈 2º</span>;
    if (posicao === 3) return <span className={styles.medalha}>🥉 3º</span>;
    return `${posicao}º`;
  };

  const getLinhaClasse = (posicao) => {
    if (posicao === 1) return styles.primeiroLugar;
    if (posicao === 2) return styles.segundoLugar;
    if (posicao === 3) return styles.terceiroLugar;
    return '';
  };

  return (
    <div className={styles.pageWrapper}>
      <Header />
      <main className={styles.container}>
        <AdminTabs />

        <h2 className={styles.title}>Ranking de Pontuação</h2>

        {loading && (
          <div className={styles.loadingAlert}>Carregando ranking...</div>
        )}

        {error && !loading && (
          <div className={styles.errorBox}>
            <p className={styles.errorText}>{error}</p>
            <button onClick={() => recarregar()} className={styles.retryButton}>
              Tentar novamente
            </button>
          </div>
        )}

        {!loading && !error && ranking.length === 0 && (
          <div className={styles.emptyState}>
            Nenhum usuário encontrado no ranking.
          </div>
        )}

        {!loading && !error && ranking.length > 0 && (
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.colPosicao}>Posição</th>
                  <th>Nome</th>
                  <th className={styles.colPontos}>Pontos</th>
                </tr>
              </thead>
              <tbody>
                {ranking.map((item) => (
                  <tr key={item.id || item.email || item.posicao} className={getLinhaClasse(item.posicao)}>
                    <td className={styles.colPosicao}>
                      {renderPosicao(item.posicao)}
                    </td>
                    <td>
                      <div className={styles.nomeWrapper}>
                        <span className={styles.nomeTexto}>{item.nome}</span>
                        <span className={styles.emailMobile}>{item.email}</span>
                      </div>
                    </td>
                    <td className={styles.colEmail}>{item.email}</td>
                    <td className={styles.colPontos}>
                      <span className={styles.pontosBadge}>
                        {item.pontos} {item.pontos === 1 ? 'pt' : 'pts'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
};

export default Ranking;