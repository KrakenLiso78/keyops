import { fakeApplications, fakeUsers } from '@/data/fake/seed';
describe('fixtures fake', () => {
  it('cubre ambos ambientes y perfiles sin secretos', () => {
    expect(new Set(fakeApplications.map((app) => app.environment))).toEqual(
      new Set(['test', 'production']),
    );
    expect(new Set(fakeUsers.map((user) => user.profile)).size).toBe(4);
    expect(JSON.stringify({ fakeApplications, fakeUsers })).not.toMatch(/clientSecret|password/i);
  });
});
