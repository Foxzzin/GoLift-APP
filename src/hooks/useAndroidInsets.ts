import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Wrapper centralizado para safe area insets.
 * Garante paddingTop/paddingBottom correcto em dispositivos Android com
 * edgeToEdgeEnabled: true (gesture navigation bar, status bar, etc.)
 */
export function useAndroidInsets() {
  const insets = useSafeAreaInsets();
  return {
    paddingTop: insets.top,
    paddingBottom: insets.bottom,
    insets,
  };
}
