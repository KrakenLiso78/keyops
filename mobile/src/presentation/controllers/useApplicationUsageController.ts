import { useMemo } from 'react';
import { getApplicationUsage } from '@/domain/use-cases/usage/getApplicationUsage';
import type { Environment } from '@/domain/model/types';

export function useApplicationUsageController(environment: Environment, applicationId: string) {
  return useMemo(
    () => getApplicationUsage(environment, applicationId),
    [environment, applicationId],
  );
}
