import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/screen';
import { InfoRow, SectionTitle, StatusPill } from '@/components/status-pill';
import { Button, Card } from '@/components/ui';
import { radius, spacing, useColors } from '@/constants/theme';
import { useSip } from '@/lib/sip-context';

export default function DiagnosticsScreen() {
  const colors = useColors();
  const router = useRouter();
  const { activeAccount, registration, registrationDetail, trace, accounts } = useSip();
  const [showTrace, setShowTrace] = useState(false);

  return (
    <Screen>
      <Card>
        <View style={styles.head}>
          <Text style={[styles.title, { color: colors.text }]}>Connection</Text>
          <StatusPill state={registration} />
        </View>
        {activeAccount ? (
          <>
            <InfoRow icon="person-outline" label="Account" value={activeAccount.label} />
            <InfoRow
              icon="at-outline"
              label="Address"
              value={`${activeAccount.username}@${activeAccount.domain}`}
            />
            <InfoRow icon="link-outline" label="Server" value={activeAccount.server} />
            <InfoRow icon="swap-horizontal" label="Transport" value={activeAccount.transport} />
            <InfoRow
              icon="time-outline"
              label="Expiry"
              value={`${activeAccount.expires} s`}
            />
            {registrationDetail ? (
              <InfoRow
                icon="alert-circle-outline"
                label="Last message"
                value={registrationDetail}
                tone={registration === 'failed' ? 'danger' : 'default'}
              />
            ) : null}
          </>
        ) : (
          <Text style={[styles.body, { color: colors.muted }]}>
            No SIP account is configured yet.
          </Text>
        )}
      </Card>

      <SectionTitle>SIP trace</SectionTitle>
      <Card>
        <Text style={[styles.body, { color: colors.muted }]}>
          The last SIP messages this app sent and received. Useful when a server rejects
          registration — the status line tells you why.
        </Text>
        <Button
          title={showTrace ? 'Hide trace' : 'Show trace'}
          variant="secondary"
          icon={showTrace ? 'chevron-up' : 'chevron-down'}
          onPress={() => setShowTrace((v) => !v)}
        />
        {showTrace ? (
          <ScrollView style={[styles.traceBox, { backgroundColor: colors.background }]}>
            {trace.length === 0 ? (
              <Text style={[styles.traceLine, { color: colors.muted }]}>Nothing yet.</Text>
            ) : (
              trace.map((line, index) => (
                <Text
                  key={`${index}-${line}`}
                  style={[styles.traceLine, { color: colors.text }]}
                  selectable>
                  {line}
                </Text>
              ))
            )}
          </ScrollView>
        ) : null}
      </Card>

      <SectionTitle>Checklist</SectionTitle>
      <Card>
        <ChecklistItem
          done={accounts.length > 0}
          text="A SIP account is saved"
          onPress={() => router.push('/account/new')}
        />
        <ChecklistItem
          done={registration === 'registered'}
          text="The account is registered with the server"
          onPress={() => router.push('/(tabs)/settings')}
        />
        <ChecklistItem
          done={!!activeAccount?.server.startsWith('wss://')}
          text="The server uses a secure wss:// address"
          onPress={() => activeAccount && router.push(`/account/${activeAccount.id}`)}
        />
      </Card>

      <Card>
        <Text style={[styles.body, { color: colors.muted }]}>
          Common causes of a failed registration: wrong password, the server does not allow
          WebSocket transport, the WebSocket path is not /ws, or the port is blocked on your network.
          Try a mobile data connection if Wi-Fi blocks the port.
        </Text>
      </Card>
    </Screen>
  );
}

function ChecklistItem({
  done,
  text,
  onPress,
}: {
  done: boolean;
  text: string;
  onPress: () => void;
}) {
  const colors = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.checkRow, pressed && { opacity: 0.6 }]}>
      <View
        style={[
          styles.checkCircle,
          { backgroundColor: done ? colors.success : colors.background, borderColor: colors.border },
        ]}>
        <Ionicons name={done ? 'checkmark' : 'ellipse-outline'} size={14} color={done ? '#fff' : colors.muted} />
      </View>
      <Text style={[styles.checkText, { color: colors.text }]}>{text}</Text>
      <Ionicons name="chevron-forward" size={16} color={colors.muted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 16, fontWeight: '700' },
  body: { fontSize: 13, lineHeight: 19 },
  traceBox: { maxHeight: 260, borderRadius: radius.sm, padding: spacing.sm },
  traceLine: { fontSize: 11, fontFamily: 'monospace', lineHeight: 16 },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: 8 },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkText: { flex: 1, fontSize: 14 },
});
