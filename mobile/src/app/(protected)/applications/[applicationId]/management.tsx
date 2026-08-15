import { useLocalSearchParams, router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useDependencies } from '@/composition/DependenciesProvider';
import { Body, Button, Card, Heading, Screen } from '@/presentation/components/base';
import { ManagementContextForm } from '@/presentation/components/applications/ManagementContextForm';
import { BackHeader, EnvironmentBadge, SectionLabel } from '@/presentation/components/chrome';
import { LoadingState, PersistentError } from '@/presentation/components/feedback';
import { useApplicationDetailController } from '@/presentation/controllers/useApplicationDetailController';
import { space } from '@/presentation/design-system';
import { useApp } from '@/presentation/state/AppProvider';
import { useEnvironment } from '@/presentation/state/EnvironmentProvider';
import { updatePersistentManagementContext } from '@/domain/use-cases/applications/updateManagementContext';

export default function ManagementScreen() {
  const { applicationId } = useLocalSearchParams<{ applicationId: string }>();
  const { environment } = useApp();
  const { applications } = useDependencies();
  const { beginRequest } = useEnvironment();
  const controller = useApplicationDetailController(environment, applicationId);
  const app = controller.application;

  if (controller.status === 'loading' || controller.status === 'idle') {
    return (
      <Screen>
        <BackHeader onBack={() => router.back()} />
        <LoadingState label="Cargando información de gestión…" />
      </Screen>
    );
  }
  if (controller.status === 'error' || !app) {
    return (
      <Screen>
        <BackHeader onBack={() => router.back()} />
        <PersistentError
          message={controller.error ?? 'Aplicación no encontrada.'}
          onRetry={controller.retry}
        />
      </Screen>
    );
  }

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
          <ManagementContextForm
            initialContact={app.technicalContact}
            initialEmail={app.technicalContactEmail}
            initialPhone={app.technicalContactPhone}
            initialReason={app.managementReason}
            initialTicket={app.requestOrTicketId}
            onSubmit={async (input) => {
              const request = beginRequest();
              await updatePersistentManagementContext(applications, environment, applicationId, {
                ...input,
                expectedUpdatedAt: app.updatedAt ?? app.lastChangedAt,
                signal: request.signal,
              });
            }}
          />
        </Card>
        <Button title="Cancelar" variant="ghost" onPress={() => router.back()} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: space.md, paddingBottom: space.xxl },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  titleBlock: { gap: space.xxs },
});
