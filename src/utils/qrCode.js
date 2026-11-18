const PREFIX_SALA = 'senaigo:sala:';
const PREFIX_PALESTRA = 'senaigo:palestra:';

export const buildQrPayload = (salaId) => `${PREFIX_SALA}${salaId}`;
export const buildPalestraQrPayload = (palestraId) => `${PREFIX_PALESTRA}${palestraId}`;

const toId = (value) => {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : null;
};

export const parseQrPayload = (text) => {
  const content = String(text || '').trim();
  if (!content) return null;

  const lower = content.toLowerCase();

  // 1. Verifica se é QR Code de Palestra (Quiz)
  if (lower.startsWith(PREFIX_PALESTRA)) {
    const id = toId(content.slice(PREFIX_PALESTRA.length));
    return id ? { tipo: 'palestra', id } : null;
  }

  // 2. Verifica se é QR Code de Sala normal
  if (lower.startsWith(PREFIX_SALA)) {
    const id = toId(content.slice(PREFIX_SALA.length));
    return id ? { tipo: 'sala', id } : null;
  }

  // Mantém compatibilidade com JSON e URL caso existam
  if (content.startsWith('{')) {
    try {
      const data = JSON.parse(content);
      if (data.palestraId) {
        const id = toId(data.palestraId);
        return id ? { tipo: 'palestra', id } : null;
      }
      const id = toId(data.salaId);
      return id ? { tipo: 'sala', id } : null;
    } catch {
      return null;
    }
  }

  try {
    const url = new URL(content);
    const palestraId = toId(url.searchParams.get('palestraId'));
    if (palestraId) return { tipo: 'palestra', id: palestraId };

    const fromQuery = toId(url.searchParams.get('salaId'));
    if (fromQuery) return { tipo: 'sala', id: fromQuery };

    const match = url.pathname.match(/\/sala\/(\d+)\/?$/i);
    const matchId = match ? toId(match[1]) : null;
    return matchId ? { tipo: 'sala', id: matchId } : null;
  } catch {
    return null;
  }
};