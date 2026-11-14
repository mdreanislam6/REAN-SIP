import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Icon } from '@/components/icon';
import { Avatar, Btn, Field, IconButton } from '@/components/kit';
import { useApp } from '@/lib/app-state';

export default function EditProfileScreen() {
  const { colors, data, set, toast } = useApp();
  const router = useRouter();
  const [form, setForm] = useState(data.profile);

  const patch = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const save = () => {
    if (!form.name.trim()) {
      toast('Name cannot be empty');
      return;
    }
    set({ ...data, profile: form });
    toast('Profile updated');
    router.back();
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.root, { backgroundColor: colors.bg }]}>
      <View style={styles.top}>
        <IconButton name="arrowLeft" onPress={() => router.back()} />
        <Text style={[styles.topTitle, { color: colors.text }]}>Edit Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.photoWrap}>
          <Avatar letter={form.name.charAt(0) || 'C'} c="c1" size={92} />
          <Pressable
            onPress={() => toast('Photo picker opened')}
            style={[styles.camBtn, { backgroundColor: colors.accent, borderColor: colors.bg }]}
            accessibilityRole="button"
            accessibilityLabel="Change photo">
            <Icon name="camera" size={15} color="#FFFFFF" />
          </Pressable>
          <Text style={[styles.photoHint, { color: colors.text3 }]}>Tap to change photo</Text>
        </View>

        <Field label="Full Name" value={form.name} onChangeText={(v) => patch('name', v)} placeholder="Your name" />
        <Field label="Phone Number" value={form.phone} onChangeText={(v) => patch('phone', v)} keyboard="phone-pad" placeholder="+880 ..." />
        <Field label="Email / Gmail" value={form.email} onChangeText={(v) => patch('email', v)} keyboard="email-address" placeholder="you@gmail.com" />
        <Field label="Status" value={form.status} onChangeText={(v) => patch('status', v)} placeholder="Available" />
        <Field label="About" value={form.about} onChangeText={(v) => patch('about', v)} multiline placeholder="Tell people about you" />

        <Text style={[styles.groupLabel, { color: colors.text2 }]}>SOCIAL LINKS</Text>
        <Field label="Facebook" value={form.fb} onChangeText={(v) => patch('fb', v)} placeholder="facebook.com/username" />
        <Field label="LinkedIn" value={form.li} onChangeText={(v) => patch('li', v)} placeholder="linkedin.com/in/username" />
        <Field label="Instagram" value={form.ig} onChangeText={(v) => patch('ig', v)} placeholder="@username" />
        <Field label="Twitter / X" value={form.tw} onChangeText={(v) => patch('tw', v)} placeholder="@username" />

        <View style={styles.foot}>
          <Btn title="Save Changes" icon="check" onPress={save} />
          <Btn title="Cancel" variant="secondary" onPress={() => router.back()} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  top: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingTop: 4, paddingBottom: 6 },
  topTitle: { flex: 1, textAlign: 'center', fontSize: 14, fontWeight: '700' },
  content: { paddingBottom: 30 },
  photoWrap: { alignItems: 'center', gap: 6, paddingVertical: 14 },
  camBtn: { position: 'absolute', top: 78, right: '35%', width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
  photoHint: { fontSize: 11.5, marginTop: 2 },
  groupLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 0.9, paddingHorizontal: 16, paddingTop: 6, paddingBottom: 8 },
  foot: { paddingHorizontal: 16, paddingTop: 8, gap: 10 },
});
