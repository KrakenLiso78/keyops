import { fakeApplications, fakeUsers } from '@/data/fake/seed';

describe('fixtures fake', () => {
  it('mantiene un inventario amplio y equilibrado en ambos ambientes', () => {
    expect(fakeApplications).toHaveLength(24);
    expect(fakeApplications.filter((app) => app.environment === 'test')).toHaveLength(12);
    expect(fakeApplications.filter((app) => app.environment === 'production')).toHaveLength(12);
    expect(new Set(fakeApplications.map((app) => app.id)).size).toBe(24);
  });

  it('cubre los cinco estados en cada ambiente', () => {
    const expectedStates = new Set([
      'no_credentials',
      'active',
      'suspended',
      'rotated_inactive',
      'revoked',
    ]);

    expect(
      new Set(
        fakeApplications
          .filter((app) => app.environment === 'test')
          .map((app) => app.credentialState),
      ),
    ).toEqual(expectedStates);
    expect(
      new Set(
        fakeApplications
          .filter((app) => app.environment === 'production')
          .map((app) => app.credentialState),
      ),
    ).toEqual(expectedStates);
  });

  it('cubre todos los perfiles sin secretos', () => {
    expect(new Set(fakeUsers.map((user) => user.profile)).size).toBe(4);
    expect(JSON.stringify({ fakeApplications, fakeUsers })).not.toMatch(
      /clientSecret|password|otp/i,
    );
  });
});
