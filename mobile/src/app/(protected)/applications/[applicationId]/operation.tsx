import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocalSearchParams, router } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { createFakeCredentialRepository } from '@/data/fake/FakeCredentialRepository';
import { actionNeedsReason } from '@/domain/policies/credentialTransitions';
import type { Delivery, User } from '@/domain/model/types';
import type { CredentialAction } from '@/domain/policies/permittedActions';
import { useDependencies } from '@/composition/DependenciesProvider';
import { Body, Button, Card, Field, Heading, Screen } from '@/presentation/components/base';
import { CopyableValue } from '@/presentation/components/CopyableValue';
import {
  BackHeader,
  CredentialStateBadge,
  EnvironmentBadge,
  SectionLabel,
} from '@/presentation/components/chrome';
import { colors, space } from '@/presentation/design-system';
import { useApp } from '@/presentation/state/AppProvider';
import { useEnvironment } from '@/presentation/state/EnvironmentProvider';
import { useCredentialOperationController } from '@/presentation/controllers/useCredentialOperationController';
import { useApplicationDetailController } from '@/presentation/controllers/useApplicationDetailController';
import { LoadingState, PersistentError } from '@/presentation/components/feedback';
import { fakeUsers } from '@/data/fake/seed';
import {
  CredentialOperationFeedback,
  SyntheticCredentialNotice,
} from '@/presentation/components/credentials';

const titles: Record<string, string> = {
  issue: 'Generar credenciales',
  delivery: 'Generar enlace de entrega',
  regenerate: 'Regenerar credenciales',
  suspend: 'Suspender credenciales',
  reactivate: 'Reactivar credenciales',
  revoke: 'Revocar credenciales',
};

const consequences: Record<string, string> = {
  issue: 'Se emitirá una nueva credencial y se preparará una entrega segura.',
  delivery: 'Se creará un nuevo enlace y un OTP sin cambiar la credencial activa.',
  regenerate: 'La credencial anterior quedará inactiva de inmediato.',
  suspend: 'La credencial dejará de aceptar peticiones hasta su reactivación.',
  reactivate: 'La credencial volverá a aceptar peticiones.',
  revoke: 'La credencial quedará revocada de forma irreversible.',
};

