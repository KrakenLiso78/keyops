import { useLocalSearchParams, router } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { fakeRepository } from '@/data/fake/FakeKeyOpsRepository';
import type { CredentialHistoryEntry, CredentialState } from '@/domain/model/types';
import { permittedActions } from '@/domain/policies/permittedActions';
import { Body, Button, Card, Heading, Screen } from '@/presentation/components/base';
import { ApplicationDetailTitle } from '@/presentation/components/applications/ApplicationDetailTitle';
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

function stateTone(state: CredentialState) {
  if (state === 'active') return colors.success;
  if (state === 'revoked') return colors.error;
  if (state === 'suspended') return colors.warning;
  if (state === 'no_credentials') return colors.error;
  return '#b8b8b8';
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
    .format(new Date(value))
    .replace(',', ' ·');
}

function HistoryItem({ entry, last }: { entry: CredentialHistoryEntry; last: boolean }) {
  return (
    <View style={styles.timelineRow}>
      <View style={styles.timelineRail}>
        <View style={[styles.timelineDot, { backgroundColor: stateTone(entry.state) }]} />
        {!last ? <View style={styles.timelineLine} /> : null}
      </View>
      <View style={styles.timelineContent}>
        <CredentialStateBadge state={entry.state} />
        {entry.actorDisplayName ? (
          <Text style={styles.historyActor}>{entry.actorDisplayName}</Text>
        ) : null}
        <Text style={styles.historyDate}>{formatDate(entry.changedAt)}</Text>
      </View>
    </View>
  );
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
  const featuredAction = actions.includes('delivery') ? 'delivery' : actions[0];
  const additionalActions = actions.filter((action) => action !== featuredAction);
  const history = app.credentialHistory ?? [
    {
      state: app.credentialState,
      changedAt: app.lastChangedAt,
    },
  ];
  const openOperation = (action: string) =>
    router.push({
      pathname: '/applications/[applicationId]/operation',
      params: { applicationId, action },
    });

  return (
    <Screen style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.topControls}>
          <BackHeader onBack={() => router.back()} />
          <EnvironmentBadge environment={environment} />
        </View>
        <ApplicationDetailTitle />

        <Card style={styles.credentialCard}>
          <Heading level={3}>Credencial API</Heading>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Estado</Text>
            <CredentialStateBadge state={app.credentialState} />
          </View>
          <View style={styles.infoBlock}>
            <Text style={styles.label}>Contacto técnico</Text>
            <Text style={styles.value}>{app.technicalContact ?? 'Sin registrar'}</Text>
          </View>
          <View style={styles.infoBlock}>
            <Text style={styles.label}>Client ID</Text>
            <View style={styles.clientIdBox}>
              <Text numberOfLines={1} selectable style={styles.clientId}>
                {app.clientId ?? 'Aún no disponible'}
              </Text>
              {app.clientId ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Copiar Client ID"
                  onPress={() => Clipboard.setStringAsync(app.clientId!)}
                  style={styles.copyButton}
                >
                  <Text style={styles.copyIcon}>▢</Text>
                </Pressable>
              ) : null}
            </View>
          </View>
          {featuredAction ? (
            <Button
              title={actionLabels[featuredAction]}
              onPress={() => openOperation(featuredAction)}
            />
          ) : null}
        </Card>

        <View style={styles.history}>
          {history.map((entry, index) => (
            <HistoryItem
              key={`${entry.state}-${entry.changedAt}`}
              entry={entry}
              last={index === history.length - 1}
            />
          ))}
        </View>

        <View style={styles.additionalContent}>
          {additionalActions.length ? (
            <View style={styles.actions}>
              <SectionLabel>Otras acciones</SectionLabel>
              {additionalActions.map((action) => (
                <Button
                  key={action}
                  title={actionLabels[action] ?? action}
                  variant="secondary"
                  danger={action === 'revoke'}
                  onPress={() => openOperation(action)}
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
          <Card tone="sky">
            <SectionLabel>Aplicación</SectionLabel>
            <Text style={styles.applicationName}>{app.institution}</Text>
            <Body>{app.name}</Body>
            <RoleBadge>{app.apiRole}</RoleBadge>
          </Card>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.canvas },
  content: { gap: space.md, paddingHorizontal: 12, paddingBottom: space.xxl },
  topControls: { alignItems: 'flex-start', gap: space.xs },
  credentialCard: {
    gap: 14,
    borderColor: colors.hairline,
    borderRadius: 10,
    padding: 20,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 8,
    elevation: 4,
  },
  infoRow: { minHeight: 30, flexDirection: 'row', alignItems: 'center', gap: space.md },
  infoBlock: { gap: 2 },
  label: { color: colors.ink, fontSize: 16 },
  value: { color: colors.ink, fontSize: 16, lineHeight: 22 },
  clientIdBox: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: 8,
    paddingLeft: space.sm,
  },
  clientId: { flex: 1, color: colors.ink, fontFamily: 'monospace', fontSize: 15 },
  copyButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  copyIcon: { color: colors.slate, fontSize: 24 },
  history: { marginTop: space.xs },
  timelineRow: { minHeight: 76, flexDirection: 'row', gap: space.sm },
  timelineRail: { width: 22, alignItems: 'center' },
  timelineDot: { width: 14, height: 14, borderRadius: 7, marginTop: 5 },
  timelineLine: { width: 1, flex: 1, backgroundColor: colors.hairline },
  timelineContent: { flex: 1, gap: 2, paddingBottom: space.sm },
  historyActor: { color: colors.ink, fontSize: 14 },
  historyDate: { color: colors.ink, fontSize: 14 },
  additionalContent: { gap: space.md, marginTop: space.md },
  actions: { gap: space.sm },
  applicationName: { color: colors.navy, fontSize: 17, fontWeight: '800' },
});
