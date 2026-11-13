import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import { radius, spacing, useColors } from '@/constants/theme';
import type { RegistrationState } from '@/lib/sip/types';

const LABELS: Record<RegistrationState, string> = {
  offline: 'Offline',
  connecting: 'Connecting…',
  registered: 'Registered',
  failed: 'Failed',
};

/** Small pill showing whether the SIP account is registered. */
export function StatusPill({ state, label }: { state: RegistrationState; label?: string }) {
  const colors = useColors();
  const color =
    state === 'registered'
      ? colors.success
      : state === 'connecting'
        ? colors.warning
        : state === 'failed'
          ? colors.danger
          : colors.muted;
  return (
    <View style={[styles.pill, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.text, { color: colors.text }]} numberOfLines={1}>
        {label ?? LABELS[state]}
      </Text>
    </View>
  );
}

export function StatusDot({ state }: { state: RegistrationState }) {
  const colors = useColors();
  const color =
    state === 'registered'
      ? colors.success
      : state === 'connecting'
        ? colors.warning
        : state === 'failed'
          ? colors.danger
          : colors.muted;
  return <View style={[styles.dot, { backgroundColor: color }]} />;
}

export function SectionTitle({ children, action }: { children: string; action?: React.ReactNode }) {
  const colors = useColors();
  return (
    <View style={styles.sectionRow}>
      <Text style={[styles.section, { color: colors.muted }]}>{children}</Text>
      {action}
    </View>
  );
}

export function InfoRow({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  value: string;
  tone?: 'default' | 'danger' | 'success';
}) {
  const colors = useColors();
  const color = tone === 'danger' ? colors.danger : tone === 'success' ? colors.success : colors.text;
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={18} color={colors.muted} />
      <Text style={[styles.infoLabel, { color: colors.muted }]}>{label}</Text>
      <Text style={[styles.infoValue, { color }]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 5,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    maxWidth: '100%',
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  text: { fontSize: 12, fontWeight: '600' },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  section: { fontSize: 12, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: 6 },
  infoLabel: { fontSize: 14, flex: 1 },
  infoValue: { fontSize: 14, fontWeight: '600', maxWidth: '55%' },
});
