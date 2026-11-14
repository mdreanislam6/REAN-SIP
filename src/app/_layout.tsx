import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';

import { Toast } from '@/components/kit';
import { AppProvider, useApp } from '@/lib/app-state';

function Shell() {
  const { colors } = useApp();
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar style={colors.isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bg },
          animation: 'slide_from_right',
        }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="permissions" options={{ animation: 'fade' }} />
        <Stack.Screen name="dialer" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="call" options={{ animation: 'fade', gestureEnabled: false }} />
        <Stack.Screen name="after-call" options={{ animation: 'fade' }} />
        <Stack.Screen name="contact/[id]" />
        <Stack.Screen name="profile" />
        <Stack.Screen name="edit-profile" />
        <Stack.Screen name="theme" />
        <Stack.Screen name="sip" />
        <Stack.Screen name="sip-guide" />
        <Stack.Screen name="voip-security" />
        <Stack.Screen name="voip-best" />
        <Stack.Screen name="search" />
        <Stack.Screen name="blocklist" />
        <Stack.Screen name="recordings" />
        <Stack.Screen name="notifications" />
        <Stack.Screen name="family" />
        <Stack.Screen name="business" />
        <Stack.Screen name="devices" />
        <Stack.Screen name="backup" />
        <Stack.Screen name="premium" />
        <Stack.Screen name="who" />
      </Stack>
      <Toast />
    </View>
  );
}

export default function RootLayout() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  );
}
