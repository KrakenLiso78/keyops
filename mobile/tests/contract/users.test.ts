import {
  authorizedUserSchema,
  registerAuthorizedUserSchema,
  updateAuthorizedUserSchema,
} from '@/data/schemas/user';

describe('contrato de usuarios corporativos', () => {
  it('acepta la autorización corporativa completa', () => {
    expect(
      authorizedUserSchema.parse({
        id: 'user-1',
        corporateIssuer: 'https://identity.example.test',
        corporateSubject: 'subject-1',
        displayName: 'Corporate User',
        profile: 'administrator',
        enabled: true,
        permissions: ['users:write'],
        updatedAt: '2026-08-15T10:00:00.000Z',
      }),
    ).toMatchObject({ corporateSubject: 'subject-1' });
  });

  it('requires HTTPS identity and complete optimistic updates', () => {
    expect(() =>
      registerAuthorizedUserSchema.parse({
        corporateIssuer: 'http://identity.example.test',
        corporateSubject: 'subject-1',
        profile: 'analyst',
        enabled: true,
      }),
    ).toThrow();
    expect(() => updateAuthorizedUserSchema.parse({ profile: 'auditor' })).toThrow();
  });
});
