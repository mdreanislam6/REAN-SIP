import { useLocalSearchParams } from 'expo-router';

import { ContactForm } from '@/components/contact-form';

export default function EditContactScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <ContactForm contactId={id} />;
}
