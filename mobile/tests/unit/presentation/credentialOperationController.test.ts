import { operationReducer } from '@/presentation/state/operationReducer';
describe('estado de operación', () => {
  it('no sustituye el resultado hasta recibir éxito', () => {
    const submitting = operationReducer({ status: 'idle' as const }, { type: 'submit' });
    expect(submitting.receipt).toBeUndefined();
    expect(operationReducer(submitting, { type: 'success', receipt: 'ok' }).receipt).toBe('ok');
  });
});
