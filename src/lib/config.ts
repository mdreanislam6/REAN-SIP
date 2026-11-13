/**
 * Runtime configuration. EXPO_PUBLIC_* values are inlined at build time from .env
 * (or the EAS build environment) and are readable by anyone holding the app, so
 * nothing secret may come through here.
 */
export const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? '').replace(/\/+$/, '');

/** True when the app was built without a backend address. */
export const hasBackend = API_URL.length > 0;
