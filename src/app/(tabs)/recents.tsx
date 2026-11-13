import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/screen';
import { ConfirmDialog, EmptyState } from '@/components/ui';
import { radius, spacing, useColors } from '@/constants/theme';
import { avatarColor, formatDuration, formatWhen, initials } from '@/lib/format';
import { useSip } from '@/lib/sip-context';
import type { CallLogEntry } from '@/lib/sip/types';

type Filter = 'all' | 'missed';

export default function RecentsScreen() {
  const colors = useColors();
  const router = useRouter();
  const { callLog, clearCallLog, dial, registration, contacts } = useSip();
  const [filter, setFilter] = useState<Filter>('all');
  const [confirmClear, setConfirmClear] = useState(false);

  const entries = useMemo(
    () => (filter === 'missed' ? callLog.filter((e) => e.missed) : callLog),
    [callLog, filter],
  );

  const nameFor = (entry: CallLogEntry) =>
    entry.name ?? contacts.find((c) => c.number.replace(/\D/g, '') === entry.number.replace(/\D/g, ''))?.name;

  const renderItem = ({ item }: { item: CallLogEntry }) => {
    const name = nameFor(item);
    const label = name ?? item.number;
    const icon = item.missed ? 'call-outline' : item.direction === 'in' ? 'arrow-down' : 'arrow-up';
    const tone = item.missed ? colors.danger : item.direction === 'in' ? colors.success : colors.primary;
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Call ${label}`}
        onPress={() => registration === 'registered' && dial(item.number, name)}
        style={({ pressed }) => [
          styles.row,
          { backgroundColor: colors.card, borderColor: colors.border },
          pressed && { opacity: 0.7 },
        ]}>
        <View style={[styles.avatar, { backgroundColor: avatarColor(label) }]}>
          <Text style={styles.avatarText}>{initials(label)}</Text>
        </View>
        <View style={styles.rowBody}>
          <Text style={[styles.rowTitle, { color: item.missed ? colors.danger : colors.text }]} numberOfLines={1}>
            {label}
          </Text>
          <View style={styles.metaRow}>
            <Ionicons name={icon} size={13} color={tone} />
            <Text style={[styles.rowMeta, { color: colors.muted }]} numberOfLines={1}>
              {formatWhen(item.startedAt)}
              {item.durationSec > 0 ? ` · ${formatDuration(item.durationSec)}` : item.missed ? ' · Missed' : ''}
            </Text>
          </View>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Call ${label} back`}
          onPress={() => registration === 'registered' && dial(item.number, name)}
          hitSlop={8}
          style={({ pressed }) => [styles.callIcon, pressed && { opacity: 0.5 }]}>
          <Ionicons name="call" size={20} color={colors.primary} />
        </Pressable>
      </Pressable>
    );
  };

  return (
    <Screen scroll={false}>
      <View style={styles.toolbar}>
        <View style={[styles.segment, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {(['all', 'missed'] as Filter[]).map((key) => (
            <Pressable
              key={key}
              accessibilityRole="button"
              onPress={() => setFilter(key)}
              style={[styles.segmentItem, filter === key && { backgroundColor: colors.primarySoft }]}>
              <Text
                style={[
                  styles.segmentText,
                  { color: filter === key ? colors.primary : colors.muted },
                ]}>
                {key === 'all' ? 'All' : 'Missed'}
              </Text>
            </Pressable>
          ))}
        </View>
        {callLog.length > 0 ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Clear call history"
            onPress={() => setConfirmClear(true)}
            hitSlop={8}
            style={({ pressed }) => [pressed && { opacity: 0.5 }]}>
            <Ionicons name="trash-outline" size={20} color={colors.muted} />
          </Pressable>
        ) : null}
      </View>

      <FlatList
        data={entries}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        ListEmptyComponent={
          <EmptyState
            icon="time-outline"
            title={filter === 'missed' ? 'No missed calls' : 'No calls yet'}
            message={
              filter === 'missed'
                ? 'Missed calls will appear here.'
                : 'Your incoming and outgoing SIP calls are listed here, newest first.'
            }
            actionTitle={filter === 'all' ? 'Open dialer' : undefined}
            onAction={filter === 'all' ? () => router.push('/(tabs)') : undefined}
          />
        }
      />

      <ConfirmDialog
        visible={confirmClear}
        title="Clear call history?"
        message="This removes every entry from the call log on this phone. It cannot be undone."
        confirmTitle="Clear"
        cancelTitle="Cancel"
        destructive
        onConfirm={() => {
          clearCallLog();
          setConfirmClear(false);
        }}
        onCancel={() => setConfirmClear(false)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.sm,
  },
  segment: {
    flexDirection: 'row',
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 3,
    gap: 2,
  },
  segmentItem: { paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: radius.pill },
  segmentText: { fontSize: 13, fontWeight: '600' },
  list: { paddingVertical: spacing.md, flexGrow: 1 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  rowBody: { flex: 1, gap: 3 },
  rowTitle: { fontSize: 16, fontWeight: '600' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rowMeta: { fontSize: 13 },
  callIcon: { padding: spacing.xs },
});
