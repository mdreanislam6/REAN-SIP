import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Icon } from '@/components/icon';
import { Group, IconButton, Row, SectionTitle, ToggleRow } from '@/components/kit';
import { useApp } from '@/lib/app-state';

export default function VoipSecurityScreen() {
  const { colors, data, set } = useApp();
  const router = useRouter();
  const t = data.toggles;
  const setToggle = (k: string, v: boolean) => set({ ...data, toggles: { ...data.toggles, [k]: v } });

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.root, { backgroundColor: colors.bg }]}>
      <View style={styles.top}>
        <IconButton name="arrowLeft" onPress={() => router.back()} />
        <Text style={[styles.topTitle, { color: colors.text }]}>VoIP Security</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.hero, { backgroundColor: colors.greenSoft }]}>
          <Icon name="shieldCheck" size={22} color={colors.green} />
          <Text style={[styles.heroText, { color: colors.text }]}>
            Encrypt signalling and media so calls cannot be listened to on the network.
          </Text>
        </View>

        <SectionTitle>Encryption</SectionTitle>
        <Group>
          <ToggleRow icon="lock" tone="g" label="Force TLS" sub="Encrypt SIP signalling" value={t.forceTls} onChange={(v) => setToggle('forceTls', v)} />
          <ToggleRow icon="shield" tone="g" label="SRTP" sub="Encrypt audio streams" value={t.srtp} onChange={(v) => setToggle('srtp', v)} />
          <ToggleRow icon="key" tone="p" label="ZRTP" sub="End-to-end key agreement" value={t.zrtp} onChange={(v) => setToggle('zrtp', v)} />
          <ToggleRow icon="verified" tone="a" label="Verify Certificate" sub="Reject untrusted server certificates" value={t.verifyCert} onChange={(v) => setToggle('verifyCert', v)} />
        </Group>

        <SectionTitle>Learn</SectionTitle>
        <Group>
          <Row icon="info" tone="a" label="Security Best Practices" onPress={() => router.push('/voip-best')} />
        </Group>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  top: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingTop: 4 },
  topTitle: { flex: 1, textAlign: 'center', fontSize: 14, fontWeight: '700' },
  content: { paddingBottom: 30 },
  hero: { flexDirection: 'row', alignItems: 'center', gap: 10, margin: 16, marginBottom: 4, padding: 14, borderRadius: 16 },
  heroText: { flex: 1, fontSize: 13, lineHeight: 19, fontWeight: '600' },
});
