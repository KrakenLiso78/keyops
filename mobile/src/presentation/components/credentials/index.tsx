import { Linking, Text, View } from 'react-native';
import type { Delivery } from '@/domain/model/types';
import { Button, Card, Field } from '@/presentation/components/base';
import type { OperationReceipt } from '@/domain/model/audit';
export function DeliveryLinkCard({ delivery }: { delivery: Delivery }) {
  return (
    <Card>
      <Text style={{ fontWeight: '700' }}>Enlace de entrega</Text>
      <Button title="Abrir enlace" onPress={() => Linking.openURL(delivery.deliveryUrl)} />
    </Card>
  );
}
export function OtpCard({ delivery }: { delivery: Delivery }) {
  return (
    <View accessibilityLabel="OTP de un solo uso">
      <Text style={{ fontWeight: '700' }}>OTP (válido dos minutos)</Text>
      <Text>{delivery.otp}</Text>
    </View>
  );
}

export function SyntheticCredentialNotice() {
  return (
    <Card tone="yellow">
      <Text style={{ fontWeight: '700' }}>Material sintético no funcional</Text>
      <Text>No contiene secretos reales ni concede acceso a ningún servicio.</Text>
    </Card>
  );
}

export function RealCredentialNotice() {
  return (
    <Card tone="sky">
      <Text style={{ fontWeight: '700' }}>Operación real</Text>
      <Text>El proveedor corporativo confirmará el estado antes de mostrar éxito.</Text>
    </Card>
  );
}

export function CredentialOperationFeedback({
  submitting,
  receipt,
  error,
}: {
  submitting: boolean;
  receipt?: OperationReceipt;
  error?: string;
}) {
  if (submitting) {
    return <Text accessibilityRole="alert">Operación pendiente de confirmación remota…</Text>;
  }
  if (error) {
    return <Text accessibilityRole="alert">{error}</Text>;
  }
  if (receipt) {
    if (receipt.status === 'reconciliation_required') {
      return (
        <Text accessibilityRole="alert">
          Operación pendiente de reconciliación con el proveedor.
        </Text>
      );
    }
    return <Text accessibilityRole="alert">Operación confirmada por el servidor.</Text>;
  }
  return null;
}

export function CredentialReasonForm({
  actionLabel,
  reason,
  onReasonChange,
  onSubmit,
  submitting = false,
  error,
  danger = false,
}: {
  actionLabel: string;
  reason: string;
  onReasonChange: (value: string) => void;
  onSubmit: () => void;
  submitting?: boolean;
  error?: string;
  danger?: boolean;
}) {
  return (
    <View style={{ gap: 12 }}>
      <Field
        label="Motivo"
        value={reason}
        onChangeText={onReasonChange}
        placeholder="Describe el motivo"
        multiline
      />
      <Button
        title={submitting ? 'Procesando…' : actionLabel}
        danger={danger}
        disabled={submitting || !reason.trim()}
        onPress={onSubmit}
      />
      <CredentialOperationFeedback submitting={submitting} error={error} />
    </View>
  );
}
