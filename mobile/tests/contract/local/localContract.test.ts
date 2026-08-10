import { z } from 'zod';

const localOperationResponse = z.object({
  contractVersion: z.literal('1'),
  requestId: z.string().min(1),
  auditEventId: z.string().min(1),
  result: z.literal('succeeded'),
});

function localHttpStub() {
  return {
    status: 200,
    body: {
      contractVersion: '1',
      requestId: 'req-local',
      auditEventId: 'aud-local',
      result: 'succeeded',
    },
  };
}

describe('stub de contrato local', () => {
  it('expone una respuesta versionada y una evidencia simulada', () => {
    const response = localHttpStub();
    expect(response.status).toBe(200);
    expect(localOperationResponse.parse(response.body)).toEqual(response.body);
  });
});
