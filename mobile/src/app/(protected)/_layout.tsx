import { Stack, router } from 'expo-router';
import { Pressable, Text } from 'react-native';
import { useApp } from '@/presentation/state/AppProvider';

export default function ProtectedLayout() {
  const { user, signOut } = useApp();
  if (!user) {
    router.replace('/(auth)/sign-in');
    return null;
  }
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerTitle: 'KeyOps',
        headerRight: () => (
          <Pressable
            onPress={() => {
              signOut();
              router.replace('/(auth)/sign-in');
            }}
          >
            <Text>Salir</Text>
          </Pressable>
        ),
      }}
    />
  );
}
