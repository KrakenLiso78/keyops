import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { AppState, Button, Text, View, type AppStateStatus } from 'react-native';
import type { CredentialRepository } from '@/domain/ports/CredentialRepository';
import { isProtectedDelivery } from '@/domain/model/delivery';
import { useCredentialOperationController } from '@/presentation/controllers/useCredentialOperationController';

function Harness({ repository }: { repository: CredentialRepository }) {
  const controller = useCredentialOperationController(repository, 'test', 'app-real');
  const delivery = controller.receipt?.delivery;
  return (
    <View>
      <Button title="Emitir real" onPress={() => void controller.execute('issue')} />
      {delivery && !isProtectedDelivery(delivery) ? (
        <>
          <Text>{delivery.deliveryId}</Text>
          <Text>{delivery.expiresAt}</Text>
          <Text>Contraseña y OTP por canales corporativos separados</Text>
        </>
      ) : null}
    </View>
  );
}

describe('referencia de entrega real', () => {
  it('no expone material secreto y limpia la referencia al pasar a segundo plano', async () => {
    let changeState: ((state: AppStateStatus) => void) | undefined;
    jest.spyOn(AppState, 'addEventListener').mockImplementation((_, listener) => {
      changeState = listener;
      return { remove: jest.fn() };
    });
    const repository = {
      issue: jest.fn().mockResolvedValue({
        operationId: 'operation-real-delivery',
        requestId: 'request-real-delivery',
        status: 'confirmed',
        result: 'succeeded',
        delivery: {
          deliveryId: 'delivery-safe-reference',
          expiresAt: '2026-08-15T12:02:00.000Z',
        },
      }),
    } as unknown as CredentialRepository;
    render(<Harness repository={repository} />);

    fireEvent.press(screen.getByText('Emitir real'));
    await waitFor(() => expect(screen.getByText('delivery-safe-reference')).toBeTruthy());
    expect(screen.queryByText('482193')).toBeNull();
    expect(screen.queryByText(/client secret/iu)).toBeNull();
    act(() => changeState?.('background'));
    await waitFor(() => expect(screen.queryByText('delivery-safe-reference')).toBeNull());
  });
});
