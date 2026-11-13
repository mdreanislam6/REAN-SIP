import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { spacing, useColors } from '@/constants/theme';

import { Button } from './button';

type Props = {
  visible: boolean;
  title: string;
  message?: string;
  confirmTitle: string;
  cancelTitle: string;
  /** Red confirm button for deletes and other actions that cannot be undone. */
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

/**
 * In-app confirmation. Use it instead of Alert.alert, which does nothing in the web
 * preview, so the preview behaves like the app.
 */
export function ConfirmDialog({
  visible,
  title,
  message,
  confirmTitle,
  cancelTitle,
  destructive,
  onConfirm,
  onCancel,
}: Props) {
  const colors = useColors();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={styles.backdrop} onPress={onCancel}>
        {/* Swallow taps inside the panel so they do not close the dialog. */}
        <Pressable style={[styles.panel, { backgroundColor: colors.card }]} onPress={() => {}}>
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          {message ? <Text style={[styles.message, { color: colors.muted }]}>{message}</Text> : null}
          <View style={styles.actions}>
            <View style={styles.action}>
              <Button title={cancelTitle} variant="secondary" onPress={onCancel} />
            </View>
            <View style={styles.action}>
              <Button title={confirmTitle} variant={destructive ? 'danger' : 'primary'} onPress={onConfirm} />
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  panel: { width: '100%', maxWidth: 400, borderRadius: 16, padding: spacing.lg, gap: spacing.md },
  title: { fontSize: 18, fontWeight: '700' },
  message: { fontSize: 15, lineHeight: 21 },
  actions: { flexDirection: 'row', gap: spacing.sm },
  action: { flex: 1 },
});
