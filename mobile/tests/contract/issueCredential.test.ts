import { credentialOperationSchema } from '@/data/schemas/credentialOperation';
describe('contrato de emisión', () => {
  it('separa OTP y enlace', () => {
    const result = credentialOperationSchema.parse({
      contractVersion: '1',
      operationId: 'op',
      requestId: 'req',
      auditEventId: 'aud',
      result: 'succeeded',
      delivery: {
        deliveryId: 'delivery-1',
        credentialVersionId: 'version-1',
        deliveryUrl: 'https://delivery.example/1',
        otp: '123456',
        otpExpiresAt: '2026-08-10T00:02:00Z',
        createdAt: '2026-08-10T00:00:00Z',
      },
    });
    expect(result.delivery?.deliveryUrl).not.toContain(result.delivery?.otp ?? '');
  });
});
