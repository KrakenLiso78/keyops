import { Text } from 'react-native';
import { Body, Button, Card } from '@/presentation/components/base';

export function CorporateCatalogError({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <Card tone="rose">
      <Text accessibilityRole="alert" style={{ fontSize: 18, fontWeight: '800' }}>
        Catálogo corporativo no disponible
      </Text>
      <Body>{message}</Body>
      <Body>No se mostrarán datos de demostración como sustitución.</Body>
      <Button title="Reintentar catálogo" variant="secondary" onPress={onRetry} />
    </Card>
  );
}
