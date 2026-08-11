import { useEffect, useMemo, useState } from 'react';
import { useLocalSearchParams, router } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { fakeRepository } from '@/data/fake/FakeKeyOpsRepository';
import { actionNeedsReason } from '@/domain/policies/credentialTransitions';
import type { Delivery, Receipt } from '@/domain/model/types';
import { Body, Button, Card, Field, Heading, Screen } from '@/presentation/components/base';
import {
  BackHeader,
  CredentialStateBadge,
  EnvironmentBadge,
  SectionLabel,
} from '@/presentation/components/chrome';
import { colors, space } from '@/presentation/design-system';
import { useApp } from '@/presentation/state/AppProvider';

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
      Caduca en {minutes}:{remainder}
    </Text>
  );
}

export default function OperationScreen() {
  const { applicationId, action } = useLocalSearchParams<{
    applicationId: string;
    action: string;
  }>();
  const { environment, user } = useApp();
  const application = useMemo(
    () => fakeRepository.getApplication(applicationId, environment),
    [applicationId, environment],
  );
  const [reason, setReason] = useState('');
  const [result, setResult] = useState<Receipt>();
  const [error, setError] = useState('');
  const title = titles[action] ?? 'Operación sobre credencial';

  const submit = () => {
    if (!user) return;
    try {
      setResult(fakeRepository.operate(user, applicationId, environment, action, reason));
      setError('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'La operación no se completó.');
    }
  };

  if (!application) {
    return (
      <Screen>
        <BackHeader onBack={() => router.back()} />
        <Heading>Aplicación no encontrada</Heading>
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
        <View style={styles.topBar}>
          <BackHeader onBack={() => (result ? returnToDetail() : router.back())} />
          <EnvironmentBadge environment={environment} />
        </View>

        {result?.delivery ? (
          <>
            <View style={styles.titleBlock}>
              <Heading level={1}>Entrega al cliente</Heading>
              <Body>Comparte el enlace y el OTP por canales separados.</Body>
            </View>
            <Card tone="sky" style={styles.deliveryCard}>
              <SectionLabel>Enlace seguro de entrega</SectionLabel>
              <Text style={styles.institution}>{application.institution}</Text>
              <Body>{application.name}</Body>
              <View style={styles.linkBox}>
                <Text numberOfLines={2} selectable style={styles.linkText}>
                  {result.delivery.deliveryUrl}
                </Text>
              </View>
              <Button
                title="Compartir enlace"
                onPress={() => Share.share({ message: result.delivery!.deliveryUrl })}
              />
              <Button
                title="Copiar enlace"
                variant="secondary"
                onPress={() => Clipboard.setStringAsync(result.delivery!.deliveryUrl)}
              />
            </Card>

            <Card tone="lavender" style={styles.otpCard}>
              <SectionLabel>OTP de un solo uso</SectionLabel>
              <Text selectable style={styles.otp}>
                {result.delivery.otp}
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
              <Text style={styles.warningText}>
                No envíes el enlace y el OTP en el mismo mensaje. El OTP solo puede utilizarse una
                vez.
              </Text>
            </View>
            <Card tone="mint">
              <Text style={styles.confirmed}>Operación completada y auditada</Text>
              <Body>Solicitud {result.requestId}</Body>
            </Card>
            <Button title="Volver al detalle" variant="ghost" onPress={returnToDetail} />
          </>
        ) : result ? (
          <>
            <Heading level={1}>Operación completada</Heading>
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
            <Button title={title} danger={action === 'revoke'} onPress={submit} />
            <Button title="Cancelar" variant="ghost" onPress={() => router.back()} />
            {error ? (
              <Text accessibilityRole="alert" style={styles.error}>
                {error}
              </Text>
            ) : null}
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: space.md, paddingBottom: space.xxl },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  titleBlock: { gap: space.xxs },
  deliveryCard: { padding: space.lg, gap: space.sm },
  otpCard: { padding: space.lg, alignItems: 'center', gap: space.sm },
  institution: { color: colors.navy, fontSize: 18, fontWeight: '800' },
  linkBox: {
    borderRadius: 10,
    backgroundColor: colors.canvas,
    borderWidth: 1,
    borderColor: '#cce7f2',
    padding: space.sm,
  },
  linkText: { color: colors.primaryDeep, fontFamily: 'monospace', fontSize: 13, lineHeight: 18 },
  otp: {
    color: colors.navy,
    fontFamily: 'monospace',
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: 6,
  },
  countdown: { color: colors.primaryDeep, fontSize: 14, fontWeight: '700' },
  warning: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    borderRadius: 12,
    backgroundColor: colors.rose,
    padding: space.sm,
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
  warningText: { flex: 1, color: colors.error, fontSize: 13, lineHeight: 18, fontWeight: '600' },
  confirmed: { color: colors.success, fontSize: 17, fontWeight: '800' },
  error: { color: colors.error, fontWeight: '600' },
});
