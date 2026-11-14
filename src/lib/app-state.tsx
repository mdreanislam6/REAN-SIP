import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

import { buildColors, type CxColors } from '@/constants/theme';
import { usePersistentState } from '@/hooks/use-persistent-state';

export type Contact = {
  id: number;
  name: string;
  num: string;
  letter: string;
  c: string;
  verified: boolean;
  spam: boolean;
  fav: boolean;
  carrier: string;
  loc: string;
  email: string;
  spamScore: number;
  tags: string[];
  notes?: string;
};

export type CallRow = { cid: number; type: 'in' | 'out' | 'miss'; time: string; dur: string; missed: boolean };
export type Msg = { cid: number; cat: 'all' | 'otp' | 'txn' | 'spam'; text: string; time: string; unread: boolean };
export type Blocked = { num: string; name: string; when: string };
export type Rec = { cid: number; dur: string; size: string; when: string };
export type Notif = { icon: string; tone: string; title: string; body: string; time: string; unread: boolean };
export type Family = { name: string; rel: string; num: string; c: string; letter: string; on: boolean };
export type Device = { name: string; meta: string; icon: string; on: boolean; this?: boolean };
export type WhoRow = { name: string; meta: string; c: string; letter: string };

export type Profile = {
  name: string;
  phone: string;
  email: string;
  status: string;
  about: string;
  fb: string;
  li: string;
  ig: string;
  tw: string;
};

export type Sip = { online: boolean; user: string; pass: string; server: string; port: string; transport: 'UDP' | 'TCP' | 'TLS'; ws: string };

export type Toggles = Record<string, boolean>;

export type AppData = {
  dark: boolean;
  accent: string;
  incognito: boolean;
  permsDone: boolean;
  profile: Profile;
  sip: Sip;
  contacts: Contact[];
  calls: CallRow[];
  msgs: Msg[];
  blocked: Blocked[];
  recs: Rec[];
  notifs: Notif[];
  family: Family[];
  devices: Device[];
  who: WhoRow[];
  toggles: Toggles;
  tags: string[];
};

export const CONTACTS: Contact[] = [
  { id: 1, name: 'Ayesha Rahman', num: '+880 1712-345678', letter: 'A', c: 'c1', verified: true, spam: false, fav: true, carrier: 'Grameenphone', loc: 'Dhaka, Bangladesh', email: 'ayesha.rahman@gmail.com', spamScore: 2, tags: ['Friend', 'Client'] },
  { id: 2, name: 'Tanvir Ahmed', num: '+880 1811-223344', letter: 'T', c: 'c2', verified: true, spam: false, fav: true, carrier: 'Robi', loc: 'Chattogram, Bangladesh', email: 'tanvir.ahmed@gmail.com', spamScore: 1, tags: ['Work'] },
  { id: 3, name: 'Nusrat Jahan', num: '+880 1912-556677', letter: 'N', c: 'c3', verified: false, spam: false, fav: true, carrier: 'Banglalink', loc: 'Sylhet, Bangladesh', email: 'nusrat.j@yahoo.com', spamScore: 3, tags: ['Family'] },
  { id: 4, name: 'Rakib Store Support', num: '+880 9612-345678', letter: 'R', c: 'c4', verified: true, spam: false, fav: false, carrier: 'BTCL', loc: 'Dhaka, Bangladesh', email: 'support@rakibstore.com.bd', spamScore: 0, tags: ['Work', 'Client'] },
  { id: 5, name: 'Shamim Hossain', num: '+880 1715-998877', letter: 'S', c: 'c5', verified: false, spam: false, fav: false, carrier: 'Grameenphone', loc: 'Khulna, Bangladesh', email: 'shamim.h@gmail.com', spamScore: 4, tags: ['Friend'] },
  { id: 6, name: 'Farhana Akter', num: '+880 1620-334455', letter: 'F', c: 'c6', verified: true, spam: false, fav: false, carrier: 'Airtel', loc: 'Rajshahi, Bangladesh', email: 'farhana.akter@gmail.com', spamScore: 1, tags: ['Family'] },
  { id: 7, name: 'Unknown Caller', num: '+880 1300-112233', letter: '?', c: '', verified: false, spam: true, fav: false, carrier: 'Unknown', loc: 'Unknown', email: '-', spamScore: 94, tags: [] },
  { id: 8, name: 'Dhaka Courier', num: '+880 1755-667788', letter: 'D', c: 'c2', verified: false, spam: false, fav: false, carrier: 'Robi', loc: 'Dhaka, Bangladesh', email: 'info@dhakacourier.com', spamScore: 8, tags: ['Work'] },
  { id: 9, name: 'Suspected Scam', num: '+880 1555-000111', letter: '!', c: '', verified: false, spam: true, fav: false, carrier: 'Unknown', loc: 'Unknown', email: '-', spamScore: 98, tags: [] },
  { id: 10, name: 'Mehedi Hasan', num: '+880 1988-776655', letter: 'M', c: 'c4', verified: true, spam: false, fav: false, carrier: 'Banglalink', loc: 'Barishal, Bangladesh', email: 'mehedi.hasan@gmail.com', spamScore: 2, tags: ['Work'] },
];

