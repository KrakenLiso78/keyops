import { fireEvent, render, screen } from '@testing-library/react-native';
import { useState } from 'react';
import { CredentialReasonForm } from '@/presentation/components/credentials';

function Harness() {
  const [reason, setReason] = useState('');
  return (
    <CredentialReasonForm
      actionLabel="Suspender credenciales"
      reason={reason}
      onReasonChange={setReason}
      onSubmit={jest.fn()}
      error="La operación no se completó."
    />
  );
}

describe('formulario de suspensión', () => {
  it('mantiene el motivo visible cuando el servidor devuelve un error', () => {
    render(<Harness />);
    fireEvent.changeText(screen.getByLabelText('Motivo'), 'Pausa operativa');
    fireEvent.press(screen.getByText('Suspender credenciales'));
    expect(screen.getByDisplayValue('Pausa operativa')).toBeTruthy();
    expect(screen.getByText('La operación no se completó.')).toBeTruthy();
  });
});
