import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Stack,
  Tooltip,
  Typography
} from '@mui/material';
import CameraAltRoundedIcon from '@mui/icons-material/CameraAltRounded';
import WarningRoundedIcon from '@mui/icons-material/WarningRounded';
import RestartAltRoundedIcon from '@mui/icons-material/RestartAltRounded';
import { useSnackbar } from 'notistack';
import { captureAndUpload } from '../services/photo';
import { useKioskStore } from '../store/useKioskStore';

const MAX_DEFAULT_WIDTH = 800;
const MAX_DEFAULT_KB = 500;

type CaptureFn = (maxWidth?: number, maxKB?: number) => Promise<string>;

declare global {
  interface Window {
    __webcam_capture__?: CaptureFn;
  }
}

export default function WebcamPanel() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resolution, setResolution] = useState<{ width: number; height: number } | null>(null);
  const { enqueueSnackbar } = useSnackbar();
  const { lastAttendance, config } = useKioskStore((state) => ({
    lastAttendance: state.lastAttendance,
    config: state.config
  }));
  const [manualLoading, setManualLoading] = useState(false);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setIsActive(false);
  }, []);

  const startStream = useCallback(async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'environment'
        },
        audio: false
      });
      streamRef.current = stream;
      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        const handleMetadata = () => {
          setResolution({
            width: video.videoWidth || 1280,
            height: video.videoHeight || 720
          });
        };
        video.addEventListener('loadedmetadata', handleMetadata, { once: true });
        await video.play();
        handleMetadata();
        setIsActive(true);
      }
    } catch (err) {
      const message =
        (err as DOMException)?.message ??
        'Kamera tidak dapat diakses. Periksa izin browser dan perangkat.';
      setError(message);
      setIsActive(false);
    }
  }, []);

  const captureBase64 = useCallback<CaptureFn>(
    async (maxWidth = MAX_DEFAULT_WIDTH, maxKB = MAX_DEFAULT_KB) => {
      if (!videoRef.current) {
        throw new Error('Video belum siap');
      }
      const video = videoRef.current;
      if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
        throw new Error('Video belum memuat frame');
      }

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Canvas context tidak tersedia');
      }

      const sourceWidth = video.videoWidth || 1280;
      const sourceHeight = video.videoHeight || 720;
      const scale = Math.min(1, maxWidth / sourceWidth);
      canvas.width = Math.round(sourceWidth * scale);
      canvas.height = Math.round(sourceHeight * scale);

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      let quality = 0.92;
      let dataUrl = canvas.toDataURL('image/jpeg', quality);
      const toKB = (input: string) => Math.ceil((atob(input.split(',')[1]).length / 1024) * 100) / 100;

      while (toKB(dataUrl) > maxKB && quality >= 0.5) {
        quality -= 0.05;
        dataUrl = canvas.toDataURL('image/jpeg', quality);
      }

      return dataUrl.replace(/^data:image\/jpeg;base64,/, '');
    },
    []
  );

  useEffect(() => {
    startStream();
    return () => {
      stopStream();
      if (window.__webcam_capture__ === captureBase64) {
        delete window.__webcam_capture__;
      }
    };
  }, [captureBase64, startStream, stopStream]);

  useEffect(() => {
    window.__webcam_capture__ = captureBase64;
  }, [captureBase64]);

  const handleRetry = () => {
    stopStream();
    void startStream();
  };

  const liveStatusChip = useMemo(
    () =>
      isActive ? (
        <Chip
          color="success"
          size="small"
          icon={<CameraAltRoundedIcon fontSize="small" />}
          label="Camera ON"
        />
      ) : (
        <Chip
          color="error"
          size="small"
          icon={<WarningRoundedIcon fontSize="small" />}
          label="Camera OFF"
        />
      ),
    [isActive]
  );

  const handleManualCapture = async () => {
    if (!lastAttendance) {
      enqueueSnackbar('Belum ada absensi untuk dikaitkan.', { variant: 'info' });
      return;
    }
    try {
      setManualLoading(true);
      await captureAndUpload(lastAttendance.id, config.photoMaxKB, { force: true });
      enqueueSnackbar('Foto manual terunggah', { variant: 'success' });
    } catch (err) {
      enqueueSnackbar('Capture manual gagal. Periksa koneksi atau izin kamera.', { variant: 'error' });
    } finally {
      setManualLoading(false);
    }
  };

  return (
    <Card variant="outlined">
      <CardHeader
        title="Webcam"
        subheader="Streaming aktif untuk monitoring & bukti foto"
        action={
          <Tooltip title="Ambil foto manual untuk petugas">
            <span>
              <Button
                onClick={handleManualCapture}
                size="small"
                variant="outlined"
                startIcon={<CameraAltRoundedIcon fontSize="small" />}
                disabled={!isActive || !config.photoEnabled || manualLoading}
              >
                {manualLoading ? 'Mengambil...' : 'Capture Now'}
              </Button>
            </span>
          </Tooltip>
        }
      />
      <CardContent>
        <Box sx={{ position: 'relative', borderRadius: 2, overflow: 'hidden' }}>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{ width: '100%', display: isActive ? 'block' : 'none' }}
          />
          {isActive && (
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                backgroundImage:
                  'linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)',
                backgroundSize: '25% 25%',
                pointerEvents: 'none'
              }}
            />
          )}
          {!isActive && (
            <Box
              sx={{
                display: 'grid',
                placeItems: 'center',
                minHeight: 180,
                bgcolor: 'action.hover',
                borderRadius: 2,
                textAlign: 'center',
                gap: 1,
                p: 3
              }}
            >
              <Typography variant="subtitle1" fontWeight={600}>
                Kamera belum aktif
              </Typography>
              {error && (
                <Typography variant="body2" color="text.secondary">
                  {error}
                </Typography>
              )}
              <Button
                startIcon={<RestartAltRoundedIcon />}
                variant="contained"
                onClick={handleRetry}
                size="small"
              >
                Coba Lagi
              </Button>
              <Typography variant="caption" color="text.secondary">
                Pastikan izin kamera di browser sudah diberikan dan tidak dipakai aplikasi lain.
              </Typography>
            </Box>
          )}
        </Box>
        <Stack direction="row" spacing={1} mt={2} alignItems="center" flexWrap="wrap">
          {liveStatusChip}
          {resolution && (
            <Chip
              size="small"
              variant="outlined"
              label={`Resolusi ${resolution.width}×${resolution.height}`}
            />
          )}
          <Chip size="small" variant="outlined" label={`≤ ${config.photoMaxKB} KB`} />
        </Stack>
      </CardContent>
    </Card>
  );
}
