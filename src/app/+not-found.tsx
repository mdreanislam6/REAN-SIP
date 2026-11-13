import { Link } from 'expo-router';
import { StyleSheet, Text } from 'react-native';

import { Screen } from '@/components/screen';
import { useColors } from '@/constants/theme';

export default function NotFoundScreen() {
  const colors = useColors();
  return (
    <Screen>
      <Text style={[styles.text, { color: colors.text }]}>This screen does not exist.</Text>
      <Link href="/" style={[styles.text, { color: colors.primary }]}>
        Go to home
      </Link>
    </Screen>
  );
}

const styles = StyleSheet.create({
  text: { fontSize: 16, marginBottom: 12 },
});
