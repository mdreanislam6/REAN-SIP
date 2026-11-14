import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Icon } from '@/components/icon';
import { IconButton } from '@/components/kit';
import { useApp } from '@/lib/app-state';

const TIPS = [
  { title: 'Always use TLS', body: 'TLS encrypts the SIP signalling so usernames, passwords and numbers cannot be read on the network.' },
  { title: 'Turn on SRTP', body: 'SRTP encrypts the audio itself. Without it, anyone on the same Wi-Fi can capture the call.' },
  { title: 'Use strong SIP passwords', body: 'Long random passwords stop registration hijacking, where an attacker makes calls on your account.' },
  { title: 'Verify the server certificate', body: 'Certificate verification blocks man-in-the-middle servers pretending to be your provider.' },
  { title: 'Avoid public Wi-Fi for calls', body: 'If you must use it, keep TLS and SRTP on and prefer mobile data for important calls.' },
  { title: 'Review linked devices', body: 'Sign out devices you no longer use so an old phone cannot receive your calls.' },
];

export default function VoipBestScreen() {
  const { colors } = useApp();
  const router = useRouter();

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.root, { backgroundColor: colors.bg }]}>
      <View style={styles.top}>
        <IconButton name="arrowLeft" onPress={() => router.back()} />
        <Text style={[styles.topTitle, { color: colors.text }]}>Security Best Practices</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {TIPS.map((t) => (
          <View key={t.title} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.num, { backgroundColor: colors.greenSoft }]}>
              <Icon name="shieldCheck" size={16} color={colors.green} />
            </View>
            <View style={styles.flex}>
              <Text style={[styles.title, { color: colors.text }]}>{t.title}</Text>
              <Text style={[styles.body, { color: colors.text2 }]}>{t.body}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  top: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingTop: 4 },
  topTitle: { flex: 1, textAlign: 'center', fontSize: 14, fontWeight: '700' },
  content: { padding: 16, paddingBottom: 30, gap: 9 },
  card: { flexDirection: 'row', gap: 12, padding: 13, borderRadius: 16, borderWidth: 1 },
  num: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 13.5, fontWeight: '700' },
  body: { fontSize: 12, lineHeight: 17, marginTop: 2 },
});
