import { useLocalSearchParams } from 'expo-router';
import { Body, Heading, Screen } from '@/presentation/components/base';
import { useApp } from '@/presentation/state/AppProvider';

export default function UserDetailScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const { user } = useApp();
  if (!user || user.profile !== 'administrator') {
    return (
      <Screen>
        <Heading>Acceso no autorizado</Heading>
      </Screen>
    );
  }
  return (
    <Screen>
      <Heading>Usuario autorizado</Heading>
      <Body>Identificador: {userId}</Body>
    </Screen>
  );
}
