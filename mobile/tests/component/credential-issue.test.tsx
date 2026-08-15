import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { Button, Text, View } from 'react-native';
import type { CredentialRepository } from '@/domain/ports/CredentialRepository';
import { useCredentialOperationController } from '@/presentation/controllers/useCredentialOperationController';

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((next) => {
    resolve = next;
  });
  return { promise, resolve };
}

function Harness({ repository }: { repository: CredentialRepository }) {
  const controller = useCredentialOperationController(repository, 'test', 'app-001');
  return (
    <View>
      <Button title="Emitir" onPress={() => controller.execute('issue')} />
      {controller.submitting ? <Text>Enviando</Text> : null}
      {controller.receipt ? <Text>Confirmada</Text> : null}
      {controller.error ? <Text>{controller.error}</Text> : null}
    </View>
  );
}

describe('emisión sintética remota', () => {
  it('no muestra éxito antes de la respuesta confirmada', async () => {
    const pending = deferred<Awaited<ReturnType<CredentialRepository['issue']>>>();
    const repository = {
      issue: jest.fn(() => pending.promise),
    } as unknown as CredentialRepository;
    render(<Harness repository={repository} />);
    fireEvent.press(screen.getByText('Emitir'));
    expect(screen.getByText('Enviando')).toBeTruthy();
    expect(screen.queryByText('Confirmada')).toBeNull();
    await act(async () => {
      pending.resolve({ operationId: 'op-1', requestId: 'req-1', result: 'succeeded' });
      await pending.promise;
    });
    expect(screen.getByText('Confirmada')).toBeTruthy();
  });
});
