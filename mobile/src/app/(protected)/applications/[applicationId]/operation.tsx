import { useState } from 'react';
import { useLocalSearchParams, router } from 'expo-router';
import { Linking, ScrollView, Text } from 'react-native';
import { fakeRepository } from '@/data/fake/FakeKeyOpsRepository';
import { actionNeedsReason } from '@/domain/policies/credentialTransitions';
import type { Receipt } from '@/domain/model/types';
import { Body, Button, Card, Field, Heading, Screen } from '@/presentation/components/base';
import { useApp } from '@/presentation/state/AppProvider';

export default function OperationScreen() {
  const { applicationId, action } = useLocalSearchParams<{
    applicationId: string;
    action: string;
  }>();
  const { environment, user } = useApp();
  const [reason, setReason] = useState('');
  const [result, setResult] = useState<Receipt>();
  const [error, setError] = useState('');
  const title =
    action === 'issue'
      ? 'Generar credenciales'
      : action === 'delivery'
        ? 'Nueva entrega'
        : `${action} credenciales`;
  const submit = () => {
    if (!user) return;
    try {
      setResult(fakeRepository.operate(user, applicationId, environment, action, reason));
      setError('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'La operación no se completó.');
    }
  };
  return (
    <Screen>
      <ScrollView contentContainerStyle={{ gap: 16 }}>
        <Heading>{title}</Heading>
        <Body>El estado no se actualiza hasta recibir un resultado confirmado.</Body>
        {actionNeedsReason(action) ? (
          <Field
            label="Motivo"
            value={reason}
            onChangeText={setReason}
            placeholder="Describe el motivo"
          />
        ) : null}
        {action === 'revoke' ? (
          <Text accessibilityRole="alert">Esta acción es irreversible.</Text>
        ) : null}
        <Button title="Confirmar operación" danger={action === 'revoke'} onPress={submit} />
        {error ? (
          <Text accessibilityRole="alert" style={{ color: '#c62828' }}>
            {error}
          </Text>
        ) : null}
        {result ? (
          <Card>
            <Text style={{ fontWeight: '700' }}>Operación confirmada</Text>
            <Body>Solicitud: {result.requestId}</Body>
            {result.delivery ? (
              <>
                <Text style={{ fontWeight: '700' }}>Enlace de entrega</Text>
                <Button
                  title="Abrir enlace"
                  onPress={() => Linking.openURL(result.delivery!.deliveryUrl)}
                />
                <Text style={{ fontWeight: '700' }}>OTP (válido dos minutos)</Text>
                <Body>{result.delivery.otp}</Body>
              </>
            ) : null}
            <Button
              title="Volver al detalle"
              onPress={() =>
                router.replace({
                  pathname: '/(protected)/applications/[applicationId]',
                  params: { applicationId },
                })
              }
            />
          </Card>
        ) : null}
      </ScrollView>
    </Screen>
  );
}
