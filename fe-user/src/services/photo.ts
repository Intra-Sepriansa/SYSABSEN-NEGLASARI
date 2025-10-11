import { api } from '../api/client';
import { useKioskStore } from '../store/useKioskStore';

type CaptureFn = (maxWidth?: number, maxKB?: number) => Promise<string>;

declare global {
  interface Window {
    __webcam_capture__?: CaptureFn;
  }
}

const MIN_UPLOAD_INTERVAL_MS = 750;
let lastUploadedAt = 0;

function resolveCapture(): CaptureFn {
  if (typeof window === 'undefined' || typeof window.__webcam_capture__ !== 'function') {
    throw new Error('Webcam belum siap merekam gambar.');
  }
  return window.__webcam_capture__;
}

export async function captureAndUpload(attendanceId: number, maxWidth = 800, maxKB?: number) {
  const { config, setPhotoStatus } = useKioskStore.getState();
  if (!config.photoEnabled) {
    return;
  }

  const now = Date.now();
  if (now - lastUploadedAt < MIN_UPLOAD_INTERVAL_MS) {
    return;
  }

  try {
    setPhotoStatus('uploading');
    const capture = resolveCapture();
    const base64 = await capture(maxWidth, maxKB ?? config.photoMaxKB);
    if (!base64) {
      throw new Error('Hasil capture kosong.');
    }
    await api.post(`/api/attendances/${attendanceId}/photo`, { image_base64: base64 });
    setPhotoStatus('success');
    lastUploadedAt = now;
  } catch (error) {
    setPhotoStatus('error');
    throw error;
  } finally {
    setTimeout(() => useKioskStore.getState().setPhotoStatus('idle'), 2_000);
  }
}
