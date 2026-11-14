import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Icon } from '@/components/icon';
import { Avatar, Badge, Empty, IconButton, Tabs } from '@/components/kit';
import { useApp, type CallRow } from '@/lib/app-state';

type Filter = 'all' | 'missed' | 'spam' | 'fav';

export default function CallsScreen() {
  const { colors, data, contactById } = useApp();
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>('all');

  const rows = useMemo(() => {
    return data.calls.filter((c) => {
      const ct = contactById(c.cid);
      if (filter === 'missed') return c.missed;
      if (filter === 'spam') return ct.spam;
      if (filter === 'fav') return ct.fav;
      return true;
    });
  }, [data.calls, filter, contactById]);

  const renderRow = ({ item }: { item: CallRow }) => {
    const ct = contactById(item.cid);
    const typeIcon = item.type === 'miss' ? 'phoneMissed' : item.type === 'out' ? 'phoneOut' : 'phoneIn';
    const typeColor = item.missed ? colors.red : item.type === 'out' ? colors.text2 : colors.green;
    return (
      <Pressable
        accessibilityRole="button"
        onPress={() => router.push({ pathname: '/call', params: { cid: String(ct.id) } })}
        style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.surf }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Open ${ct.name}`}
          onPress={() => router.push({ pathname: '/contact/[id]', params: { id: String(ct.id) } })}
          hitSlop={4}>
          <Avatar letter={ct.letter} c={ct.c} spam={ct.spam} />
        </Pressable>
        <View style={styles.flex}>
          <View style={styles.nameRow}>
            <Text style={[styles.name, { color: item.missed ? colors.red : colors.text }]} numberOfLines={1}>
              {ct.name}
            </Text>
            {ct.verified ? <Icon name="verified" size={13} color={colors.accent} /> : null}
            {ct.spam ? <Badge label="SPAM" tone="r" /> : null}
          </View>
          <View style={styles.metaRow}>
            <Icon name={typeIcon} size={12} color={typeColor} />
            <Text style={[styles.meta, { color: colors.text2 }]} numberOfLines={1}>
              {item.time} · {item.dur}
            </Text>
          </View>
        </View>
        <IconButton
          name="phone"
          size={19}
          color={colors.accent}
          onPress={() => router.push({ pathname: '/call', params: { cid: String(ct.id) } })}
        />
      </Pressable>
    );
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.root, { backgroundColor: colors.bg }]}>
      <View style={styles.header}>
        <View style={styles.headRow}>
          <Pressable onPress={() => router.push('/profile')} accessibilityRole="button" accessibilityLabel="Open profile">
            <Avatar letter={data.profile.name.charAt(0)} c="c1" size={40} />
          </Pressable>
          <Text style={[styles.title, { color: colors.text }]}>Calls</Text>
          <IconButton name="search" onPress={() => router.push('/search')} />
          <IconButton name="more" onPress={() => router.push('/settings')} />
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/sip')}
          style={({ pressed }) => [
            styles.sipChip,
            { backgroundColor: data.sip.online ? colors.greenSoft : colors.redSoft },
            pressed && { opacity: 0.7 },
          ]}>
          <View style={[styles.dot, { backgroundColor: data.sip.online ? colors.green : colors.red }]} />
          <Text style={[styles.sipText, { color: data.sip.online ? colors.green : colors.red }]}>
            {data.sip.online ? 'SIP Online' : 'SIP Offline'}
          </Text>
          <Icon name="chevron" size={13} color={data.sip.online ? colors.green : colors.red} />
        </Pressable>

        <Tabs
          value={filter}
          onChange={setFilter}
          items={[
            { id: 'all', label: 'All' },
            { id: 'missed', label: 'Missed' },
            { id: 'spam', label: 'Spam' },
            { id: 'fav', label: 'Favorites' },
          ]}
        />
      </View>

      <FlatList
        data={rows}
        keyExtractor={(item, i) => `${item.cid}-${i}`}
        renderItem={renderRow}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Empty icon="phone" title="No calls here" sub="Calls that match this filter will appear here." />}
      />

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Open keypad"
        onPress={() => router.push('/dialer')}
        style={({ pressed }) => [styles.fab, { backgroundColor: colors.accent }, pressed && { transform: [{ scale: 0.94 }] }]}>
        <Icon name="keypad" size={25} color="#FFFFFF" />
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  header: { paddingHorizontal: 12, paddingTop: 4, gap: 10 },
  headRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { flex: 1, fontSize: 26, fontWeight: '800', letterSpacing: -0.6, marginLeft: 4 },
  sipChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    marginLeft: 4,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 999,
  },
  dot: { width: 7, height: 7, borderRadius: 4 },
  sipText: { fontSize: 12, fontWeight: '800' },
  list: { paddingTop: 8, paddingBottom: 110 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 11 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  name: { fontSize: 15, fontWeight: '700', maxWidth: '72%' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 3 },
  meta: { fontSize: 12.5 },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.22,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
});
