import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import Modal from '../Modal/Modal';
import Button from '../Button/Button';
import Alert from '../Alert/Alert';
import Input from '../Input/Input';
import api from '../../services/api';
import { buildQrPayload } from '../../utils/qrCode';
import {
  Download,
  ImagePlus,
  Trash2,
  Save,
  Sparkles,
  Presentation,
  HelpCircle,
  CheckCircle2,
} from 'lucide-react';
import styles from './QrCodeModal.module.css';

const ALTERNATIVAS_LETRAS = ['A', 'B', 'C', 'D', 'E'];

function formatarParaInputLocal(dataValor) {
  if (!dataValor) return '';
  const data = dataValor instanceof Date ? dataValor : new Date(dataValor);
  if (isNaN(data.getTime())) return '';
  const offset = data.getTimezoneOffset() * 60000;
  return new Date(data.getTime() - offset).toISOString().slice(0, 16);
}

const QrCodeContent = ({ sala, onAtualizarSala }) => {
  const [image, setImage] = useState('');
  const [error, setError] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [qrColor, setQrColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#FFFFFF');
  const [borderColor, setBorderColor] = useState('#000000');
  const [borderWidth, setBorderWidth] = useState(16);
  const [logoSrc, setLogoSrc] = useState(null);

  // Estados do controle de leitura e horário
  const [bloquearLeitura, setBloquearLeitura] = useState(Boolean(sala.bloquear_leitura));
  const [bloqueadaAte, setBloqueadaAte] = useState(() => formatarParaInputLocal(sala.bloqueada_ate));
  const [salvando, setSalvando] = useState(false);

  // Estados do Modo Palestra (Questão A - E)
  const [modoPalestra, setModoPalestra] = useState(Boolean(sala.modoPalestra || sala.questao));
  const [pergunta, setPergunta] = useState(sala.questao?.pergunta ?? '');
  const [alternativas, setAlternativas] = useState(
    sala.questao?.alternativas ?? { A: '', B: '', C: '', D: '', E: '' }
  );
  const [correta, setCorreta] = useState(sala.questao?.correta ?? 'A');
  const [salvandoPalestra, setSalvandoPalestra] = useState(false);

  useEffect(() => {
    setBloquearLeitura(Boolean(sala.bloquear_leitura));
    setBloqueadaAte(formatarParaInputLocal(sala.bloqueada_ate));
    setModoPalestra(Boolean(sala.modoPalestra || sala.questao));
    setPergunta(sala.questao?.pergunta ?? '');
    setAlternativas(sala.questao?.alternativas ?? { A: '', B: '', C: '', D: '', E: '' });
    setCorreta(sala.questao?.correta ?? 'A');
    setSucesso('');
    setError('');
  }, [sala]);

  useEffect(() => {
    let ativo = true;

    async function gerarQrCode() {
      try {
        setError('');
        const totalSize = 600;
        const innerSize = totalSize - borderWidth * 2;

        const qrCanvas = document.createElement('canvas');
        await QRCode.toCanvas(qrCanvas, buildQrPayload(sala.salaId), {
          width: innerSize,
          margin: 2,
          errorCorrectionLevel: 'H',
          color: {
            dark: qrColor,
            light: bgColor,
          },
        });

        const finalCanvas = document.createElement('canvas');
        finalCanvas.width = totalSize;
        finalCanvas.height = totalSize;
        const ctx = finalCanvas.getContext('2d');

        if (borderWidth > 0) {
          ctx.fillStyle = borderColor;
          ctx.fillRect(0, 0, totalSize, totalSize);
        }

        ctx.drawImage(qrCanvas, borderWidth, borderWidth, innerSize, innerSize);

        if (logoSrc) {
          await new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
              const maxLogo = innerSize * 0.22;
              const scale = Math.min(maxLogo / img.width, maxLogo / img.height);
              const w = img.width * scale;
              const h = img.height * scale;
              const x = (totalSize - w) / 2;
              const y = (totalSize - h) / 2;
              const padding = 8;

              ctx.fillStyle = bgColor;
              ctx.fillRect(x - padding, y - padding, w + padding * 2, h + padding * 2);
              ctx.drawImage(img, x, y, w, h);
              resolve();
            };
            img.onerror = reject;
            img.src = logoSrc;
          });
        }

        if (ativo) {
          setImage(finalCanvas.toDataURL('image/png'));
        }
      } catch {
        if (ativo) {
          setError('Não foi possível gerar o QR Code.');
        }
      }
    }

    gerarQrCode();
    return () => {
      ativo = false;
    };
  }, [sala.salaId, qrColor, bgColor, borderColor, borderWidth, logoSrc]);

  useEffect(() => {
    return () => {
      if (logoSrc) URL.revokeObjectURL(logoSrc);
    };
  }, [logoSrc]);

  const handleUploadLogo = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoSrc(URL.createObjectURL(file));
    e.target.value = '';
  };

  const ativarModoLendario = () => {
    setQrColor('#B45309');
    setBgColor('#FFFBEB');
    setBorderColor('#F59E0B');
    setBorderWidth((prev) => (prev === 0 ? 16 : prev));

    const emUmaHoraEMeia = new Date(Date.now() + 90 * 60 * 1000);
    setBloqueadaAte(formatarParaInputLocal(emUmaHoraEMeia));
    setBloquearLeitura(false);

    setError('');
    setSucesso('Modo Lendário aplicado! Tempo definido para 1h30 (clique em Salvar para confirmar no banco).');
  };

  const baixar = () => {
    const link = document.createElement('a');
    link.href = image;
    link.download = `qrcode-sala-${sala.salaId}.png`;
    link.click();
  };

  const salvarControleLeitura = async () => {
    try {
      setSalvando(true);
      setError('');
      setSucesso('');

      const dataFormatada = bloqueadaAte ? new Date(bloqueadaAte).toISOString() : null;

      const { data } = await api.patch(`/bloquearLeitura/${sala.salaId}`, {
        bloquear_leitura: bloquearLeitura,
        bloqueada_ate: dataFormatada,
      });

      setSucesso('Regras de leitura salvas com sucesso!');
      if (onAtualizarSala && data?.sala) {
        onAtualizarSala(data.sala);
      }
    } catch (err) {
      setError(err.message || 'Erro ao salvar o horário/bloqueio da sala.');
    } finally {
      setSalvando(false);
    }
  };

  const handleAlternativaChange = (letra, valor) => {
    setAlternativas((prev) => ({ ...prev, [letra]: valor }));
    setError('');
  };

  const salvarModoPalestra = async () => {
    try {
      setError('');
      setSucesso('');

      if (modoPalestra) {
        if (!pergunta.trim()) {
          setError('Digite o enunciado da questão para o Modo Palestra.');
          return;
        }
        const vazia = ALTERNATIVAS_LETRAS.find((letra) => !alternativas[letra]?.trim());
        if (vazia) {
          setError(`Preencha a alternativa ${vazia}.`);
          return;
        }
      }

      setSalvandoPalestra(true);

      const payload = {
        sala: sala.sala,
        descricao: sala.descricao || '',
        icone: sala.icone || 'map-pin',
        pontos: Number(sala.pontos),
        ativa: Boolean(sala.ativa),
        modoPalestra,
        questao: modoPalestra
          ? {
              pergunta: pergunta.trim(),
              alternativas: {
                A: alternativas.A.trim(),
                B: alternativas.B.trim(),
                C: alternativas.C.trim(),
                D: alternativas.D.trim(),
                E: alternativas.E.trim(),
              },
              correta,
            }
          : null,
      };

      const { data } = await api.put(`/atualizarSala/${sala.salaId}`, payload);

      setSucesso(
        modoPalestra
          ? 'Modo Palestra e questão salvos com sucesso!'
          : 'Modo Palestra desativado com sucesso!'
      );

      if (onAtualizarSala && data?.sala) {
        onAtualizarSala(data.sala);
      }
    } catch (err) {
      setError(err.message || 'Erro ao salvar Modo Palestra.');
    } finally {
      setSalvandoPalestra(false);
    }
  };

  return (
    <div className={styles.content}>
      {error && <Alert variant="error">{error}</Alert>}
      {sucesso && <Alert variant="success">{sucesso}</Alert>}

      {/* Botão Preset Lendário */}
      <div className={styles.legendaryWrapper}>
        <button type="button" onClick={ativarModoLendario} className={styles.legendaryBtn}>
          <Sparkles size={16} />
          Lendário (Dourado • 1h30)
        </button>
      </div>

      {/* Controles de Aparência do QR Code */}
      <div className={styles.controlsRow}>
        <label className={styles.colorLabel}>
          <input
            type="color"
            value={qrColor}
            onChange={(e) => setQrColor(e.target.value)}
            className={styles.colorInput}
          />
          Cor
        </label>

        <label className={styles.colorLabel}>
          <input
            type="color"
            value={bgColor}
            onChange={(e) => setBgColor(e.target.value)}
            className={styles.colorInput}
          />
          Fundo
        </label>

        <label className={styles.colorLabel}>
          <input
            type="color"
            value={borderColor}
            onChange={(e) => setBorderColor(e.target.value)}
            disabled={borderWidth === 0}
            className={styles.colorInput}
          />
          Borda
        </label>

        <select
          value={borderWidth}
          onChange={(e) => setBorderWidth(Number(e.target.value))}
          className={styles.borderSelect}
        >
          <option value={0}>Sem borda</option>
          <option value={8}>Borda fina</option>
          <option value={16}>Borda média</option>
          <option value={28}>Borda grossa</option>
        </select>

        <label className={styles.logoUploadBtn}>
          <ImagePlus size={16} />
          {logoSrc ? 'Trocar logo' : 'Adicionar logo'}
          <input type="file" accept="image/*" onChange={handleUploadLogo} hidden />
        </label>

        {logoSrc && (
          <button
            type="button"
            onClick={() => setLogoSrc(null)}
            title="Remover logo"
            className={styles.logoRemoveBtn}
          >
            <Trash2 size={16} />
            Remover
          </button>
        )}
      </div>

      {image && <img src={image} alt={`QR Code da sala ${sala.sala}`} className={styles.image} />}
      <p className={styles.hint}>
        Imprima e cole este QR Code na sala <strong>{sala.sala}</strong>.
      </p>
      {image && (
        <Button fullWidth icon={Download} onClick={baixar}>
          Baixar PNG
        </Button>
      )}

      {/* Seção Modo Palestra */}
      <div className={styles.sectionDivider}>
        <Button
          type="button"
          variant={modoPalestra ? 'primary' : 'outline'}
          fullWidth
          icon={Presentation}
          onClick={() => setModoPalestra((prev) => !prev)}
        >
          {modoPalestra ? 'Modo Palestra (Ativado)' : 'Modo Palestra'}
        </Button>

        {modoPalestra && (
          <div className={styles.palestraBox}>
            <div className={styles.palestraHeader}>
              <HelpCircle size={17} />
              <strong>Questão de Múltipla Escolha (A - E)</strong>
            </div>

            <Input
              id="qr-palestra-pergunta"
              label="Pergunta / Enunciado"
              placeholder="Ex.: Qual tema foi abordado na palestra?"
              value={pergunta}
              onChange={(e) => setPergunta(e.target.value)}
            />

            <p className={styles.palestraHelper}>
              Preencha as 5 alternativas e marque a <strong>única resposta correta</strong>:
            </p>

            <div className={styles.alternativasList}>
              {ALTERNATIVAS_LETRAS.map((letra) => {
                const isCorreta = correta === letra;
                return (
                  <div
                    key={letra}
                    className={`${styles.alternativaItem} ${
                      isCorreta ? styles.alternativaCorreta : ''
                    }`}
                  >
                    <label
                      className={styles.radioLabel}
                      title={`Marcar ${letra} como resposta correta`}
                    >
                      <input
                        type="radio"
                        name="qr-alternativa-correta"
                        checked={isCorreta}
                        onChange={() => setCorreta(letra)}
                      />
                      <span className={styles.letraBadge}>{letra}</span>
                    </label>

                    <div className={styles.alternativaInput}>
                      <Input
                        id={`qr-alt-${letra}`}
                        placeholder={
                          isCorreta ? `Resposta certa (${letra})` : `Resposta errada (${letra})`
                        }
                        value={alternativas[letra]}
                        onChange={(e) => handleAlternativaChange(letra, e.target.value)}
                      />
                    </div>

                    {isCorreta && (
                      <span className={styles.corretaTag}>
                        <CheckCircle2 size={15} /> Certa
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className={styles.palestraSaveWrapper}>
          <Button
            type="button"
            fullWidth
            icon={Save}
            onClick={salvarModoPalestra}
            disabled={salvandoPalestra}
          >
            {salvandoPalestra ? 'Salvando...' : 'Salvar Modo Palestra'}
          </Button>
        </div>
      </div>

      {/* Painel de Controle de Tempo e Bloqueio */}
      <div className={styles.sectionDivider}>
        <p className={styles.sectionTitle}>Controle de Leitura do QR Code</p>

        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={bloquearLeitura}
            onChange={(e) => setBloquearLeitura(e.target.checked)}
            className={styles.checkboxInput}
          />
          Bloquear leitura imediatamente
        </label>

        <label className={styles.datetimeLabel}>
          Bloquear automaticamente após (data e hora):
          <div className={styles.datetimeRow}>
            <input
              type="datetime-local"
              value={bloqueadaAte}
              onChange={(e) => setBloqueadaAte(e.target.value)}
              className={styles.datetimeInput}
            />
            {bloqueadaAte && (
              <button
                type="button"
                onClick={() => setBloqueadaAte('')}
                className={styles.clearBtn}
              >
                Limpar
              </button>
            )}
          </div>
        </label>

        <Button fullWidth icon={Save} onClick={salvarControleLeitura} disabled={salvando}>
          {salvando ? 'Salvando...' : 'Salvar Regras de Leitura'}
        </Button>
      </div>
    </div>
  );
};

const QrCodeModal = ({ sala, onClose, onAtualizarSala }) => (
  <Modal isOpen={Boolean(sala)} onClose={onClose} title={sala ? `QR Code: ${sala.sala}` : 'QR Code'}>
    {sala && <QrCodeContent sala={sala} onAtualizarSala={onAtualizarSala} />}
  </Modal>
);

export default QrCodeModal;