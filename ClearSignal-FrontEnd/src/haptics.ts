import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

// Haptics are unavailable on web and some devices, so never let them throw.
export function haptic(kind: 'light' | 'select' = 'light'): void {
  if (Platform.OS === 'web') return;
  try {
    if (kind === 'select') {
      void Haptics.selectionAsync();
    } else {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  } catch {
    // ignore
  }
}
