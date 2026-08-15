import { useState } from 'react';
import { Text } from 'react-native';
import { Button, Field } from '@/presentation/components/base';
import type { ManagementContextPatch } from '@/data/schemas/managementContext';

export function ManagementContextForm({
  initialContact = '',
  initialEmail = '',
  initialPhone = '',
  initialReason = '',
  initialTicket = '',
  onSubmit,
}: {
  initialContact?: string;
  initialEmail?: string;
  initialPhone?: string;
  initialReason?: string;
  initialTicket?: string;
  onSubmit: (input: ManagementContextPatch) => Promise<void> | void;
}) {
  const [technicalContact, setTechnicalContact] = useState(initialContact);
  const [email, setEmail] = useState(initialEmail);
  const [phone, setPhone] = useState(initialPhone);
  const [reason, setReason] = useState(initialReason);
  const [requestOrTicketId, setRequestOrTicketId] = useState(initialTicket);
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [error, setError] = useState<string>();

  const submit = async () => {
    setStatus('saving');
    setError(undefined);
    try {
      await onSubmit({
        technicalContact: technicalContact.trim()
          ? {
              name: technicalContact.trim(),
              email: email.trim() || undefined,
              phone: phone.trim() || undefined,
            }
          : undefined,
        reason: reason.trim() || undefined,
        requestOrTicketId: requestOrTicketId.trim() || undefined,
      });
      setStatus('saved');
    } catch (cause) {
      setStatus('error');
      setError(cause instanceof Error ? cause.message : 'No se pudo guardar.');
    }
  };

  return (
    <>
      <Field label="Contacto técnico" value={technicalContact} onChangeText={setTechnicalContact} />
      <Field
        autoCapitalize="none"
        keyboardType="email-address"
        label="Correo del contacto"
        value={email}
        onChangeText={setEmail}
      />
      <Field label="Teléfono del contacto" value={phone} onChangeText={setPhone} />
      <Field label="Motivo de gestión" value={reason} onChangeText={setReason} multiline />
      <Field
        label="Solicitud o ticket"
        value={requestOrTicketId}
        onChangeText={setRequestOrTicketId}
      />
      <Button
        title={status === 'saving' ? 'Guardando…' : 'Guardar cambios'}
        disabled={status === 'saving'}
        onPress={() => void submit()}
      />
      {status === 'saved' ? <Text accessibilityRole="alert">Cambios guardados.</Text> : null}
      {error ? <Text accessibilityRole="alert">{error}</Text> : null}
    </>
  );
}
