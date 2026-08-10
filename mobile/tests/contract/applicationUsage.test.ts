import { usageSchema } from '@/data/schemas/usage';

describe('contrato de uso', () => {
  it.each(['available', 'no_data', 'unavailable'])('admite disponibilidad %s', (availability) => {
    expect(
      usageSchema.parse({
        applicationId: 'app-1',
        environment: 'test',
        availability,
        consumedServices: [],
        usedIps: [],
      }).availability,
    ).toBe(availability);
  });
});
