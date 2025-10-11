export interface BrandingConfig {
  title: string;
  subtitle: string;
  logo: string;
}

const envTitle = import.meta.env.VITE_BRAND_TITLE ?? 'KELURAHAN NEGLASARI';
const envSubtitle =
  import.meta.env.VITE_BRAND_SUBTITLE ?? 'Kecamatan Jasinga • Kabupaten Bogor — Tegar Beriman';
const envLogo = import.meta.env.VITE_BRAND_LOGO ?? '/logo-tegar-beriman.svg';

export function resolveBranding(overrides?: Partial<BrandingConfig>): BrandingConfig {
  return {
    title: overrides?.title?.trim() || envTitle,
    subtitle: overrides?.subtitle?.trim() || envSubtitle,
    logo: overrides?.logo?.trim() || envLogo
  };
}
