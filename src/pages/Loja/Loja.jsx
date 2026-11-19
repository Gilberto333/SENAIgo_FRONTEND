import React, { useState } from 'react';
import { useProgresso } from '../../hooks/useProgresso';
import { useProdutos } from '../../hooks/useProdutos';
import { useResgates } from '../../hooks/useResgates';
import BottomNav from '../../components/BottomNav/BottomNav';
import Button from '../../components/Button/Button';
import Alert from '../../components/Alert/Alert';
import ConfirmModal from '../../components/ConfirmModal/ConfirmModal';
import { formatDate } from '../../utils/formatters';
import { Trophy, Sparkles, RefreshCw, CheckCircle2 } from 'lucide-react';
import styles from './Loja.module.css';

const Loja = () => {
  const { saldo, atualizarSaldo } = useProgresso();
  const { produtos, loading, error, recarregar: recarregarProdutos } = useProdutos();
  const { resgates, loading: loadingResgates, error: errorResgates, recarregar: recarregarResgates, resgatar } = useResgates();

  const [produtoSelecionado, setProdutoSelecionado] = useState(null);
  const [resgatando, setResgatando] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const fecharConfirmacao = () => {
    if (!resgatando) setProdutoSelecionado(null);
  };

  const handleConfirmarResgate = async () => {
    setResgatando(true);
    try {
      await resgatar(produtoSelecionado.id);
      setFeedback({ variant: 'success', message: `${produtoSelecionado.nome} resgatado com sucesso!` });
    } catch (err) {
      setFeedback({ variant: 'error', message: err.message });
    } finally {
      await Promise.allSettled([
        atualizarSaldo(),
        recarregarProdutos({ silencioso: true }),
        recarregarResgates(),
      ]);
      setResgatando(false);
      setProdutoSelecionado(null);
    }
  };

  return (
    <div className={styles.pageContainer}>
      <header className={styles.topBar}>
        <div className={styles.topBarSpacer} />
        <h1 className={styles.pageTitle}>Loja</h1>
        <div className={styles.saldoBadge}>
          <Trophy size={18} />
          <span>{saldo}</span>
        </div>
      </header>

      <main className={styles.mainContent}>
        <section className={styles.bannerLoja}>
          <div className={styles.bannerInfo}>
            <div className={styles.tagLoja}>
              <Sparkles size={14} />
              <span>Loja de Recompensas</span>
            </div>
            <h2>Troque seus pontos por Brindes</h2>
            <p>Resgate abaixo e retire na lojinha do SENAI.</p>
          </div>
          <div className={styles.bannerIcon}>
            <Trophy size={40} />
          </div>
        </section>

        {feedback && <Alert variant={feedback.variant}>{feedback.message}</Alert>}
        {loading && <Alert variant="info">Carregando produtos...</Alert>}
        {error && (
          <div className={styles.errorBox}>
            <Alert variant="error">{error}</Alert>
            <Button variant="outline" icon={RefreshCw} onClick={() => recarregarProdutos()}>
              Tentar novamente
            </Button>
          </div>
        )}

        <section className={styles.sectionBlock}>
          <h3 className={styles.sectionTitle}>Brindes disponíveis</h3>

          {!loading && !error && produtos.length === 0 && (
            <Alert variant="info">Nenhum produto disponível no momento.</Alert>
          )}

          <div className={styles.itemsGrid}>
            {produtos.map((item) => {
              const esgotado = item.estoque <= 0;
              const podeResgatar = !esgotado && saldo >= item.pontos;

              return (
                <button
                  key={item.id}
                  type="button"
                  disabled={!podeResgatar}
                  className={`${styles.itemCard} ${!podeResgatar ? styles.itemDisabled : ''}`}
                  onClick={() => {
                    setFeedback(null);
                    setProdutoSelecionado(item);
                  }}
                >
                  <span className={styles.stockTag}>
                    {esgotado ? 'Esgotado' : `${item.estoque} un.`}
                  </span>

                  <div className={styles.itemEmoji}>{item.imagem}</div>

                  <span className={styles.itemName}>{item.nome}</span>

                  <div className={`${styles.pointsPill} ${podeResgatar ? styles.pillActive : ''}`}>
                    <Trophy size={13} />
                    <span>{item.pontos}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <section className={styles.sectionBlock}>
          <h3 className={styles.sectionTitle}>Meus Resgates</h3>

          {loadingResgates && <Alert variant="info">Carregando seus resgates...</Alert>}
          {errorResgates && <Alert variant="error">{errorResgates}</Alert>}
          {!loadingResgates && !errorResgates && resgates.length === 0 && (
            <p className={styles.emptyText}>Você ainda não resgatou nenhum brinde.</p>
          )}

          <div className={styles.rewardsList}>
            {[...resgates].reverse().map((resgate) => (
              <div key={resgate.id} className={styles.rewardRow}>
                <div className={styles.rewardIconBox}>
                  <span>{resgate.produtoImagem}</span>
                </div>

                <div className={styles.rewardInfo}>
                  <strong>{resgate.produtoNome}</strong>
                  <small>{formatDate(resgate.criadoEm)}</small>
                </div>

                <span className={styles.rewardAction}>
                  <CheckCircle2 size={15} /> -{resgate.pontos} pts
                </span>
              </div>
            ))}
          </div>
        </section>
      </main>

      <BottomNav />

      <ConfirmModal
        isOpen={Boolean(produtoSelecionado)}
        title="Confirmar resgate"
        confirmLabel="Resgatar"
        loading={resgatando}
        onConfirm={handleConfirmarResgate}
        onCancel={fecharConfirmacao}
      >
        {produtoSelecionado && (
          <>
            Deseja trocar <strong>{produtoSelecionado.pontos} pontos</strong> por{' '}
            <strong>{produtoSelecionado.nome}</strong>?
          </>
        )}
      </ConfirmModal>
    </div>
  );
};

export default Loja;