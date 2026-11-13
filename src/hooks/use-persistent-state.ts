import { useCallback, useEffect, useRef, useState } from 'react';

import { readJSON, subscribe, writeJSON } from '@/lib/storage';

type Status = 'loading' | 'ready' | 'error';
type Updater<T> = (prev: T) => T;

/**
 * useState that survives app restarts and stays in step across screens using the same
 * key. A change made before the stored value has loaded is kept and applied on top of it
 * once it arrives, so nothing typed during loading is lost or overwritten. Nothing is
 * written after a failed load, so a read error cannot wipe the user's data.
 *
 *   const [items, setItems, status] = usePersistentState<Item[]>('items', []);
 *   if (status === 'loading') return <ActivityIndicator />;
 */
export function usePersistentState<T>(
  key: string,
  initial: T,
): [T, (next: T | Updater<T>) => void, Status] {
  const [value, setValue] = useState<T>(initial);
  const [status, setStatus] = useState<Status>('loading');
  const loaded = useRef(false);
  // Changes made while loading, replayed in order on the loaded value.
  const pending = useRef<Updater<T>[]>([]);
  // `initial` is only the first-run default; keep the first one so a new array literal
  // on every render does not reload or reset anything.
  const initialRef = useRef(initial);

  useEffect(() => {
    let alive = true;
    loaded.current = false;
    pending.current = [];
    readJSON(key, initialRef.current)
      .then((stored) => {
        if (!alive) return;
        const queued = pending.current;
        pending.current = [];
        const merged = queued.reduce((acc, apply) => apply(acc), stored);
        setValue(merged);
        loaded.current = true;
        setStatus('ready');
        if (queued.length > 0) {
          writeJSON(key, merged).catch(() => setStatus('error'));
        }
      })
      .catch(() => {
        if (alive) setStatus('error');
      });
    const unsubscribe = subscribe(key, (next) => {
      if (alive && loaded.current) {
        setValue(next === undefined ? initialRef.current : (next as T));
      }
    });
    return () => {
      alive = false;
      unsubscribe();
    };
  }, [key]);

  const update = useCallback(
    (next: T | Updater<T>) => {
      const apply: Updater<T> = typeof next === 'function' ? (next as Updater<T>) : () => next;
      if (!loaded.current) {
        // Show it now; persist it once the stored value has loaded (see the effect above).
        pending.current.push(apply);
        setValue((prev) => apply(prev));
        return;
      }
      setValue((prev) => {
        const resolved = apply(prev);
        writeJSON(key, resolved).catch(() => setStatus('error'));
        return resolved;
      });
    },
    [key],
  );

  return [value, update, status];
}
