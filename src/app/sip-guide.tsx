import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Icon } from '@/components/icon';
import { IconButton } from '@/components/kit';
import { useApp } from '@/lib/app-state';

const STEPS = [
  {
    title: 'Get your SIP credentials',
    body: 'Ask your SIP provider for the username, password, server/domain and port. Most providers also give a WebSocket URL for browser and mobile clients.',
  },
  {
    title: 'Enable WebSocket on the server',
    body: 'CallerX sends audio over WebRTC, which needs a WebSocket transport. In your PBX or provider panel, turn on WSS (usually port 7443) and note the exact path, e.g. wss://sip.example.com:7443/ws.',
  },
  {
    title: 'Enter the details in CallerX',
    body: 'Open Settings -> SIP Account, fill in username, password, server, port and the WebSocket URL, then choose TLS as the transport.',
  },
  {
    title: 'Register',
    body: 'Tap Save & Register. The status card turns green and the Calls screen chip shows SIP Online. If it stays red, check the server address and that the port is reachable from mobile data.',
  },
  {
    title: 'Make a test call',
    body: 'Open the keypad, dial an extension or a full number and press the green call button. Audio uses the phone microphone, so grant the Microphone permission first.',
  },
];

export default function SipGuideScreen() {
  const { colors } = useApp();
  const router = useRouter();

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.root, { backgroundColor: colors.bg }]}>
      <View style={styles.top}>
        <IconButton name="arrowLeft" onPress={() => router.back()} />
        <Text style={[styles.topTitle, { color: colors.text }]}>SIP Setup Guide</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.hero, { backgroundColor: colors.accentSoft }]}>
          <Icon name="server" size={22} color={colors.accent} />
          <Text style={[styles.heroText, { color: colors.text }]}>
            Five steps to get CallerX online with your own SIP provider.
          </Text>
        </View>

        {STEPS.map((s, i) => (
          <View key={s.title} style={[styles.step, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.num, { backgroundColor: colors.accent }]}>
              <Text style={styles.numText}>{i + 1}</Text>
            </View>
            <View style={styles.flex}>
              <Text style={[styles.stepTitle, { color: colors.text }]}>{s.title}</Text>
              <Text style={[styles.stepBody, { color: colors.text2 }]}>{s.body}</Text>
            </View>
          </View>
        ))}

        <View style={[styles.note, { backgroundColor: colors.orangeSoft }]}>
          <Icon name="alert" size={16} color={colors.orange} />
          <Text style={[styles.noteText, { color: colors.text }]}>
            Incoming calls ring while CallerX is open. Ringing when the app is closed needs a push service from your provider.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  top: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingTop: 4 },
  topTitle: { flex: 1, textAlign: 'center', fontSize: 14, fontWeight: '700' },
  content: { padding: 16, paddingBottom: 30, gap: 10 },
  hero: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 16 },
  heroText: { flex: 1, fontSize: 13, lineHeight: 19, fontWeight: '600' },
  step: { flexDirection: 'row', gap: 12, padding: 13, borderRadius: 16, borderWidth: 1 },
  num: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  numText: { color: '#FFFFFF', fontSize: 12.5, fontWeight: '800' },
  stepTitle: { fontSize: 14, fontWeight: '700' },
  stepBody: { fontSize: 12.5, lineHeight: 18, marginTop: 3 },
  note: { flexDirection: 'row', gap: 9, padding: 13, borderRadius: 14, alignItems: 'flex-start' },
  noteText: { flex: 1, fontSize: 12, lineHeight: 18 },
});
