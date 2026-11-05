import React, { useState, useMemo } from 'react';
import Header from '../../components/Header/Header';
import AdminTabs from '../../components/AdminTabs/AdminTabs';
import { useVisitasUsuarios } from '../../hooks/useVisitasUsuarios';
import styles from './GerenciarVisitasUsuarios.module.css';

const GerenciarVisitasUsuarios = () => {
  const {
    usuarios,
    usuarioSelecionado,
    visitas,
    loadingUsuarios,
    loadingVisitas,
    error,
    erroVisitas,
    carregarUsuarios,
    selecionarUsuario,
  } = useVisitasUsuarios();

  const [busca, setBusca] = useState('');

  const usuariosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return usuarios;
    return usuarios.filter(
      (u) =>
        (u.nome && u.nome.toLowerCase().includes(termo)) ||
        (u.email && u.email.toLowerCase().includes(termo)) ||
        (u.cpf && u.cpf.replace(/\D/g, '').includes(termo))
    );
  }, [usuarios, busca]);

  const formatarData = (isoString) => {
    if (!isoString) return '-';
    return new Date(isoString).toLocaleString('pt-BR');
  };

  return (
    <div className={styles.pageWrapper}>
      <Header />
      <main className={styles.container}>
        <AdminTabs />

        <h2 className={styles.title}>Visitas por Usuário</h2>

        {loadingUsuarios && (
          <div className={styles.loadingAlert}>Carregando usuários...</div>
        )}

        {error && !loadingUsuarios && (
          <div className={styles.errorBox}>
            <p className={styles.errorText}>{error}</p>
            <button onClick={carregarUsuarios} className={styles.retryButton}>
              Tentar novamente
            </button>
          </div>
        )}

        {!loadingUsuarios && !error && (
          <div className={styles.layoutGrid}>
            <div className={styles.painelUsuarios}>
              <div className={styles.buscaBox}>
                <input
                  type="text"
                  placeholder="Buscar por nome, e-mail ou CPF..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className={styles.inputBusca}
                />
              </div>

              {usuariosFiltrados.length === 0 ? (
                <div className={styles.emptyState}>
                  Nenhum usuário encontrado.
                </div>
              ) : (
                <ul className={styles.listaUsuarios}>
                  {usuariosFiltrados.map((u) => {
                    const isSelected = usuarioSelecionado?.id === u.id;
                    return (
                      <li
                        key={u.id}
                        className={`${styles.itemUsuario} ${
                          isSelected ? styles.itemUsuarioAtivo : ''
                        }`}
                        onClick={() => selecionarUsuario(u)}
                      >
                        <div className={styles.usuarioInfoMain}>
                          <span className={styles.usuarioNome}>{u.nome}</span>
                          <span className={styles.usuarioEmail}>{u.email}</span>
                        </div>
                        {u.cpf && (
                          <span className={styles.usuarioCpf}>CPF: {u.cpf}</span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <div className={styles.painelVisitas}>
              {!usuarioSelecionado ? (
                <div className={styles.placeholderSelecao}>
                  👈 Selecione um usuário ao lado para visualizar o histórico de salas escaneadas.
                </div>
              ) : (
                <div className={styles.detalhesContainer}>
                  <div className={styles.usuarioHeaderCard}>
                    <h3 className={styles.usuarioHeaderNome}>
                      {usuarioSelecionado.nome}
                    </h3>
                    <div className={styles.usuarioHeaderMeta}>
                      <span><strong>E-mail:</strong> {usuarioSelecionado.email}</span>
                      {usuarioSelecionado.cpf && (
                        <span><strong>CPF:</strong> {usuarioSelecionado.cpf}</span>
                      )}
                    </div>
                  </div>

                  <h4 className={styles.subtituloVisitas}>Salas Escaneadas</h4>

                  {loadingVisitas && (
                    <div className={styles.loadingAlert}>Carregando histórico...</div>
                  )}

                  {erroVisitas && !loadingVisitas && (
                    <div className={styles.errorBox}>
                      <p className={styles.errorText}>{erroVisitas}</p>
                      <button
                        onClick={() => selecionarUsuario(usuarioSelecionado)}
                        className={styles.retryButton}
                      >
                        Tentar novamente
                      </button>
                    </div>
                  )}

                  {!loadingVisitas && !erroVisitas && visitas.length === 0 && (
                    <div className={styles.emptyState}>
                      Este usuário ainda não escaneou nenhuma sala.
                    </div>
                  )}

                  {!loadingVisitas && !erroVisitas && visitas.length > 0 && (
                    <ul className={styles.listaVisitas}>
                      {visitas.map((v) => (
                        <li key={v.id || `${v.salaId}-${v.escaneadoEm}`} className={styles.cardVisita}>
                          <div className={styles.visitaHeader}>
                            <span className={styles.salaNome}>
                               {v.salaNome || v.nomeSala || 'Sala Sem Nome'}
                            </span>
                            {v.pontosGanhos !== undefined && (
                              <span className={styles.badgePontos}>
                                +{v.pontosGanhos} pts
                              </span>
                            )}
                          </div>
                          <div className={styles.visitaDetalhes}>
                            {(v.codigoSala || v.codigo) && (
                              <span><strong>Código:</strong> {v.codigoSala || v.codigo}</span>
                            )}
                            <span>
                              <strong>Data:</strong> {formatarData(v.escaneadoEm || v.criadoEm || v.dataVisita)}
                            </span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default GerenciarVisitasUsuarios;