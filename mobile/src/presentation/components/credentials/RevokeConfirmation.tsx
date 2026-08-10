import { Text } from 'react-native';
import { Button, Card } from '@/presentation/components/base';

export function RevokeConfirmation({ onConfirm }: { onConfirm: () => void }) {
  return (
    <Card>
      <Text accessibilityRole="alert">Esta acción es irreversible.</Text>
      <Button title="Revocar credenciales" danger onPress={onConfirm} />
    </Card>
  );
}