function Countdown({ delivery }: { delivery: Delivery }) {
  const [seconds, setSeconds] = useState(120);
  useEffect(() => {
    const update = () =>
      setSeconds(
        Math.max(0, Math.ceil((new Date(delivery.otpExpiresAt).getTime() - Date.now()) / 1000)),
      );
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [delivery.otpExpiresAt]);
  const minutes = String(Math.floor(seconds / 60)).padStart(2, '0');
  const remainder = String(seconds % 60).padStart(2, '0');
  return (
    <Text style={styles.countdown}>
      Válido {minutes}:{remainder}
    </Text>
  );
}

export default function OperationScreen() {
  const { applicationId, action } = useLocalSearchParams<{
    applicationId: string;
    action: string;
  }>();
  const { environment, user } = useApp();
  const dependencies = useDependencies();
  const applicationController = useApplicationDetailController(environment, applicationId);
  const application = applicationController.application;
  const credentialRepository = useMemo(
    () =>
      dependencies.credentials ?? createFakeCredentialRepository((user ?? fakeUsers[0]!) as User),
    [dependencies.credentials, user],
  );
  const [reason, setReason] = useState('');
  const retryApplication = applicationController.retry;
  const refreshApplication = useCallback(() => retryApplication(), [retryApplication]);
  const operation = useCredentialOperationController(
    credentialRepository,
    environment,
    applicationId,
    application?.credentialId,
    refreshApplication,
  );
  const result = operation.receipt;
  const error = operation.error;
  const resetOperation = operation.reset;
  const { registerReset } = useEnvironment();
  useEffect(
    () =>
      registerReset(() => {
        setReason('');
        resetOperation();
      }),
    [registerReset, resetOperation],
  );
  const title = titles[action] ?? 'Operación sobre credencial';

  const submit = () => {
    if (!user) return;
    void operation.execute(action as CredentialAction, reason);
  };

  if (!application && ['idle', 'loading'].includes(applicationController.status)) {
    return (
      <Screen>
        <BackHeader onBack={() => router.back()} />
        <LoadingState label="Cargando aplicación…" />
      </Screen>
    );
  }
  if (!application) {
    return (
      <Screen>
        <BackHeader onBack={() => router.back()} />
        <PersistentError
          message={applicationController.error ?? 'Aplicación no encontrada.'}
          onRetry={applicationController.retry}
        />
      </Screen>
    );
  }

  const returnToDetail = () =>
    router.replace({
      pathname: '/applications/[applicationId]',
      params: { applicationId },
    });

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.topControls}>
          <BackHeader onBack={() => (result ? returnToDetail() : router.back())} />
          <EnvironmentBadge environment={environment} />
        </View>

        {result?.delivery ? (
          <>
            <Heading level={1}>Entrega al cliente</Heading>
            <SyntheticCredentialNotice />
            <Card tone="sky" style={styles.deliveryCard}>
              <Text style={styles.institution}>
                {application.institution} /{`\n`}
                {application.name}
              </Text>
              <Text style={styles.deliveryText}>
                Contacto: {application.technicalContact ?? 'Sin registrar'}
              </Text>
              <Text style={styles.deliveryText}>Enlace seguro</Text>
              <CopyableValue
                value={result.delivery.deliveryUrl}
                copyLabel="Copiar enlace"
                iconBackgroundColor={colors.sky}
                outlined={false}
                style={styles.linkRow}
                textStyle={styles.linkText}
              />
            </Card>
            <Button
              title="Compartir enlace"
              onPress={() => Share.share({ message: result.delivery!.deliveryUrl })}
            />

            <Card tone="lavender" style={styles.otpCard}>
              <Text style={styles.otpLabel}>OTP de un solo uso</Text>
              <Text selectable style={styles.otp}>
                {result.delivery.otp.slice(0, 3)} {result.delivery.otp.slice(3)}
              </Text>
              <Countdown delivery={result.delivery} />
              <Button
                title="Copiar OTP"
                variant="secondary"
                onPress={() => Clipboard.setStringAsync(result.delivery!.otp)}
              />
            </Card>

            <View accessibilityRole="alert" style={styles.warning}>
              <Text style={styles.warningIcon}>!</Text>
              <Text style={styles.warningText}>Envía el OTP por separado.</Text>
            </View>
            <View style={styles.resultFooter}>
              <CredentialOperationFeedback submitting={operation.submitting} receipt={result} />
              <Card tone="mint">
                <Text style={styles.confirmed}>Operación completada y auditada</Text>
                <Body>Solicitud {result.requestId}</Body>
              </Card>
              <Button title="Volver al detalle" variant="ghost" onPress={returnToDetail} />
            </View>
          </>
        ) : result ? (
          <>
            <Heading level={1}>Operación completada</Heading>
            <SyntheticCredentialNotice />
            <CredentialOperationFeedback submitting={operation.submitting} receipt={result} />
            <Card tone="mint">
              <Text style={styles.confirmed}>{title}</Text>
              <Body>Solicitud {result.requestId}</Body>
              <Body>La evidencia de auditoría se ha registrado.</Body>
            </Card>
            <Button title="Volver al detalle" onPress={returnToDetail} />
          </>
        ) : (
          <>
            <View style={styles.titleBlock}>
              <Heading level={1}>{title}</Heading>
              <Body>{consequences[action] ?? 'Revisa el contexto antes de continuar.'}</Body>
            </View>
            <Card>
              <SectionLabel>Contexto de la operación</SectionLabel>
              <Text style={styles.institution}>{application.institution}</Text>
              <Body>{application.name}</Body>
              <CredentialStateBadge state={application.credentialState} />
            </Card>
            <SyntheticCredentialNotice />
            {actionNeedsReason(action) ? (
              <Field
                label="Motivo"
                value={reason}
                onChangeText={setReason}
                placeholder="Describe el motivo"
                multiline
              />
            ) : null}
            {action === 'revoke' ? (
              <View accessibilityRole="alert" style={styles.warning}>
                <Text style={styles.warningIcon}>!</Text>
                <Text style={styles.warningText}>Esta acción es irreversible.</Text>
              </View>
            ) : null}
            <Button
              title={operation.submitting ? 'Procesando…' : title}
              danger={action === 'revoke'}
              disabled={operation.submitting}
              onPress={submit}
            />
            <Button title="Cancelar" variant="ghost" onPress={() => router.back()} />
            <CredentialOperationFeedback submitting={operation.submitting} error={error} />
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: space.md, paddingBottom: space.xxl },
  topControls: { alignItems: 'flex-start', gap: space.xs },
  titleBlock: { gap: space.xxs },
  deliveryCard: { padding: space.lg, gap: 12 },
  otpCard: { padding: space.lg, alignItems: 'flex-start', gap: 6 },
  institution: { color: colors.navy, fontSize: 18, fontWeight: '800' },
  deliveryText: { color: colors.ink, fontSize: 15, lineHeight: 21 },
  linkRow: { minHeight: 44, paddingLeft: 0 },
  linkText: { fontSize: 13 },
  otpLabel: { color: colors.ink, fontSize: 16 },
  otp: {
    color: colors.primaryDeep,
    fontFamily: 'monospace',
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: 6,
  },
  countdown: { color: colors.ink, fontSize: 14 },
  warning: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingHorizontal: space.xxs,
    paddingVertical: space.xs,
  },
  warningIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.error,
    color: colors.canvas,
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '800',
  },
  warningText: { flex: 1, color: colors.error, fontSize: 14, lineHeight: 20, fontWeight: '600' },
  resultFooter: { gap: space.sm, marginTop: 120 },
  confirmed: { color: colors.success, fontSize: 17, fontWeight: '800' },
  error: { color: colors.error, fontWeight: '600' },
});
