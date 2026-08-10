import { Text } from 'react-native';
import type { Application } from '@/domain/model/types';
import { Body, Card } from '@/presentation/components/base';

export function ApplicationDetail({ application }: { application: Application }) {
  return (
    <Card>
      <Text style={{ fontWeight: '700' }}>{application.name}</Text>
      <Body>{application.institution}</Body>
      <Body>Client ID: {application.clientId ?? 'Aún no disponible'}</Body>
      <Body>Estado: {application.credentialState.replaceAll('_', ' ')}</Body>
      <Body>IPs declaradas: {application.declaredIps.join(', ')}</Body>
    </Card>
  );
}
