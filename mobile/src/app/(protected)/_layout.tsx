import { Stack, router } from 'expo-router';
import { useApp } from '@/presentation/state/AppProvider';

export default function ProtectedLayout() {
  const { user } = useApp();
  if (!user) {
    router.replace('/sign-in');
    return null;
  }
  return <Stack screenOptions={{ headerShown: false }} />;
}
