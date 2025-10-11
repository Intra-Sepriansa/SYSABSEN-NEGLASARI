import MemoryRoundedIcon from '@mui/icons-material/MemoryRounded';
import { Chip, Tooltip } from '@mui/material';
import { useMemo } from 'react';
import { useKioskStore } from '../store/useKioskStore';

interface Props {
  deviceId?: string;
}

export default function DeviceBadge({ deviceId }: Props) {
  const fallbackId = useKioskStore((state) => state.config.deviceId);
  const idToShow = useMemo(() => deviceId || fallbackId || 'Unknown', [deviceId, fallbackId]);

  return (
    <Tooltip title={`Kiosk ID: ${idToShow}`}>
      <Chip
        color="primary"
        variant="outlined"
        icon={<MemoryRoundedIcon fontSize="small" />}
        label={`Kiosk-${idToShow}`}
      />
    </Tooltip>
  );
}
