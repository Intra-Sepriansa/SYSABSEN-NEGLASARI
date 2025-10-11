import { Box, Typography } from '@mui/material';

interface Props {
  entries: string[];
}

export function AttendanceTicker({ entries }: Props) {
  const content = entries.length
    ? entries.map((name, idx) => `${name}${idx === entries.length - 1 ? '' : ' • '}`).join(' ')
    : 'Belum ada tap terkini';

  return (
    <Box
      sx={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 2,
        border: '1px solid rgba(255,255,255,0.12)',
        background: 'rgba(16,24,39,0.85)',
        backdropFilter: 'blur(10px)',
        py: 1
      }}
    >
      <Typography
        variant="h6"
        sx={{
          whiteSpace: 'nowrap',
          display: 'inline-block',
          animation: 'marquee 20s linear infinite',
          '@keyframes marquee': {
            '0%': { transform: 'translateX(100%)' },
            '100%': { transform: 'translateX(-100%)' }
          }
        }}
      >
        {content}
      </Typography>
    </Box>
  );
}

export default AttendanceTicker;
