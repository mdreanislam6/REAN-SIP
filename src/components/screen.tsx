import type { ReactNode } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { spacing, useColors } from '@/constants/theme';

type Props = {
  children: ReactNode;
  scroll?: boolean;
};

/** Page container: safe-area aware, themed background, optional scrolling. */
export function Screen({ children, scroll = true }: Props) {
  const colors = useColors();
  return (
    <SafeAreaView edges={['left', 'right']} style={[styles.root, { backgroundColor: colors.background }]}>
      {scroll ? (
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
      ) : (
        children
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { padding: spacing.md, gap: spacing.md },
});