const CALLS: CallRow[] = [
  { cid: 1, type: 'in', time: '2 min ago', dur: '4:12', missed: false },
  { cid: 7, type: 'miss', time: '18 min ago', dur: '-', missed: true },
  { cid: 2, type: 'out', time: '1 hr ago', dur: '1:38', missed: false },
  { cid: 9, type: 'miss', time: '2 hr ago', dur: '-', missed: true },
  { cid: 3, type: 'in', time: 'Yesterday', dur: '12:04', missed: false },
  { cid: 4, type: 'out', time: 'Yesterday', dur: '0:46', missed: false },
  { cid: 5, type: 'in', time: 'Yesterday', dur: '2:20', missed: false },
  { cid: 6, type: 'miss', time: '2 days ago', dur: '-', missed: true },
  { cid: 8, type: 'out', time: '2 days ago', dur: '1:05', missed: false },
  { cid: 10, type: 'in', time: '3 days ago', dur: '6:31', missed: false },
];

const MSGS: Msg[] = [
  { cid: 4, cat: 'txn', text: 'Your order #4821 has been confirmed. Delivery within 2 days.', time: '09:12', unread: true },
  { cid: 1, cat: 'all', text: 'Are we still meeting at 5 PM today?', time: '08:40', unread: true },
  { cid: 7, cat: 'spam', text: 'Congratulations! You won 50,000 BDT. Click to claim now.', time: '07:55', unread: true },
  { cid: 2, cat: 'otp', text: 'Your CallerX verification code is 482913. Do not share it.', time: '07:20', unread: false },
  { cid: 3, cat: 'all', text: 'Bhai, send me the shop address please.', time: 'Yesterday', unread: false },
  { cid: 9, cat: 'spam', text: 'Your bank account is blocked. Verify immediately at this link.', time: 'Yesterday', unread: false },
  { cid: 8, cat: 'txn', text: 'Payment of 2,450 BDT received. Thank you for your business.', time: 'Yesterday', unread: false },
  { cid: 6, cat: 'otp', text: 'Use 771204 to log in. Expires in 5 minutes.', time: '2 days ago', unread: false },
  { cid: 5, cat: 'all', text: 'Call me when you are free.', time: '2 days ago', unread: false },
];

const BLOCKED: Blocked[] = [
  { num: '+880 1300-112233', name: 'Unknown Caller', when: 'Blocked 3 days ago' },
  { num: '+880 1555-000111', name: 'Suspected Scam', when: 'Blocked 1 week ago' },
];

const RECS: Rec[] = [
  { cid: 1, dur: '4:12', size: '1.8 MB', when: 'Today, 09:14' },
  { cid: 2, dur: '1:38', size: '0.7 MB', when: 'Today, 08:02' },
  { cid: 3, dur: '12:04', size: '5.1 MB', when: 'Yesterday, 18:40' },
  { cid: 4, dur: '0:46', size: '0.3 MB', when: 'Yesterday, 11:22' },
];

const NOTIFS: Notif[] = [
  { icon: 'alert', tone: 'r', title: 'Spam call blocked', body: '+880 1555-000111 was blocked automatically. 12 reports from other users.', time: '12 min ago', unread: true },
  { icon: 'phoneMissed', tone: 'o', title: 'Missed call', body: 'Unknown Caller tried to reach you twice.', time: '18 min ago', unread: true },
  { icon: 'shieldCheck', tone: 'g', title: 'SIP registered', body: 'Your SIP account is online and ready for calls.', time: '1 hr ago', unread: false },
  { icon: 'crown', tone: 'p', title: 'Premium trial available', body: 'Try CallerX Premium free for 7 days.', time: 'Yesterday', unread: false },
  { icon: 'cloud', tone: '', title: 'Backup complete', body: 'Your contacts and call history were backed up to Google Drive.', time: 'Yesterday', unread: false },
];

