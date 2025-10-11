import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Box, Card, CardContent, Chip, Stack, Typography } from '@mui/material';
import CameraAltRoundedIcon from '@mui/icons-material/CameraAltRounded';
import WarningRoundedIcon from '@mui/icons-material/WarningRounded';
import ReplayRoundedIcon from '@mui/icons-material/ReplayRounded';
import { useKioskStore } from '../store/useKioskStore';

type CaptureFn = (maxWidth?: number, maxKB?: number) => Promise<string>;

declare global {
  interface Window {
    __webcam_capture__?: CaptureFn;
  }
}

const MAX_WIDTH = 800;
const MAX_KB = 500;

export default function WebcamPanel() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resolution, setResolution] = useState<{ width: number; height: number } | null>(null);
  const photoMaxKB = useKioskStore((state) => state.config.photoMaxKB);

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
        (err as DOMException)?.message ?? 'Kamera tidak dapat diakses. Periksa izin browser & perangkat.';
      setError(message);
      setIsActive(false);
    }
  }, []);

  const captureBase64 = useCallback<CaptureFn>(
    async (maxWidth = MAX_WIDTH, maxKB = MAX_KB) => {
      if (!videoRef.current) {
        throw new Error('Webcam belum siap');
      }
      const video = videoRef.current;
      if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
        throw new Error('Webcam belum memuat frame');
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

  const statusChip = useMemo(
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

  return (
    <Card variant="outlined" sx={{ overflow: 'hidden' }}>
      <CardContent sx={{ p: 2 }}>
        <Stack spacing={1.5}>
          <Typography variant="subtitle1" fontWeight={600}>
            Webcam Monitoring
          </Typography>
          <Box
            sx={{
              position: 'relative',
              borderRadius: 2,
              overflow: 'hidden',
              bgcolor: 'common.black',
              aspectRatio: '16 / 9'
            }}
          >
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: isActive ? 'block' : 'none' }}
            />
            {!isActive && (
              <Stack
                spacing={1}
                alignItems="center"
                justifyContent="center"
                sx={{
                  position: 'absolute',
                  inset: 0,
                  bgcolor: 'rgba(15,23,42,0.7)',
                  color: 'common.white',
                  textAlign: 'center',
                  p: 2
                }}
              >
                <ReplayRoundedIcon fontSize="large" />
                <Typography variant="body2">Mengaktifkan kamera…</Typography>
                {error && (
                  <Typography variant="caption" sx={{ maxWidth: 240 }}>
                    {error}
                  </Typography>
                )}
              </Stack>
            )}
          </Box>
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
            {statusChip}
            {resolution && (
              <Chip size="small" variant="outlined" label={`Resolusi ${resolution.width}×${resolution.height}`} />
            )}
            <Chip size="small" variant="outlined" label={`≤ ${photoMaxKB} KB`} />
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}
