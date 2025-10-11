import { ReactNode, useEffect } from 'react';
import { Box } from '@mui/material';
import HeaderBar from './HeaderBar';

interface Props {
  children: ReactNode;
  onOpenSettings: () => void;
}

export function KioskShell({ children, onOpenSettings }: Props) {
  useEffect(() => {
    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === 'F10') {
        event.preventDefault();
        onOpenSettings();
      }
    };
    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, [onOpenSettings]);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'background.default',
        color: 'text.primary'
      }}
    >
      <HeaderBar onOpenSettings={onOpenSettings} />
      <Box component="main" sx={{ flex: 1, pb: 4, px: { xs: 2, md: 3 }, pt: 3 }}>
        {children}
      </Box>
    </Box>
  );
}

export default KioskShell;
