import { CssBaseline, ThemeProvider } from '@mui/material';
import { fireEvent, render } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import ThemeToggle from '../../src/components/ThemeToggle';
import { resolveTheme, useThemeStore } from '../../src/theme';

const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const mode = useThemeStore((state) => state.mode);
  return (
    <ThemeProvider theme={resolveTheme(mode)}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
};

describe('ThemeToggle', () => {
  beforeEach(() => {
    localStorage.clear();
    useThemeStore.setState({ mode: 'dark' });
  });

  it('switches theme mode and persists to localStorage', () => {
    const { getByRole } = render(<ThemeToggle />, { wrapper: Wrapper });
    const button = getByRole('button', { name: /toggle theme/i });
    fireEvent.click(button);
    expect(useThemeStore.getState().mode).toBe('light');
    expect(localStorage.getItem('themeMode')).toBe('light');
  });
});
