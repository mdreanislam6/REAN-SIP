import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Icon } from '@/components/icon';
import { Avatar, Btn, Group, IconButton, Row, SectionTitle, ToggleRow } from '@/components/kit';
import { useApp } from '@/lib/app-state';

export default function ProfileScreen() {
  const { colors, data, set } = useApp();
  const router = useRouter();
  const p = data.profile;

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.root, { backgroundColor: colors.bg }]}>
      <View style={styles.top}>
        <IconButton name="arrowLeft" onPress={() => router.back()} />
        <Text style={[styles.topTitle, { color: colors.text }]}>My Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Avatar letter={p.name.charAt(0)} c="c1" size={86} />
          <Text style={[styles.name, { color: colors.text }]}>{p.name}</Text>
          <Text style={[styles.phone, { color: colors.text2 }]}>{p.phone}</Text>
          <View style={[styles.statusPill, { backgroundColor: colors.greenSoft }]}>
            <View style={[styles.dot, { backgroundColor: colors.green }]} />
            <Text style={[styles.statusText, { color: colors.green }]}>{p.status}</Text>
          </View>
          <Btn title="Edit Profile" icon="edit" onPress={() => router.push('/edit-profile')} style={{ marginTop: 12, paddingHorizontal: 26 }} />
        </View>

        <SectionTitle>Account</SectionTitle>
        <Group>
          <Row icon="edit" tone="a" label="Edit Profile" onPress={() => router.push('/edit-profile')} />
          <Row icon="bell" label="Notifications" onPress={() => router.push('/notifications')} />
          <Row icon="eye" label="Who Viewed My Profile" onPress={() => router.push('/who')} />
          <Row icon="briefcase" tone="o" label="Business Profile" onPress={() => router.push('/business')} />
          <Row icon="settings" label="Settings" onPress={() => router.push('/(tabs)/settings')} />
        </Group>

        <SectionTitle>VoIP</SectionTitle>
        <Group>
          <Row
            icon="server"
            tone="g"
            label="SIP / VoIP Account"
            sub={data.sip.online ? 'Online' : 'Not registered'}
            onPress={() => router.push('/sip')}
          />
          <Row icon="shieldCheck" tone="p" label="VoIP Security" onPress={() => router.push('/voip-security')} />
        </Group>

        <SectionTitle>Appearance</SectionTitle>
        <Group>
          <ToggleRow icon="incognito" label="Incognito Mode" value={data.toggles.incognito} onChange={(v) => set({ ...data, toggles: { ...data.toggles, incognito: v } })} />
          <ToggleRow icon="moon" label="Dark Mode" value={data.dark} onChange={(v) => set({ ...data, dark: v })} />
          <Row icon="palette" label="Theme" value={data.accent} onPress={() => router.push('/theme')} />
        </Group>

        <SectionTitle>Upgrade</SectionTitle>
        <Group>
          <Row icon="crown" tone="o" label="CallerX Premium" sub="Unlimited caller ID and recordings" onPress={() => router.push('/premium')} />
        </Group>

        <View style={styles.about}>
          <Icon name="info" size={13} color={colors.text3} />
          <Text style={[styles.aboutText, { color: colors.text3 }]}>{p.about}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  top: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingTop: 4 },
  topTitle: { flex: 1, textAlign: 'center', fontSize: 14, fontWeight: '700' },
  content: { paddingBottom: 30 },
  hero: { alignItems: 'center', gap: 4, paddingTop: 6, paddingBottom: 8 },
  name: { fontSize: 21, fontWeight: '800', letterSpacing: -0.4, marginTop: 8 },
  phone: { fontSize: 13.5, fontVariant: ['tabular-nums'] },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, marginTop: 6 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11.5, fontWeight: '700' },
  about: { flexDirection: 'row', gap: 7, paddingHorizontal: 22, paddingTop: 20, alignItems: 'flex-start' },
  aboutText: { flex: 1, fontSize: 11.5, lineHeight: 17 },
});
