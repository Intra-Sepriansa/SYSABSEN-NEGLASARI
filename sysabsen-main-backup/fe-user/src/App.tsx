import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Container, Grid, Stack } from '@mui/material';
import { useSnackbar } from 'notistack';
import KioskShell from './components/KioskShell';
import VideoPane from './components/VideoPane';
import ClockCard from './components/ClockCard';
import TapStatusCard from './components/TapStatusCard';
import HistoryTable from './components/HistoryTable';
import SettingsDialog from './components/SettingsDialog';
import WebcamPanel from './components/WebcamPanel';
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
          if (store.config.photoEnabled) {
            captureAndUpload(latest.id, store.config.photoMaxKB).catch(() => {
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

  const layout = useMemo(
    () => (
      <Container maxWidth="xl">
        <Grid container spacing={3}>
          <Grid item xs={12} lg={8}>
            <VideoPane videoId={config.youtubeVideoId} />
          </Grid>
          <Grid item xs={12} lg={4}>
            <Stack spacing={3}>
              <ClockCard />
              <TapStatusCard />
              <WebcamPanel />
              <HistoryTable />
            </Stack>
          </Grid>
        </Grid>
      </Container>
    ),
    [config.youtubeVideoId]
  );

  return (
    <>
      <KioskShell onOpenSettings={() => setSettingsOpen(true)}>{layout}</KioskShell>
      <SettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  );
}
