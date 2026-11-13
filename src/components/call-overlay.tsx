import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { RTCView, type MediaStream } from 'react-native-webrtc';
import { SafeAreaView } from 'react-native-safe-area-context';

import { radius, spacing, useColors } from '@/constants/theme';
import { avatarColor, formatDuration, initials } from '@/lib/format';
import { useSip } from '@/lib/sip-context';

const KEYPAD = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['*', '0', '#'],
];

/** Full-screen call UI shown over every screen while a call is in progress. */
export function CallOverlay() {
  const colors = useColors();
  const { call, answer, reject, hangup, sendDtmf, setMuted, muted, settings, remoteStream } = useSip();
  const [elapsed, setElapsed] = useState(0);
  const [showKeypad, setShowKeypad] = useState(false);
  const [speaker, setSpeaker] = useState(false);

  useEffect(() => {
    if (!call?.answeredAt) {
      setElapsed(0);
      return;
    }
    const tick = () => setElapsed(Math.floor((Date.now() - (call.answeredAt ?? Date.now())) / 1000));
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [call?.answeredAt]);

  useEffect(() => {
    if (!call) {
      setShowKeypad(false);
      setSpeaker(false);
    }
  }, [call]);

  if (!call) return null;

  const incoming = call.phase === 'incoming';
  const connected = call.phase === 'active';
  const label = call.name?.trim() || call.number;
  const status = connected
    ? formatDuration(elapsed)
    : incoming
      ? 'Incoming call'
      : call.phase === 'ringing'
        ? 'Ringing…'
        : call.phase === 'dialing'
          ? 'Calling…'
          : (call.statusText ?? 'Call ended');

  return (
    <Modal visible transparent={false} animationType="slide" onRequestClose={() => {}}>
      <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]}>
        {/* Remote audio plays through this hidden view. */}
        {remoteStream ? (
          <RTCView
            streamURL={(remoteStream as MediaStream).toURL()}
            style={styles.remoteAudio}
            objectFit="cover"
          />
        ) : null}
        <View style={styles.top}>
          <View style={[styles.badge, { backgroundColor: colors.primarySoft }]}>
            <Ionicons
              name={incoming ? 'arrow-down' : 'arrow-up'}
              size={13}
              color={colors.primary}
            />
            <Text style={[styles.badgeText, { color: colors.primary }]}>
              {incoming ? 'INCOMING' : 'OUTGOING'}
            </Text>
          </View>
          <Text style={[styles.status, { color: colors.muted }]}>{status}</Text>
        </View>

        <View style={styles.identity}>
          <View style={[styles.avatar, { backgroundColor: avatarColor(label) }]}>
            <Text style={styles.avatarText}>{initials(label)}</Text>
          </View>
          <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
            {label}
          </Text>
          {call.name ? (
            <Text style={[styles.number, { color: colors.muted }]}>{call.number}</Text>
          ) : null}
          {settings.showSipTrace && call.statusText ? (
            <Text style={[styles.trace, { color: colors.muted }]}>{call.statusText}</Text>
          ) : null}
        </View>

        {connected && showKeypad ? (
          <View style={styles.keypad}>
            {KEYPAD.map((row) => (
              <View key={row.join('')} style={styles.keyRow}>
                {row.map((key) => (
                  <Pressable
                    key={key}
                    accessibilityRole="button"
                    accessibilityLabel={`DTMF ${key}`}
                    onPress={() => sendDtmf(key)}
                    style={({ pressed }) => [
                      styles.key,
                      { backgroundColor: colors.card, borderColor: colors.border },
                      pressed && { opacity: 0.6 },
                    ]}>
                    <Text style={[styles.keyText, { color: colors.text }]}>{key}</Text>
                  </Pressable>
                ))}
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.spacer} />
        )}

        {connected ? (
          <View style={styles.controls}>
            <ControlButton
              icon={muted ? 'mic-off' : 'mic'}
              label={muted ? 'Unmute' : 'Mute'}
              active={muted}
              onPress={() => setMuted(!muted)}
            />
            <ControlButton
              icon="keypad-outline"
              label="Keypad"
              active={showKeypad}
              onPress={() => setShowKeypad((v) => !v)}
            />
            <ControlButton
              icon={speaker ? 'volume-high' : 'volume-medium-outline'}
              label="Speaker"
              active={speaker}
              onPress={() => setSpeaker((v) => !v)}
            />
          </View>
        ) : (
          <View style={styles.controls} />
        )}

        <View style={styles.actions}>
          {incoming ? (
            <>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Decline call"
                onPress={reject}
                style={({ pressed }) => [
                  styles.round,
                  { backgroundColor: colors.danger },
                  pressed && { opacity: 0.75 },
                ]}>
                <Ionicons name="close" size={32} color="#fff" />
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Answer call"
                onPress={answer}
                style={({ pressed }) => [
                  styles.round,
                  { backgroundColor: colors.success },
                  pressed && { opacity: 0.75 },
                ]}>
                <Ionicons name="call" size={30} color="#fff" />
              </Pressable>
            </>
          ) : (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="End call"
              onPress={hangup}
              style={({ pressed }) => [
                styles.round,
                { backgroundColor: colors.danger },
                pressed && { opacity: 0.75 },
              ]}>
              <Ionicons name="call" size={30} color="#fff" style={{ transform: [{ rotate: '135deg' }] }} />
            </Pressable>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
}

function ControlButton({
  icon,
  label,
  active,
  onPress,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const colors = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.control, pressed && { opacity: 0.6 }]}>
      <View
        style={[
          styles.controlCircle,
          {
            backgroundColor: active ? colors.primary : colors.card,
            borderColor: colors.border,
          },
        ]}>
        <Ionicons name={icon} size={22} color={active ? colors.onPrimary : colors.text} />
      </View>
      <Text style={[styles.controlLabel, { color: colors.muted }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: spacing.lg },
  remoteAudio: { width: 1, height: 1, opacity: 0 },
  top: { alignItems: 'center', gap: spacing.sm, paddingTop: spacing.lg },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  badgeText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.6 },
  status: { fontSize: 15, fontWeight: '500' },
  identity: { alignItems: 'center', gap: spacing.sm, marginTop: spacing.xl },
  avatar: {
    width: 108,
    height: 108,
    borderRadius: 54,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontSize: 38, fontWeight: '700' },
  name: { fontSize: 26, fontWeight: '700', textAlign: 'center' },
  number: { fontSize: 16 },
  trace: { fontSize: 12, textAlign: 'center', paddingHorizontal: spacing.md },
  spacer: { flex: 1 },
  keypad: { flex: 1, justifyContent: 'center', gap: spacing.sm },
  keyRow: { flexDirection: 'row', justifyContent: 'center', gap: spacing.md },
  key: {
    width: 68,
    height: 56,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyText: { fontSize: 24, fontWeight: '600' },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xl,
    paddingVertical: spacing.md,
    minHeight: 84,
  },
  control: { alignItems: 'center', gap: 6 },
  controlCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlLabel: { fontSize: 12 },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xl * 2,
    paddingBottom: spacing.xl,
    paddingTop: spacing.sm,
  },
  round: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
