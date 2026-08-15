import { RestUserRepository } from '@/data/repositories/RestUserRepository';

const user = {
  id: 'user-1',
  corporateIssuer: 'https://identity.example.test',
  corporateSubject: 'subject-1',
  displayName: 'Corporate User',
  profile: 'analyst',
  enabled: true,
  permissions: ['applications:read'],
  updatedAt: '2026-08-15T10:00:00.000Z',
};

describe('RestUserRepository', () => {
  it('lists, registers and updates with optimistic concurrency', async () => {
    const request = jest
      .fn()
      .mockResolvedValueOnce([user])
      .mockResolvedValueOnce(user)
      .mockResolvedValueOnce({ ...user, profile: 'auditor', permissions: ['audit:read'] });
    const repository = new RestUserRepository({ request } as never);
    await expect(repository.list()).resolves.toHaveLength(1);
    await repository.create({
      corporateIssuer: user.corporateIssuer,
      corporateSubject: user.corporateSubject,
      profile: 'analyst',
      enabled: true,
    });
    await repository.update(user.id, user.updatedAt, { profile: 'auditor', enabled: true });
    expect(request).toHaveBeenNthCalledWith(2, '/v1/users', {
      method: 'POST',
      body: JSON.stringify({
        corporateIssuer: user.corporateIssuer,
        corporateSubject: user.corporateSubject,
        profile: 'analyst',
        enabled: true,
      }),
    });
    expect(request).toHaveBeenNthCalledWith(3, '/v1/users/user-1', {
      method: 'PATCH',
      headers: { 'if-match': '"2026-08-15T10:00:00.000Z"' },
      body: JSON.stringify({ profile: 'auditor', enabled: true }),
    });
  });

  it('rejects incomplete external responses', async () => {
    const repository = new RestUserRepository({ request: async () => [{ id: 'broken' }] } as never);
    await expect(repository.list()).rejects.toThrow();
  });
});
