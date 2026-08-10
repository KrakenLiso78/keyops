import { actionNeedsReason, nextCredentialState } from '@/domain/policies/credentialTransitions';
describe('transiciones de credenciales', () => {
  it('solo aplica transiciones válidas', () => {
    expect(nextCredentialState('suspend', 'active')).toBe('suspended');
    expect(() => nextCredentialState('reactivate', 'active')).toThrow();
  });
  it('exige motivo para cambios sensibles', () => expect(actionNeedsReason('revoke')).toBe(true));
});
