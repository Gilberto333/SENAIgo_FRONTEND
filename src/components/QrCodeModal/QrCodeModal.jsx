import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import Modal from '../Modal/Modal';
import Button from '../Button/Button';
import Alert from '../Alert/Alert';
import { buildQrPayload } from '../../utils/qrCode';
import { Download, ImagePlus, Trash2, Save, Sparkles } from 'lucide-react';
import styles from './QrCodeModal.module.css';

// Função auxiliar para formatar Date ou ISO string no padrão YYYY-MM-DDTHH:mm do input local
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
  const [borderWidth, setBorderWidth] = useState(16); // 0 = sem borda
  const [logoSrc, setLogoSrc] = useState(null);

  // Estados do controle de leitura e horário (alinhados com bloqueada_ate)
  const [bloquearLeitura, setBloquearLeitura] = useState(Boolean(sala.bloquear_leitura));
  const [bloqueadaAte, setBloqueadaAte] = useState(() => formatarParaInputLocal(sala.bloqueada_ate));
  const [salvando, setSalvando] = useState(false);

  // Atualiza os estados se o usuário abrir o modal de outra sala
  useEffect(() => {
    setBloquearLeitura(Boolean(sala.bloquear_leitura));
    setBloqueadaAte(formatarParaInputLocal(sala.bloqueada_ate));
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
    return () => { ativo = false; };
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
    // Aplica o tema dourado mantendo bom contraste para leitura da câmera
    setQrColor('#B45309');      // Dourado escuro / âmbar intenso
    setBgColor('#FFFBEB');      // Fundo creme dourado bem claro
    setBorderColor('#F59E0B');  // Borda dourada vibrante
    setBorderWidth((prev) => (prev === 0 ? 16 : prev));

    // Define o tempo para agora + 1 hora e 30 minutos (90 minutos)
    const emUmaHoraEMeia = new Date(Date.now() + 90 * 60 * 1000);
    setBloqueadaAte(formatarParaInputLocal(emUmaHoraEMeia));
    setBloquearLeitura(false); // Garante que a leitura esteja liberada durante esse tempo

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

      // Ajuste a URL base caso use variável de ambiente (ex: import.meta.env.VITE_API_URL)
      const response = await fetch(`http://localhost:3000/bloquearLeitura/${sala.salaId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          bloquear_leitura: bloquearLeitura,
          bloqueada_ate: dataFormatada,
        }),
      });

      const dados = await response.json();

      if (!response.ok) {
        throw new Error(dados.erro || 'Falha ao salvar configuração.');
      }

      setSucesso('Regras de leitura salvas com sucesso!');
      if (onAtualizarSala) {
        onAtualizarSala(dados.sala);
      }
    } catch (err) {
      setError(err.message || 'Erro ao salvar o horário/bloqueio da sala.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className={styles.content}>
      {error && <Alert variant="error">{error}</Alert>}
      {sucesso && <Alert variant="success">{sucesso}</Alert>}

      {/* Botão Preset Lendário */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px', width: '100%' }}>
        <button
          type="button"
          onClick={ativarModoLendario}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '8px 16px',
            borderRadius: '8px',
            border: '1px solid #D97706',
            background: 'linear-gradient(135deg, #FDE047 0%, #F59E0B 50%, #D97706 100%)',
            color: '#451A03',
            fontWeight: 700,
            fontSize: '0.875rem',
            cursor: 'pointer',
            boxShadow: '0 2px 6px rgba(245, 158, 11, 0.35)',
          }}
        >
          <Sparkles size={16} />
          Lendário (Dourado • 1h30)
        </button>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center', marginBottom: '12px' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.875rem', cursor: 'pointer' }}>
          <input
            type="color"
            value={qrColor}
            onChange={(e) => setQrColor(e.target.value)}
            style={{ width: '28px', height: '28px', border: 'none', background: 'none', cursor: 'pointer' }}
          />
          Cor
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.875rem', cursor: 'pointer' }}>
          <input
            type="color"
            value={bgColor}
            onChange={(e) => setBgColor(e.target.value)}
            style={{ width: '28px', height: '28px', border: 'none', background: 'none', cursor: 'pointer' }}
          />
          Fundo
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.875rem', cursor: 'pointer' }}>
          <input
            type="color"
            value={borderColor}
            onChange={(e) => setBorderColor(e.target.value)}
            disabled={borderWidth === 0}
            style={{ width: '28px', height: '28px', border: 'none', background: 'none', cursor: 'pointer' }}
          />
          Borda
        </label>

        <select
          value={borderWidth}
          onChange={(e) => setBorderWidth(Number(e.target.value))}
          style={{
            padding: '4px 8px',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '0.875rem',
            cursor: 'pointer',
          }}
        >
          <option value={0}>Sem borda</option>
          <option value={8}>Borda fina</option>
          <option value={16}>Borda média</option>
          <option value={28}>Borda grossa</option>
        </select>

        <label
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '0.875rem',
            cursor: 'pointer',
          }}
        >
          <ImagePlus size={16} />
          {logoSrc ? 'Trocar logo' : 'Adicionar logo'}
          <input type="file" accept="image/*" onChange={handleUploadLogo} hidden />
        </label>

        {logoSrc && (
          <button
            type="button"
            onClick={() => setLogoSrc(null)}
            title="Remover logo"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 8px',
              border: '1px solid #fca5a5',
              borderRadius: '6px',
              background: '#fef2f2',
              color: '#dc2626',
              fontSize: '0.875rem',
              cursor: 'pointer',
            }}
          >
            <Trash2 size={16} />
            Remover
          </button>
        )}
      </div>

      {image && <img src={image} alt={`QR Code da sala ${sala.sala}`} className={styles.image} />}
      <p className={styles.hint}>Imprima e cole este QR Code na sala <strong>{sala.sala}</strong>.</p>
      {image && <Button fullWidth icon={Download} onClick={baixar}>Baixar PNG</Button>}

      {/* Painel de Controle de Tempo e Bloqueio */}
      <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '16px', marginTop: '16px', width: '100%' }}>
        <p style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '10px' }}>
          Controle de Leitura do QR Code
        </p>

        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem', marginBottom: '12px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={bloquearLeitura}
            onChange={(e) => setBloquearLeitura(e.target.checked)}
            style={{ width: '16px', height: '16px', cursor: 'pointer' }}
          />
          Bloquear leitura imediatamente
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.875rem', marginBottom: '12px' }}>
          Bloquear automaticamente após (data e hora):
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="datetime-local"
              value={bloqueadaAte}
              onChange={(e) => setBloqueadaAte(e.target.value)}
              style={{
                flex: 1,
                padding: '6px 10px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '0.875rem',
              }}
            />
            {bloqueadaAte && (
              <button
                type="button"
                onClick={() => setBloqueadaAte('')}
                style={{
                  padding: '6px 10px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  background: '#f9fafb',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                }}
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