const toNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const rawApiUrl = (import.meta.env.VITE_API_URL || '').trim().replace(/\/+$/, '');

const resolveApiUrl = () => {
  if (rawApiUrl) {
    if (
      typeof window !== 'undefined' &&
      window.location.hostname !== 'localhost' &&
      window.location.hostname !== '127.0.0.1' &&
      /localhost|127\.0\.0\.1/.test(rawApiUrl)
    ) {
      return rawApiUrl.replace(/localhost|127\.0\.0\.1/, window.location.hostname);
    }
    return rawApiUrl;
  }

  if (typeof window !== 'undefined') {
    return `http://${window.location.hostname}:3000`;
  }

  return '';
};

const apiUrl = resolveApiUrl();

if (!apiUrl) {
  console.error('VITE_API_URL não definida. Copie o .env.example para .env e preencha os valores.');
}

export const env = {
  apiUrl,
  apiTimeoutMs: toNumber(import.meta.env.VITE_API_TIMEOUT_MS, 10000),
  scanCooldownMs: toNumber(import.meta.env.VITE_SCAN_COOLDOWN_MS, 3000),
};