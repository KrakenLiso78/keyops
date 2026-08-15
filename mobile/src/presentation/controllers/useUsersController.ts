import { useCallback, useEffect, useState } from 'react';
import type {
  AuthenticatedUser,
  AuthorizedUser,
  RegisterAuthorizedUserCommand,
  UpdateAuthorizedUserCommand,
} from '@/domain/model/user';
import type { UserRepository } from '@/domain/ports/UserRepository';
import {
  listCorporateUsers,
  registerCorporateUser,
  updateCorporateUser,
} from '@/domain/use-cases/users';

export function useUsersController(actor: AuthenticatedUser, repository: UserRepository) {
  const [users, setUsers] = useState<AuthorizedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>();
  const [refreshToken, setRefreshToken] = useState(0);

  useEffect(() => {
    let active = true;
    listCorporateUsers(actor, repository)
      .then((result) => {
        if (!active) return;
        setUsers(result);
        setError(undefined);
      })
      .catch((cause: unknown) => {
        if (active) {
          setError(cause instanceof Error ? cause.message : 'No se pudieron cargar los usuarios.');
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [actor, refreshToken, repository]);

  const load = useCallback(() => {
    setLoading(true);
    setRefreshToken((value) => value + 1);
  }, []);

  const register = useCallback(
    async (command: RegisterAuthorizedUserCommand) => {
      setSubmitting(true);
      try {
        await registerCorporateUser(actor, repository, command);
        setUsers(await listCorporateUsers(actor, repository));
        setError(undefined);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : 'No se pudo registrar el usuario.');
      } finally {
        setSubmitting(false);
      }
    },
    [actor, repository],
  );

  const update = useCallback(
    async (user: AuthorizedUser, command: UpdateAuthorizedUserCommand) => {
      setSubmitting(true);
      try {
        const updated = await updateCorporateUser(
          actor,
          repository,
          user.id,
          user.updatedAt,
          command,
        );
        setUsers((current) => current.map((item) => (item.id === updated.id ? updated : item)));
        setError(undefined);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : 'No se pudo actualizar el usuario.');
      } finally {
        setSubmitting(false);
      }
    },
    [actor, repository],
  );

  return { users, loading, submitting, error, load, register, update };
}
