import { useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
  FormControlLabel,
  Switch,
  MenuItem,
  Alert
} from '@mui/material';
import { useSnackbar } from 'notistack';
import { useKioskStore, KioskConfig, LayoutMode } from '../store/useKioskStore';
import { saveSecure, loadSecure, clearSecure } from '../utils/secureStore';
import { api } from '../api/client';
import type { DeviceAuthResponse } from '../api/types';
import { id as locale } from '../i18n/id';
import type { ThemeMode } from '../theme';

interface Props {
  open: boolean;
  onClose: () => void;
}

type FormState = KioskConfig;

const layoutOptions: { value: LayoutMode; label: string }[] = [
  { value: 'A', label: locale.labels.layoutA },
  { value: 'B', label: locale.labels.layoutB },
  { value: 'C', label: locale.labels.layoutC }
];

export function SettingsDialog({ open, onClose }: Props) {
  const { enqueueSnackbar } = useSnackbar();
  const { config, setConfig, setToken } = useKioskStore((state) => ({
    config: state.config,
    setConfig: state.setConfig,
    setToken: state.setToken
  }));
  const [form, setForm] = useState<FormState>(config);
  const [isAuthing, setAuthing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setForm(config);
    }
  }, [config, open]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const secrets = Array.from(
      new Set(
        [form.deviceKey, config.deviceKey, import.meta.env.VITE_DEVICE_KEY, 'absentech'].filter(
          (value): value is string => Boolean(value)
        )
      )
    );

    (async () => {
      for (const secret of secrets) {
        const saved = await loadSecure<FormState>(secret);
        if (saved) {
          setForm((prev) => ({ ...prev, ...saved }));
          setLoadError(null);
          return;
        }
      }
      setLoadError('Konfigurasi terenkripsi tidak ditemukan, gunakan nilai baru.');
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const saveDisabled = useMemo(
    () => !form.apiBaseUrl || !form.deviceId || !form.deviceKey,
    [form.apiBaseUrl, form.deviceId, form.deviceKey]
  );

  const handleChange =
    (field: keyof FormState) => (event: React.ChangeEvent<HTMLInputElement>) => {
      let value: FormState[typeof field];
      if (field === 'photoEnabled') {
        value = event.target.checked as FormState[typeof field];
      } else if (field === 'photoMaxKB') {
        value = Number(event.target.value) as FormState[typeof field];
      } else if (field === 'defaultTheme') {
        value = (event.target.value as ThemeMode) as FormState[typeof field];
      } else {
        value = event.target.value as FormState[typeof field];
      }
      setForm((prev) => ({ ...prev, [field]: value }));
    };

  const handleSave = async () => {
    setConfig(form);
    await saveSecure(form, form.deviceKey || 'absentech');
    enqueueSnackbar('Konfigurasi tersimpan', { variant: 'success' });
    onClose();
  };

  const handleReset = () => {
    clearSecure();
    setForm(config);
    enqueueSnackbar('Konfigurasi disetel ulang', { variant: 'info' });
  };

  const handleAuth = async () => {
    setAuthing(true);
    try {
      const response = await api.post<DeviceAuthResponse>('/api/devices/auth', {
        device_key: form.deviceKey
      });
      setToken(response.data.token);
      enqueueSnackbar('Device berhasil terautentikasi', { variant: 'success' });
    } catch (error) {
      enqueueSnackbar('Autentikasi gagal', { variant: 'error' });
    } finally {
      setAuthing(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{locale.settings.dialogTitle}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          {loadError && <Alert severity="info">{loadError}</Alert>}
          <TextField
            label={locale.settings.apiBaseUrl}
            value={form.apiBaseUrl}
            onChange={handleChange('apiBaseUrl')}
            required
          />
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <TextField
              label={locale.settings.deviceId}
              value={form.deviceId}
              onChange={handleChange('deviceId')}
              required
              fullWidth
            />
            <TextField
              label={locale.settings.deviceKey}
              value={form.deviceKey}
              onChange={handleChange('deviceKey')}
              type="password"
              required
              fullWidth
            />
          </Stack>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <TextField
              label="YouTube URL"
              value={form.youtubeUrl ?? ''}
              onChange={handleChange('youtubeUrl')}
              helperText="Tempel tautan YouTube (watch / share / shorts / embed)"
              fullWidth
            />
            <TextField
              label={locale.settings.youtubeVideoId}
              value={form.youtubeVideoId}
              onChange={handleChange('youtubeVideoId')}
              helperText="Opsional sebagai fallback ID"
              fullWidth
            />
          </Stack>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <TextField
              label={locale.settings.photoMaxKB}
              value={form.photoMaxKB}
              onChange={handleChange('photoMaxKB')}
              type="number"
              fullWidth
            />
            <TextField
              label={locale.settings.pusherKey}
              value={form.pusherKey ?? ''}
              onChange={handleChange('pusherKey')}
              fullWidth
            />
          </Stack>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <TextField
              label={locale.settings.pusherCluster}
              value={form.pusherCluster ?? ''}
              onChange={handleChange('pusherCluster')}
              fullWidth
            />
            <TextField
              select
              label={locale.settings.layoutMode}
              value={form.layoutMode}
              onChange={handleChange('layoutMode')}
              fullWidth
            >
              {layoutOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <TextField
              label="Judul Brand"
              value={form.brandTitle ?? ''}
              onChange={handleChange('brandTitle')}
              fullWidth
            />
            <TextField
              label="Subjudul Brand"
              value={form.brandSubtitle ?? ''}
              onChange={handleChange('brandSubtitle')}
              fullWidth
            />
          </Stack>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <TextField
              label="Logo Brand (URL)"
              value={form.brandLogo ?? ''}
              onChange={handleChange('brandLogo')}
              fullWidth
            />
            <TextField
              select
              label="Tema Default"
              value={form.defaultTheme}
              onChange={handleChange('defaultTheme')}
              fullWidth
            >
              <MenuItem value="dark">Gelap</MenuItem>
              <MenuItem value="light">Terang</MenuItem>
            </TextField>
          </Stack>
          <FormControlLabel
            control={<Switch checked={form.photoEnabled} onChange={handleChange('photoEnabled')} />}
            label={locale.settings.photoEnabled}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'space-between' }}>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" onClick={handleReset}>
            {locale.settings.reset}
          </Button>
          <Button variant="contained" color="secondary" onClick={handleAuth} disabled={isAuthing}>
            {isAuthing ? 'Mengirim...' : 'Authenticate'}
          </Button>
        </Stack>
        <Stack direction="row" spacing={1}>
          <Button onClick={onClose}>{locale.labels.cancel}</Button>
          <Button onClick={handleSave} variant="contained" disabled={saveDisabled}>
            {locale.labels.save}
          </Button>
        </Stack>
      </DialogActions>
    </Dialog>
  );
}

export default SettingsDialog;
