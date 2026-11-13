import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { spacing, useColors } from '@/constants/theme';

import { Button } from './button';

type Props = {
  icon?: ComponentProps<typeof Ionicons>['name'];
  title: string;
  message?: string;
  actionTitle?: string;
  onAction?: () => void;
};

/** What a list or screen shows when there is nothing yet, or when loading failed. */
export function EmptyState({ icon = 'file-tray-outline', title, message, actionTitle, onAction }: Props) {
  const colors = useColors();
  return (
    <View style={styles.wrap}>
      <Ionicons name={icon} size={48} color={colors.muted} />
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      {message ? <Text style={[styles.message, { color: colors.muted }]}>{message}</Text> : null}
      {actionTitle && onAction ? <Button title={actionTitle} onPress={onAction} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.sm },
  title: { fontSize: 18, fontWeight: '600', textAlign: 'center' },
  message: { fontSize: 15, lineHeight: 21, textAlign: 'center', marginBottom: spacing.sm },
});
