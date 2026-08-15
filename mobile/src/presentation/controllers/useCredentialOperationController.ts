import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import type { Environment } from '@/domain/model/common';
import type { OperationReceipt } from '@/domain/model/audit';
import type { CredentialRepository } from '@/domain/ports/CredentialRepository';
import type { CredentialAction } from '@/domain/policies/permittedActions';

function createIdempotencyKey(applicationId: string): string {
  const random = globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2);
  return `keyops-${applicationId}-${Date.now()}-${random}`;
}

export function useCredentialOperationController(
  repository: CredentialRepository,
  environment: Environment,
  applicationId: string,
  credentialId?: string,
  onConfirmed?: () => void | Promise<void>,
) {
  const [receipt, setReceipt] = useState<OperationReceipt>();
  const [error, setError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);
  const pending = useRef<{ action: CredentialAction; key: string } | undefined>(undefined);

  const execute = useCallback(
    async (action: CredentialAction, reason?: string) => {
      if (submitting) return;
      if (pending.current?.action !== action) {
        pending.current = { action, key: createIdempotencyKey(applicationId) };
      }
      const key = pending.current.key;
      setSubmitting(true);
      setError(undefined);
      try {
        let next: OperationReceipt;
        if (action === 'issue') {
          next = await repository.issue(environment, applicationId, key);
        } else {
          if (!credentialId) throw new Error('La credencial confirmada no está disponible.');
          if (action === 'regenerate') {
            next = await repository.regenerate(environment, applicationId, credentialId, key);
          } else if (action === 'delivery') {
            next = await repository.deliver(environment, applicationId, credentialId, key);
          } else if (action === 'suspend') {
            next = await repository.suspend(
              environment,
              applicationId,
              credentialId,
              reason ?? '',
              key,
            );
          } else if (action === 'reactivate') {
            next = await repository.reactivate(
              environment,
              applicationId,
              credentialId,
              reason ?? '',
              key,
            );
          } else {
            next = await repository.revoke(
              environment,
              applicationId,
              credentialId,
              reason ?? '',
              key,
            );
          }
        }
        setReceipt(next);
        pending.current = undefined;
        await onConfirmed?.();
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : 'La operación no se completó.');
      } finally {
        setSubmitting(false);
      }
    },
    [applicationId, credentialId, environment, onConfirmed, repository, submitting],
  );

  const clearSensitive = useCallback(() => {
    setReceipt((current) => (current?.delivery ? undefined : current));
  }, []);
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState !== 'active') clearSensitive();
    });
    return () => subscription.remove();
  }, [clearSensitive]);
  const reset = useCallback(() => {
    pending.current = undefined;
    setReceipt(undefined);
    setError(undefined);
    setSubmitting(false);
  }, []);

  return { receipt, error, submitting, execute, clearSensitive, reset };
}
