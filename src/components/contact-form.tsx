import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Switch, Text, View } from 'react-native';

import { Screen } from '@/components/screen';
import { Button, Card, TextField } from '@/components/ui';
import { spacing, useColors } from '@/constants/theme';
import { useSip } from '@/lib/sip-context';
import type { Contact } from '@/lib/sip/types';

export function ContactForm({ contactId }: { contactId?: string }) {
  const colors = useColors();
  const router = useRouter();
  const { contacts, setContacts } = useSip();

  const existing = useMemo(
    () => (contactId ? contacts.find((c) => c.id === contactId) : undefined),
    [contacts, contactId],
  );

  const [name, setName] = useState(existing?.name ?? '');
  const [number, setNumber] = useState(existing?.number ?? '');
  const [company, setCompany] = useState(existing?.company ?? '');
  const [favorite, setFavorite] = useState(existing?.favorite ?? false);
  const [blocked, setBlocked] = useState(existing?.blocked ?? false);
  const [errors, setErrors] = useState<{ name?: string; number?: string }>({});

  const save = () => {
    const next: typeof errors = {};
    if (!name.trim()) next.name = 'Name is required.';
    const digits = number.replace(/[^\d+*#]/g, '');
    if (!digits) next.number = 'Enter a number or SIP extension.';
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    const contact: Contact = {
      id: existing?.id ?? `c-${Date.now()}`,
      name: name.trim(),
      number: digits,
      company: company.trim() || undefined,
      favorite,
      blocked,
    };
    if (existing) {
      setContacts((prev) => prev.map((c) => (c.id === contact.id ? contact : c)));
    } else {
      setContacts((prev) => [...prev, contact]);
    }
    router.back();
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen>
        <TextField
          label="Name"
          placeholder="Full name"
          value={name}
          onChangeText={(v) => {
            setName(v);
            setErrors((e) => ({ ...e, name: undefined }));
          }}
          error={errors.name}
          autoCapitalize="words"
        />
        <TextField
          label="Number or extension"
          placeholder="1001 or +8801712345678"
          value={number}
          onChangeText={(v) => {
            setNumber(v);
            setErrors((e) => ({ ...e, number: undefined }));
          }}
          error={errors.number}
          keyboardType="phone-pad"
          autoCapitalize="none"
        />
        <TextField
          label="Company (optional)"
          placeholder="Office, client, family…"
          value={company}
          onChangeText={setCompany}
          autoCapitalize="words"
        />

        <Card>
          <View style={styles.switchRow}>
            <View style={styles.switchText}>
              <Text style={[styles.label, { color: colors.text }]}>Favourite</Text>
              <Text style={[styles.hint, { color: colors.muted }]}>Pin to the top of the list</Text>
            </View>
            <Switch value={favorite} onValueChange={setFavorite} accessibilityLabel="Favourite" />
          </View>
          <View style={styles.switchRow}>
            <View style={styles.switchText}>
              <Text style={[styles.label, { color: colors.text }]}>Blocked</Text>
              <Text style={[styles.hint, { color: colors.muted }]}>
                Calls to this contact are disabled
              </Text>
            </View>
            <Switch value={blocked} onValueChange={setBlocked} accessibilityLabel="Blocked" />
          </View>
        </Card>

        <Button title={existing ? 'Save changes' : 'Add contact'} icon="checkmark" onPress={save} />
        <Button title="Cancel" variant="ghost" onPress={() => router.back()} />
      </Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: 6 },
  switchText: { flex: 1, gap: 2 },
  label: { fontSize: 15, fontWeight: '600' },
  hint: { fontSize: 12 },
});
