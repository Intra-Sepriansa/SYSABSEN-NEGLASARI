export function parseYouTubeId(urlOrId: string | undefined | null): string {
  if (!urlOrId) {
    return '';
  }

  const trimmed = urlOrId.trim();
  if (/^[\w-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  try {
    const url = new URL(trimmed);
    if (url.hostname.includes('youtu.be')) {
      const candidate = url.pathname.replace('/', '').trim();
      if (candidate) {
        return candidate;
      }
    }

    const vParam = url.searchParams.get('v');
    if (vParam) {
      return vParam;
    }

    const segments = url.pathname.split('/').filter(Boolean);
    const pivot = segments.findIndex((segment) => ['embed', 'shorts', 'v'].includes(segment));
    if (pivot >= 0 && segments[pivot + 1]) {
      return segments[pivot + 1];
    }

    if (segments.length > 0) {
      return segments[segments.length - 1];
    }
  } catch {
    // ignore parse errors, fall back below
  }

  return trimmed;
}
