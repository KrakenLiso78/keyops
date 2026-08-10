import { reasonCommandSchema } from '@/data/schemas/reasonCommand';
describe('comandos con motivo', () => {
  it('exige motivo no vacío', () => {
    expect(reasonCommandSchema.parse({ reason: 'Mantenimiento' }).reason).toBe('Mantenimiento');
    expect(() => reasonCommandSchema.parse({ reason: ' ' })).toThrow();
  });
});
