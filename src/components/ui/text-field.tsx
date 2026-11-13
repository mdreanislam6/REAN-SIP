import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { spacing, useColors } from '@/constants/theme';

type Props = TextInputProps & {
  label: string;
  /** Shown under the field in the danger color; also marks the field invalid. */
  error?: string | null;
  hint?: string;
};

export function TextField({ label, error, hint, style, ...input }: Props) {
  const colors = useColors();
  return (
    <View style={styles.wrap}>
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.muted}
        accessibilityLabel={label}
        {...input}
        style={[
          styles.input,
          {
            color: colors.text,
            backgroundColor: colors.card,
            borderColor: error ? colors.danger : colors.border,
          },
          style,
        ]}
      />
      {error ? (
        <Text style={[styles.note, { color: colors.danger }]}>{error}</Text>
      ) : hint ? (
        <Text style={[styles.note, { color: colors.muted }]}>{hint}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.xs },
  label: { fontSize: 14, fontWeight: '600' },
  input: {
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    fontSize: 16,
  },
  note: { fontSize: 13 },
});
