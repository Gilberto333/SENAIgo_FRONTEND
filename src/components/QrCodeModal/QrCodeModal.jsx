import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import Modal from '../Modal/Modal';
import Button from '../Button/Button';
import Alert from '../Alert/Alert';
import { buildQrPayload } from '../../utils/qrCode';
import { Download, ImagePlus, Trash2 } from 'lucide-react';
import styles from './QrCodeModal.module.css';

const QrCodeContent = ({ sala }) => {
  const [image, setImage] = useState('');
  const [error, setError] = useState('');
  const [qrColor, setQrColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#FFFFFF');
  const [borderColor, setBorderColor] = useState('#000000');
  const [borderWidth, setBorderWidth] = useState(16); // 0 = sem borda
  const [logoSrc, setLogoSrc] = useState(null);

  useEffect(() => {
    let ativo = true;

    async function gerarQrCode() {
      try {
        setError('');
        const totalSize = 600;
        const innerSize = totalSize - borderWidth * 2;

        // 1. Gera o QR Code em um canvas auxiliar com o tamanho interno
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

  const baixar = () => {
    const link = document.createElement('a');
    link.href = image;
    link.download = `qrcode-sala-${sala.salaId}.png`;
    link.click();
  };

  return (
    <div className={styles.content}>
      {error && <Alert variant="error">{error}</Alert>}

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
    </div>
  );
};

const QrCodeModal = ({ sala, onClose }) => (
  <Modal isOpen={Boolean(sala)} onClose={onClose} title={sala ? `QR Code: ${sala.sala}` : 'QR Code'}>
    {sala && <QrCodeContent sala={sala} />}
  </Modal>
);

export default QrCodeModal;