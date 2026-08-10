import { useState } from 'react';
import { Text } from 'react-native';
import { Button, Field } from '@/presentation/components/base';

export function ManagementContextForm({
  initialContact = '',
  initialTicket = '',
  onSubmit,
}: {
  initialContact?: string;
  initialTicket?: string;
  onSubmit: (input: { technicalContact?: string; requestOrTicketId?: string }) => void;
}) {
  const [technicalContact, setTechnicalContact] = useState(initialContact);
  const [requestOrTicketId, setRequestOrTicketId] = useState(initialTicket);
  const [error, setError] = useState<string>();
  return (
    <>
      <Field label="Contacto técnico" value={technicalContact} onChangeText={setTechnicalContact} />
      <Field
        label="Solicitud o ticket"
        value={requestOrTicketId}
        onChangeText={setRequestOrTicketId}
      />
      <Button
        title="Guardar cambios"
        onPress={() => {
          try {
            onSubmit({
              technicalContact: technicalContact || undefined,
              requestOrTicketId: requestOrTicketId || undefined,
            });
            setError(undefined);
          } catch (cause) {
            setError(cause instanceof Error ? cause.message : 'No se pudo guardar.');
          }
        }}
      />
      {error ? <Text accessibilityRole="alert">{error}</Text> : null}
    </>
  );
}
