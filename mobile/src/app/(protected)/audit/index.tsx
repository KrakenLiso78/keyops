import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { AuditOperation } from '@/domain/model/types';
import { listAuditEvents } from '@/domain/use-cases/audit/listAuditEvents';
import { Body, Card, Heading, Screen } from '@/presentation/components/base';
import { BackHeader, EnvironmentBadge, SectionLabel } from '@/presentation/components/chrome';
import { colors, space } from '@/presentation/design-system';
import { useApp } from '@/presentation/state/AppProvider';

const operationLabels: Record<AuditOperation, string> = {
  sign_in: 'Inicio de sesión',
  list_applications: 'Consulta de aplicaciones',
  view_application: 'Consulta de detalle',
  issue: 'Emisión de credenciales',
  regenerate: 'Regeneración de credenciales',
  suspend: 'Suspensión de credenciales',
  reactivate: 'Reactivación de credenciales',
  revoke: 'Revocación de credenciales',
  delivery: 'Generación de entrega',
  update_management: 'Actualización de gestión',
  list_audit: 'Consulta de auditoría',
  manage_users: 'Gestión de usuarios',
};

const resultLabels = {
  succeeded: 'Completada',
  failed: 'Fallida',
  rejected: 'Rechazada',
} as const;

function Unauthorized() {
  return (
    <Screen>
      <BackHeader onBack={() => router.back()} />
      <Heading>Acceso no autorizado</Heading>
      <Body>No tienes permiso para consultar la auditoría.</Body>
    </Screen>
  );
}

export default function AuditScreen() {
  const { user } = useApp();
  if (!user) return <Unauthorized />;
  let events;
  try {
    events = listAuditEvents(user).items;
  } catch {
    return <Unauthorized />;
  }
  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <BackHeader onBack={() => router.back()} />
        <View style={styles.titleBlock}>
          <Heading level={1}>Auditoría</Heading>
          <Body>Trazabilidad de las acciones realizadas durante esta sesión.</Body>
        </View>
        {events.length ? (
          events.map((event) => (
            <Card key={event.id} style={styles.eventCard}>
              <View style={styles.eventHeader}>
                <Text style={styles.operation}>{operationLabels[event.operation]}</Text>
                <View
                  style={[styles.resultBadge, event.result !== 'succeeded' && styles.failureBadge]}
                >
                  <Text
                    style={[styles.resultText, event.result !== 'succeeded' && styles.failureText]}
                  >
                    {resultLabels[event.result]}
                  </Text>
                </View>
              </View>
              <EnvironmentBadge environment={event.environment} />
              <Body>{event.actorDisplayName}</Body>
              {event.institution ? (
                <Body>
                  {event.institution} · {event.application}
                </Body>
              ) : null}
              <View style={styles.divider} />
              <SectionLabel>Solicitud</SectionLabel>
              <Text selectable style={styles.requestId}>
                {event.requestId}
              </Text>
            </Card>
          ))
        ) : (
          <Card tone="sky">
            <Text style={styles.emptyTitle}>Aún no hay eventos</Text>
            <Body>Las operaciones de esta sesión aparecerán aquí.</Body>
          </Card>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: space.md, paddingBottom: space.xxl },
  titleBlock: { gap: space.xxs },
  eventCard: { gap: space.sm },
  eventHeader: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: space.xs,
  },
  operation: { flex: 1, color: colors.navy, fontSize: 17, fontWeight: '800' },
  resultBadge: {
    borderRadius: 14,
    backgroundColor: colors.mint,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  failureBadge: { backgroundColor: colors.rose },
  resultText: { color: colors.success, fontSize: 13, fontWeight: '700' },
  failureText: { color: colors.error },
  divider: { height: 1, backgroundColor: colors.hairline },
  requestId: { color: colors.primaryDeep, fontFamily: 'monospace', fontSize: 13 },
  emptyTitle: { color: colors.navy, fontSize: 18, fontWeight: '800' },
});
