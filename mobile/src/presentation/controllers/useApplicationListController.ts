import { useCallback, useEffect, useReducer, useState } from 'react';
import { useDependencies } from '@/composition/DependenciesProvider';
import type { Application, CredentialState, Environment } from '@/domain/model/types';
import type { Page } from '@/domain/model/page';
import { queryReducer } from '@/presentation/state/queryReducer';
import { useEnvironment } from '@/presentation/state/EnvironmentProvider';
import { listPersistentApplications } from '@/domain/use-cases/applications/listApplications';

const messageFor = (error: unknown) =>
  error instanceof Error ? error.message : 'No se pudo cargar el inventario.';

export function useApplicationListController(environment: Environment) {
  const { applications } = useDependencies();
  const { beginRequest, isCurrentRequest } = useEnvironment();
  const [query, setQuery] = useState('');
  const [state, setState] = useState<CredentialState>();
  const [sort, setSort] = useState<'name' | 'institution' | 'lastChangedAt'>('name');
  const [page, setPage] = useState(1);
  const [refreshToken, setRefreshToken] = useState(0);
  const [result, dispatch] = useReducer(queryReducer<Page<Application>>, { status: 'idle' });
  const updateQuery = useCallback((value: string) => {
    setPage(1);
    setQuery(value);
  }, []);
  const updateState = useCallback((value: CredentialState | undefined) => {
    setPage(1);
    setState(value);
  }, []);
  const updateSort = useCallback((value: 'name' | 'institution' | 'lastChangedAt') => {
    setPage(1);
    setSort(value);
  }, []);

  useEffect(() => {
    const request = beginRequest();
    dispatch({ type: 'load' });
    listPersistentApplications(applications, environment, {
      query: query.trim() || undefined,
      state,
      sort,
      page,
      signal: request.signal,
    })
      .then((data) => {
        if (isCurrentRequest(request.sequence)) dispatch({ type: 'success', data });
      })
      .catch((error: unknown) => {
        if (request.signal.aborted) return;
        if (isCurrentRequest(request.sequence)) {
          dispatch({ type: 'error', error: messageFor(error) });
        }
      });
  }, [
    applications,
    beginRequest,
    environment,
    isCurrentRequest,
    page,
    query,
    refreshToken,
    sort,
    state,
  ]);

  return {
    ...result,
    items: result.data?.items ?? [],
    total: result.data?.total ?? 0,
    query,
    setQuery: updateQuery,
    state,
    setState: updateState,
    sort,
    setSort: updateSort,
    page,
    pageSize: result.data?.pageSize ?? 20,
    setPage,
    retry: () => setRefreshToken((value) => value + 1),
  };
}
