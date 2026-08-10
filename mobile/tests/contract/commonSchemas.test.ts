import { environmentSchema, instantSchema } from '@/data/schemas/common';
import { errorSchema } from '@/data/schemas/error';
describe('schemas comunes', () => {
  it('acepta contrato y error válido', () =>
    expect(
      errorSchema.parse({
        contractVersion: '1',
        code: 'forbidden',
        message: 'No autorizado',
        requestId: 'req-1',
      }).retryable,
    ).toBe(false));
  it('rechaza versiones y fechas incompatibles', () => {
    expect(() =>
      errorSchema.parse({ contractVersion: '2', code: 'x', message: 'x', requestId: 'x' }),
    ).toThrow();
    expect(instantSchema.safeParse('invalid').success).toBe(false);
    expect(environmentSchema.parse('production')).toBe('production');
  });
});
