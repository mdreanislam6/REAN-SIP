import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Icon } from '@/components/icon';
import { useApp } from '@/lib/app-state';

function Ring({ delay, color }: { delay: number; color: string }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(v, { toValue: 1, duration: 2800, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        Animated.timing(v, { toValue: 0, duration: 0, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [delay, v]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.ring,
        {
          borderColor: color,
          opacity: v.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0, 0.5, 0] }),
          transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.62, 1.55] }) }],
        },
      ]}
    />
  );
}

export default function CallScreen() {
  const { colors, data, contactById, set, toast } = useApp();
  const router = useRouter();
  const params = useLocalSearchParams<{ cid?: string; num?: string; name?: string }>();

  const contact = params.cid ? contactById(Number(params.cid)) : null;
  const name = contact?.name ?? (params.name || params.num || 'Unknown');
  const number = contact?.num ?? params.num ?? '';

  const [state, setState] = useState<'calling' | 'connected' | 'incoming'>('calling');
  const [seconds, setSeconds] = useState(0);
  const [muted, setMuted] = useState(false);
  const [speaker, setSpeaker] = useState(false);
  const [held, setHeld] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [note, setNote] = useState('');

  const breathe = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(breathe, { toValue: 0, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [breathe]);

  // Ringing -> connected after a short simulated handshake.
  useEffect(() => {
    if (state !== 'calling') return;
    const t = setTimeout(() => setState('connected'), 2600);
    return () => clearTimeout(t);
  }, [state]);

  useEffect(() => {
    if (state !== 'connected') return;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [state]);

  const mmss = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;

  const end = () => {
    const dur = mmss;
    const cid = contact?.id ?? 0;
    if (cid) {
      set({
        ...data,
        calls: [{ cid, type: 'out', time: 'Just now', dur, missed: false }, ...data.calls],
      });
    }
    if (data.toggles.afterCall) {
      router.replace({ pathname: '/after-call', params: { cid: String(cid), dur, name, num: number } });
    } else {
      router.back();
    }
  };

  const accept = () => {
    setState('connected');
    toast('Call connected');
  };

  const decline = () => {
    router.back();
  };

  const Action = ({
    icon,
    label,
    active,
    onPress,
  }: {
    icon: 'mic' | 'micOff' | 'speaker' | 'pause' | 'note';
    label: string;
    active?: boolean;
    onPress: () => void;
  }) => (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.cact}>
      <View style={[styles.circ, { backgroundColor: active ? '#FFFFFF' : 'rgba(255,255,255,0.14)' }]}>
        <Icon name={icon} size={22} color={active ? '#0E1116' : '#FFFFFF'} />
      </View>
      <Text style={styles.cactLabel}>{label}</Text>
    </Pressable>
  );

  return (
    <LinearGradient colors={['#101A2E', '#0A0F1A', '#05070C']} style={styles.root}>
      <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={styles.safe}>
        <View style={styles.top}>
          <View style={styles.badge}>
            <Icon name="wifi" size={12} color="#7DD3FC" strokeWidth={2.4} />
            <Text style={styles.badgeText}>{data.sip.online ? 'SIP VOIP - HD AUDIO' : 'SIP VOIP - NOT REGISTERED'}</Text>
          </View>
          <Text style={styles.name} numberOfLines={1}>
            {name}
          </Text>
          <Text style={styles.num}>{number}</Text>
          <View style={styles.statusRow}>
            <Icon name={state === 'connected' ? 'phoneIn' : 'phoneOut'} size={14} color="rgba(255,255,255,0.78)" />
            <Text style={styles.status}>
              {state === 'connected' ? (held ? 'On hold' : 'Connected') : state === 'incoming' ? 'Incoming call...' : 'Calling via SIP...'}
            </Text>
          </View>
          {state === 'connected' ? <Text style={styles.timer}>{mmss}</Text> : null}
        </View>

        <View style={styles.center}>
          <View style={styles.ringWrap}>
            {state !== 'connected' ? (
              <>
                <Ring delay={0} color="#60A5FA" />
                <Ring delay={700} color="#60A5FA" />
                <Ring delay={1400} color="#60A5FA" />
                <Ring delay={2100} color="#60A5FA" />
              </>
            ) : null}
            <Animated.View
              style={[
                styles.orb,
                {
                  backgroundColor: state === 'connected' ? '#0E9F6E' : '#2563EB',
                  transform: [{ scale: breathe.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] }) }],
                },
              ]}>
              <Icon name="phone" size={42} color="#FFFFFF" strokeWidth={1.7} />
            </Animated.View>
          </View>
        </View>

        {noteOpen ? (
          <View style={styles.noteBox}>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="Type a note during the call..."
              placeholderTextColor="rgba(255,255,255,0.45)"
              style={styles.noteInput}
            />
          </View>
        ) : null}

        <View style={styles.actions}>
          <Action icon={muted ? 'micOff' : 'mic'} label="Mute" active={muted} onPress={() => setMuted((m) => !m)} />
          <Action icon="speaker" label="Speaker" active={speaker} onPress={() => setSpeaker((s) => !s)} />
          <Action icon="pause" label="Hold" active={held} onPress={() => setHeld((h) => !h)} />
          <Action icon="note" label="Note" active={noteOpen} onPress={() => setNoteOpen((n) => !n)} />
        </View>

        {state === 'incoming' ? (
          <View style={styles.answerRow}>
            <Pressable onPress={decline} style={[styles.ansBtn, { backgroundColor: '#F04438' }]} accessibilityRole="button">
              <Icon name="phoneOff" size={24} color="#FFFFFF" />
              <Text style={styles.ansLabel}>Decline</Text>
            </Pressable>
            <Pressable onPress={accept} style={[styles.ansBtn, { backgroundColor: '#12B76A' }]} accessibilityRole="button">
              <Icon name="phone" size={24} color="#FFFFFF" />
              <Text style={styles.ansLabel}>Accept</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.endWrap}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="End call"
              onPress={end}
              style={({ pressed }) => [styles.endBtn, pressed && { transform: [{ scale: 0.93 }] }]}>
              <Icon name="phoneOff" size={28} color="#FFFFFF" strokeWidth={2} />
            </Pressable>
          </View>
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  top: { alignItems: 'center', paddingTop: 22, paddingHorizontal: 24 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(96,165,250,0.16)',
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 999,
  },
  badgeText: { color: '#BFDBFE', fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },
  name: { color: '#FFFFFF', fontSize: 27, fontWeight: '700', letterSpacing: -0.6, marginTop: 18 },
  num: { color: 'rgba(255,255,255,0.62)', fontSize: 14, marginTop: 6, letterSpacing: 0.4, fontVariant: ['tabular-nums'] },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  status: { color: 'rgba(255,255,255,0.78)', fontSize: 13, fontWeight: '500' },
  timer: { color: '#FFFFFF', fontSize: 15, fontWeight: '600', letterSpacing: 2, marginTop: 8, fontVariant: ['tabular-nums'] },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  ringWrap: { width: 210, height: 210, alignItems: 'center', justifyContent: 'center' },
  ring: { position: 'absolute', width: 210, height: 210, borderRadius: 105, borderWidth: 1.5 },
  orb: {
    width: 116,
    height: 116,
    borderRadius: 58,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2563EB',
    shadowOpacity: 0.5,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
  noteBox: { marginHorizontal: 24, marginBottom: 12, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10 },
  noteInput: { color: '#FFFFFF', fontSize: 13, padding: 0 },
  actions: { flexDirection: 'row', justifyContent: 'center', gap: 24, paddingBottom: 18 },
  cact: { alignItems: 'center', gap: 7, width: 66 },
  circ: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  cactLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 11.5, fontWeight: '600' },
  answerRow: { flexDirection: 'row', justifyContent: 'center', gap: 40, paddingBottom: 26 },
  ansBtn: { width: 74, height: 74, borderRadius: 37, alignItems: 'center', justifyContent: 'center', gap: 2 },
  ansLabel: { color: '#FFFFFF', fontSize: 10.5, fontWeight: '700' },
  endWrap: { alignItems: 'center', paddingBottom: 26 },
  endBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#F04438',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#F04438',
    shadowOpacity: 0.45,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
});
