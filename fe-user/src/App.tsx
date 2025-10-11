import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Box, Container, Grid } from '@mui/material';
import { useSnackbar } from 'notistack';
import VideoPane from './components/VideoPane';
import ClockCard from './components/ClockCard';
import SettingsDialog from './components/SettingsDialog';
import WebcamPanel from './components/WebcamPanel';
import HistoryTable from './components/HistoryTable';
import HeaderBar from './components/HeaderBar';
import { api } from './api/client';
import { connectPusher, disconnectPusher } from './services/pusher';
import { captureAndUpload } from './services/photo';
import { useKioskStore, AttendanceRow } from './store/useKioskStore';
import type { AttendancePayload, HealthResponse } from './api/types';
import { calculateLatencyMs } from './utils/time';

type AttendanceResponse = {
  data: AttendancePayload[];
};

function mapAttendance(payload: AttendancePayload): AttendanceRow {
  return {
    id: payload.id,
    name: payload.user?.name ?? 'Unknown User',
    nim: payload.user?.nim,
    course: payload.course,
    device: payload.device?.name ?? payload.device?.id,
    type: payload.type,
    flags: payload.flags,
    tapTime: payload.tap_time,
    createdAt: payload.created_at
  };
}

export default function App() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { enqueueSnackbar } = useSnackbar();
  const {
    config,
    setHistory,
    networkHealth,
    setNetworkHealth,
    setStatus,
    setQueueLag,
    status,
    lastAttendance,
    setLastAttendance
  } = useKioskStore((state) => ({
    config: state.config,
    setHistory: state.setHistory,
    networkHealth: state.networkHealth,
    setNetworkHealth: state.setNetworkHealth,
    setStatus: state.setStatus,
    setQueueLag: state.setQueueLag,
    status: state.status,
    lastAttendance: state.lastAttendance,
    setLastAttendance: state.setLastAttendance
  }));
  const previousAttendanceId = useRef<number | null>(null);
  const initialisedRef = useRef(false);
  const dingRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    dingRef.current = new Audio('/ding.wav');
    if (dingRef.current) {
      dingRef.current.volume = 0.5;
    }
  }, []);

  useEffect(() => {
    if (networkHealth === 'offline') {
      setStatus('OFFLINE');
    } else if (status === 'OFFLINE') {
      setStatus('IDLE');
    }
  }, [networkHealth, setStatus, status]);

  const fetchHistory = useCallback(async () => {
    try {
      const response = await api.get<AttendanceResponse>('/api/attendances', {
        params: { limit: 10 }
      });
      const rows = response.data?.data?.map(mapAttendance) ?? [];
      if (rows.length > 0) {
        const store = useKioskStore.getState();
        const latest = rows[0];
        const hasExisting = Boolean(store.lastAttendance);
        if (latest && hasExisting && latest.id !== store.lastAttendance?.id) {
          const latency = calculateLatencyMs(latest.tapTime);
          store.pushAttendance(latest, latency);
          const shouldCapture = latest.type === 'in' || latest.type === 'out';
          if (shouldCapture && store.config.photoEnabled) {
            captureAndUpload(latest.id, 800, store.config.photoMaxKB).catch(() => {
              enqueueSnackbar('Foto gagal diunggah', { variant: 'warning' });
            });
          }
        }
        setHistory(rows);
        setLastAttendance(latest);
      }
      setNetworkHealth('online');
    } catch (error) {
      console.warn('History fetch failed', error);
      setNetworkHealth('offline');
      setStatus('OFFLINE');
    }
  }, [enqueueSnackbar, setHistory, setLastAttendance, setNetworkHealth, setStatus]);

  const fetchHealth = useCallback(async () => {
    try {
      const response = await api.get<HealthResponse>('/api/health');
      const payload = response.data;
      if (payload.queue_lag_ms !== undefined) {
        setQueueLag(payload.queue_lag_ms);
      }
      if (payload.status === 'ok') {
        setNetworkHealth('online');
      } else if (payload.status === 'degraded') {
        setNetworkHealth('degraded');
      } else {
        setNetworkHealth('offline');
      }
    } catch (error) {
      console.warn('Health check failed', error);
      setNetworkHealth('offline');
    }
  }, [setNetworkHealth, setQueueLag]);

  useEffect(() => {
    fetchHistory();
    fetchHealth();
  }, [fetchHealth, fetchHistory]);

  useEffect(() => {
    const historyInterval = window.setInterval(fetchHistory, 10_000);
    const healthInterval = window.setInterval(fetchHealth, 7_000);
    return () => {
      window.clearInterval(historyInterval);
      window.clearInterval(healthInterval);
    };
  }, [fetchHealth, fetchHistory]);

  useEffect(() => {
    if (!config.pusherKey || !config.pusherCluster) {
      disconnectPusher();
      return;
    }
    connectPusher();
    return () => {
      disconnectPusher();
    };
  }, [config.pusherKey, config.pusherCluster]);

  useEffect(() => {
    if (!lastAttendance) {
      return;
    }
    if (previousAttendanceId.current === lastAttendance.id) {
      return;
    }
    if (!initialisedRef.current) {
      initialisedRef.current = true;
      previousAttendanceId.current = lastAttendance.id;
      return;
    }
    previousAttendanceId.current = lastAttendance.id;
    if (status === 'SUCCESS' || status === 'LATE' || status === 'EARLY') {
      dingRef.current
        ?.play()
        .catch(() => {
          /* ignore autoplay block */
        });
    }
  }, [lastAttendance, status]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'F10') {
        event.preventDefault();
        setSettingsOpen(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const youtubeUrl = useMemo(() => {
    if (config.youtubeUrl && config.youtubeUrl.trim().length > 0) {
      return config.youtubeUrl.trim();
    }
    if (config.youtubeVideoId) {
      return `https://www.youtube.com/watch?v=${config.youtubeVideoId}`;
    }
    return 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
  }, [config.youtubeUrl, config.youtubeVideoId]);

  return (
    <>
      <Box sx={{ height: '100dvh', width: '100vw', overflow: 'hidden', bgcolor: 'background.default' }}>
        <HeaderBar onOpenSettings={() => setSettingsOpen(true)} />
        <Container
          maxWidth="xl"
          sx={{
            height: 'calc(100dvh - 80px)',
            pt: 2,
            pb: 2
          }}
        >
          <Grid container spacing={2} sx={{ height: '100%' }}>
            <Grid item xs={12} lg={8} sx={{ height: '100%' }}>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateRows: '1fr 1fr',
                  gap: 2,
                  height: '100%'
                }}
              >
                <VideoPane youtubeUrl={youtubeUrl} />
                <HistoryTable />
              </Box>
            </Grid>
            <Grid item xs={12} lg={4} sx={{ height: '100%', overflow: 'hidden' }}>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateRows: 'auto 1fr',
                  gap: 2,
                  height: '100%'
                }}
              >
                <ClockCard timeFontSize="clamp(32px, 6vh, 48px)" dateFontSize="clamp(14px, 2vh, 20px)" />
                <WebcamPanel />
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>
      <SettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  );
}
