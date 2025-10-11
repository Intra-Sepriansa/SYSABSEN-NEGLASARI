import { Grid, Paper, Stack, Typography } from '@mui/material';

interface Props {
  present: number;
  late: number;
  earlyLeave: number;
  offlineDevices: number;
}

export function StatsMiniGrid({ present, late, earlyLeave, offlineDevices }: Props) {
  const entries = [
    { label: 'Hadir', value: present, color: 'success.main' },
    { label: 'Telat', value: late, color: 'warning.main' },
    { label: 'Pulang Awal', value: earlyLeave, color: 'secondary.main' },
    { label: 'Offline', value: offlineDevices, color: 'error.main' }
  ];

  return (
    <Grid container spacing={2}>
      {entries.map((entry) => (
        <Grid item xs={6} key={entry.label}>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              height: '100%',
              borderRadius: 2,
              border: '1px solid rgba(255,255,255,0.12)',
              background: 'rgba(11,18,32,0.65)',
              backdropFilter: 'blur(12px)'
            }}
          >
            <Stack spacing={1}>
              <Typography variant="subtitle2" color="text.secondary">
                {entry.label}
              </Typography>
              <Typography variant="h4" sx={{ color: entry.color }}>
                {entry.value}
              </Typography>
            </Stack>
          </Paper>
        </Grid>
      ))}
    </Grid>
  );
}

export default StatsMiniGrid;
