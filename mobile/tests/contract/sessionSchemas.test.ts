import {
  createSessionRequestSchema,
  sessionResponseSchema,
  sessionViewSchema,
} from '@/data/schemas/session';
describe('schemas de sesión', () => {
  const user = {
    id: 'u1',
    loginIdentifier: 'analista',
    displayName: 'Ana',
    profile: 'analyst',
    enabled: true,
    permissions: ['applications:read'],
  };
  it('valida inicio y respuesta', () => {
    expect(
      createSessionRequestSchema.parse({ loginIdentifier: 'analista', password: 'demo' }),
    ).toBeTruthy();
    expect(
      sessionResponseSchema.parse({ contractVersion: '1', user, accessToken: 'token' }).user
        .profile,
    ).toBe('analyst');
    expect(sessionViewSchema.parse({ contractVersion: '1', user }).user.id).toBe('u1');
  });
});
