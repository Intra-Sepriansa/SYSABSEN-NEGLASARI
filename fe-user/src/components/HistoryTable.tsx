import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography
} from '@mui/material';
import dayjs from 'dayjs';
import { keyframes } from '@emotion/react';
import { useKioskStore } from '../store/useKioskStore';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

const STATUS_META: Record<
  'in' | 'out' | 'auto',
  {
    label: string;
    color: 'success' | 'default' | 'secondary';
  }
> = {
  in: { label: 'MASUK', color: 'success' },
  out: { label: 'PULANG', color: 'secondary' },
  auto: { label: 'AUTO', color: 'default' }
};

function formatTimestamp(timestamp?: string): string {
  if (!timestamp) {
    return '-';
  }
  const parsed = dayjs(timestamp);
  if (!parsed.isValid()) {
    return '-';
  }
  return `${parsed.format('YYYY-MM-DD')} | ${parsed.format('HH:mm:ss')}`;
}

const glowSweep = keyframes`
  0% {
    transform: translateX(-80%);
    opacity: 0;
  }
  50% {
    transform: translateX(0%);
    opacity: 0.22;
  }
  100% {
    transform: translateX(80%);
    opacity: 0;
  }
`;

export default function HistoryTable() {
  const history = useKioskStore((state) => state.history);

  const rows = useMemo(() => history.slice(0, 10), [history]);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (rows.length === 0) {
      setActiveIndex(0);
      return;
    }
    setActiveIndex((prev) => (prev >= rows.length ? 0 : prev));
    const interval = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % rows.length);
    }, 2800);
    return () => {
      window.clearInterval(interval);
    };
  }, [rows.length]);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        borderRadius: 2,
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        overflow: 'hidden'
      }}
    >
      <Box
        sx={{
          px: 3,
          py: 2,
          borderBottom: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          flexDirection: 'column',
          gap: 0.5
        }}
      >
        <Typography variant="h6" fontWeight={700}>
          Histori Absensi
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Menampilkan 10 data terbaru
        </Typography>
      </Box>
      <TableContainer sx={{ flex: 1 }}>
        <Table
          stickyHeader
          size="small"
          sx={{
            minWidth: 640,
            tableLayout: 'fixed',
            '& .MuiTableCell-head': {
              fontWeight: 700,
              textTransform: 'none',
              bgcolor: 'background.default',
              letterSpacing: 0.4,
              py: 1.25
            },
            '& .MuiTableCell-root': {
              borderColor: 'divider',
              px: 2.5,
              py: 1.5
            }
          }}
        >
          <TableHead>
            <TableRow>
              <TableCell align="center" sx={{ width: 72 }}>
                No
              </TableCell>
              <TableCell sx={{ width: '32%' }}>Nama</TableCell>
              <TableCell sx={{ width: '38%', whiteSpace: 'nowrap' }}>Waktu</TableCell>
              <TableCell align="center" sx={{ width: '18%' }}>
                Status
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} sx={{ py: 6 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 3
                    }}
                  >
                    <Box sx={{ width: 220, maxWidth: '100%' }}>
                      <DotLottieReact
                        src="https://lottie.host/b1b1d214-a2db-4ae7-8aa3-1b00b0ef6e58/3Kb5imLmY2.lottie"
                        loop
                        autoplay
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary" textAlign="center">
                      Belum ada data absensi
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row, index) => {
                const status = STATUS_META[row.type] ?? { label: row.type?.toUpperCase() ?? '-', color: 'default' };
                const isActive = activeIndex === index;
                const zebra = index % 2 === 0 ? 'transparent' : 'action.hover';
                return (
                  <TableRow
                    key={row.id}
                    hover
                    sx={{
                      position: 'relative',
                      overflow: 'hidden',
                      bgcolor: isActive ? 'action.selected' : zebra,
                      transition: 'background-color 0.4s ease',
                      '&::after': isActive
                        ? {
                            content: '""',
                            position: 'absolute',
                            inset: 0,
                            background:
                              'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.55) 50%, transparent 100%)',
                            animation: `${glowSweep} 2.4s ease-in-out infinite`,
                            pointerEvents: 'none'
                          }
                        : {}
                    }}
                  >
                    <TableCell align="center" sx={{ fontWeight: 600 }}>
                      {index + 1}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 500 }}>{row.name ?? '-'}</TableCell>
                    <TableCell
                      sx={{
                        fontFamily: 'monospace',
                        letterSpacing: 0.4,
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {formatTimestamp(row.tapTime)}
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={status.label}
                        color={status.color}
                        size="small"
                        sx={{ fontWeight: 600, minWidth: 88 }}
                      />
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
