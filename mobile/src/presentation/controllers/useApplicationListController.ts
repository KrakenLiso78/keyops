import { useMemo, useState } from 'react';
import { listApplications } from '@/domain/use-cases/applications/listApplications';
import type { Environment } from '@/domain/model/types';
export function useApplicationListController(environment: Environment) {
  const [query, setQuery] = useState('');
  const [state, setState] = useState<string>();
  const result = useMemo(
    () => listApplications(environment, { query, state }),
    [environment, query, state],
  );
  return { ...result, query, setQuery, state, setState };
}
