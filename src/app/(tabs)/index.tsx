import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/screen';
import { StatusPill } from '@/components/status-pill';
import { Button, Card, EmptyState } from '@/components/ui';
import { radius, spacing, useColors } from '@/constants/theme';
import { formatNumber } from '@/lib/format';
import { useSip } from '@/lib/sip-context';

const KEYS: { digit: string; letters?: string }[][] = [
  [
    { digit: '1' },
    { digit: '2', letters: 'ABC' },
    { digit: '3', letters: 'DEF' },
  ],
  [
    { digit: '4', letters: 'GHI' },
    { digit: '5', letters: 'JKL' },
    { digit: '6', letters: 'MNO' },
  ],
  [
    { digit: '7', letters: 'PQRS' },
    { digit: '8', letters: 'TUV' },
    { digit: '9', letters: 'WXYZ' },
  ],
  [{ digit: '*' }, { digit: '0', letters: '+' }, { digit: '#' }],
];

export default function DialerScreen() {
  const colors = useColors();
  const router = useRouter();
  const { accounts, activeAccount, registration, registrationDetail, dial, contacts, call } = useSip();
  const [number, setNumber] = useState('');

  const match = useMemo(() => {
    const digits = number.replace(/\D/g, '');
    if (digits.length < 3) return null;
    return contacts.find((c) => c.number.replace(/\D/g, '').endsWith(digits)) ?? null;
  }, [number, contacts]);

  const canCall = number.trim().length > 0 && registration === 'registered' && !call;

  const press = (digit: string) => {
    setNumber((prev) => (prev.length >= 24 ? prev : prev + digit));
  };

  const backspace = () => setNumber((prev) => prev.slice(0, -1));

  const placeCall = () => {
    if (!canCall) return;
    dial(number.trim(), match?.name);
  };

  if (accounts.length === 0) {
    return (
      <Screen>
        <EmptyState
          icon="call-outline"
          title="Add a SIP account to start calling"
          message="REAN SIP connects to any SIP server you have credentials for. Add your server, username and password once — then dial from here."
          actionTitle="Add SIP account"
          onAction={() => router.push('/account/new')}
        />
      </Screen>
    );
  }

  return (
    <Screen scroll={false}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Choose SIP account"
          onPress={() => router.push('/(tabs)/settings')}
          style={({ pressed }) => [pressed && { opacity: 0.6 }]}>
          <StatusPill
            state={registration}
            label={
              registration === 'registered'
                ? (activeAccount?.label ?? 'Registered')
                : registration === 'failed'
                  ? 'Registration failed'
                  : undefined
            }
          />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Diagnostics"
          onPress={() => router.push('/diagnostics')}
          style={({ pressed }) => [pressed && { opacity: 0.6 }]}>
          <Ionicons name="pulse-outline" size={22} color={colors.muted} />
        </Pressable>
      </View>

      {registration === 'failed' && registrationDetail ? (
        <Card style={{ borderColor: colors.danger }}>
          <Text style={[styles.errorTitle, { color: colors.danger }]}>Could not register</Text>
          <Text style={[styles.errorBody, { color: colors.muted }]}>{registrationDetail}</Text>
          <Button
            title="Check account settings"
            variant="secondary"
            icon="settings-outline"
            onPress={() => router.push('/(tabs)/settings')}
          />
        </Card>
      ) : null}

      <View style={styles.display}>
        <Text
          style={[styles.number, { color: number ? colors.text : colors.muted }]}
          numberOfLines={1}
          adjustsFontSizeToFit>
          {number ? formatNumber(number) : 'Enter a number'}
        </Text>
        {match ? (
          <Text style={[styles.match, { color: colors.primary }]} numberOfLines={1}>
            {match.name}
          </Text>
        ) : (
          <Text style={[styles.match, { color: colors.muted }]}>
            {registration === 'registered'
              ? `via ${activeAccount?.label ?? 'SIP'}`
              : registration === 'connecting'
                ? 'Connecting to server…'
                : 'Not registered'}
          </Text>
        )}
      </View>

      <View style={styles.keypad}>
        {KEYS.map((row) => (
          <View key={row.map((k) => k.digit).join('')} style={styles.keyRow}>
            {row.map((key) => (
              <Pressable
                key={key.digit}
                accessibilityRole="button"
                accessibilityLabel={key.digit}
                onPress={() => press(key.digit)}
                onLongPress={() => key.digit === '0' && press('+')}
                style={({ pressed }) => [
                  styles.key,
                  { backgroundColor: colors.card, borderColor: colors.border },
                  pressed && { backgroundColor: colors.primarySoft },
                ]}>
                <Text style={[styles.keyDigit, { color: colors.text }]}>{key.digit}</Text>
                {key.letters ? (
                  <Text style={[styles.keyLetters, { color: colors.muted }]}>{key.letters}</Text>
                ) : null}
              </Pressable>
            ))}
          </View>
        ))}
      </View>

      <View style={styles.actions}>
        <View style={styles.actionSlot} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Call"
          disabled={!canCall}
          onPress={placeCall}
          style={({ pressed }) => [
            styles.callButton,
            { backgroundColor: canCall ? colors.success : colors.border },
            pressed && { opacity: 0.8 },
          ]}>
          <Ionicons name="call" size={30} color="#fff" />
        </Pressable>
        <View style={styles.actionSlot}>
          {number.length > 0 ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Delete last digit"
              onPress={backspace}
              onLongPress={() => setNumber('')}
              style={({ pressed }) => [styles.backspace, pressed && { opacity: 0.5 }]}>
              <Ionicons name="backspace-outline" size={26} color={colors.muted} />
            </Pressable>
          ) : null}
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.sm,
  },
  errorTitle: { fontSize: 15, fontWeight: '700' },
  errorBody: { fontSize: 13, lineHeight: 19 },
  display: { alignItems: 'center', gap: 4, paddingVertical: spacing.md, minHeight: 96 },
  number: { fontSize: 34, fontWeight: '600', letterSpacing: 0.5 },
  match: { fontSize: 14, fontWeight: '500' },
  keypad: { flex: 1, justifyContent: 'center', gap: spacing.sm },
  keyRow: { flexDirection: 'row', justifyContent: 'center', gap: spacing.md },
  key: {
    width: 78,
    height: 62,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyDigit: { fontSize: 26, fontWeight: '600' },
  keyLetters: { fontSize: 9, fontWeight: '700', letterSpacing: 1.2, marginTop: -2 },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
  },
  actionSlot: { width: 72, alignItems: 'center' },
  callButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backspace: { padding: spacing.sm },
});
