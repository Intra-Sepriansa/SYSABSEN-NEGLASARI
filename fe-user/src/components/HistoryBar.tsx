import { Box, Chip, Typography } from '@mui/material';
import dayjs from 'dayjs';
import { useMemo } from 'react';
import { useKioskStore } from '../store/useKioskStore';

function formatCounter(counter: number): string {
  return counter.toString().padStart(3, '0');
}

function resolveStatus(type?: 'in' | 'out' | 'auto'): { label: string; color: 'success' | 'secondary' } {
  if (type === 'out') {
    return { label: 'PULANG', color: 'secondary' };
  }
  return { label: 'MASUK', color: 'success' };
}

export default function HistoryBar() {
  const { lastAttendance, history } = useKioskStore((state) => ({
    lastAttendance: state.lastAttendance,
    history: state.history
  }));

  const { text, chip } = useMemo(() => {
    if (!lastAttendance) {
      return {
        text: 'Belum ada data absensi',
        chip: null
      };
    }

    const todayCount = history.filter((item) =>
      dayjs(item.tapTime).isSame(dayjs(), 'day')
    ).length;
    const timestamp = dayjs(lastAttendance.tapTime);
    const counter = formatCounter(todayCount || 1);
    const status = resolveStatus(lastAttendance.type);

    const description = `${counter} | ${lastAttendance.name ?? '-'} | ${timestamp.format(
      'YYYY-MM-DD'
    )} | ${timestamp.format('HH:mm:ss')} | ${status.label}`;

    return {
      text: description,
      chip: status
    };
  }, [history, lastAttendance]);

  return (
    <Box
      sx={{
        height: 60,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        px: 2,
        borderRadius: 2,
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        overflow: 'hidden',
        gap: 2
      }}
    >
      <Typography
        variant="subtitle1"
        sx={{
          fontWeight: 600,
          fontSize: 'clamp(14px, 1.8vh, 18px)',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          flex: 1
        }}
      >
        {text}
      </Typography>
      {chip && (
        <Chip
          label={chip.label}
          color={chip.color}
          size="small"
          sx={{ fontWeight: 600, letterSpacing: 0.5 }}
        />
      )}
    </Box>
  );
}
