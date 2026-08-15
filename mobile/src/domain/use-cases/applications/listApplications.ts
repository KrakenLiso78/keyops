import { fakeRepository } from '@/data/fake/FakeKeyOpsRepository';
import type { Environment } from '@/domain/model/types';
import type {
  ApplicationListInput,
  ApplicationRepository,
} from '@/domain/ports/ApplicationRepository';
export type ListApplicationsInput = {
  query?: string;
  state?: string;
  sort?: 'institution' | 'application' | 'lastChangedAt';
  page?: number;
  pageSize?: number;
};
export function listApplications(environment: Environment, input: ListApplicationsInput = {}) {
  const all = fakeRepository
    .listApplications(environment, input.query)
    .filter((app) => !input.state || app.credentialState === input.state);
  const key = input.sort ?? 'lastChangedAt';
  const sorted = [...all].sort((a, b) =>
    key === 'application'
      ? a.name.localeCompare(b.name)
      : key === 'institution'
        ? a.institution.localeCompare(b.institution)
        : b.lastChangedAt.localeCompare(a.lastChangedAt),
  );
  const page = input.page ?? 1;
  const pageSize = input.pageSize ?? 20;
  return {
    items: sorted.slice((page - 1) * pageSize, page * pageSize),
    page,
    pageSize,
    total: sorted.length,
  };
}

export function listPersistentApplications(
  repository: ApplicationRepository,
  environment: Environment,
  input: ApplicationListInput = {},
) {
  return repository.list(environment, input);
}
