import { useMemo } from 'react';
import { getApplicationDetail } from '@/domain/use-cases/applications/getApplicationDetail';
import type { Environment } from '@/domain/model/types';
export function useApplicationDetailController(environment: Environment, applicationId: string) {
  return useMemo(
    () => getApplicationDetail(environment, applicationId),
    [environment, applicationId],
  );
}
