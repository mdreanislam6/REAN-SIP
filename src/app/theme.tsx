import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Icon } from '@/components/icon';
import { Group, IconButton, Row, SectionTitle, ToggleRow } from '@/components/kit';
import { ACCENTS } from '@/constants/theme';
import { useApp } from '@/lib/app-state';

export default function ThemeScreen() {
  const { colors, data, set, toast } = useApp();
  const router = useRouter();

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.root, { backgroundColor: colors.bg }]}>
      <View style={styles.top}>
        <IconButton name="arrowLeft" onPress={() => router.back()} />
        <Text style={[styles.topTitle, { color: colors.text }]}>Theme</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <SectionTitle>Accent color</SectionTitle>
        <View style={styles.grid}>
          {ACCENTS.map((a) => {
            const active = a.id === data.accent;
            return (
              <Pressable
                key={a.id}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                onPress={() => {
                  set({ ...data, accent: a.id });
                  toast(`${a.name} theme applied`);
                }}
                style={({ pressed }) => [styles.swatchItem, pressed && { opacity: 0.7 }]}>
                <View
                  style={[
                    styles.swatch,
                    { backgroundColor: a.hex, borderColor: active ? colors.text : 'transparent' },
                  ]}>
                  {active ? <Icon name="check" size={20} color="#FFFFFF" strokeWidth={2.6} /> : null}
                </View>
                <Text style={[styles.swatchName, { color: active ? colors.text : colors.text2 }]}>{a.name}</Text>
              </Pressable>
            );
          })}
        </View>

        <SectionTitle>Appearance</SectionTitle>
        <Group>
          <ToggleRow icon="moon" label="Dark Mode" sub="Use the dark palette across the app" value={data.dark} onChange={(v) => set({ ...data, dark: v })} />
          <Row icon="palette" label="Current accent" value={data.accent} chevron={false} />
        </Group>

        <View style={[styles.preview, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.previewLabel, { color: colors.text2 }]}>PREVIEW</Text>
          <View style={styles.previewRow}>
            <View style={[styles.previewBtn, { backgroundColor: colors.accent }]}>
              <Text style={styles.previewBtnText}>Primary</Text>
            </View>
            <View style={[styles.previewChip, { backgroundColor: colors.accentSoft }]}>
              <Text style={[styles.previewChipText, { color: colors.accent }]}>Accent soft</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  top: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingTop: 4 },
  topTitle: { flex: 1, textAlign: 'center', fontSize: 14, fontWeight: '700' },
  content: { paddingBottom: 30 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 14 },
  swatchItem: { alignItems: 'center', gap: 6, width: 66 },
  swatch: { width: 54, height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center', borderWidth: 3 },
  swatchName: { fontSize: 11.5, fontWeight: '600' },
  preview: { margin: 16, marginTop: 20, borderRadius: 16, borderWidth: 1, padding: 14, gap: 10 },
  previewLabel: { fontSize: 10.5, fontWeight: '800', letterSpacing: 0.9 },
  previewRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  previewBtn: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12 },
  previewBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  previewChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999 },
  previewChipText: { fontSize: 12, fontWeight: '700' },
});
