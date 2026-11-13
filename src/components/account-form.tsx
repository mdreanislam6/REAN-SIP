import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/screen';
import { Button, Card, TextField } from '@/components/ui';
import { spacing, useColors } from '@/constants/theme';
import { useSip } from '@/lib/sip-context';
import type { SipAccount, SipTransport } from '@/lib/sip/types';

type FormState = {
  label: string;
  displayName: string;
  username: string;
  authUser: string;
  password: string;
  domain: string;
  server: string;
  transport: SipTransport;
  expires: string;
};

const EMPTY: FormState = {
  label: '',
  displayName: '',
  username: '',
  authUser: '',
  password: '',
  domain: '',
  server: '',
  transport: 'WSS',
  expires: '300',
};

function validate(form: FormState): Partial<Record<keyof FormState, string>> {
  const errors: Partial<Record<keyof FormState, string>> = {};
  if (!form.label.trim()) errors.label = 'Give this account a name, e.g. "Office".';
  if (!form.username.trim()) errors.username = 'Username is required.';
  if (!form.password) errors.password = 'Password is required.';
  if (!form.domain.trim()) errors.domain = 'SIP domain is required, e.g. sip.example.com.';
  const server = form.server.trim();
  if (!server) {
    errors.server = 'WebSocket URL is required.';
  } else if (!/^wss?:\/\/.+/i.test(server)) {
    errors.server = 'Must start with wss:// (secure) or ws://.';
  }
  const expires = Number(form.expires);
  if (!Number.isFinite(expires) || expires < 60 || expires > 3600) {
    errors.expires = 'Use a value between 60 and 3600 seconds.';
  }
  return errors;
}

export function AccountForm({ accountId }: { accountId?: string }) {
  const colors = useColors();
  const router = useRouter();
  const { accounts, setAccounts, selectAccount } = useSip();

  const existing = useMemo(
    () => (accountId ? accounts.find((a) => a.id === accountId) : undefined),
    [accounts, accountId],
  );

  const [form, setForm] = useState<FormState>(() =>
    existing
      ? {
          label: existing.label,
          displayName: existing.displayName,
          username: existing.username,
          authUser: existing.authUser,
          password: existing.password,
          domain: existing.domain,
          server: existing.server,
          transport: existing.transport,
          expires: String(existing.expires),
        }
      : EMPTY,
  );
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const save = () => {
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    const account: SipAccount = {
      id: existing?.id ?? `acc-${Date.now()}`,
      label: form.label.trim(),
      displayName: form.displayName.trim() || form.username.trim(),
      username: form.username.trim(),
      authUser: form.authUser.trim() || form.username.trim(),
      password: form.password,
      domain: form.domain.trim(),
      server: form.server.trim(),
      transport: form.transport,
      expires: Number(form.expires),
      enabled: existing?.enabled ?? true,
    };

    if (existing) {
      setAccounts((prev) => prev.map((a) => (a.id === account.id ? account : a)));
    } else {
      setAccounts((prev) => [...prev, account]);
      selectAccount(account.id);
    }
    router.back();
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen>
        <Card>
          <Text style={[styles.hint, { color: colors.muted }]}>
            Use the details from your SIP provider. The WebSocket URL is usually the same host as the
            SIP domain, on port 7443 with path /ws — check your provider&apos;s setup page.
          </Text>
        </Card>

        <TextField
          label="Account name"
          placeholder="Office"
          value={form.label}
          onChangeText={(v) => set('label', v)}
          error={errors.label}
          autoCapitalize="words"
        />
        <TextField
          label="Display name"
          placeholder="Your name shown to the other side"
          value={form.displayName}
          onChangeText={(v) => set('displayName', v)}
          autoCapitalize="words"
        />
        <TextField
          label="Username"
          placeholder="1001"
          value={form.username}
          onChangeText={(v) => set('username', v)}
          error={errors.username}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TextField
          label="Auth username (optional)"
          placeholder="Defaults to the username"
          value={form.authUser}
          onChangeText={(v) => set('authUser', v)}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TextField
          label="Password"
          placeholder="SIP password"
          value={form.password}
          onChangeText={(v) => set('password', v)}
          error={errors.password}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TextField
          label="SIP domain"
          placeholder="sip.example.com"
          value={form.domain}
          onChangeText={(v) => set('domain', v)}
          error={errors.domain}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
        />
        <TextField
          label="WebSocket server"
          placeholder="wss://sip.example.com:7443/ws"
          value={form.server}
          onChangeText={(v) => set('server', v)}
          error={errors.server}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
        />

        <View style={styles.transportRow}>
          <Text style={[styles.transportLabel, { color: colors.text }]}>Transport</Text>
          <View style={styles.transportOptions}>
            {(['WSS', 'WS'] as SipTransport[]).map((t) => {
              const on = form.transport === t;
              return (
                <Button
                  key={t}
                  title={t}
                  variant={on ? 'primary' : 'secondary'}
                  onPress={() => set('transport', t)}
                />
              );
            })}
          </View>
        </View>

        <TextField
          label="Registration expiry (seconds)"
          placeholder="300"
          value={form.expires}
          onChangeText={(v) => set('expires', v.replace(/[^0-9]/g, ''))}
          error={errors.expires}
          keyboardType="number-pad"
          hint="How often the app re-registers. 300 is a safe default."
        />

        <Button title={existing ? 'Save changes' : 'Add account'} icon="checkmark" onPress={save} />
        <Button title="Cancel" variant="ghost" onPress={() => router.back()} />
      </Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  hint: { fontSize: 13, lineHeight: 19 },
  transportRow: { gap: spacing.sm },
  transportLabel: { fontSize: 14, fontWeight: '600' },
  transportOptions: { flexDirection: 'row', gap: spacing.sm },
});
