import { useColorScheme } from 'react-native';

const palette = {
  light: {
    primary: '#1F6FEB',
    primarySoft: '#E8F0FE',
    onPrimary: '#FFFFFF',
    background: '#F4F6FB',
    card: '#FFFFFF',
    text: '#0F1522',
    muted: '#6B7280',
    border: '#E1E5EE',
    danger: '#D93F3F',
    success: '#0E9F6E',
    warning: '#C27803',
    overlay: 'rgba(9,13,22,0.55)',
  },
  dark: {
    primary: '#5B9BFF',
    primarySoft: '#16233A',
    onPrimary: '#08111F',
    background: '#0B0F17',
    card: '#151A24',
    text: '#F2F5FA',
    muted: '#98A2B3',
    border: '#252C3A',
    danger: '#FF6B6B',
    success: '#34D399',
    warning: '#FBBF24',
    overlay: 'rgba(0,0,0,0.65)',
  },
};

export type Colors = typeof palette.light;

export function useColors(): Colors {
  return useColorScheme() === 'dark' ? palette.dark : palette.light;
}

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 };
export const radius = { sm: 10, md: 14, lg: 20, pill: 999 };
