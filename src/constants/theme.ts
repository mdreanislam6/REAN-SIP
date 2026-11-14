import { useColorScheme } from 'react-native';

export type CxColors = {
  bg: string;
  card: string;
  surf: string;
  surf2: string;
  text: string;
  text2: string;
  text3: string;
  border: string;
  border2: string;
  accent: string;
  accent2: string;
  accentSoft: string;
  accentSoft2: string;
  green: string;
  greenSoft: string;
  red: string;
  redSoft: string;
  orange: string;
  orangeSoft: string;
  purple: string;
  purpleSoft: string;
  isDark: boolean;
};

export type AccentDef = { id: string; name: string; hex: string; hex2: string; softLight: string; softDark: string };

export const ACCENTS: AccentDef[] = [
  { id: 'blue', name: 'Blue', hex: '#2563EB', hex2: '#3B82F6', softLight: '#EAF1FE', softDark: '#16233B' },
  { id: 'green', name: 'Green', hex: '#0E9F6E', hex2: '#12B76A', softLight: '#E6F7EF', softDark: '#0F2A1E' },
  { id: 'purple', name: 'Purple', hex: '#7A5AF8', hex2: '#9B8AFB', softLight: '#F0EDFE', softDark: '#1E1A33' },
  { id: 'orange', name: 'Orange', hex: '#F79009', hex2: '#FDB022', softLight: '#FEF3E2', softDark: '#2A1F0E' },
  { id: 'pink', name: 'Pink', hex: '#E31B7E', hex2: '#F0509F', softLight: '#FDEBF4', softDark: '#33101F' },
  { id: 'indigo', name: 'Indigo', hex: '#4F46E5', hex2: '#6366F1', softLight: '#ECEBFE', softDark: '#1B1A3A' },
  { id: 'teal', name: 'Teal', hex: '#0E9384', hex2: '#15B79E', softLight: '#E4F6F4', softDark: '#0C2A28' },
  { id: 'red', name: 'Red', hex: '#E02D3C', hex2: '#F04438', softLight: '#FEECEB', softDark: '#2C1614' },
  { id: 'gray', name: 'Gray', hex: '#4B5563', hex2: '#6B7280', softLight: '#F0F1F3', softDark: '#23262C' },
];

export function accentById(id: string): AccentDef {
  return ACCENTS.find((a) => a.id === id) ?? ACCENTS[0];
}

export function buildColors(dark: boolean, accentId: string): CxColors {
  const a = accentById(accentId);
  if (dark) {
    return {
      bg: '#0A0B0D',
      card: '#141619',
      surf: '#1B1E23',
      surf2: '#23272E',
      text: '#F3F5F8',
      text2: '#98A0AC',
      text3: '#6E7681',
      border: '#23262C',
      border2: '#2C3037',
      accent: a.hex,
      accent2: a.hex2,
      accentSoft: a.softDark,
      accentSoft2: a.softDark,
      green: '#12B76A',
      greenSoft: '#0F2A1E',
      red: '#F04438',
      redSoft: '#2C1614',
      orange: '#F79009',
      orangeSoft: '#2A1F0E',
      purple: '#9B8AFB',
      purpleSoft: '#1E1A33',
      isDark: true,
    };
  }
  return {
    bg: '#F6F7F9',
    card: '#FFFFFF',
    surf: '#F1F3F6',
    surf2: '#E8EBF0',
    text: '#0E1116',
    text2: '#6B7280',
    text3: '#9AA1AC',
    border: '#E7EAEF',
    border2: '#DDE1E8',
    accent: a.hex,
    accent2: a.hex2,
    accentSoft: a.softLight,
    accentSoft2: a.softLight,
    green: '#12B76A',
    greenSoft: '#E6F7EF',
    red: '#F04438',
    redSoft: '#FEECEB',
    orange: '#F79009',
    orangeSoft: '#FEF3E2',
    purple: '#7A5AF8',
    purpleSoft: '#F0EDFE',
    isDark: false,
  };
}

/** Fallback palette for components rendered outside the app provider. */
export function useColors(): CxColors {
  return buildColors(useColorScheme() === 'dark', 'blue');
}

export const AVATAR_GRADS: Record<string, [string, string]> = {
  c1: ['#2563EB', '#3B82F6'],
  c2: ['#0E9F6E', '#12B76A'],
  c3: ['#7A5AF8', '#9B8AFB'],
  c4: ['#F79009', '#FDB022'],
  c5: ['#E31B7E', '#F0509F'],
  c6: ['#0E9384', '#15B79E'],
};

export function avatarGrad(c: string): [string, string] {
  return AVATAR_GRADS[c] ?? ['#6B7280', '#9AA1AC'];
}

export const radius = { sm: 12, md: 16, lg: 20, pill: 999 };
export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 };
