import type { Environment } from '@/domain/model/common';
export class EnvironmentRequestScope {
  private controller = new AbortController();
  private sequence = 0;
  begin(environment: Environment) {
    this.controller.abort();
    this.controller = new AbortController();
    const sequence = ++this.sequence;
    return { environment, sequence, signal: this.controller.signal };
  }
  isCurrent(sequence: number) {
    return sequence === this.sequence;
  }
  cancel() {
    this.controller.abort();
  }
}
