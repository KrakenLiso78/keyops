import { useState } from 'react';
import { Text } from 'react-native';
import { Button, Card } from '@/presentation/components/base';

export function RevokeConfirmation({
  onConfirm,
  revoked = false,
  disabled = false,
}: {
  onConfirm: () => void;
  revoked?: boolean;
  disabled?: boolean;
}) {
  const [armed, setArmed] = useState(false);
  const confirm = () => {
    setArmed(false);
    onConfirm();
  };
  if (revoked) {
    return (
      <Card tone="rose">
        <Text accessibilityRole="alert">La credencial está revocada definitivamente.</Text>
      </Card>
    );
  }
  return (
    <Card tone="rose">
      <Text accessibilityRole="alert">Esta acción es irreversible.</Text>
      {armed ? (
        <>
          <Text>Confirma que quieres bloquear toda operación posterior.</Text>
          <Button title="Confirmar revocación" danger disabled={disabled} onPress={confirm} />
          <Button title="Cancelar" variant="ghost" onPress={() => setArmed(false)} />
        </>
      ) : (
        <Button title="Revisar revocación" danger onPress={() => setArmed(true)} />
      )}
    </Card>
  );
}
