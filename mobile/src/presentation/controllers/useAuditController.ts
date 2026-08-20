import { useCallback, useEffect, useReducer, useState } from 'react';
import { useDependencies } from '@/composition/DependenciesProvider';
import type {
  AuditFilters,
  AuditPage,
  IntegrityVerification,
  OperationResult,
} from '@/domain/model/audit';
import type { AuthenticatedUser } from '@/domain/model/user';
import { canListAuditEvents, listAuditEvents } from '@/domain/use-cases/audit/listAuditEvents';
import { queryReducer } from '@/presentation/state/queryReducer';

const messageFor = (error: unknown) =>
  error instanceof Error ? error.message : 'No se pudo cargar la auditoría.';

export function useAuditController(user: AuthenticatedUser) {
  const { audit } = useDependencies();
  const authorized = canListAuditEvents(user);
  const [filters, setFilters] = useState<AuditFilters>({});
  const [cursorHistory, setCursorHistory] = useState<(string | undefined)[]>([undefined]);
  const [refreshToken, setRefreshToken] = useState(0);
  const [result, dispatch] = useReducer(queryReducer<AuditPage>, { status: 'idle' });
  const [verifications, setVerifications] = useState<
    Record<
      string,
      { status: 'loading' | 'success' | 'error'; result?: IntegrityVerification; error?: string }
    >
  >({});

  const updateFilter = useCallback(
    <K extends Exclude<keyof AuditFilters, 'cursor'>>(key: K, value: AuditFilters[K]) => {
      setFilters((current) => ({ ...current, [key]: value || undefined }));
      setCursorHistory([undefined]);
    },
    [],
  );

  useEffect(() => {
    if (!authorized) return;
    const controller = new AbortController();
    dispatch({ type: 'load' });
    listAuditEvents(audit, user, { ...filters, cursor: cursorHistory.at(-1) }, controller.signal)
      .then((data) => dispatch({ type: 'success', data }))
      .catch((error: unknown) => {
        if (!controller.signal.aborted) dispatch({ type: 'error', error: messageFor(error) });
      });
    return () => controller.abort();
  }, [audit, authorized, cursorHistory, filters, refreshToken, user]);

  const verifyEvent = useCallback(
    (eventId: string) => {
      setVerifications((current) => ({ ...current, [eventId]: { status: 'loading' } }));
      audit
        .verify(eventId)
        .then((verification) =>
          setVerifications((current) => ({
            ...current,
            [eventId]: { status: 'success', result: verification },
          })),
        )
        .catch((error: unknown) =>
          setVerifications((current) => ({
            ...current,
            [eventId]: { status: 'error', error: messageFor(error) },
          })),
        );
    },
    [audit],
  );

  return {
    ...result,
    authorized,
    items: result.data?.items ?? [],
    page: cursorHistory.length,
    nextCursor: result.data?.nextCursor,
    canPrevious: cursorHistory.length > 1,
    filters,
    setFrom: (value: string) => updateFilter('from', value),
    setTo: (value: string) => updateFilter('to', value),
    setApplicationId: (value: string) => updateFilter('applicationId', value),
    setActorUserId: (value: string) => updateFilter('actorUserId', value),
    setResult: (value: OperationResult | undefined) => updateFilter('result', value),
    next: () => {
      const cursor = result.data?.nextCursor;
      if (cursor) setCursorHistory((current) => [...current, cursor]);
    },
    previous: () =>
      setCursorHistory((current) => (current.length > 1 ? current.slice(0, -1) : current)),
    verifications,
    verifyEvent,
    retry: () => setRefreshToken((value) => value + 1),
  };
}
