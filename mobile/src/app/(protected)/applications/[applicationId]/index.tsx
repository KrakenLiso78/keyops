import { useLocalSearchParams, router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { fakeRepository } from '@/data/fake/FakeKeyOpsRepository';
import type { CredentialState } from '@/domain/model/types';
import { permittedActions } from '@/domain/policies/permittedActions';
import { Body, Button, Card, Heading, Screen } from '@/presentation/components/base';
import {
  BackHeader,
  CredentialStateBadge,
  EnvironmentBadge,
  RoleBadge,
  SectionLabel,
} from '@/presentation/components/chrome';
import { colors, space } from '@/presentation/design-system';
import { useApp } from '@/presentation/state/AppProvider';

const actionLabels: Record<string, string> = {
  issue: 'Generar credenciales',
  delivery: 'Generar enlace de entrega',
  regenerate: 'Regenerar credenciales',
  suspend: 'Suspender credenciales',
  reactivate: 'Reactivar credenciales',
  revoke: 'Revocar credenciales',
};

function DetailRow({
  label,
  value,
  code = false,
}: {
  label: string;
  value: string;
  code?: boolean;
}) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text selectable={code} style={[styles.detailValue, code && styles.code]}>
        {value}
      </Text>
    </View>
  );
}

function stateTone(state: CredentialState) {
  if (state === 'active') return colors.success;
  if (state === 'revoked') return colors.error;
  if (state === 'suspended') return colors.warning;
  return colors.primary;
}

export default function ApplicationDetailScreen() {
  const { applicationId } = useLocalSearchParams<{ applicationId: string }>();
  const { environment, user } = useApp();
  const app = fakeRepository.getApplication(applicationId, environment);
  if (!app || !user)
    return (
      <Screen>
        <BackHeader onBack={() => router.back()} />
        <Heading>Aplicación no encontrada</Heading>
      </Screen>
    );
  const actions = permittedActions(user.profile, app.credentialState);
  const changedAt = new Intl.DateTimeFormat('es-ES', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(app.lastChangedAt));

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.topBar}>
          <BackHeader onBack={() => router.back()} />
          <EnvironmentBadge environment={environment} />
        </View>
        <View style={styles.titleBlock}>
          <Heading level={1}>{app.institution}</Heading>
          <Body>{app.name}</Body>
        </View>

        <Card style={styles.credentialCard}>
          <View style={styles.cardHeader}>
            <Heading level={4}>Credencial API</Heading>
            <CredentialStateBadge state={app.credentialState} />
          </View>
          <RoleBadge>{app.apiRole}</RoleBadge>
          <View style={styles.divider} />
          <DetailRow
            label="Client ID"
            value={app.clientId ?? 'Aún no disponible'}
            code={Boolean(app.clientId)}
          />
          <DetailRow label="Contacto técnico" value={app.technicalContact ?? 'Sin registrar'} />
          <DetailRow label="Solicitud" value={app.requestOrTicketId ?? 'Sin registrar'} />
          <DetailRow label="IPs declaradas" value={app.declaredIps.join(', ') || 'Sin registrar'} />
        </Card>

        {actions.length ? (
          <View style={styles.actions}>
            <SectionLabel>Acciones disponibles</SectionLabel>
            {actions.map((action, index) => (
              <Button
                key={action}
                title={actionLabels[action] ?? action}
                variant={index === 0 ? 'primary' : 'secondary'}
                danger={action === 'revoke'}
                onPress={() =>
                  router.push({
                    pathname: '/applications/[applicationId]/operation',
                    params: { applicationId, action },
                  })
                }
              />
            ))}
          </View>
        ) : null}

        <Button
          title="Editar información de gestión"
          variant="ghost"
          onPress={() =>
            router.push({
              pathname: '/applications/[applicationId]/management',
              params: { applicationId },
            })
          }
        />

        {app.messagesSent !== undefined ? (
          <Card tone="sky">
            <SectionLabel>Uso de la aplicación</SectionLabel>
            <Text style={styles.usageValue}>{app.messagesSent.toLocaleString('es-ES')}</Text>
            <Body>mensajes enviados · {app.consumedServices?.join(', ')}</Body>
          </Card>
        ) : null}

        <View style={styles.history}>
          <Heading level={3}>Historial de estados</Heading>
          <View style={styles.timelineRow}>
            <View style={styles.timelineRail}>
              <View
                style={[styles.timelineDot, { backgroundColor: stateTone(app.credentialState) }]}
              />
              <View style={styles.timelineLine} />
            </View>
            <View style={styles.timelineContent}>
              <CredentialStateBadge state={app.credentialState} />
              <Text style={styles.historyDate}>{changedAt}</Text>
              <Body>Último cambio registrado para esta credencial.</Body>
            </View>
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: space.md, paddingBottom: space.xxl },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  titleBlock: { gap: space.xxs },
  credentialCard: {
    padding: space.lg,
    shadowColor: colors.navy,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.sm,
  },
  divider: { height: 1, backgroundColor: colors.hairline, marginVertical: space.xs },
  detailRow: { gap: space.xxs, paddingVertical: space.xs },
  detailLabel: { color: colors.slate, fontSize: 13, fontWeight: '700' },
  detailValue: { color: colors.ink, fontSize: 16, lineHeight: 22 },
  code: {
    overflow: 'hidden',
    borderRadius: 8,
    backgroundColor: colors.surface,
    paddingHorizontal: space.sm,
    paddingVertical: space.xs,
    color: colors.primaryDeep,
    fontFamily: 'monospace',
    fontSize: 14,
  },
  actions: { gap: space.sm },
  usageValue: { color: colors.navy, fontSize: 30, fontWeight: '800' },
  history: { gap: space.md, paddingTop: space.xs },
  timelineRow: { flexDirection: 'row', gap: space.sm },
  timelineRail: { width: 18, alignItems: 'center' },
  timelineDot: { width: 14, height: 14, borderRadius: 7, marginTop: 6 },
  timelineLine: { width: 2, flex: 1, minHeight: 66, backgroundColor: colors.hairline },
  timelineContent: { flex: 1, gap: space.xxs, paddingBottom: space.md },
  historyDate: { color: colors.slate, fontSize: 13 },
});
