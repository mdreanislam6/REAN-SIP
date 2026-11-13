import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { spacing, useColors } from '@/constants/theme';

type Props = {
  children: ReactNode;
  /** Makes the whole card tappable (e.g. open the item's detail screen). */
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

export function Card({ children, onPress, style }: Props) {
  const colors = useColors();
  const base = [styles.card, { backgroundColor: colors.card, borderColor: colors.border }, style];
  if (!onPress) {
    return <View style={base}>{children}</View>;
  }
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [...base, pressed && { opacity: 0.7 }]}>
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.md,
    gap: spacing.sm,
  },
});
