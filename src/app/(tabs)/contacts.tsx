import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Icon } from '@/components/icon';
import { Avatar, Empty, IconButton, SectionTitle } from '@/components/kit';
import { useApp, type Contact } from '@/lib/app-state';

export default function ContactsScreen() {
  const { colors, data, toast } = useApp();
  const router = useRouter();
  const [q, setQ] = useState('');

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return data.contacts;
    return data.contacts.filter((c) => c.name.toLowerCase().includes(needle) || c.num.includes(needle));
  }, [data.contacts, q]);

  const favorites = filtered.filter((c) => c.fav);
  const all = filtered;

  const openDetail = (c: Contact) => router.push({ pathname: '/contact/[id]', params: { id: String(c.id) } });
  const call = (c: Contact) => router.push({ pathname: '/call', params: { cid: String(c.id) } });

  const ContactRow = ({ c }: { c: Contact }) => (
    <Pressable
      accessibilityRole="button"
      onPress={() => call(c)}
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.surf }]}>
      <Pressable onPress={() => openDetail(c)} accessibilityRole="button" accessibilityLabel={`Open ${c.name}`} hitSlop={4}>
        <Avatar letter={c.letter} c={c.c} spam={c.spam} size={42} />
      </Pressable>
      <View style={styles.flex}>
        <View style={styles.nameRow}>
          <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
            {c.name}
          </Text>
          {c.verified ? <Icon name="verified" size={12} color={colors.accent} /> : null}
        </View>
        <Text style={[styles.num, { color: colors.text2 }]}>{c.num}</Text>
      </View>
      <IconButton name="phone" size={18} color={colors.accent} onPress={() => call(c)} />
    </Pressable>
  );

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.root, { backgroundColor: colors.bg }]}>
      <View style={styles.header}>
        <View style={styles.headRow}>
          <View style={styles.flex}>
            <Text style={[styles.title, { color: colors.text }]}>Contacts</Text>
            <Text style={[styles.sub, { color: colors.text2 }]}>
              {data.contacts.length} contacts · {favorites.length} favorites
            </Text>
          </View>
          <IconButton name="plus" onPress={() => toast('Add contact form opened')} />
        </View>
        <View style={[styles.search, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Icon name="search" size={17} color={colors.text3} />
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder="Search contacts"
            placeholderTextColor={colors.text3}
            style={[styles.searchInput, { color: colors.text }]}
          />
          {q ? <IconButton name="x" size={16} onPress={() => setQ('')} /> : null}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.list} keyboardShouldPersistTaps="handled">
        {favorites.length > 0 ? (
          <>
            <SectionTitle>Favorites</SectionTitle>
            <View style={styles.favWrap}>
              {favorites.map((c) => (
                <Pressable key={c.id} onPress={() => openDetail(c)} style={styles.favItem} accessibilityRole="button">
                  <Avatar letter={c.letter} c={c.c} size={52} />
                  <Text style={[styles.favName, { color: colors.text }]} numberOfLines={1}>
                    {c.name.split(' ')[0]}
                  </Text>
                </Pressable>
              ))}
            </View>
          </>
        ) : null}

        <SectionTitle>All contacts</SectionTitle>
        {all.length === 0 ? (
          <Empty icon="users" title="No contacts found" sub="Try a different name or number." />
        ) : (
          all.map((c) => <ContactRow key={c.id} c={c} />)
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  header: { paddingHorizontal: 12, paddingTop: 4, gap: 10 },
  headRow: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingLeft: 4 },
  title: { fontSize: 26, fontWeight: '800', letterSpacing: -0.6 },
  sub: { fontSize: 12.5, marginTop: 1 },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 4,
    paddingHorizontal: 12,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchInput: { flex: 1, fontSize: 14.5, paddingVertical: 0 },
  list: { paddingBottom: 28 },
  favWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, paddingHorizontal: 20, paddingBottom: 6 },
  favItem: { alignItems: 'center', gap: 5, width: 62 },
  favName: { fontSize: 11.5, fontWeight: '600' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 9 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  name: { fontSize: 14.5, fontWeight: '700', maxWidth: '80%' },
  num: { fontSize: 12, marginTop: 2 },
});
