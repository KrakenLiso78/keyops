import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Button, Text, View } from 'react-native';
import type { OperationReceipt } from '@/domain/model/audit';
import type { CredentialRepository } from '@/domain/ports/CredentialRepository';
import { useCredentialOperationController } from '@/presentation/controllers/useCredentialOperationController';

function Harness({
  repository,
  onConfirmed,
}: {
  repository: CredentialRepository;
  onConfirmed: () => void;
}) {
  const controller = useCredentialOperationController(
    repository,
    'test',
    'app-real',
    undefined,
    onConfirmed,
  );
  return (
    <View>
      <Button title="Emitir" onPress={() => void controller.execute('issue')} />
      <Button title="Reconciliar" onPress={() => void controller.reconcile()} />
      {controller.submitting ? <Text>Pendiente</Text> : null}
      {controller.receipt ? <Text>{controller.receipt.status}</Text> : null}
      {controller.error ? <Text>{controller.error}</Text> : null}
    </View>
  );
}

describe('emisión real sin éxito optimista', () => {
  it('mantiene la clave y reconcilia antes de confirmar', async () => {
    let resolveIssue!: (receipt: OperationReceipt) => void;
    const issue = jest.fn(
      () =>
        new Promise<OperationReceipt>((resolve) => {
          resolveIssue = resolve;
        }),
    );
    const status = jest.fn().mockResolvedValue({
      operationId: 'operation-real-1',
      requestId: 'request-real-1',
      status: 'confirmed',
      result: 'succeeded',
    });
    const onConfirmed = jest.fn();
    const repository = { issue, status } as unknown as CredentialRepository;
    render(<Harness repository={repository} onConfirmed={onConfirmed} />);

    fireEvent.press(screen.getByText('Emitir'));
    expect(screen.getByText('Pendiente')).toBeTruthy();
    expect(screen.queryByText('confirmed')).toBeNull();
    await act(async () => {
      resolveIssue({
        operationId: 'operation-real-1',
        requestId: 'request-real-1',
        status: 'reconciliation_required',
        result: 'failed',
      });
    });

    await waitFor(() => expect(screen.getByText('reconciliation_required')).toBeTruthy());
    expect(onConfirmed).not.toHaveBeenCalled();
    fireEvent.press(screen.getByText('Reconciliar'));
    await waitFor(() => expect(screen.getByText('confirmed')).toBeTruthy());
    expect(status).toHaveBeenCalledWith('operation-real-1');
    expect(onConfirmed).toHaveBeenCalledTimes(1);
    expect(issue).toHaveBeenCalledTimes(1);
  });
});
