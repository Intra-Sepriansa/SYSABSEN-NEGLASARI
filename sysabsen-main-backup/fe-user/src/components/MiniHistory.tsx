import { Stack, Chip } from '@mui/material';
import { AttendanceRow } from '../store/useKioskStore';

interface Props {
  history: AttendanceRow[];
}

export function MiniHistory({ history }: Props) {
  return (
    <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', maxWidth: 360 }}>
      {history.slice(0, 6).map((item) => {
        const firstName = item.name ? item.name.split(' ')[0] : 'Unknown';
        return (
        <Chip
          key={item.id}
          label={`${firstName} • ${item.type.toUpperCase()}`}
          color={item.flags?.late ? 'warning' : 'default'}
          variant={item.flags?.late ? 'filled' : 'outlined'}
        />
        );
      })}
    </Stack>
  );
}

export default MiniHistory;
