import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Icon, type IconName } from '@/components/icon';
import { Avatar, Badge, Btn, Group, IconButton, Row, SectionTitle } from '@/components/kit';
import { useApp } from '@/lib/app-state';

const QUICK: { icon: IconName; label: string }[] = [
  { icon: 'phone', label: 'Call' },
  { icon: 'whatsapp', label: 'WhatsApp' },
  { icon: 'telegram', label: 'Telegram' },
  { icon: 'gmail', label: 'Gmail' },
  { icon: 'message', label: 'Message' },
];

export default function ContactDetailScreen() {
  const { colors, data, set, contactById, toast } = useApp();
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const contact = contactById(Number(params.id));

  const [notes, setNotes] = useState(contact.notes ?? '');
  const [newTag, setNewTag] = useState('');
  const [addingTag, setAddingTag] = useState(false);

  const update = (patch: Partial<typeof contact>) => {
    set({ ...data, contacts: data.contacts.map((c) => (c.id === contact.id ? { ...c, ...patch } : c)) });
  };

  const saveNotes = () => {
    update({ notes });
    toast('Note saved');
  };

  const addTag = () => {
    const t = newTag.trim();
    if (!t) return;
    update({ tags: [...contact.tags, t] });
    setNewTag('');
    setAddingTag(false);
    toast(`Tag "${t}" added`);
  };

  const block = () => {
    set({ ...data, blocked: [{ num: contact.num, name: contact.name, when: 'Blocked just now' }, ...data.blocked] });
    toast(`${contact.name} blocked`);
    router.back();
  };

  const history = data.calls.filter((c) => c.cid === contact.id);

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.root, { backgroundColor: colors.bg }]}>
      <View style={styles.top}>
        <IconButton name="arrowLeft" onPress={() => router.back()} />
        <View style={styles.flex} />
        <IconButton name="more" onPress={() => toast('Contact options')} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Avatar letter={contact.letter} c={contact.c} spam={contact.spam} size={78} />
          <Text style={[styles.name, { color: colors.text }]}>{contact.name}</Text>
          <Text style={[styles.num, { color: colors.text2 }]}>{contact.num}</Text>
          <View style={styles.badges}>
            {contact.verified ? <Badge label="VERIFIED" tone="a" /> : null}
            {contact.spam ? <Badge label={`SPAM ${contact.spamScore}%`} tone="r" /> : <Badge label={`SPAM SCORE ${contact.spamScore}%`} tone="g" />}
            {contact.fav ? <Badge label="FAVORITE" tone="o" /> : null}
          </View>
        </View>

        <View style={styles.quickRow}>
          {QUICK.map((q) => (
            <Pressable
              key={q.label}
              accessibilityRole="button"
              onPress={() =>
                q.label === 'Call'
                  ? router.push({ pathname: '/call', params: { cid: String(contact.id) } })
                  : toast(`Opening ${q.label}...`)
              }
              style={styles.quickItem}>
              <View style={[styles.quickCirc, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Icon name={q.icon} size={20} color={colors.accent} />
              </View>
              <Text style={[styles.quickLabel, { color: colors.text2 }]}>{q.label}</Text>
            </Pressable>
          ))}
        </View>

        <SectionTitle>Caller ID Details</SectionTitle>
        <Group>
          <Row icon="phone" label="Mobile" value={contact.num} chevron={false} />
          <Row icon="sim" label="Carrier" value={contact.carrier} chevron={false} />
          <Row icon="globe" label="Location" value={contact.loc} chevron={false} />
          <Row icon="alert" tone={contact.spamScore > 50 ? 'r' : 'g'} label="Spam Score" value={`${contact.spamScore}%`} chevron={false} />
          <Row icon="gmail" label="Email" value={contact.email} chevron={false} />
        </Group>

        <SectionTitle>Tags</SectionTitle>
        <View style={styles.tagWrap}>
          {contact.tags.map((t) => (
            <View key={t} style={[styles.tag, { backgroundColor: colors.accentSoft }]}>
              <Text style={[styles.tagText, { color: colors.accent }]}>{t}</Text>
            </View>
          ))}
          {addingTag ? (
            <View style={[styles.tagInput, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <TextInput
                value={newTag}
                onChangeText={setNewTag}
                onSubmitEditing={addTag}
                autoFocus
                placeholder="Tag name"
                placeholderTextColor={colors.text3}
                style={[styles.tagInputText, { color: colors.text }]}
              />
              <Pressable onPress={addTag} hitSlop={6}>
                <Icon name="check" size={15} color={colors.accent} />
              </Pressable>
            </View>
          ) : (
            <Pressable
              onPress={() => setAddingTag(true)}
              style={[styles.tag, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
              <Icon name="plus" size={12} color={colors.text2} />
              <Text style={[styles.tagText, { color: colors.text2 }]}>Add Tag</Text>
            </Pressable>
          )}
        </View>

        <SectionTitle>Notes</SectionTitle>
        <View style={styles.notesWrap}>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Add a private note about this contact..."
            placeholderTextColor={colors.text3}
            multiline
            style={[styles.notes, { color: colors.text, backgroundColor: colors.card, borderColor: colors.border }]}
          />
          <Btn title="Save Note" onPress={saveNotes} style={{ marginTop: 10 }} />
        </View>

        <SectionTitle>Recent Calls</SectionTitle>
        <Group>
          {history.length === 0 ? (
            <Row icon="clock" label="No calls yet" chevron={false} />
          ) : (
            history.map((h, i) => (
              <Row
                key={i}
                icon={h.type === 'miss' ? 'phoneMissed' : h.type === 'out' ? 'phoneOut' : 'phoneIn'}
                tone={h.missed ? 'r' : 'g'}
                label={h.type === 'miss' ? 'Missed call' : h.type === 'out' ? 'Outgoing call' : 'Incoming call'}
                value={`${h.time} - ${h.dur}`}
                chevron={false}
              />
            ))
          )}
        </Group>

        <View style={styles.foot}>
          <Btn title="Report as Spam" variant="danger" icon="alert" onPress={() => toast('Reported as spam')} />
          <Btn title="Block Number" variant="secondary" icon="block" onPress={block} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  top: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingTop: 4 },
  content: { paddingBottom: 30 },
  hero: { alignItems: 'center', gap: 5, paddingTop: 4, paddingBottom: 16 },
  name: { fontSize: 21, fontWeight: '800', letterSpacing: -0.4, marginTop: 6 },
  num: { fontSize: 13.5, fontVariant: ['tabular-nums'] },
  badges: { flexDirection: 'row', gap: 6, marginTop: 6, flexWrap: 'wrap', justifyContent: 'center' },
  quickRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 18, paddingBottom: 4 },
  quickItem: { alignItems: 'center', gap: 6, width: 62 },
  quickCirc: { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  quickLabel: { fontSize: 10.5, fontWeight: '600' },
  tagWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, paddingHorizontal: 16 },
  tag: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 11, paddingVertical: 6, borderRadius: 999 },
  tagText: { fontSize: 12, fontWeight: '700' },
  tagInput: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 11, paddingVertical: 4, borderRadius: 999, borderWidth: 1 },
  tagInputText: { fontSize: 12, minWidth: 70, paddingVertical: 2 },
  notesWrap: { paddingHorizontal: 16 },
  notes: { borderRadius: 12, borderWidth: 1, padding: 13, fontSize: 13.5, minHeight: 88, textAlignVertical: 'top', lineHeight: 20 },
  foot: { paddingHorizontal: 16, paddingTop: 18, gap: 10 },
});
