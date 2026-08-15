import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Button, Text, View } from 'react-native';
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
      <Button title="Regenerar" onPress={() => controller.execute('regenerate')} />
      {controller.receipt ? <Text>Confirmada</Text> : null}
      {controller.error ? <Text>{controller.error}</Text> : null}
    </View>
  );
}

describe('regeneración sintética remota', () => {
  it('reintenta con la misma clave y no pierde el último estado confirmado', async () => {
    const regenerate = jest
      .fn()
      .mockRejectedValueOnce(new Error('Respuesta incierta'))
      .mockResolvedValueOnce({ operationId: 'op-1', requestId: 'req-1', result: 'succeeded' });
    const repository = { regenerate } as unknown as CredentialRepository;
    render(<Harness repository={repository} />);
    fireEvent.press(screen.getByText('Regenerar'));
    await waitFor(() => expect(screen.getByText('Respuesta incierta')).toBeTruthy());
    const retainedKey = regenerate.mock.calls[0][3];
    fireEvent.press(screen.getByText('Regenerar'));
    await waitFor(() => expect(screen.getByText('Confirmada')).toBeTruthy());
    expect(regenerate).toHaveBeenCalledTimes(2);
    expect(regenerate.mock.calls[1][3]).toBe(retainedKey);
  });
});
