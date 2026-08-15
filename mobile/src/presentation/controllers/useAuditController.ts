import { useCallback, useEffect, useReducer, useState } from 'react';
import { useDependencies } from '@/composition/DependenciesProvider';
import type { AuditEvent, AuditFilters, OperationResult } from '@/domain/model/audit';
import type { Page } from '@/domain/model/page';
import type { AuthenticatedUser } from '@/domain/model/user';
import { canListAuditEvents, listAuditEvents } from '@/domain/use-cases/audit/listAuditEvents';
import { queryReducer } from '@/presentation/state/queryReducer';

const messageFor = (error: unknown) =>
  error instanceof Error ? error.message : 'No se pudo cargar la auditoría.';

export function useAuditController(user: AuthenticatedUser) {
  const { audit } = useDependencies();
  const authorized = canListAuditEvents(user);
  const [filters, setFilters] = useState<AuditFilters>({ page: 1 });
  const [refreshToken, setRefreshToken] = useState(0);
  const [result, dispatch] = useReducer(queryReducer<Page<AuditEvent>>, { status: 'idle' });

  const updateFilter = useCallback(
    <K extends Exclude<keyof AuditFilters, 'page'>>(key: K, value: AuditFilters[K]) => {
      setFilters((current) => ({ ...current, [key]: value || undefined, page: 1 }));
    },
    [],
  );

  useEffect(() => {
    if (!authorized) return;
    const controller = new AbortController();
    dispatch({ type: 'load' });
    listAuditEvents(audit, user, filters, controller.signal)
      .then((data) => dispatch({ type: 'success', data }))
      .catch((error: unknown) => {
        if (!controller.signal.aborted) dispatch({ type: 'error', error: messageFor(error) });
      });
    return () => controller.abort();
  }, [audit, authorized, filters, refreshToken, user]);

  return {
    ...result,
    authorized,
    items: result.data?.items ?? [],
    total: result.data?.total ?? 0,
    page: filters.page ?? 1,
    pageSize: result.data?.pageSize ?? 20,
    filters,
    setFrom: (value: string) => updateFilter('from', value),
    setTo: (value: string) => updateFilter('to', value),
    setInstitutionId: (value: string) => updateFilter('institutionId', value),
    setApplicationId: (value: string) => updateFilter('applicationId', value),
    setActorUserId: (value: string) => updateFilter('actorUserId', value),
    setResult: (value: OperationResult | undefined) => updateFilter('result', value),
    setPage: (page: number) => setFilters((current) => ({ ...current, page })),
    retry: () => setRefreshToken((value) => value + 1),
  };
}
