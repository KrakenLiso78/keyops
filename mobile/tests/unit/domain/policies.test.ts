import { nextCredentialState } from '@/domain/policies/credentialTransitions';
import { permittedActions } from '@/domain/policies/permittedActions';

describe('políticas de credenciales', () => {
  it('solo permite emitir sin credenciales', () =>
    expect(permittedActions('analyst', 'no_credentials')).toEqual(['issue']));
  it('requiere transición válida', () =>
    expect(() => nextCredentialState('suspend', 'revoked')).toThrow());
  it('reserva revocación para perfiles autorizados', () =>
    expect(permittedActions('senior_analyst', 'active')).toContain('revoke'));
});
