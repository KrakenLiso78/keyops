import { useState } from 'react';
import { FakeAuthRepository } from '@/data/fake/FakeAuthRepository';
export function useSignInController(onSuccess: (login: string) => void) {
  const [error, setError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);
  const submit = async (login: string, password: string) => {
    setSubmitting(true);
    try {
      await new FakeAuthRepository().signIn(login, password);
      setError(undefined);
      onSuccess(login);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo iniciar sesión.');
    } finally {
      setSubmitting(false);
    }
  };
  return { error, submitting, submit };
}
