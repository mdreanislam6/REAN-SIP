import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Icon } from '@/components/icon';
import { Group, IconButton, Row, SectionTitle, ToggleRow } from '@/components/kit';
import { useApp } from '@/lib/app-state';

export default function SettingsScreen() {
  const { colors, data, set, toast } = useApp();
  const router = useRouter();
  const t = data.toggles;

  const setToggle = (key: string, v: boolean) => set({ ...data, toggles: { ...data.toggles, [key]: v } });

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.root, { backgroundColor: colors.bg }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Settings</Text>
        <IconButton name={data.dark ? 'sun' : 'moon'} onPress={() => set({ ...data, dark: !data.dark })} />
      </View>

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        <SectionTitle>Account</SectionTitle>
        <Group>
          <Row icon="user" tone="a" label="My Profile" sub={data.profile.name} onPress={() => router.push('/profile')} />
        </Group>

        <SectionTitle>VoIP &amp; SIP</SectionTitle>
        <Group>
          <Row
            icon="server"
            tone="g"
            label="SIP Account"
            sub={data.sip.online ? `Online · ${data.sip.user || 'registered'}` : 'Not registered'}
            onPress={() => router.push('/sip')}
          />
          <Row icon="shieldCheck" tone="p" label="VoIP Security" sub="TLS, SRTP, ZRTP" onPress={() => router.push('/voip-security')} />
        </Group>

        <SectionTitle>More</SectionTitle>
        <Group>
          <Row icon="bell" label="Notifications" onPress={() => router.push('/notifications')} />
          <Row icon="eye" label="Who Viewed My Profile" onPress={() => router.push('/who')} />
          <Row icon="briefcase" tone="o" label="Business Profile" onPress={() => router.push('/business')} />
          <Row icon="devices" label="Linked Devices" onPress={() => router.push('/devices')} />
          <Row icon="cloud" tone="g" label="Backup &amp; Restore" onPress={() => router.push('/backup')} />
          <Row icon="family" tone="p" label="Family Protection" onPress={() => router.push('/family')} />
          <ToggleRow
            icon="incognito"
            label="Incognito Mode"
            sub="Hide your profile from unknown callers"
            value={t.incognito}
            onChange={(v) => setToggle('incognito', v)}
          />
          <Row icon="crown" tone="o" label="CallerX Premium" onPress={() => router.push('/premium')} />
        </Group>

        <SectionTitle>Calls</SectionTitle>
        <Group>
          <ToggleRow
            icon="phone"
            label="Caller ID"
            sub="Show caller identity on incoming calls"
            value={t.callerId}
            onChange={(v) => setToggle('callerId', v)}
          />
          <ToggleRow
            icon="note"
            label="After Call"
            sub="Show the summary screen after every call"
            value={t.afterCall}
            onChange={(v) => setToggle('afterCall', v)}
          />
          <ToggleRow icon="mic" tone="r" label="Auto Record Calls" value={t.autoRecord} onChange={(v) => setToggle('autoRecord', v)} />
          <Row icon="play" label="Call Recordings" onPress={() => router.push('/recordings')} />
          <Row icon="block" tone="r" label="Block List" value={`${data.blocked.length}`} onPress={() => router.push('/blocklist')} />
        </Group>

        <SectionTitle>SIM Management</SectionTitle>
        <Group>
          <ToggleRow icon="sim" label="SIM 1" sub="Grameenphone · Primary" value={t.sim1} onChange={(v) => setToggle('sim1', v)} />
          <ToggleRow icon="sim" label="SIM 2" sub="Robi · Secondary" value={t.sim2} onChange={(v) => setToggle('sim2', v)} />
          <ToggleRow icon="info" label="Ask every time before call" value={t.askEvery} onChange={(v) => setToggle('askEvery', v)} />
        </Group>

        <SectionTitle>Notifications customize</SectionTitle>
        <Group>
          <ToggleRow icon="alert" tone="r" label="Spam Call Alerts" value={t.spamAlerts} onChange={(v) => setToggle('spamAlerts', v)} />
          <ToggleRow
            icon="phoneMissed"
            tone="o"
            label="Missed Call Alerts"
            value={t.missedAlerts}
            onChange={(v) => setToggle('missedAlerts', v)}
          />
          <ToggleRow icon="bell" label="Only Spam Notifications" value={t.onlySpam} onChange={(v) => setToggle('onlySpam', v)} />
        </Group>

        <SectionTitle>General</SectionTitle>
        <Group>
          <Row
            icon="keypad"
            tone="a"
            label="Set as Default Dialer"
            sub="Make CallerX your phone app"
            onPress={() => toast('Default dialer request sent to Android')}
          />
          <ToggleRow icon="moon" label="Dark Mode" value={data.dark} onChange={(v) => set({ ...data, dark: v })} />
          <Row icon="palette" label="Theme" value={data.accent} onPress={() => router.push('/theme')} />
        </Group>

        <View style={styles.footer}>
          <Icon name="shieldCheck" size={14} color={colors.text3} />
          <Text style={[styles.footerText, { color: colors.text3 }]}>CallerX 1.0.0 · All data stays on this device</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 4, paddingBottom: 2 },
  title: { flex: 1, fontSize: 26, fontWeight: '800', letterSpacing: -0.6 },
  list: { paddingBottom: 30 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingTop: 22 },
  footerText: { fontSize: 11.5 },
});
