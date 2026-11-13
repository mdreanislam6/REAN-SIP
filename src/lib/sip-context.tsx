import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';

import { usePersistentState } from '@/hooks/use-persistent-state';
import { SipClient } from '@/lib/sip/client';
import {
  DEFAULT_SETTINGS,
  type ActiveCall,
  type AppSettings,
  type CallLogEntry,
  type Contact,
  type RegistrationState,
  type SipAccount,
} from '@/lib/sip/types';

type SipContextValue = {
  accounts: SipAccount[];
  setAccounts: (next: SipAccount[] | ((prev: SipAccount[]) => SipAccount[])) => void;
  activeAccount: SipAccount | null;
  activeAccountId: string | null;
  selectAccount: (id: string) => void;
  registration: RegistrationState;
  registrationDetail: string;
  call: ActiveCall | null;
  callLog: CallLogEntry[];
  clearCallLog: () => void;
  contacts: Contact[];
  setContacts: (next: Contact[] | ((prev: Contact[]) => Contact[])) => void;
  settings: AppSettings;
  setSettings: (next: AppSettings | ((prev: AppSettings) => AppSettings)) => void;
  trace: string[];
  dial: (number: string, name?: string) => void;
  answer: () => void;
  reject: () => void;
  hangup: () => void;
  sendDtmf: (digit: string) => void;
  setMuted: (muted: boolean) => void;
  muted: boolean;
  ready: boolean;
  remoteStream: unknown;
};

const SipContext = createContext<SipContextValue | null>(null);

export function SipProvider({ children }: { children: ReactNode }) {
  const [accounts, setAccounts, accountsStatus] = usePersistentState<SipAccount[]>('accounts', []);
  const [activeAccountId, setActiveAccountId, activeStatus] = usePersistentState<string | null>(
    'activeAccountId',
    null,
  );
  const [callLog, setCallLog, logStatus] = usePersistentState<CallLogEntry[]>('callLog', []);
  const [contacts, setContacts, contactsStatus] = usePersistentState<Contact[]>('contacts', []);
  const [settings, setSettings, settingsStatus] = usePersistentState<AppSettings>(
    'settings',
    DEFAULT_SETTINGS,
  );

  const [registration, setRegistration] = useState<RegistrationState>('offline');
  const [registrationDetail, setRegistrationDetail] = useState('');
  const [call, setCall] = useState<ActiveCall | null>(null);
  const [trace, setTrace] = useState<string[]>([]);
  const [muted, setMutedState] = useState(false);
  const [remoteStream, setRemoteStream] = useState<unknown>(null);

  const clientRef = useRef<SipClient | null>(null);
  const logRef = useRef(setCallLog);
  logRef.current = setCallLog;

  if (!clientRef.current) {
    clientRef.current = new SipClient({
      onRegistration: (state, detail) => {
        setRegistration(state);
        setRegistrationDetail(detail ?? '');
      },
      onCall: (next) => {
        setCall(next);
        if (!next) {
          setMutedState(false);
          setRemoteStream(null);
        }
      },
      onCallLog: (entry) => {
        const full: CallLogEntry = { ...entry, id: `${entry.startedAt}-${Math.random().toString(36).slice(2, 8)}` };
        logRef.current((prev) => [full, ...prev].slice(0, 500));
      },
      onTrace: (line) => setTrace((prev) => [...prev.slice(-199), line]),
      onRemoteStream: (stream) => setRemoteStream(stream),
    });
  }

  const ready =
    accountsStatus === 'ready' &&
    activeStatus === 'ready' &&
    logStatus === 'ready' &&
    contactsStatus === 'ready' &&
    settingsStatus === 'ready';

  const activeAccount = useMemo(() => {
    if (accounts.length === 0) return null;
    const found = accounts.find((a) => a.id === activeAccountId && a.enabled);
    return found ?? accounts.find((a) => a.enabled) ?? null;
  }, [accounts, activeAccountId]);

  // (Re)connect whenever the selected account changes.
  const accountKey = activeAccount
    ? `${activeAccount.id}|${activeAccount.server}|${activeAccount.username}|${activeAccount.password}|${activeAccount.domain}|${activeAccount.expires}`
    : '';

  useEffect(() => {
    const client = clientRef.current;
    if (!client) return;
    if (!activeAccount) {
      client.stop();
      setRegistration('offline');
      return;
    }
    client.start(activeAccount);
    return () => client.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountKey]);

  const selectAccount = useCallback(
    (id: string) => {
      setActiveAccountId(id);
    },
    [setActiveAccountId],
  );

  const dial = useCallback(
    (number: string, name?: string) => {
      const client = clientRef.current;
      if (!client) return;
      if (registration !== 'registered') return;
      void client.placeCall(number, name);
    },
    [registration],
  );

  const answer = useCallback(() => clientRef.current?.answer(), []);
  const reject = useCallback(() => clientRef.current?.reject(), []);
  const hangup = useCallback(() => clientRef.current?.hangup(), []);
  const sendDtmf = useCallback((digit: string) => clientRef.current?.sendDtmf(digit), []);
  const setMuted = useCallback((next: boolean) => {
    setMutedState(next);
    clientRef.current?.setMuted(next);
  }, []);

  const clearCallLog = useCallback(() => setCallLog([]), [setCallLog]);

  const value: SipContextValue = {
    accounts,
    setAccounts,
    activeAccount,
    activeAccountId: activeAccount?.id ?? null,
    selectAccount,
    registration,
    registrationDetail,
    call,
    callLog,
    clearCallLog,
    contacts,
    setContacts,
    settings,
    setSettings,
    trace,
    dial,
    answer,
    reject,
    hangup,
    sendDtmf,
    setMuted,
    muted,
    ready,
    remoteStream,
  };

  return <SipContext.Provider value={value}>{children}</SipContext.Provider>;
}

export function useSip(): SipContextValue {
  const ctx = useContext(SipContext);
  if (!ctx) throw new Error('useSip must be used inside SipProvider');
  return ctx;
}
