import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';
import { useEffect, useRef } from 'react';
import { Platform, Vibration } from 'react-native';

import { useSip } from '@/lib/sip-context';

/**
 * Plays the ringtone and vibrates while a call is incoming, and switches the phone
 * into the right audio mode for a call. Mounted once at the root.
 */
export function useCallAlerts() {
  const { call, settings } = useSip();
  const player = useAudioPlayer(require('../../assets/audio/ringtone.wav'));
  const vibrating = useRef(false);

  const incoming = call?.phase === 'incoming';

  useEffect(() => {
    if (Platform.OS === 'web') return;
    setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: false,
      allowsRecording: call?.phase === 'active',
    }).catch(() => {
      // Audio mode is best-effort; a failure must not break the call UI.
    });
  }, [call?.phase]);

  useEffect(() => {
    if (incoming && settings.ringtone) {
      try {
        player.loop = true;
        player.seekTo(0);
        player.play();
      } catch {
        // player not ready yet
      }
    } else {
      try {
        player.pause();
        player.seekTo(0);
      } catch {
        // nothing playing
      }
    }
    return () => {
      try {
        player.pause();
      } catch {
        // nothing playing
      }
    };
  }, [incoming, settings.ringtone, player]);

  useEffect(() => {
    if (incoming && settings.vibrate && Platform.OS !== 'web') {
      vibrating.current = true;
      Vibration.vibrate([0, 800, 1200], true);
    } else if (vibrating.current) {
      vibrating.current = false;
      Vibration.cancel();
    }
    return () => {
      if (vibrating.current) {
        vibrating.current = false;
        Vibration.cancel();
      }
    };
  }, [incoming, settings.vibrate]);
}
