import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Icon } from '@/components/icon';
import { Avatar, Badge, Empty, IconButton, Tabs } from '@/components/kit';
import { useApp, type Msg } from '@/lib/app-state';

type Filter = 'all' | 'otp' | 'txn' | 'spam';

export default function MessagesScreen() {
  const { colors, data, set, contactById, toast } = useApp();
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>('all');

  const rows = useMemo(() => data.msgs.filter((m) => (filter === 'all' ? true : m.cat === filter)), [data.msgs, filter]);
  const unread = data.msgs.filter((m) => m.unread).length;

  const open = (m: Msg) => {
    set({ ...data, msgs: data.msgs.map((x) => (x === m ? { ...x, unread: false } : x)) });
    const ct = contactById(m.cid);
    toast(`Message from ${ct.name}`);
  };

  const renderRow = ({ item }: { item: Msg }) => {
    const ct = contactById(item.cid);
    return (
      <Pressable
        accessibilityRole="button"
        onPress={() => open(item)}
        style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.surf }]}>
        <Avatar letter={ct.letter} c={ct.c} spam={ct.spam} size={44} />
        <View style={styles.flex}>
          <View style={styles.nameRow}>
            <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
              {ct.name}
            </Text>
            {item.cat === 'otp' ? <Badge label="OTP" tone="a" /> : null}
            {item.cat === 'txn' ? <Badge label="TXN" tone="g" /> : null}
            {item.cat === 'spam' ? <Badge label="SPAM" tone="r" /> : null}
            <Text style={[styles.time, { color: colors.text3 }]}>{item.time}</Text>
          </View>
          <Text style={[styles.body, { color: item.unread ? colors.text : colors.text2 }]} numberOfLines={2}>
            {item.text}
          </Text>
        </View>
        {item.unread ? <View style={[styles.unread, { backgroundColor: colors.accent }]} /> : null}
      </Pressable>
    );
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.root, { backgroundColor: colors.bg }]}>
      <View style={styles.header}>
        <View style={styles.headRow}>
          <View style={styles.flex}>
            <Text style={[styles.title, { color: colors.text }]}>Messages</Text>
            <Text style={[styles.sub, { color: colors.text2 }]}>{unread} unread</Text>
          </View>
          <IconButton
            name="check"
            onPress={() => {
              set({ ...data, msgs: data.msgs.map((m) => ({ ...m, unread: false })) });
              toast('All messages marked as read');
            }}
          />
          <IconButton name="edit" onPress={() => router.push('/dialer')} />
        </View>
        <Tabs
          value={filter}
          onChange={setFilter}
          items={[
            { id: 'all', label: 'All' },
            { id: 'otp', label: 'OTP' },
            { id: 'txn', label: 'Transactions' },
            { id: 'spam', label: 'Spam' },
          ]}
        />
      </View>
      <FlatList
        data={rows}
        keyExtractor={(m, i) => `${m.cid}-${i}`}
        renderItem={renderRow}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Empty icon="message" title="No messages" sub="Messages in this category will appear here." />}
      />
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
  list: { paddingTop: 8, paddingBottom: 24 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  name: { fontSize: 14.5, fontWeight: '700', maxWidth: '52%' },
  time: { fontSize: 11, marginLeft: 'auto' },
  body: { fontSize: 12.5, marginTop: 3, lineHeight: 17 },
  unread: { width: 8, height: 8, borderRadius: 4 },
});
