import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { ManagementContextForm } from '@/presentation/components/applications/ManagementContextForm';

describe('contexto de gestión persistente', () => {
  it('confirma solo después de resolver la persistencia', async () => {
    let finish!: () => void;
    const onSubmit = jest.fn(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        }),
    );
    const screen = render(<ManagementContextForm onSubmit={onSubmit} />);
    fireEvent.changeText(screen.getByLabelText('Contacto técnico'), 'Ana Ruiz');
    fireEvent.changeText(screen.getByLabelText('Motivo de gestión'), 'Alta operativa');
    fireEvent.press(screen.getByRole('button', { name: 'Guardar cambios' }));
    expect(screen.queryByText('Cambios guardados.')).toBeNull();
    finish();
    await waitFor(() => expect(screen.getByText('Cambios guardados.')).toBeTruthy());
    expect(onSubmit).toHaveBeenCalledWith({
      technicalContact: { name: 'Ana Ruiz', email: undefined, phone: undefined },
      reason: 'Alta operativa',
      requestOrTicketId: undefined,
    });
  });

  it('informa el error, no anuncia éxito y conserva lo introducido', async () => {
    const screen = render(
      <ManagementContextForm
        initialContact="Contacto confirmado"
        onSubmit={() => Promise.reject(new Error('Airtable no disponible'))}
      />,
    );
    fireEvent.changeText(screen.getByLabelText('Contacto técnico'), 'Nuevo contacto');
    fireEvent.press(screen.getByRole('button', { name: 'Guardar cambios' }));
    await waitFor(() => expect(screen.getByText('Airtable no disponible')).toBeTruthy());
    expect(screen.queryByText('Cambios guardados.')).toBeNull();
    expect(screen.getByLabelText('Contacto técnico').props.value).toBe('Nuevo contacto');
  });
});
