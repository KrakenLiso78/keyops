import { ScrollView, Text } from 'react-native';
import { listAuditEvents } from '@/domain/use-cases/audit/listAuditEvents';
import { Body, Card, Heading, Screen } from '@/presentation/components/base';
import { useApp } from '@/presentation/state/AppProvider';

export default function AuditScreen() {
  const { user } = useApp();
  if (!user)
    return (
      <Screen>
        <Heading>Acceso no autorizado</Heading>
        <Body>No tienes permiso para consultar la auditoría.</Body>
      </Screen>
    );
  let events;
  try {
    events = listAuditEvents(user).items;
  } catch {
    return (
      <Screen>
        <Heading>Acceso no autorizado</Heading>
        <Body>No tienes permiso para consultar la auditoría.</Body>
      </Screen>
    );
  }
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
