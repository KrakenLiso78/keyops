import { OperationTiming } from '@/data/http/OperationTiming';

describe('medición de operaciones', () => {
  it('correlaciona duración sin registrar cuerpos sensibles', () => {
    const timing = new OperationTiming('issue', 'req-123');
    expect(timing.finish(18)).toEqual({
      operation: 'issue',
      requestId: 'req-123',
      clientDurationMs: expect.any(Number),
      serviceDurationMs: 18,
    });
  });
});
