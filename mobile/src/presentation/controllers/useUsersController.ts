import { useCallback, useState } from 'react';
import { listAuthorizedUsers, updateAuthorizedUser } from '@/domain/use-cases/users/manageUsers';
import type { User, UserProfile } from '@/domain/model/types';

export function useUsersController(actor: User) {
  const [, setVersion] = useState(0);
  const users = listAuthorizedUsers(actor);
  const update = useCallback(
    (id: string, profile: UserProfile, enabled: boolean) => {
      updateAuthorizedUser(actor, id, profile, enabled);
      setVersion((value) => value + 1);
    },
    [actor],
  );
  return { users, update };
}
