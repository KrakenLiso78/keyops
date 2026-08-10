import { Linking, Text, View } from 'react-native';
import type { Delivery } from '@/domain/model/types';
import { Button, Card } from '@/presentation/components/base';
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
