import { reasonCommandSchema } from '@/data/schemas/reasonCommand';
describe('revocación', () =>
  it('exige motivo para la transición terminal', () =>
    expect(reasonCommandSchema.safeParse({ reason: '' }).success).toBe(false)));
