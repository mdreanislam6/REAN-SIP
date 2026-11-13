import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/screen';
import { EmptyState, TextField } from '@/components/ui';
import { radius, spacing, useColors } from '@/constants/theme';
import { avatarColor, initials } from '@/lib/format';
import { useSip } from '@/lib/sip-context';
import type { Contact } from '@/lib/sip/types';

export default function ContactsScreen() {
  const colors = useColors();
  const router = useRouter();
  const { contacts, dial, registration } = useSip();
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? contacts.filter(
          (c) =>
            c.name.toLowerCase().includes(q) ||
            c.number.toLowerCase().includes(q) ||
            (c.company ?? '').toLowerCase().includes(q),
        )
      : contacts;
    return [...list].sort((a, b) => {
      if (a.favorite !== b.favorite) return a.favorite ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
  }, [contacts, query]);

  const renderItem = ({ item }: { item: Contact }) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open ${item.name}`}
      onPress={() => router.push(`/contact/${item.id}`)}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: colors.card, borderColor: colors.border },
        pressed && { opacity: 0.7 },
      ]}>
      <View style={[styles.avatar, { backgroundColor: avatarColor(item.name) }]}>
        <Text style={styles.avatarText}>{initials(item.name)}</Text>
      </View>
      <View style={styles.body}>
        <View style={styles.nameRow}>
          <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
            {item.name}
          </Text>
          {item.favorite ? <Ionicons name="star" size={13} color={colors.warning} /> : null}
          {item.blocked ? <Ionicons name="ban" size={13} color={colors.danger} /> : null}
        </View>
        <Text style={[styles.meta, { color: colors.muted }]} numberOfLines={1}>
          {item.number}
          {item.company ? ` · ${item.company}` : ''}
        </Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Call ${item.name}`}
        disabled={item.blocked || registration !== 'registered'}
        onPress={() => dial(item.number, item.name)}
        hitSlop={8}
        style={({ pressed }) => [styles.callIcon, pressed && { opacity: 0.5 }]}>
        <Ionicons
          name="call"
          size={20}
          color={item.blocked || registration !== 'registered' ? colors.border : colors.primary}
        />
      </Pressable>
    </Pressable>
  );

  return (
    <Screen scroll={false}>
      <View style={styles.top}>
        <View style={styles.searchWrap}>
          <TextField
            label="Search"
            placeholder="Name, number or company"
            value={query}
            onChangeText={setQuery}
            autoCorrect={false}
            returnKeyType="search"
          />
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Add contact"
          onPress={() => router.push('/contact/new')}
          style={({ pressed }) => [
            styles.addButton,
            { backgroundColor: colors.primary },
            pressed && { opacity: 0.8 },
          ]}>
          <Ionicons name="add" size={24} color={colors.onPrimary} />
        </Pressable>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        ListEmptyComponent={
          <EmptyState
            icon="people-outline"
            title={query ? 'No matching contacts' : 'No contacts yet'}
            message={
              query
                ? 'Try a different name or number.'
                : 'Save the people you call most. Contacts stay on this phone.'
            }
            actionTitle={query ? undefined : 'Add contact'}
            onAction={query ? undefined : () => router.push('/contact/new')}
          />
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm, paddingTop: spacing.sm },
  searchWrap: { flex: 1 },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
  body: { flex: 1, gap: 3 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  name: { fontSize: 16, fontWeight: '600', flexShrink: 1 },
  meta: { fontSize: 13 },
  callIcon: { padding: spacing.xs },
});
