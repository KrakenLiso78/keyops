import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const source = (relativePath: string) =>
  readFileSync(join(process.cwd(), 'src', relativePath), 'utf8');

describe('persistencia y exposición sensible', () => {
  it('no persiste secretos ni OTP en sesión o rutas', () => {
    const inspected = [
      source('data/session/SecureStoreSessionStore.ts'),
      source('app/(protected)/applications/[applicationId]/operation.tsx'),
      source('data/fake/FakeKeyOpsRepository.ts'),
    ].join('\n');
    expect(inspected).not.toMatch(/clientSecret|zipPassword|AsyncStorage/i);
  });
});
