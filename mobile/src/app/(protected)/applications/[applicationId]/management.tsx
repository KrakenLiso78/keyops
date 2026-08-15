import { useEffect, useState } from 'react';
import { useLocalSearchParams, router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { fakeRepository } from '@/data/fake/FakeKeyOpsRepository';
import type { Application, Environment } from '@/domain/model/types';
import { updateManagementContext } from '@/domain/use-cases/applications/updateManagementContext';
import { Body, Button, Card, Field, Heading, Screen } from '@/presentation/components/base';
import { BackHeader, EnvironmentBadge, SectionLabel } from '@/presentation/components/chrome';
import { colors, space } from '@/presentation/design-system';
import { useApp } from '@/presentation/state/AppProvider';
import { useEnvironment } from '@/presentation/state/EnvironmentProvider';

export default function ManagementScreen() {
  const { applicationId } = useLocalSearchParams<{ applicationId: string }>();
  const { environment } = useApp();
  const app = fakeRepository.getApplication(applicationId, environment);
  if (!app)
    return (
      <Screen>
        <BackHeader onBack={() => router.back()} />
        <Heading>Aplicación no encontrada</Heading>
      </Screen>
    );
  return (
    <ManagementContent
      key={`${environment}:${applicationId}`}
      app={app}
      applicationId={applicationId}
      environment={environment}
    />
  );
}

function ManagementContent({
  app,
  applicationId,
  environment,
}: {
  app: Application;
  applicationId: string;
  environment: Environment;
}) {
  const [contact, setContact] = useState(app?.technicalContact ?? '');
  const [ticket, setTicket] = useState(app?.requestOrTicketId ?? '');
  const { registerReset } = useEnvironment();
  useEffect(
    () =>
      registerReset(() => {
        setContact('');
        setTicket('');
      }),
    [registerReset],
  );
  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.topBar}>
          <BackHeader onBack={() => router.back()} />
          <EnvironmentBadge environment={environment} />
        </View>
        <View style={styles.titleBlock}>
          <Heading level={1}>Información de gestión</Heading>
          <Body>
            {app.institution} · {app.name}
          </Body>
        </View>
        <Card>
          <SectionLabel>Datos de la solicitud</SectionLabel>
          <Field label="Contacto técnico" value={contact} onChangeText={setContact} />
          <Field label="Solicitud o ticket" value={ticket} onChangeText={setTicket} />
        </Card>
        <Button
          title="Guardar cambios"
          onPress={() => {
            updateManagementContext(environment, applicationId, {
              technicalContact: contact || undefined,
              requestOrTicketId: ticket || undefined,
            });
            router.back();
          }}
        />
        <Button title="Cancelar" variant="ghost" onPress={() => router.back()} />
        <Text style={styles.note}>
          Los motivos de las operaciones sobre credenciales se registran por separado.
        </Text>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: space.md, paddingBottom: space.xxl },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  titleBlock: { gap: space.xxs },
  note: { color: colors.slate, fontSize: 13, lineHeight: 19, textAlign: 'center' },
});
