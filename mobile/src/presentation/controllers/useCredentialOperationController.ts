import { useCallback, useRef, useState } from 'react';
import {
  operateCredential,
  type CredentialOperation,
} from '@/domain/use-cases/credentials/operateCredential';
import type { Environment, Receipt, User } from '@/domain/model/types';
export function useCredentialOperationController(
  user: User,
  environment: Environment,
  applicationId: string,
) {
  const [receipt, setReceipt] = useState<Receipt>();
  const [error, setError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);
  const key = useRef<string | undefined>(undefined);
  const execute = useCallback(
    (operation: CredentialOperation, reason?: string) => {
      if (submitting) return;
      key.current ??= `key-${Date.now()}-${applicationId}`;
      setSubmitting(true);
      try {
        const next = operateCredential(user, environment, applicationId, operation, reason);
        setReceipt(next);
        setError(undefined);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : 'La operación no se completó.');
      } finally {
        setSubmitting(false);
        key.current = undefined;
      }
    },
    [applicationId, environment, submitting, user],
  );
  return { receipt, error, submitting, execute };
}
