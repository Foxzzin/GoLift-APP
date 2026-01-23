import { useColorScheme } from 'react-native';

export const lightTheme = {
  // Base colors
  background: '#ffffff',
  backgroundSecondary: '#f8f8f8',
  backgroundTertiary: '#f0f0f0',
  
  // Text colors
  text: '#000000',
  textSecondary: '#666666',
  textTertiary: '#999999',
  
  // Borders and accents
  border: '#e0e0e0',
  borderLight: '#f0f0f0',
  
  // Accent colors (motivação)
  primary: '#000000', // Botão principal
  accent: '#ef4444', // Vermelho para ações importantes
  accentGreen: '#10b981', // Verde para sucesso
  accentBlue: '#3b82f6', // Azul para info
  
  // Specific
  streakBase: '#f5f5f5',
};

export const darkTheme = {
  // Base colors
  background: '#0a0a0a',
  backgroundSecondary: '#1a1a1a',
  backgroundTertiary: '#2a2a2a',
  
  // Text colors
  text: '#ffffff',
  textSecondary: '#b0b0b0',
  textTertiary: '#808080',
  
  // Borders and accents
  border: '#333333',
  borderLight: '#1f1f1f',
  
  // Accent colors (motivação)
  primary: '#ffffff', // Botão principal
  accent: '#ff4444', // Vermelho mais brilhante para dark
  accentGreen: '#10b981', // Verde
  accentBlue: '#3b82f6', // Azul
  
  // Specific
  streakBase: '#1a1a1a',
};

export function useTheme() {
  const colorScheme = useColorScheme();
  return colorScheme === 'dark' ? darkTheme : lightTheme;
}

export type Theme = typeof lightTheme;
