import { applicationPageSchema } from '@/data/schemas/applicationList';
import type { Application } from '@/domain/model/types';
import type { Page } from '@/domain/model/page';
import { mapApiApplication } from './applicationDetailMapper';

export function mapApplicationPage(input: unknown): Page<Application> {
  const parsed = applicationPageSchema.parse(input);
  return {
    items: parsed.items.map(mapApiApplication),
    page: parsed.page,
    pageSize: parsed.pageSize,
    total: parsed.total,
  };
}
