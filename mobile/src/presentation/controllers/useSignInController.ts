import { useState } from 'react';
import type { AuthenticatedUser } from '@/domain/model/user';

export function useSignInController(
  authenticate: (login: string, password: string) => Promise<AuthenticatedUser>,
  onSuccess: (user: AuthenticatedUser) => void,
) {
  const [error, setError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);
  const submit = async (login: string, password: string) => {
    setSubmitting(true);
    try {
      const user = await authenticate(login, password);
      setError(undefined);
      onSuccess(user);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo iniciar sesión.');
    } finally {
      setSubmitting(false);
    }
  };
  return { error, setError, submitting, submit };
}
