import { useLocalSearchParams } from 'expo-router';

import { AccountForm } from '@/components/account-form';

export default function EditAccountScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <AccountForm accountId={id} />;
}
