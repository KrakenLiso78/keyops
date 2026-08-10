import { ScrollView, Text } from 'react-native';
import { fakeRepository } from '@/data/fake/FakeKeyOpsRepository';
import { canReadAudit } from '@/domain/policies/permittedActions';
import { Body, Card, Heading, Screen } from '@/presentation/components/base';
import { useApp } from '@/presentation/state/AppProvider';

export default function AuditScreen() {
  const { user } = useApp();
  if (!user || !canReadAudit(user.profile))
    return (
      <Screen>
        <Heading>Acceso no autorizado</Heading>
        <Body>No tienes permiso para consultar la auditoría.</Body>
      </Screen>
    );
  const events = fakeRepository.listAudit();
  return (
    <Screen>
      <Heading>Auditoría</Heading>
      <ScrollView contentContainerStyle={{ gap: 12 }}>
        {events.length ? (
          events.map((event) => (
            <Card key={event.id}>
              <Text style={{ fontWeight: '700' }}>
                {event.operation} · {event.result}
              </Text>
              <Body>
                {event.actorDisplayName} · {event.environment}
              </Body>
              <Body>{event.requestId}</Body>
            </Card>
          ))
        ) : (
          <Body>Aún no hay eventos registrados en esta sesión.</Body>
        )}
      </ScrollView>
    </Screen>
  );
}
