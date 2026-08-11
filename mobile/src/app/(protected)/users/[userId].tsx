import { useLocalSearchParams, router } from 'expo-router';
import { Body, Card, Heading, Screen } from '@/presentation/components/base';
import { BackHeader, SectionLabel } from '@/presentation/components/chrome';
import { useApp } from '@/presentation/state/AppProvider';

export default function UserDetailScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const { user } = useApp();
  if (!user || user.profile !== 'administrator') {
    return (
      <Screen>
        <BackHeader onBack={() => router.back()} />
        <Heading>Acceso no autorizado</Heading>
      </Screen>
    );
  }
  return (
    <Screen>
      <BackHeader onBack={() => router.back()} />
      <Heading level={1}>Usuario autorizado</Heading>
      <Card tone="lavender">
        <SectionLabel>Identificador</SectionLabel>
        <Body>{userId}</Body>
      </Card>
    </Screen>
  );
}
