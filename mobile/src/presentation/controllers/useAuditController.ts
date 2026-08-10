import { useMemo, useState } from 'react';
import { listAuditEvents } from '@/domain/use-cases/audit/listAuditEvents';
import type { User } from '@/domain/model/types';

export function useAuditController(user: User) {
  const [query, setQuery] = useState('');
  const page = useMemo(() => listAuditEvents(user, { query }), [query, user]);
  return { ...page, query, setQuery };
}
