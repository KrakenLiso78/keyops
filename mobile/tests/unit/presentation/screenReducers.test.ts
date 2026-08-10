import { operationReducer } from '@/presentation/state/operationReducer';
import { queryReducer } from '@/presentation/state/queryReducer';
describe('reducers de pantalla', () => {
  it('no publica éxito optimista', () => {
    const state = operationReducer({ status: 'idle' as const }, { type: 'submit' });
    expect(state.status).toBe('submitting');
    expect(state.receipt).toBeUndefined();
  });
  it('conserva datos al fallar una consulta', () =>
    expect(
      queryReducer({ status: 'success' as const, data: ['a'] }, { type: 'error', error: 'fallo' })
        .data,
    ).toEqual(['a']));
});
