import { fakeRepository } from './FakeKeyOpsRepository';
import type { User } from '@/domain/model/types';
export class FakeCredentialRepository {
  constructor(private readonly user: User) {}
  issue(environment: 'test' | 'production', applicationId: string) {
    return fakeRepository.operate(this.user, applicationId, environment, 'issue');
  }
  regenerate(environment: 'test' | 'production', applicationId: string) {
    return fakeRepository.operate(this.user, applicationId, environment, 'regenerate');
  }
  deliver(environment: 'test' | 'production', applicationId: string) {
    return fakeRepository.operate(this.user, applicationId, environment, 'delivery');
  }
  suspend(environment: 'test' | 'production', applicationId: string, reason: string) {
    return fakeRepository.operate(this.user, applicationId, environment, 'suspend', reason);
  }
  reactivate(environment: 'test' | 'production', applicationId: string, reason: string) {
    return fakeRepository.operate(this.user, applicationId, environment, 'reactivate', reason);
  }
  revoke(environment: 'test' | 'production', applicationId: string, reason: string) {
    return fakeRepository.operate(this.user, applicationId, environment, 'revoke', reason);
  }
}
