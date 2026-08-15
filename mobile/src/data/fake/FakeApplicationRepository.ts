import { fakeRepository } from './FakeKeyOpsRepository';
import type { ApplicationRepository } from '@/domain/ports/ApplicationRepository';

export const fakeApplicationRepository: ApplicationRepository = {
  async list(environment, input = {}) {
    const apps = fakeRepository
      .listApplications(environment, input.query)
      .filter((application) => !input.state || application.credentialState === input.state)
      .sort((left, right) => {
        if (input.sort === 'lastChangedAt') {
          return right.lastChangedAt.localeCompare(left.lastChangedAt);
        }
        if (input.sort === 'institution') {
          return left.institution.localeCompare(right.institution, 'es');
        }
        return left.name.localeCompare(right.name, 'es');
      });
    const page = input.page ?? 1;
    return {
      items: apps.slice((page - 1) * 20, page * 20),
      page,
      pageSize: 20,
      total: apps.length,
    };
  },
  async get(environment, applicationId) {
    const application = fakeRepository.getApplication(applicationId, environment);
    if (!application) throw new Error('Aplicación no encontrada.');
    application.updatedAt ??= application.lastChangedAt;
    return application;
  },
  async updateManagement(environment, applicationId, input) {
    const application = fakeRepository.updateManagement(
      applicationId,
      environment,
      input.technicalContact?.name,
      input.requestOrTicketId,
    );
    application.managementReason = input.reason;
    application.updatedAt = new Date().toISOString();
    return application;
  },
};
