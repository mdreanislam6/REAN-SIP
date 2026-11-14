import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Icon } from '@/components/icon';
import { Btn, Field, Group, IconButton, Row, SectionTitle } from '@/components/kit';
import { useApp } from '@/lib/app-state';

const TRANSPORTS: ('UDP' | 'TCP' | 'TLS')[] = ['UDP', 'TCP', 'TLS'];

export default function SipScreen() {
  const { colors, data, set, toast } = useApp();
  const router = useRouter();
  const [form, setForm] = useState(data.sip);
  const [busy, setBusy] = useState(false);

  const patch = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const register = () => {
    if (!form.user.trim() || !form.server.trim()) {
      toast('Username and server are required');
      return;
    }
    setBusy(true);
    setTimeout(() => {
      const online = true;
      setForm((f) => ({ ...f, online }));
      set({ ...data, sip: { ...form, online } });
      setBusy(false);
      toast('SIP registered - Online');
    }, 1600);
  };

  const unregister = () => {
    const next = { ...form, online: false };
    setForm(next);
    set({ ...data, sip: next });
    toast('SIP unregistered');
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.root, { backgroundColor: colors.bg }]}>
      <View style={styles.top}>
        <IconButton name="arrowLeft" onPress={() => router.back()} />
        <Text style={[styles.topTitle, { color: colors.text }]}>SIP Account</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View
          style={[
            styles.statusCard,
            { backgroundColor: form.online ? colors.greenSoft : colors.redSoft, borderColor: form.online ? colors.green + '44' : colors.red + '44' },
          ]}>
          <View style={[styles.statusIcon, { backgroundColor: form.online ? colors.green : colors.red }]}>
            <Icon name="wifi" size={20} color="#FFFFFF" strokeWidth={2.2} />
          </View>
          <View style={styles.flex}>
            <Text style={[styles.statusTitle, { color: form.online ? colors.green : colors.red }]}>
              {form.online ? 'Registered - Online' : 'Not registered'}
            </Text>
            <Text style={[styles.statusSub, { color: colors.text2 }]}>
              {form.online ? `${form.user}@${form.server} - ${form.transport}` : 'Enter your SIP details and register'}
            </Text>
          </View>
        </View>

        <SectionTitle>Credentials</SectionTitle>
        <Field label="Username" value={form.user} onChangeText={(v) => patch('user', v)} placeholder="1001" />
        <Field label="Password" value={form.pass} onChangeText={(v) => patch('pass', v)} secure placeholder="********" />

        <SectionTitle>Server</SectionTitle>
        <Field label="Server / Domain" value={form.server} onChangeText={(v) => patch('server', v)} placeholder="sip.example.com" />
        <Field label="Port" value={form.port} onChangeText={(v) => patch('port', v)} keyboard="numeric" placeholder="5060" />
        <Field
          label="WebSocket URL (for media)"
          value={form.ws}
          onChangeText={(v) => patch('ws', v)}
          placeholder="wss://sip.example.com:7443/ws"
          hint="Required for audio over WebRTC. Ask your provider for the WSS endpoint."
        />

        <SectionTitle>Transport</SectionTitle>
        <View style={styles.transportRow}>
          {TRANSPORTS.map((t) => {
            const active = form.transport === t;
            return (
              <Pressable
                key={t}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                onPress={() => patch('transport', t)}
                style={[
                  styles.transport,
                  {
                    backgroundColor: active ? colors.accent : colors.card,
                    borderColor: active ? colors.accent : colors.border,
                  },
                ]}>
                <Text style={[styles.transportText, { color: active ? '#FFFFFF' : colors.text2 }]}>{t}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.actions}>
          <Btn title={busy ? 'Registering...' : 'Save & Register'} icon="check" onPress={register} disabled={busy} />
          {form.online ? <Btn title="Unregister" variant="secondary" onPress={unregister} /> : null}
        </View>

        <SectionTitle>Help</SectionTitle>
        <Group>
          <Row icon="info" tone="a" label="SIP Setup Guide" sub="Step-by-step provider setup" onPress={() => router.push('/sip-guide')} />
          <Row icon="shieldCheck" tone="p" label="VoIP Security" onPress={() => router.push('/voip-security')} />
        </Group>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  top: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingTop: 4 },
  topTitle: { flex: 1, textAlign: 'center', fontSize: 14, fontWeight: '700' },
  content: { paddingBottom: 30 },
  statusCard: { flexDirection: 'row', alignItems: 'center', gap: 12, margin: 16, marginBottom: 4, padding: 13, borderRadius: 16, borderWidth: 1 },
  statusIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  statusTitle: { fontSize: 14, fontWeight: '800' },
  statusSub: { fontSize: 12, marginTop: 2 },
  transportRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16 },
  transport: { flex: 1, alignItems: 'center', paddingVertical: 11, borderRadius: 12, borderWidth: 1 },
  transportText: { fontSize: 13, fontWeight: '800', letterSpacing: 0.4 },
  actions: { paddingHorizontal: 16, paddingTop: 18, gap: 10 },
});
