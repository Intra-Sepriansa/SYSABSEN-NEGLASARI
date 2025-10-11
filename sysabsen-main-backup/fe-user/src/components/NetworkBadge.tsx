import { useMemo } from 'react';
import { Chip, Stack, Tooltip, Typography } from '@mui/material';
import OfflineBoltRoundedIcon from '@mui/icons-material/OfflineBoltRounded';
import WifiRoundedIcon from '@mui/icons-material/WifiRounded';
import WarningRoundedIcon from '@mui/icons-material/WarningRounded';
import CameraAltRoundedIcon from '@mui/icons-material/CameraAltRounded';
import { useKioskStore } from '../store/useKioskStore';
import { id as locale } from '../i18n/id';

const statusMapping = {
  online: {
    label: locale.network.online,
    color: 'success' as const,
    icon: <WifiRoundedIcon fontSize="small" />
  },
  degraded: {
    label: locale.network.degraded,
    color: 'warning' as const,
    icon: <WarningRoundedIcon fontSize="small" />
  },
  offline: {
    label: locale.network.offline,
    color: 'error' as const,
    icon: <OfflineBoltRoundedIcon fontSize="small" />
  }
};

export function NetworkBadge() {
  const { networkHealth, queueLagMs } = useKioskStore((state) => ({
    networkHealth: state.networkHealth,
    queueLagMs: state.queueLagMs
  }));

  const status = useMemo(() => statusMapping[networkHealth], [networkHealth]);

  return (
    <Stack direction="row" spacing={1} alignItems="center">
      <Chip color={status.color} icon={status.icon} label={status.label} />
      {typeof queueLagMs === 'number' && (
        <Tooltip title="Selisih antrean foto terhadap server">
          <Chip
            variant="outlined"
            icon={<CameraAltRoundedIcon fontSize="small" />}
            label={`${locale.labels.queueLag}: ${queueLagMs} ms`}
          />
        </Tooltip>
      )}
      {networkHealth === 'offline' && (
        <Typography variant="caption" color="warning.main">
          {locale.labels.modeOffline}
        </Typography>
      )}
    </Stack>
  );
}

export default NetworkBadge;
