import { api } from '../api/client';
import { useKioskStore } from '../store/useKioskStore';
import { useThemeStore, type ThemeMode } from '../theme';

type CaptureFn = (maxWidth?: number, maxKB?: number) => Promise<string>;

declare global {
  interface Window {
    __webcam_capture__?: CaptureFn;
  }
}

const MIN_UPLOAD_INTERVAL = 1_500;
let lastUploadAt = 0;

function getCapture(): CaptureFn {
  if (typeof window === 'undefined' || typeof window.__webcam_capture__ !== 'function') {
    throw new Error('Webcam belum siap untuk capture');
  }
  return window.__webcam_capture__;
}

async function addWatermark(base64: string, text: string, mode: ThemeMode): Promise<string> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = image.width;
      canvas.height = image.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context unavailable'));
        return;
      }
      ctx.drawImage(image, 0, 0);
      const padding = canvas.width * 0.02;
      const fontSize = Math.max(16, Math.round(canvas.width * 0.025));
      ctx.font = `${fontSize}px Poppins, Arial, sans-serif`;
      ctx.textBaseline = 'bottom';
      ctx.fillStyle = mode === 'dark' ? 'rgba(236, 239, 244, 0.75)' : 'rgba(15, 23, 42, 0.75)';
      ctx.strokeStyle = mode === 'dark' ? 'rgba(15, 23, 42, 0.5)' : 'rgba(226, 232, 240, 0.6)';
      ctx.lineWidth = Math.max(2, Math.round(canvas.width * 0.0025));
      ctx.strokeText(text, padding, canvas.height - padding);
      ctx.fillText(text, padding, canvas.height - padding);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      resolve(dataUrl.replace(/^data:image\/jpeg;base64,/, ''));
    };
    image.onerror = () => reject(new Error('Gagal memuat hasil capture untuk watermark'));
    image.src = `data:image/jpeg;base64,${base64}`;
  });
}

interface CaptureOptions {
  force?: boolean;
}

export async function captureAndUpload(attendanceId: number, maxKB?: number, options?: CaptureOptions) {
  const { config, setPhotoStatus } = useKioskStore.getState();
  if (!config.photoEnabled) {
    return null;
  }
  const now = Date.now();
  if (!options?.force && now - lastUploadAt < MIN_UPLOAD_INTERVAL) {
    return null;
  }

  try {
    setPhotoStatus('uploading');
    const capture = getCapture();
    const rawBase64 = await capture(800, maxKB ?? config.photoMaxKB);
    const timestamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0];
    const watermark = `Kel. Neglasari – Kiosk-${config.deviceId || 'NA'} – ${timestamp}`;
    const mode = useThemeStore.getState().mode;
    const payload = await addWatermark(rawBase64, watermark, mode);
    await api.post(`/api/attendances/${attendanceId}/photo`, { image_base64: payload });
    setPhotoStatus('success');
    if (!options?.force) {
      lastUploadAt = now;
    }
  } catch (error) {
    setPhotoStatus('error');
    lastUploadAt = 0;
    throw error;
  } finally {
    setTimeout(() => useKioskStore.getState().setPhotoStatus('idle'), 3_000);
  }
}

if (typeof window !== 'undefined' && import.meta.env.MODE !== 'production') {
  (window as typeof window & { __captureAndUpload__?: typeof captureAndUpload }).__captureAndUpload__ =
    captureAndUpload;
}
