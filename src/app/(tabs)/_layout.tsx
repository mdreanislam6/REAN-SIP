import { Redirect } from 'expo-router';
import { Tabs } from 'expo-router';
import { Platform, StyleSheet, View, type ColorValue } from 'react-native';

import { Icon, type IconName } from '@/components/icon';
import { useApp } from '@/lib/app-state';

function TabIcon({ name, color, focused }: { name: IconName; color: ColorValue; focused: boolean }) {
  const { colors } = useApp();
  return (
    <View style={[styles.iconWrap, focused && { backgroundColor: colors.accentSoft }]}>
      <Icon name={name} size={21} color={color as string} strokeWidth={focused ? 2.1 : 1.8} />
    </View>
  );
}

export default function TabLayout() {
  const { colors, data } = useApp();

  // First launch goes through the permission flow before the tabs appear.
  if (!data.permsDone) return <Redirect href="/permissions" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.text3,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          borderTopWidth: StyleSheet.hairlineWidth,
          height: Platform.OS === 'android' ? 66 : 84,
          paddingTop: 6,
          paddingBottom: Platform.OS === 'android' ? 8 : 24,
        },
        tabBarLabelStyle: { fontSize: 10.5, fontWeight: '700', letterSpacing: 0.1 },
        tabBarItemStyle: { gap: 2 },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Calls',
          tabBarIcon: ({ color, focused }) => <TabIcon name="phone" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Messages',
          tabBarIcon: ({ color, focused }) => <TabIcon name="message" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="contacts"
        options={{
          title: 'Contacts',
          tabBarIcon: ({ color, focused }) => <TabIcon name="users" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, focused }) => <TabIcon name="settings" color={color} focused={focused} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconWrap: { width: 44, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
});
