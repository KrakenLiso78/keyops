import { credentialOperationSchema } from '@/data/schemas/credentialOperation';
describe('contrato de regeneración', () =>
  it('acepta resultado confirmado', () =>
    expect(
      credentialOperationSchema.parse({
        contractVersion: '1',
        operationId: 'op',
        requestId: 'req',
        auditEventId: 'aud',
        result: 'succeeded',
      }).result,
    ).toBe('succeeded')));
