import { useMemo } from 'react';
import {
  Card,
  CardContent,
  Chip,
  Stack,
  Typography,
  Alert,
  Divider,
  Fade
} from '@mui/material';
import dayjs from 'dayjs';
import { useKioskStore } from '../store/useKioskStore';
import { id as locale } from '../i18n/id';
import { formatTapTime } from '../utils/time';

const statusTone: Record<string, { color: 'default' | 'success' | 'warning' | 'error'; label: string }> = {
  IDLE: { color: 'default', label: 'SIAP TAP' },
  SUCCESS: { color: 'success', label: 'SUDAH TERABSEN' },
  LATE: { color: 'warning', label: 'TERLAMBAT' },
  EARLY: { color: 'warning', label: 'PULANG CEPAT' },
  REJECTED: { color: 'error', label: 'DITOLAK' },
  OFFLINE: { color: 'warning', label: 'MODE OFFLINE' },
  ERROR: { color: 'error', label: 'GANGGUAN SISTEM' }
};

export function TapStatusCard() {
  const { status, lastAttendance, latencyMs, photoStatus } = useKioskStore(
    (state) => ({
      status: state.status,
      lastAttendance: state.lastAttendance,
      latencyMs: state.latencyMs,
      photoStatus: state.photoStatus
    })
  );

  const tone = useMemo(() => statusTone[status] ?? statusTone.IDLE, [status]);

  return (
    <Card
      variant="outlined"
      role="status"
      aria-live={status === 'IDLE' ? 'off' : 'assertive'}
      sx={{
        borderWidth: 2,
        borderColor: (theme) =>
          tone.color === 'default' ? theme.palette.divider : theme.palette[tone.color].main,
        bgcolor: 'background.paper'
      }}
    >
      <CardContent>
        <Stack spacing={2}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h4" fontWeight={600}>
              {tone.label}
            </Typography>
            {status !== 'IDLE' && (
              <Chip
                label={lastAttendance?.type.toUpperCase()}
                color="primary"
                variant="outlined"
                size="small"
              />
            )}
          </Stack>
          {lastAttendance && (
            <Stack spacing={1}>
              <Typography variant="h5" fontWeight={500}>
                {lastAttendance.name}
                {lastAttendance.nim && (
                  <Typography component="span" variant="subtitle1" sx={{ ml: 1 }} color="text.secondary">
                    ({lastAttendance.nim})
                  </Typography>
                )}
              </Typography>
              <Typography variant="subtitle1" color="text.secondary">
                {formatTapTime(lastAttendance.tapTime)}
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                {lastAttendance.course && (
                  <Chip label={lastAttendance.course} variant="outlined" color="secondary" size="small" />
                )}
                {lastAttendance.device && (
                  <Chip
                    label={`${locale.labels.device}: ${lastAttendance.device}`}
                    variant="outlined"
                    size="small"
                  />
                )}
                {typeof latencyMs === 'number' && (
                  <Chip
                    label={`${locale.labels.latency}: ${latencyMs} ms`}
                    size="small"
                    variant="outlined"
                    color="primary"
                  />
                )}
                {lastAttendance.flags?.late && (
                  <Chip label="Late" color="warning" size="small" variant="outlined" />
                )}
                {lastAttendance.flags?.early_leave && (
                  <Chip label="Early Leave" color="warning" size="small" variant="outlined" />
                )}
                {lastAttendance.flags?.rejected_reason && (
                  <Chip label={lastAttendance.flags.rejected_reason} color="error" size="small" />
                )}
              </Stack>
              <Typography variant="caption" color="text.secondary">
                {`Event diterima ${dayjs(lastAttendance.createdAt ?? lastAttendance.tapTime).fromNow()}`}
              </Typography>
            </Stack>
          )}
          <Divider light />
          <Stack spacing={1}>
            <Fade in={photoStatus !== 'idle'}>
              <div>
                {photoStatus === 'uploading' && (
                  <Alert severity="info" variant="outlined">
                    {locale.labels.processing}
                  </Alert>
                )}
                {photoStatus === 'error' && (
                  <Alert severity="error" variant="outlined">
                    {locale.labels.photoError}
                  </Alert>
                )}
                {photoStatus === 'success' && (
                  <Alert severity="success" variant="outlined">
                    {locale.labels.photoSuccess}
                  </Alert>
                )}
              </div>
            </Fade>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}

export default TapStatusCard;