const FAMILY: Family[] = [
  { name: 'Nusrat Jahan', rel: 'Mother', num: '+880 1912-556677', c: 'c3', letter: 'N', on: true },
  { name: 'Shamim Hossain', rel: 'Brother', num: '+880 1715-998877', c: 'c5', letter: 'S', on: true },
  { name: 'Farhana Akter', rel: 'Sister', num: '+880 1620-334455', c: 'c6', letter: 'F', on: false },
];

const DEVICES: Device[] = [
  { name: 'Samsung Galaxy S23', meta: 'This device - Android 14', icon: 'phone', on: true, this: true },
  { name: 'Chrome on Windows', meta: 'Last active 2 hours ago - Dhaka', icon: 'devices', on: true },
  { name: 'iPad Air', meta: 'Last active 3 days ago - Dhaka', icon: 'devices', on: false },
];

const WHO: WhoRow[] = [
  { name: 'Rakib Store Support', meta: 'Viewed your business profile - 2 hours ago', c: 'c4', letter: 'R' },
  { name: 'Tanvir Ahmed', meta: 'Viewed your profile - 5 hours ago', c: 'c2', letter: 'T' },
  { name: 'Dhaka Courier', meta: 'Viewed your business profile - Yesterday', c: 'c2', letter: 'D' },
  { name: 'Mehedi Hasan', meta: 'Viewed your profile - 2 days ago', c: 'c4', letter: 'M' },
];

export const DEFAULT_TOGGLES: Toggles = {
  callerId: true,
  afterCall: true,
  autoRecord: false,
  sim1: true,
  sim2: false,
  askEvery: true,
  spamAlerts: true,
  missedAlerts: true,
  onlySpam: false,
  forceTls: true,
  srtp: true,
  zrtp: false,
  verifyCert: true,
  incognito: false,
  familyProtect: true,
};

const INITIAL: AppData = {
  dark: false,
  accent: 'blue',
  incognito: false,
  permsDone: false,
  profile: {
    name: 'Rakib Hasan',
    phone: '+880 1712-345678',
    email: 'rakib.hasan@gmail.com',
    status: 'Available - Dhaka',
    about: 'Store owner - Dhaka, Bangladesh. Prefer calls after 10 AM.',
    fb: 'facebook.com/rakibhasan',
    li: 'linkedin.com/in/rakibhasan',
    ig: '@rakib.hasan',
    tw: '@rakibhasan',
  },
  sip: { online: false, user: '', pass: '', server: '', port: '5060', transport: 'TLS', ws: '' },
  contacts: CONTACTS,
  calls: CALLS,
  msgs: MSGS,
  blocked: BLOCKED,
  recs: RECS,
  notifs: NOTIFS,
  family: FAMILY,
  devices: DEVICES,
  who: WHO,
  toggles: DEFAULT_TOGGLES,
  tags: ['Friend', 'Family', 'Client', 'Work'],
};

type Ctx = {
  data: AppData;
  set: (next: AppData | ((prev: AppData) => AppData)) => void;
  colors: CxColors;
  toast: (msg: string) => void;
  toastMsg: string | null;
  contactById: (id: number) => Contact;
};

const AppCtx = createContext<Ctx | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [data, setData] = usePersistentState<AppData>('callerx-state-v1', INITIAL);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const toast = useCallback((msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg((cur) => (cur === msg ? null : cur)), 2200);
  }, []);

  const colors = useMemo(() => buildColors(data.dark, data.accent), [data.dark, data.accent]);

  const contactById = useCallback(
    (id: number) => data.contacts.find((c) => c.id === id) ?? data.contacts[0],
    [data.contacts],
  );

  const value = useMemo<Ctx>(
    () => ({ data, set: setData, colors, toast, toastMsg, contactById }),
    [data, setData, colors, toast, toastMsg, contactById],
  );

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}

export function useApp(): Ctx {
  const ctx = useContext(AppCtx);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
