import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Data kept on this phone only (AsyncStorage; localStorage in the web preview).
 *
 * Keys are namespaced and versioned: when the shape of stored data changes, bump
 * SCHEMA_VERSION and convert old values in `migrate`, so an update never loads data it
 * cannot read. Values are JSON.
 */
const NAMESPACE = 'app';
const SCHEMA_VERSION = 1;

function fullKey(key: string): string {
  return `${NAMESPACE}:v${SCHEMA_VERSION}:${key}`;
}

/** Thrown when stored data exists but cannot be read; never overwrite it after this. */
export class StorageReadError extends Error {}

/** The stored value, or `fallback` when nothing is stored under `key` yet. */
export async function readJSON<T>(key: string, fallback: T): Promise<T> {
  let raw: string | null;
  try {
    raw = await AsyncStorage.getItem(fullKey(key));
  } catch (e) {
    throw new StorageReadError(`could not read ${key}: ${String(e)}`);
  }
  if (raw === null) {
    return migrate(key, fallback);
  }
  try {
    return JSON.parse(raw) as T;
  } catch {
    throw new StorageReadError(`stored ${key} is not valid JSON`);
  }
}

export async function writeJSON<T>(key: string, value: T): Promise<void> {
  await AsyncStorage.setItem(fullKey(key), JSON.stringify(value));
  notify(key, value);
}

export async function removeKey(key: string): Promise<void> {
  await AsyncStorage.removeItem(fullKey(key));
  notify(key, undefined);
}

// Screens that show the same key (a list and its edit screen) stay in step: every
// write or removal is pushed to the other subscribers. `undefined` means removed.
type Listener = (value: unknown) => void;
const listeners = new Map<string, Set<Listener>>();

export function subscribe(key: string, listener: Listener): () => void {
  const set = listeners.get(key) ?? new Set<Listener>();
  set.add(listener);
  listeners.set(key, set);
  return () => {
    set.delete(listener);
  };
}

function notify(key: string, value: unknown): void {
  listeners.get(key)?.forEach((listener) => listener(value));
}

/**
 * Called when `key` has no value under the current version. Read the previous
 * version's key here and convert it when SCHEMA_VERSION goes up; until then there is
 * nothing to migrate.
 */
async function migrate<T>(_key: string, fallback: T): Promise<T> {
  return fallback;
}
