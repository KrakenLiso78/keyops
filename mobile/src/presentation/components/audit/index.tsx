import { Text } from 'react-native';
import type { AuditEvent } from '@/domain/model/types';
import { Body, Card, Field } from '@/presentation/components/base';

export function AuditEventCard({ event }: { event: AuditEvent }) {
  return (
    <Card>
      <Text style={{ fontWeight: '700' }}>
        {event.operation} · {event.result}
      </Text>
      <Body>
        {event.actorDisplayName} · {event.environment}
      </Body>
      <Body>{event.requestId}</Body>
    </Card>
  );
}

export function AuditFilters({
  query,
  onChangeQuery,
}: {
  query: string;
  onChangeQuery: (query: string) => void;
}) {
  return <Field label="Filtrar auditoría" value={query} onChangeText={onChangeQuery} />;
}
