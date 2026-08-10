import { Text } from 'react-native';
import type { UsageSummary } from '@/domain/model/usage';
import { Body, Card } from '@/presentation/components/base';

export function ApplicationUsageCard({ usage }: { usage: UsageSummary }) {
  if (usage.availability !== 'available') {
    return (
      <Card>
        <Text style={{ fontWeight: '700' }}>Uso</Text>
        <Body>
          {usage.availability === 'no_data'
            ? 'No hay datos de consumo disponibles.'
            : 'La consulta de uso no está disponible.'}
        </Body>
      </Card>
    );
  }
  return (
    <Card>
      <Text style={{ fontWeight: '700' }}>Uso</Text>
      <Body>{usage.messagesSent} mensajes enviados</Body>
      <Body>{usage.consumedServices.join(', ') || 'Sin servicios registrados'}</Body>
      <Body>{usage.usedIps.join(', ') || 'Sin IPs registradas'}</Body>
      {usage.lastConsumedAt ? <Body>Último uso: {usage.lastConsumedAt}</Body> : null}
    </Card>
  );
}
