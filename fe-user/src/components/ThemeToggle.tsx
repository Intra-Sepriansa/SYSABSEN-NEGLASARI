import { IconButton, Tooltip } from '@mui/material';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import { useThemeStore } from '../theme';

export default function ThemeToggle() {
  const { mode, toggle } = useThemeStore();

  return (
    <Tooltip title={mode === 'dark' ? 'Mode Terang' : 'Mode Gelap'}>
      <IconButton onClick={toggle} aria-label="Toggle theme mode" size="large">
        {mode === 'dark' ? <LightModeIcon fontSize="small" /> : <DarkModeIcon fontSize="small" />}
      </IconButton>
    </Tooltip>
  );
}
