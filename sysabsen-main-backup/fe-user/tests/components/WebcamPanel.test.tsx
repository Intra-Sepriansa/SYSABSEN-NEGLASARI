import { CssBaseline, ThemeProvider } from '@mui/material';
import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import WebcamPanel from '../../src/components/WebcamPanel';
import { resolveTheme, useThemeStore } from '../../src/theme';
import { useKioskStore } from '../../src/store/useKioskStore';

const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const mode = useThemeStore((state) => state.mode);
  return (
    <ThemeProvider theme={resolveTheme(mode)}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
};

const mockTrack = { stop: vi.fn() };
const mockStream = {
  getTracks: () => [mockTrack],
  getVideoTracks: () => [mockTrack]
} as unknown as MediaStream;

describe('WebcamPanel', () => {
  beforeEach(() => {
    localStorage.clear();
    useThemeStore.setState({ mode: 'dark' });
    useKioskStore.setState((state) => ({
      ...state,
      config: { ...state.config, photoEnabled: true, photoMaxKB: 500 }
    }));
    mockTrack.stop.mockReset();
    if (!navigator.mediaDevices) {
      (navigator as unknown as { mediaDevices: MediaDevices }).mediaDevices = {
        getUserMedia: vi.fn()
      } as unknown as MediaDevices;
    }
    vi.spyOn(navigator.mediaDevices, 'getUserMedia').mockResolvedValue(mockStream);
    vi.spyOn(HTMLVideoElement.prototype, 'play').mockResolvedValue(undefined);
    Object.defineProperty(HTMLVideoElement.prototype, 'videoWidth', {
      configurable: true,
      get: () => 1280
    });
    Object.defineProperty(HTMLVideoElement.prototype, 'videoHeight', {
      configurable: true,
      get: () => 720
    });
    Object.defineProperty(HTMLVideoElement.prototype, 'readyState', {
      configurable: true,
      get: () => HTMLMediaElement.HAVE_CURRENT_DATA
    });
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      drawImage: vi.fn(),
      font: '',
      textBaseline: 'bottom',
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 0,
      fillText: vi.fn(),
      strokeText: vi.fn()
    } as unknown as CanvasRenderingContext2D);
    vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue(
      'data:image/jpeg;base64,ZmFrZQ=='
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete (HTMLVideoElement.prototype as unknown as Record<string, unknown>).videoWidth;
    delete (HTMLVideoElement.prototype as unknown as Record<string, unknown>).videoHeight;
    delete (HTMLVideoElement.prototype as unknown as Record<string, unknown>).readyState;
    delete (window as Record<string, unknown>).__webcam_capture__;
  });

  it('initialises camera stream and exposes capture function', async () => {
    render(<WebcamPanel />, { wrapper: Wrapper });
    await waitFor(() => expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalled());
    expect(await screen.findByText(/Camera ON/i)).toBeInTheDocument();

    await waitFor(() => expect(typeof window.__webcam_capture__).toBe('function'));
    const data = await window.__webcam_capture__?.();
    expect(data).toBe('ZmFrZQ==');
  });
});
