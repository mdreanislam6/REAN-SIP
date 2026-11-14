import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Icon } from '@/components/icon';
import { IconButton } from '@/components/kit';
import { useApp } from '@/lib/app-state';

const KEYS: { d: string; l: string; sym?: boolean }[] = [
  { d: '1', l: '' },
  { d: '2', l: 'ABC' },
  { d: '3', l: 'DEF' },
  { d: '4', l: 'GHI' },
  { d: '5', l: 'JKL' },
  { d: '6', l: 'MNO' },
  { d: '7', l: 'PQRS' },
  { d: '8', l: 'TUV' },
  { d: '9', l: 'WXYZ' },
  { d: '*', l: '', sym: true },
  { d: '0', l: '+' },
  { d: '#', l: '', sym: true },
];

export default function DialerScreen() {
  const { colors, data, toast } = useApp();
  const router = useRouter();
  const [num, setNum] = useState('');

  const match = useMemo(() => {
    const digits = num.replace(/\D/g, '');
    if (digits.length < 3) return null;
    return data.contacts.find((c) => c.num.replace(/\D/g, '').includes(digits)) ?? null;
  }, [num, data.contacts]);

  const press = (d: string) => {
    if (num.length >= 15) return;
    setNum((n) => n + d);
  };

  const call = () => {
    if (!num) {
      toast('Enter a number to call');
      return;
    }
    router.push({ pathname: '/call', params: { num, name: match?.name ?? '' } });
  };

  const display = num || '';
  const fontSize = display.length > 13 ? 24 : display.length > 10 ? 30 : 36;

  return (
    <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={[styles.root, { backgroundColor: colors.bg }]}>
      <View style={styles.top}>
        <IconButton name="x" onPress={() => router.back()} />
        <Text style={[styles.topLabel, { color: colors.text2 }]}>KEYPAD</Text>
        <IconButton name="sim" onPress={() => router.push('/sip')} />
      </View>

      <View style={styles.display}>
        <Text
          style={[styles.number, { color: colors.text, fontSize }]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.6}>
          {display || ' '}
        </Text>
        {num ? (
          <Text style={[styles.hint, { color: colors.text2 }]} numberOfLines={1}>
            {match ? match.name : 'Add to contacts'}
          </Text>
        ) : (
          <View style={[styles.sipChip, { backgroundColor: data.sip.online ? colors.greenSoft : colors.redSoft }]}>
            <View style={[styles.sipDot, { backgroundColor: data.sip.online ? colors.green : colors.red }]} />
            <Text style={[styles.sipText, { color: data.sip.online ? colors.green : colors.red }]}>
              {data.sip.online ? 'SIP ONLINE' : 'SIP OFFLINE'}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.keypad}>
        {KEYS.map((k) => (
          <Pressable
            key={k.d}
            accessibilityRole="button"
            accessibilityLabel={k.d}
            onPress={() => press(k.d)}
            style={({ pressed }) => [
              styles.key,
              {
                backgroundColor: pressed ? colors.accentSoft : colors.card,
                borderColor: pressed ? colors.accent : colors.border,
              },
              pressed && { transform: [{ scale: 0.94 }] },
            ]}>
            <Text style={[styles.kd, { color: colors.text, fontSize: k.sym ? 27 : 29 }]}>{k.d}</Text>
            {k.l ? <Text style={[styles.kl, { color: colors.text3 }]}>{k.l}</Text> : null}
          </Pressable>
        ))}
      </View>

      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Add to contacts"
          onPress={() => toast('Add to contacts')}
          style={styles.side}>
          <Icon name="user" size={23} color={colors.text2} />
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Call"
          onPress={call}
          style={({ pressed }) => [styles.callFab, { backgroundColor: colors.green }, pressed && { transform: [{ scale: 0.93 }] }]}>
          <Icon name="phone" size={27} color="#FFFFFF" strokeWidth={2} />
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Backspace"
          onPress={() => setNum((n) => n.slice(0, -1))}
          onLongPress={() => setNum('')}
          style={styles.side}>
          <Icon name="backspace" size={23} color={num ? colors.text2 : colors.text3} />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: 20 },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 6 },
  topLabel: { fontSize: 12, fontWeight: '800', letterSpacing: 1.2 },
  display: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 8 },
  number: { fontWeight: '600', letterSpacing: 1.2, fontVariant: ['tabular-nums'] },
  hint: { fontSize: 13, fontWeight: '500' },
  sipChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  sipDot: { width: 5, height: 5, borderRadius: 2.5 },
  sipText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.7 },
  keypad: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', rowGap: 14, columnGap: 26, paddingBottom: 14 },
  key: { width: 74, height: 74, borderRadius: 37, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  kd: { fontWeight: '600', lineHeight: 33, letterSpacing: 0.2, fontVariant: ['tabular-nums'] },
  kl: { fontSize: 8.5, fontWeight: '800', letterSpacing: 2.1, marginTop: 1 },
  actions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingTop: 8, paddingBottom: 10 },
  side: { width: 46, height: 46, alignItems: 'center', justifyContent: 'center' },
  callFab: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
  },
});
