import { Text } from 'react-native';
import type { Application } from '@/domain/model/types';
import { Body, Card } from '@/presentation/components/base';
import { CredentialStateBadge, RoleBadge } from '@/presentation/components/chrome';

export function ApplicationDetail({ application }: { application: Application }) {
  return (
    <Card>
      <Text style={{ fontSize: 17, fontWeight: '800' }}>{application.institution}</Text>
      <Body>{application.name}</Body>
      <RoleBadge>{application.apiRole}</RoleBadge>
      <CredentialStateBadge state={application.credentialState} />
      <Body>Client ID: {application.clientId ?? 'Aún no disponible'}</Body>
      <Body>IPs declaradas: {application.declaredIps.join(', ')}</Body>
    </Card>
  );
}
