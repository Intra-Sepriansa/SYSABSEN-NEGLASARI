import { render, screen } from '@testing-library/react';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { SnackbarProvider } from 'notistack';
import { describe, it, beforeEach } from 'vitest';
import TapStatusCard from '../../src/components/TapStatusCard';
import { resolveTheme } from '../../src/theme';
import { useKioskStore } from '../../src/store/useKioskStore';

const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ThemeProvider theme={resolveTheme('dark')}>
    <CssBaseline />
    <SnackbarProvider maxSnack={1}>{children}</SnackbarProvider>
  </ThemeProvider>
);

describe('TapStatusCard', () => {
  beforeEach(() => {
    useKioskStore.getState().reset();
  });

  it('renders idle message by default', () => {
    render(<TapStatusCard />, { wrapper: Wrapper });
    expect(screen.getByText(/SIAP TAP/i)).toBeInTheDocument();
  });

  it('renders success state when attendance is pushed', () => {
    useKioskStore.getState().pushAttendance(
      {
        id: 1,
        name: 'John Doe',
        type: 'in',
        tapTime: new Date().toISOString()
      },
      120
    );
    render(<TapStatusCard />, { wrapper: Wrapper });
    expect(screen.getByText(/SUDAH TERABSEN/i)).toBeInTheDocument();
    expect(screen.getByText(/John Doe/)).toBeInTheDocument();
  });
});
