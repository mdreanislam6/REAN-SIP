import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';

import { CallOverlay } from '@/components/call-overlay';
import { useCallAlerts } from '@/hooks/use-call-alerts';
import { SipProvider } from '@/lib/sip-context';

function AppShell() {
  useCallAlerts();
  return (
    <>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="account/[id]" options={{ title: 'SIP account' }} />
        <Stack.Screen name="account/new" options={{ title: 'New SIP account' }} />
        <Stack.Screen name="contact/[id]" options={{ title: 'Contact' }} />
        <Stack.Screen name="contact/new" options={{ title: 'New contact' }} />
        <Stack.Screen name="diagnostics" options={{ title: 'Diagnostics' }} />
        <Stack.Screen name="+not-found" options={{ title: 'Not found' }} />
      </Stack>
      <CallOverlay />
    </>
  );
}

export default function RootLayout() {
  const scheme = useColorScheme();
  return (
    <ThemeProvider value={scheme === 'dark' ? DarkTheme : DefaultTheme}>
      <SipProvider>
        <AppShell />
      </SipProvider>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
