import Ionicons from '@expo/vector-icons/Ionicons';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import { Screen } from '@/components/screen';
import { SectionTitle, StatusDot } from '@/components/status-pill';
import { Button, Card, ConfirmDialog } from '@/components/ui';
import { radius, spacing, useColors } from '@/constants/theme';
import { useSip } from '@/lib/sip-context';
import type { AppSettings, SipAccount } from '@/lib/sip/types';

const CODECS = ['PCMU', 'PCMA', 'G722', 'OPUS'];

export default function SettingsScreen() {
  const colors = useColors();
  const router = useRouter();
  const {
    accounts,
    setAccounts,
    activeAccountId,
    selectAccount,
    registration,
    registrationDetail,
    settings,
    setSettings,
    callLog,
    contacts,
  } = useSip();
  const [pendingDelete, setPendingDelete] = useState<SipAccount | null>(null);

  const toggleAccount = (account: SipAccount) => {
    setAccounts((prev) =>
      prev.map((a) => (a.id === account.id ? { ...a, enabled: !a.enabled } : a)),
    );
  };

  const removeAccount = (account: SipAccount) => {
    setAccounts((prev) => prev.filter((a) => a.id !== account.id));
    setPendingDelete(null);
  };

  const updateSetting = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const toggleCodec = (codec: string) => {
    setSettings((prev) => {
      const has = prev.codecs.includes(codec);
      const next = has ? prev.codecs.filter((c) => c !== codec) : [...prev.codecs, codec];
      return { ...prev, codecs: next.length === 0 ? prev.codecs : next };
    });
  };

  return (
    <Screen>
      <SectionTitle
        action={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Add SIP account"
            onPress={() => router.push('/account/new')}
            hitSlop={8}
            style={({ pressed }) => [pressed && { opacity: 0.5 }]}>
            <Ionicons name="add-circle-outline" size={22} color={colors.primary} />
          </Pressable>
        }>
        SIP accounts
      </SectionTitle>

      {accounts.length === 0 ? (
        <Card>
          <Text style={[styles.cardTitle, { color: colors.text }]}>No account yet</Text>
          <Text style={[styles.cardBody, { color: colors.muted }]}>
            Add the SIP server, username and password from your provider. REAN SIP registers over
            WebSocket (WSS) and keeps the account online in the background.
          </Text>
          <Button title="Add SIP account" icon="add" onPress={() => router.push('/account/new')} />
        </Card>
      ) : (
        accounts.map((account) => {
          const isActive = account.id === activeAccountId;
          return (
            <Card key={account.id}>
              <View style={styles.accountHead}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Use ${account.label}`}
                  onPress={() => selectAccount(account.id)}
                  style={styles.accountMain}>
                  <View style={styles.accountTitleRow}>
                    {isActive ? <StatusDot state={registration} /> : null}
                    <Text style={[styles.accountName, { color: colors.text }]} numberOfLines={1}>
                      {account.label}
                    </Text>
                    {isActive ? (
                      <View style={[styles.tag, { backgroundColor: colors.primarySoft }]}>
                        <Text style={[styles.tagText, { color: colors.primary }]}>ACTIVE</Text>
                      </View>
                    ) : null}
                  </View>
                  <Text style={[styles.accountMeta, { color: colors.muted }]} numberOfLines={1}>
                    {account.username}@{account.domain}
                  </Text>
                  <Text style={[styles.accountMeta, { color: colors.muted }]} numberOfLines={1}>
                    {account.server}
                  </Text>
                </Pressable>
                <Switch
                  value={account.enabled}
                  onValueChange={() => toggleAccount(account)}
                  accessibilityLabel={`Enable ${account.label}`}
                />
              </View>

              {isActive && registration === 'failed' && registrationDetail ? (
                <Text style={[styles.failText, { color: colors.danger }]}>{registrationDetail}</Text>
              ) : null}

              <View style={styles.accountActions}>
                <View style={styles.actionFlex}>
                  <Button
                    title="Edit"
                    variant="secondary"
                    icon="create-outline"
                    onPress={() => router.push(`/account/${account.id}`)}
                  />
                </View>
                <View style={styles.actionFlex}>
                  <Button
                    title="Delete"
                    variant="ghost"
                    icon="trash-outline"
                    onPress={() => setPendingDelete(account)}
                  />
                </View>
              </View>
            </Card>
          );
        })
      )}

      <SectionTitle>Audio codecs</SectionTitle>
      <Card>
        <Text style={[styles.cardBody, { color: colors.muted }]}>
          Offered in this order. PCMU and PCMA (G.711) work on every SIP server; G.722 and Opus give
          better quality when the server supports them.
        </Text>
        <View style={styles.chipRow}>
          {CODECS.map((codec) => {
            const on = settings.codecs.includes(codec);
            return (
              <Pressable
                key={codec}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                onPress={() => toggleCodec(codec)}
                style={[
                  styles.chip,
                  {
                    backgroundColor: on ? colors.primary : colors.card,
                    borderColor: on ? colors.primary : colors.border,
                  },
                ]}>
                <Text style={[styles.chipText, { color: on ? colors.onPrimary : colors.muted }]}>
                  {codec}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Card>

      <SectionTitle>Call behaviour</SectionTitle>
      <Card>
        <SettingSwitch
          label="Ringtone"
          hint="Play a ringtone for incoming calls"
          value={settings.ringtone}
          onChange={(v) => updateSetting('ringtone', v)}
        />
        <SettingSwitch
          label="Vibrate"
          hint="Vibrate when a call comes in"
          value={settings.vibrate}
          onChange={(v) => updateSetting('vibrate', v)}
        />
        <SettingSwitch
          label="Keypad tones"
          hint="Play a tone when you press a dial key"
          value={settings.keypadTones}
          onChange={(v) => updateSetting('keypadTones', v)}
        />
        <SettingSwitch
          label="Show SIP trace"
          hint="Show the last SIP status line during a call"
          value={settings.showSipTrace}
          onChange={(v) => updateSetting('showSipTrace', v)}
        />
      </Card>

      <SectionTitle>Data on this phone</SectionTitle>
      <Card>
        <View style={styles.statRow}>
          <Text style={[styles.statLabel, { color: colors.muted }]}>Call log entries</Text>
          <Text style={[styles.statValue, { color: colors.text }]}>{callLog.length}</Text>
        </View>
        <View style={styles.statRow}>
          <Text style={[styles.statLabel, { color: colors.muted }]}>Contacts</Text>
          <Text style={[styles.statValue, { color: colors.text }]}>{contacts.length}</Text>
        </View>
        <Text style={[styles.cardBody, { color: colors.muted }]}>
          Accounts, call log and contacts are stored only on this device. Nothing is uploaded to us —
          the app talks only to the SIP server you configure.
        </Text>
        <Button
          title="Open diagnostics"
          variant="secondary"
          icon="pulse-outline"
          onPress={() => router.push('/diagnostics')}
        />
      </Card>

      <Text style={[styles.version, { color: colors.muted }]}>
        REAN SIP {Constants.expoConfig?.version ?? '1.0.0'}
      </Text>

      <ConfirmDialog
        visible={pendingDelete !== null}
        title="Delete this account?"
        message={`${pendingDelete?.label ?? 'This account'} will be removed from this phone.`}
        confirmTitle="Delete"
        cancelTitle="Cancel"
        destructive
        onConfirm={() => pendingDelete && removeAccount(pendingDelete)}
        onCancel={() => setPendingDelete(null)}
      />
    </Screen>
  );
}

function SettingSwitch({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint: string;
  value: boolean;
  onChange: (next: boolean) => void;
}) {
  const colors = useColors();
  return (
    <View style={styles.switchRow}>
      <View style={styles.switchText}>
        <Text style={[styles.switchLabel, { color: colors.text }]}>{label}</Text>
        <Text style={[styles.switchHint, { color: colors.muted }]}>{hint}</Text>
      </View>
      <Switch value={value} onValueChange={onChange} accessibilityLabel={label} />
    </View>
  );
}

const styles = StyleSheet.create({
  cardTitle: { fontSize: 16, fontWeight: '700' },
  cardBody: { fontSize: 13, lineHeight: 19 },
  accountHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  accountMain: { flex: 1, gap: 3 },
  accountTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  accountName: { fontSize: 16, fontWeight: '700', flexShrink: 1 },
  accountMeta: { fontSize: 12 },
  tag: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: radius.sm },
  tagText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.6 },
  failText: { fontSize: 12 },
  accountActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  actionFlex: { flex: 1 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  chipText: { fontSize: 13, fontWeight: '700' },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: 6 },
  switchText: { flex: 1, gap: 2 },
  switchLabel: { fontSize: 15, fontWeight: '600' },
  switchHint: { fontSize: 12 },
  statRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  statLabel: { fontSize: 14 },
  statValue: { fontSize: 14, fontWeight: '700' },
  version: { fontSize: 12, textAlign: 'center', marginTop: spacing.sm },
});
