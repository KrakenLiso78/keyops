import { createContext, useContext, useMemo, useState, type PropsWithChildren } from 'react';
import type { AuthenticatedUser } from '@/domain/model/user';
type SessionContextValue = {
  user?: AuthenticatedUser;
  setUser: (user?: AuthenticatedUser) => void;
};
const SessionContext = createContext<SessionContextValue | undefined>(undefined);
export function SessionProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<AuthenticatedUser>();
  const value = useMemo(() => ({ user, setUser }), [user]);
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}
export function useSession() {
  const value = useContext(SessionContext);
  if (!value) throw new Error('SessionProvider no está disponible.');
  return value;
}
