import { isEnvironment, isIsoInstant } from '@/domain/model/common';
describe('modelos de dominio', () => {
  it('valida ambientes e instantes', () => {
    expect(isEnvironment('test')).toBe(true);
    expect(isEnvironment('invalid')).toBe(false);
    expect(isIsoInstant('2026-08-10T10:00:00Z')).toBe(true);
  });
});
