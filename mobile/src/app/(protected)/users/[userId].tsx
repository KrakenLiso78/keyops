import { useLocalSearchParams, router } from 'expo-router';
import { View } from 'react-native';
import { Body, Card, Heading, Screen } from '@/presentation/components/base';
import { BackHeader, EnvironmentBadge, SectionLabel } from '@/presentation/components/chrome';
import { space } from '@/presentation/design-system';
import { useApp } from '@/presentation/state/AppProvider';

export default function UserDetailScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const { environment, user } = useApp();
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
      <View style={{ alignItems: 'flex-start', gap: space.xs }}>
        <BackHeader onBack={() => router.back()} />
        <EnvironmentBadge environment={environment} />
      </View>
      <Heading level={1}>Usuario autorizado</Heading>
      <Card tone="lavender">
        <SectionLabel>Identificador</SectionLabel>
        <Body>{userId}</Body>
      </Card>
    </Screen>
  );
}
