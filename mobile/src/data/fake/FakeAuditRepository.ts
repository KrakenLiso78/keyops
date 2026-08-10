import { fakeRepository } from './FakeKeyOpsRepository';

export const fakeAuditRepository = {
  list: () => fakeRepository.listAudit(),
};
