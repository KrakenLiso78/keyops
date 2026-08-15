import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { AppState, Button, Text, View, type AppStateStatus } from 'react-native';
import type { CredentialRepository } from '@/domain/ports/CredentialRepository';
import { useCredentialOperationController } from '@/presentation/controllers/useCredentialOperationController';

function Harness({ repository }: { repository: CredentialRepository }) {
  const controller = useCredentialOperationController(
    repository,
    'test',
    'app-001',
    'credential-1',
  );
  return (
    <View>
      <Button title="Entregar" onPress={() => controller.execute('delivery')} />
      {controller.receipt?.delivery ? <Text>{controller.receipt.delivery.otp}</Text> : null}
    </View>
  );
}

describe('entrega sintética en memoria', () => {
  it('clears the OTP when the app goes to the background', async () => {
    let changeState: ((state: AppStateStatus) => void) | undefined;
    const remove = jest.fn();
    jest.spyOn(AppState, 'addEventListener').mockImplementation((_, listener) => {
      changeState = listener;
      return { remove };
    });
    const repository = {
      deliver: jest.fn().mockResolvedValue({
        operationId: 'operation-1',
        requestId: 'request-1',
        result: 'succeeded',
        delivery: {
          deliveryId: 'delivery-1',
          credentialVersionId: 'version-1',
          deliveryUrl: 'https://keyops.test/v1/deliveries/delivery-1/artifact',
          otp: '482193',
          otpExpiresAt: '2026-08-15T12:02:00.000Z',
          createdAt: '2026-08-15T12:00:00.000Z',
        },
      }),
    } as unknown as CredentialRepository;
    const view = render(<Harness repository={repository} />);
    fireEvent.press(screen.getByText('Entregar'));
    await waitFor(() => expect(screen.getByText('482193')).toBeTruthy());
    expect(changeState).toBeDefined();
    act(() => changeState?.('background'));
    await waitFor(() => expect(screen.queryByText('482193')).toBeNull());
    view.unmount();
    expect(remove).toHaveBeenCalledTimes(1);
  });
});
