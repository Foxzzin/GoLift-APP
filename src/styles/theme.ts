import { useColorScheme } from 'react-native';

export const lightTheme = {
  background: '#F2F2F7',
  backgroundSecondary: '#FFFFFF',
  backgroundTertiary: '#E5E5EA',

  text: '#000000',
  textSecondary: '#6C6C70',
  textTertiary: '#AEAEB2',

  border: '#E5E5EA',
  borderLight: '#F2F2F7',

  primary: '#0066FF',
  accent: '#0066FF',
  accentGreen: '#34C759',
  accentBlue: '#0066FF',

  streakBase: '#F2F2F7',
};

export const darkTheme = {
  background: '#080808',
  backgroundSecondary: '#141414',
  backgroundTertiary: '#1E1E1E',

  text: '#FFFFFF',
  textSecondary: '#8E8E93',
  textTertiary: '#48484A',

  border: '#2C2C2E',
  borderLight: '#1C1C1E',

  primary: '#0A84FF',
  accent: '#0A84FF',
  accentGreen: '#30D158',
  accentBlue: '#0A84FF',

  streakBase: '#141414',
};

export function useTheme() {
  const colorScheme = useColorScheme();
  return colorScheme === 'dark' ? darkTheme : lightTheme;
}

export type Theme = typeof lightTheme;
