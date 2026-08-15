import { mapApplicationDetail } from '@/data/mappers/applicationDetailMapper';
import { mapApplicationPage } from '@/data/mappers/applicationListMapper';
import { managementContextPatchSchema } from '@/data/schemas/managementContext';
import type { FetchHttpClient } from '@/data/http/FetchHttpClient';
import type {
  ApplicationListInput,
  ApplicationRepository,
  ManagementInput,
} from '@/domain/ports/ApplicationRepository';
import type { Environment } from '@/domain/model/types';

export class RestApplicationRepository implements ApplicationRepository {
  constructor(private readonly http: FetchHttpClient) {}

  async list(environment: Environment, input: ApplicationListInput = {}) {
    const params = new URLSearchParams({
      environment,
      page: String(input.page ?? 1),
      sort: input.sort ?? 'name',
    });
    if (input.query) params.set('query', input.query);
    if (input.state) params.set('state', input.state);
    return mapApplicationPage(
      await this.http.request(`/v1/applications?${params}`, {}, input.signal),
    );
  }

  async get(environment: Environment, applicationId: string, signal?: AbortSignal) {
    return mapApplicationDetail(
      await this.http.request(
        `/v1/applications/${encodeURIComponent(applicationId)}?environment=${environment}`,
        {},
        signal,
      ),
    );
  }

  async updateManagement(environment: Environment, applicationId: string, input: ManagementInput) {
    const body = managementContextPatchSchema.parse({
      technicalContact: input.technicalContact,
      reason: input.reason,
      requestOrTicketId: input.requestOrTicketId,
    });
    return mapApplicationDetail(
      await this.http.request(
        `/v1/applications/${encodeURIComponent(applicationId)}/management?environment=${environment}`,
        {
          method: 'PATCH',
          headers: { 'if-match': `"${input.expectedUpdatedAt}"` },
          body: JSON.stringify(body),
        },
        input.signal,
      ),
    );
  }
}
