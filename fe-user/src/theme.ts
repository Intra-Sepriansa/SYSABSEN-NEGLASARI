import { create } from 'zustand';
import { createTheme, responsiveFontSizes } from '@mui/material/styles';
import { deepmerge } from '@mui/utils';
import '@fontsource/poppins/400.css';
import '@fontsource/poppins/500.css';
import '@fontsource/poppins/600.css';

export type ThemeMode = 'dark' | 'light';

const baseTypography = {
  fontFamily:
    'Poppins, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Helvetica Neue", Arial, sans-serif'
};

const sharedComponents = {
  MuiCard: {
    styleOverrides: {
      root: {
        backgroundImage: 'none',
        borderRadius: 14
      }
    }
  },
  MuiAppBar: {
    defaultProps: {
      elevation: 0
    },
    styleOverrides: {
      root: {
        backdropFilter: 'blur(8px)'
      }
    }
  },
  MuiChip: {
    styleOverrides: {
      root: {
        fontWeight: 500
      }
    }
  },
  MuiDataGrid: {
    styleOverrides: {
      root: {
        borderRadius: 14,
        border: '1px solid transparent',
        backgroundColor: 'transparent'
      },
      columnHeaders: {
        fontWeight: 600,
        borderBottom: 'none'
      },
      row: {
        borderBottom: 'none'
      }
    }
  },
  MuiCssBaseline: {
    styleOverrides: {
      body: {
        fontFamily: baseTypography.fontFamily,
        minHeight: '100vh'
      }
    }
  }
};

export const darkTheme = responsiveFontSizes(
  createTheme({
    palette: {
      mode: 'dark',
      primary: { main: '#1677ff' },
      secondary: { main: '#00bcd4' },
      success: { main: '#10B981' },
      warning: { main: '#F59E0B' },
      error: { main: '#EF4444' },
      background: { default: '#0B1220', paper: '#101827' },
      text: { primary: '#E6EAF2', secondary: '#B9C1D1' }
    },
    typography: baseTypography,
    shape: { borderRadius: 14 },
    components: deepmerge(sharedComponents, {
      MuiDataGrid: {
        styleOverrides: {
          root: {
            borderColor: 'rgba(255,255,255,0.12)'
          }
        }
      },
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: '#0B1220',
            color: '#E6EAF2'
          }
        }
      }
    })
  })
);

export const lightTheme = responsiveFontSizes(
  createTheme({
    palette: {
      mode: 'light',
      primary: { main: '#1677ff' },
      secondary: { main: '#00bcd4' },
      success: { main: '#10B981' },
      warning: { main: '#F59E0B' },
      error: { main: '#EF4444' },
      background: { default: '#FFFFFF', paper: '#F8FAFC' },
      text: { primary: '#0F172A', secondary: '#334155' }
    },
    typography: baseTypography,
    shape: { borderRadius: 14 },
    components: deepmerge(sharedComponents, {
      MuiDataGrid: {
        styleOverrides: {
          root: {
            borderColor: '#CBD5F5'
          },
          columnHeaders: {
            backgroundColor: '#E2E8F0',
            color: '#0F172A'
          }
        }
      },
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: '#FFFFFF',
            color: '#0F172A'
          }
        }
      }
    })
  })
);

const DEFAULT_THEME = (import.meta.env.VITE_DEFAULT_THEME as ThemeMode) || 'dark';

function readStoredMode(): ThemeMode {
  if (typeof window === 'undefined') {
    return DEFAULT_THEME;
  }
  const stored = window.localStorage.getItem('themeMode');
  if (stored === 'dark' || stored === 'light') {
    return stored;
  }
  return DEFAULT_THEME;
}

export interface ThemeState {
  mode: ThemeMode;
  toggle: () => void;
  setMode: (mode: ThemeMode) => void;
  persist: () => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  mode: readStoredMode(),
  toggle: () =>
    set((state) => {
      const next: ThemeMode = state.mode === 'dark' ? 'light' : 'dark';
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('themeMode', next);
      }
      return { mode: next };
    }),
  setMode: (mode) => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('themeMode', mode);
    }
    set({ mode });
  },
  persist: () => {
    const mode = readStoredMode();
    set({ mode });
  }
}));

export function resolveTheme(mode: ThemeMode) {
  return mode === 'dark' ? darkTheme : lightTheme;
}
