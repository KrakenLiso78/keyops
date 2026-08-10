export type OperationTimingSample = {
  operation: string;
  requestId: string;
  clientDurationMs: number;
  serviceDurationMs?: number;
};

export class OperationTiming {
  private readonly startedAt = Date.now();

  constructor(
    private readonly operation: string,
    private readonly requestId: string,
  ) {}

  finish(serviceDurationMs?: number): OperationTimingSample {
    return {
      operation: this.operation,
      requestId: this.requestId,
      clientDurationMs: Math.max(0, Date.now() - this.startedAt),
      ...(serviceDurationMs === undefined ? {} : { serviceDurationMs }),
    };
  }
}
