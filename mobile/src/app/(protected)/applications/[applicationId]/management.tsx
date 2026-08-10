import { useState } from 'react';
import { useLocalSearchParams, router } from 'expo-router';
import { Text } from 'react-native';
import { fakeRepository } from '@/data/fake/FakeKeyOpsRepository';
import { Button, Field, Heading, Screen } from '@/presentation/components/base';
import { useApp } from '@/presentation/state/AppProvider';

export default function ManagementScreen() {
  const { applicationId } = useLocalSearchParams<{ applicationId: string }>();
  const { environment } = useApp();
  const app = fakeRepository.getApplication(applicationId, environment);
  const [contact, setContact] = useState(app?.technicalContact ?? '');
  const [ticket, setTicket] = useState(app?.requestOrTicketId ?? '');
  if (!app)
    return (
      <Screen>
        <Heading>Aplicación no encontrada</Heading>
      </Screen>
    );
  return (
    <Screen>
      <Heading>Información de gestión</Heading>
      <Field label="Contacto técnico" value={contact} onChangeText={setContact} />
      <Field label="Solicitud o ticket" value={ticket} onChangeText={setTicket} />
      <Button
        title="Guardar cambios"
        onPress={() => {
          fakeRepository.updateManagement(applicationId, environment, contact, ticket);
          router.back();
        }}
      />
      <Text>Los motivos de operación se registran de forma separada.</Text>
    </Screen>
  );
}
