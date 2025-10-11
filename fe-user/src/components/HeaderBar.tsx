import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import { AppBar, Box, Toolbar, Typography, Stack, Tooltip, IconButton } from '@mui/material';
import ThemeToggle from './ThemeToggle';
import DeviceBadge from './DeviceBadge';
import { resolveBranding } from '../services/branding';
import { useKioskStore } from '../store/useKioskStore';

interface Props {
  onOpenSettings?: () => void;
}

export default function HeaderBar({ onOpenSettings }: Props) {
  const config = useKioskStore((state) => state.config);
  const branding = resolveBranding({
    title: config.brandTitle,
    subtitle: config.brandSubtitle,
    logo: config.brandLogo
  });

  return (
    <AppBar
      position="sticky"
      color="transparent"
      sx={{
        borderBottom: (theme) => `1px solid ${theme.palette.divider}`
      }}
    >
      <Toolbar sx={{ minHeight: 80, gap: 3 }}>
        <Stack direction="row" alignItems="center" spacing={2} sx={{ flex: 1 }}>
          <Box
            component="img"
            src={branding.logo}
            alt="Logo Tegar Beriman"
            sx={{ width: 48, height: 48, objectFit: 'contain' }}
          />
          <Box>
            <Typography variant="h6" fontWeight={700}>
              {branding.title}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {branding.subtitle}
            </Typography>
          </Box>
        </Stack>
        <Stack direction="row" spacing={1.5} alignItems="center">
          {onOpenSettings && (
            <Tooltip title="Pengaturan (F10)">
              <IconButton color="primary" onClick={onOpenSettings} size="large">
                <SettingsRoundedIcon />
              </IconButton>
            </Tooltip>
          )}
          <ThemeToggle />
          <DeviceBadge deviceId={config.deviceId} />
        </Stack>
      </Toolbar>
    </AppBar>
  );
}
