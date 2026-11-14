import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Icon } from '@/components/icon';
import { Avatar, Badge, Btn, Group, IconButton, Row, SectionTitle } from '@/components/kit';
import { useApp } from '@/lib/app-state';

const QUICK = ['Thanks, got it!', 'I will call you back', 'Please send the details', 'Noted, see you then'];

export default function AfterCallScreen() {
  const { colors, data, set, contactById, toast } = useApp();
  const router = useRouter();
  const params = useLocalSearchParams<{ cid?: string; dur?: string; name?: string; num?: string }>();

  const cid = Number(params.cid ?? 0);
  const contact = cid ? contactById(cid) : null;
  const name = contact?.name ?? params.name ?? 'Unknown';
  const num = contact?.num ?? params.num ?? '';
  const dur = params.dur ?? '00:00';

  const block = () => {
    if (!num) return;
    set({ ...data, blocked: [{ num, name, when: 'Blocked just now' }, ...data.blocked] });
    toast(`${name} blocked`);
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.root, { backgroundColor: colors.bg }]}>
      <View style={styles.top}>
        <IconButton name="x" onPress={() => router.replace('/(tabs)')} />
        <Text style={[styles.topTitle, { color: colors.text }]}>Call Summary</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Avatar letter={contact?.letter ?? name.charAt(0)} c={contact?.c ?? 'c1'} size={72} />
          <Text style={[styles.name, { color: colors.text }]}>{name}</Text>
          <View style={styles.metaRow}>
            <Icon name="clock" size={13} color={colors.text2} />
            <Text style={[styles.meta, { color: colors.text2 }]}>Call ended - {dur}</Text>
          </View>
        </View>

        <View style={[styles.aiBox, { backgroundColor: colors.accentSoft, borderColor: colors.accent + '33' }]}>
          <View style={styles.aiHead}>
            <Icon name="sparkles" size={16} color={colors.accent} />
            <Text style={[styles.aiTitle, { color: colors.accent }]}>AI Call Summary</Text>
          </View>
          <Text style={[styles.aiText, { color: colors.text }]}>
            You discussed the delivery schedule and agreed to confirm the order by tomorrow evening. The caller asked for the
            shop address and a price update on the bulk order.
          </Text>
          <View style={styles.aiTags}>
            <Badge label="Order" tone="a" />
            <Badge label="Delivery" tone="g" />
            <Badge label="Follow-up" tone="o" />
          </View>
        </View>

        <SectionTitle>Quick Replies</SectionTitle>
        <View style={styles.quickWrap}>
          {QUICK.map((q) => (
            <Pressable
              key={q}
              onPress={() => toast(`Sent: ${q}`)}
              style={({ pressed }) => [
                styles.quick,
                { backgroundColor: colors.card, borderColor: colors.border },
                pressed && { opacity: 0.7 },
              ]}>
              <Text style={[styles.quickText, { color: colors.text }]}>{q}</Text>
            </Pressable>
          ))}
        </View>

        <SectionTitle>Actions</SectionTitle>
        <Group>
          <Row
            icon="phone"
            tone="g"
            label="Call again"
            onPress={() => router.replace({ pathname: '/call', params: { cid: String(cid), num, name } })}
          />
          <Row icon="message" label="Send message" onPress={() => toast('Message composer opened')} />
          <Row icon="alert" tone="o" label="Report as spam" onPress={() => toast('Reported as spam')} />
          <Row icon="block" tone="r" label="Block number" danger onPress={block} />
        </Group>

        <View style={styles.foot}>
          <Btn title="Done" variant="secondary" onPress={() => router.replace('/(tabs)')} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  top: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingTop: 4 },
  topTitle: { flex: 1, textAlign: 'center', fontSize: 14, fontWeight: '700' },
  content: { paddingBottom: 28 },
  hero: { alignItems: 'center', gap: 6, paddingTop: 10, paddingBottom: 18 },
  name: { fontSize: 20, fontWeight: '800', letterSpacing: -0.4, marginTop: 4 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  meta: { fontSize: 12.5 },
  aiBox: { marginHorizontal: 16, borderRadius: 16, borderWidth: 1, padding: 14, gap: 8 },
  aiHead: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  aiTitle: { fontSize: 12, fontWeight: '800', letterSpacing: 0.6, textTransform: 'uppercase' },
  aiText: { fontSize: 13.5, lineHeight: 20 },
  aiTags: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  quickWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 16 },
  quick: { paddingHorizontal: 13, paddingVertical: 9, borderRadius: 999, borderWidth: 1 },
  quickText: { fontSize: 12.5, fontWeight: '600' },
  foot: { paddingHorizontal: 16, paddingTop: 18 },
});
