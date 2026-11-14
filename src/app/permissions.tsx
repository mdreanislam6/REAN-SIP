import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Icon, type IconName } from '@/components/icon';
import { Btn, Tile } from '@/components/kit';
import { useApp } from '@/lib/app-state';
import { requestAll, requestPermission, type PermKey } from '@/lib/permissions';

type Perm = { key: PermKey; icon: IconName; tone: '' | 'g' | 'r' | 'o' | 'p' | 'a'; title: string; desc: string; optional?: boolean };

const PERMS: Perm[] = [
  { key: 'phone', icon: 'phone', tone: 'g', title: 'Phone', desc: 'Make and manage calls on this device' },
  { key: 'log', icon: 'clock', tone: '', title: 'Call Log', desc: 'Show your call history and identify missed calls' },
  { key: 'contacts', icon: 'users', tone: '', title: 'Contacts', desc: 'Match numbers to names you already saved' },
  { key: 'mic', icon: 'mic', tone: 'o', title: 'Microphone', desc: 'Required for every voice call' },
  { key: 'notif', icon: 'bell', tone: 'p', title: 'Notifications', desc: 'Alerts for missed and spam calls' },
  { key: 'dialer', icon: 'keypad', tone: '', title: 'Default Dialer', desc: 'Make CallerX your phone app' },
  { key: 'overlay', icon: 'eye', tone: '', title: 'Appear on Top', desc: 'Show caller ID over other apps', optional: true },
];

export default function PermissionsScreen() {
  const { colors, data, set, toast } = useApp();
  const router = useRouter();
  const [granted, setGranted] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState(false);

  const required = PERMS.filter((p) => !p.optional);
  const allRequired = required.every((p) => granted[p.key]);

  const grant = async (p: Perm) => {
    setBusy(true);
    // Default dialer is a system role, granted from Android settings, not a dialog.
    const ok = p.key === 'dialer' ? true : await requestPermission(p.key);
    setBusy(false);
    setGranted((g) => ({ ...g, [p.key]: ok }));
    if (!ok) toast('Permission denied - you can allow it later from Settings');
  };

  const grantAll = async () => {
    setBusy(true);
    const res = await requestAll();
    setGranted((g) => ({ ...g, ...res, dialer: true }));
    setBusy(false);
  };

  const finish = () => {
    set({ ...data, permsDone: true });
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={[styles.root, { backgroundColor: colors.bg }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={[styles.logo, { backgroundColor: colors.accentSoft }]}>
            <Icon name="shieldCheck" size={30} color={colors.accent} />
          </View>
          <Text style={[styles.h1, { color: colors.text }]}>Welcome to CallerX</Text>
          <Text style={[styles.p, { color: colors.text2 }]}>
            To identify callers, block spam and make calls, CallerX needs a few permissions. Everything stays on your device.
          </Text>
        </View>

        <View style={styles.list}>
          {PERMS.map((p) => {
            const on = !!granted[p.key];
            return (
              <View key={p.key} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Tile icon={p.icon} tone={p.tone} size={38} />
                <View style={styles.flex}>
                  <View style={styles.titleRow}>
                    <Text style={[styles.cardTitle, { color: colors.text }]}>{p.title}</Text>
                    {p.optional ? <Text style={[styles.opt, { color: colors.text3 }]}>OPTIONAL</Text> : null}
                  </View>
                  <Text style={[styles.cardDesc, { color: colors.text2 }]}>{p.desc}</Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected: on }}
                  disabled={busy}
                  onPress={() => grant(p)}
                  style={({ pressed }) => [
                    styles.allow,
                    { backgroundColor: on ? colors.greenSoft : colors.accent },
                    pressed && { opacity: 0.75 },
                  ]}>
                  {on ? <Icon name="check" size={15} color={colors.green} /> : null}
                  <Text style={[styles.allowText, { color: on ? colors.green : '#FFFFFF' }]}>{on ? 'Allowed' : 'Allow'}</Text>
                </Pressable>
              </View>
            );
          })}
        </View>

        <View style={styles.foot}>
          <Btn title={busy ? 'Requesting...' : 'Allow all permissions'} icon="shieldCheck" onPress={grantAll} disabled={busy} />
          <Btn title="Continue to CallerX" variant="secondary" onPress={finish} disabled={!allRequired || busy} />
          {busy ? <ActivityIndicator color={colors.accent} /> : null}
          <Text style={[styles.note, { color: colors.text3 }]}>
            {allRequired
              ? 'You can change any permission later from Settings.'
              : 'Grant the required permissions above to continue.'}
          </Text>
          {Platform.OS === 'android' ? (
            <Text style={[styles.note, { color: colors.text3 }]}>
              Android shows its own system prompt for each permission. Default Dialer is enabled from Android settings, because
              a launcher app cannot hand over that role by itself.
            </Text>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  content: { padding: 16, paddingBottom: 28, gap: 16 },
  hero: { alignItems: 'center', gap: 8, paddingTop: 12 },
  logo: { width: 66, height: 66, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  h1: { fontSize: 23, fontWeight: '800', letterSpacing: -0.5 },
  p: { fontSize: 13.5, textAlign: 'center', lineHeight: 20, paddingHorizontal: 8 },
  list: { gap: 9 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 16, borderWidth: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cardTitle: { fontSize: 14.5, fontWeight: '700' },
  opt: { fontSize: 9, fontWeight: '800', letterSpacing: 0.6 },
  cardDesc: { fontSize: 12, marginTop: 2, lineHeight: 16 },
  allow: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 13, paddingVertical: 8, borderRadius: 999 },
  allowText: { fontSize: 12.5, fontWeight: '800' },
  foot: { gap: 9, paddingTop: 4 },
  note: { fontSize: 11.5, textAlign: 'center', lineHeight: 16 },
});
