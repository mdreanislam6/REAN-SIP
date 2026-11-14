import { PermissionsAndroid, Platform, Linking } from 'react-native';

export type PermKey = 'phone' | 'log' | 'contacts' | 'mic' | 'notif' | 'dialer' | 'overlay';

type Spec = { key: PermKey; android?: string; label: string };

/**
 * The Android permissions behind each row of the welcome flow. Asking through the
 * platform dialog is what makes the grant real on the device - the row's own button
 * only reflects the result.
 */
const SPECS: Spec[] = [
  { key: 'phone', android: PermissionsAndroid.PERMISSIONS.CALL_PHONE, label: 'Phone' },
  { key: 'log', android: PermissionsAndroid.PERMISSIONS.READ_CALL_LOG, label: 'Call Log' },
  { key: 'contacts', android: PermissionsAndroid.PERMISSIONS.READ_CONTACTS, label: 'Contacts' },
  { key: 'mic', android: PermissionsAndroid.PERMISSIONS.RECORD_AUDIO, label: 'Microphone' },
  { key: 'notif', android: 'android.permission.POST_NOTIFICATIONS', label: 'Notifications' },
];

export async function requestPermission(key: PermKey): Promise<boolean> {
  if (Platform.OS !== 'android') return true;

  const spec = SPECS.find((s) => s.key === key);

  // Not a runtime permission: send the user to the system screen that owns the setting.
  if (key === 'overlay') {
    await Linking.openSettings().catch(() => undefined);
    return true;
  }

  if (!spec?.android) return true;

  try {
    const res = await PermissionsAndroid.request(spec.android as never);
    return res === PermissionsAndroid.RESULTS.GRANTED;
  } catch {
    return false;
  }
}

export async function checkPermission(key: PermKey): Promise<boolean> {
  if (Platform.OS !== 'android') return true;
  const spec = SPECS.find((s) => s.key === key);
  if (!spec?.android) return false;
  try {
    return await PermissionsAndroid.check(spec.android as never);
  } catch {
    return false;
  }
}

/** Asks for every runtime permission the caller identity features need, in order. */
export async function requestAll(): Promise<Record<string, boolean>> {
  const out: Record<string, boolean> = {};
  for (const spec of SPECS) {
    out[spec.key] = await requestPermission(spec.key);
  }
  return out;
}
