import type { FetchHttpClient } from '@/data/http/FetchHttpClient';
import { RestCredentialRepository } from '@/data/repositories/RestCredentialRepository';

const receipt = {
  contractVersion: '1' as const,
  operationId: 'operation-1',
  requestId: 'request-1',
  auditEventId: 'audit-1',
  result: 'succeeded' as const,
  delivery: {
    deliveryId: 'delivery-1',
    credentialVersionId: 'version-1',
    deliveryUrl: 'https://keyops.test/v1/deliveries/delivery-1/artifact',
    otp: '123456',
    otpExpiresAt: '2026-08-15T10:02:00.000Z',
    createdAt: '2026-08-15T10:00:00.000Z',
  },
};

describe('RestCredentialRepository', () => {
  it('sends the retained idempotency key and maps the confirmed receipt', async () => {
    const request = jest.fn().mockResolvedValue(receipt);
    const repository = new RestCredentialRepository({ request } as unknown as FetchHttpClient);
    await expect(repository.issue('test', 'app-001', 'keyops-key-00000001')).resolves.toMatchObject(
      {
        operationId: 'operation-1',
        delivery: { otp: '123456' },
      },
    );
    expect(request).toHaveBeenCalledTimes(1);
    expect(request).toHaveBeenCalledWith(
      '/v1/applications/app-001/credentials?environment=test',
      expect.objectContaining({
        method: 'POST',
        headers: { 'idempotency-key': 'keyops-key-00000001' },
      }),
    );
  });
});
