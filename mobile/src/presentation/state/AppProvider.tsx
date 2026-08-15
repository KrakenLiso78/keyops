import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import { useDependencies } from '@/composition/DependenciesProvider';
import type { AuthenticatedUser } from '@/domain/model/user';
import type { Environment } from '@/domain/model/types';
import { restoreSession } from '@/domain/use-cases/auth/restoreSession';
import { signIn as signInUseCase } from '@/domain/use-cases/auth/signIn';
import { signOut as signOutUseCase } from '@/domain/use-cases/auth/signOut';

type AppContextValue = {
  user?: AuthenticatedUser;
  restoring: boolean;
  environment: Environment;
  signIn: (login: string, password: string) => Promise<AuthenticatedUser>;
  signOut: () => Promise<void>;
  setEnvironment: (environment: Environment) => void;
};
const AppContext = createContext<AppContextValue | undefined>(undefined);

export function AppProvider({ children }: PropsWithChildren) {
  const { auth, sessionStore } = useDependencies();
  const [user, setUser] = useState<AuthenticatedUser>();
  const [restoring, setRestoring] = useState(true);
  const [environment, setEnvironment] = useState<Environment>('test');

  useEffect(() => {
    let mounted = true;
    restoreSession(auth, sessionStore)
      .then((restored) => {
        if (mounted) setUser(restored);
      })
      .catch(() => {
        if (mounted) setUser(undefined);
      })
      .finally(() => {
        if (mounted) setRestoring(false);
      });
    return () => {
      mounted = false;
    };
  }, [auth, sessionStore]);

  const value = useMemo(
    () => ({
      user,
      restoring,
      environment,
      signIn: async (login: string, password: string) => {
        const authenticated = await signInUseCase(auth, sessionStore, login, password);
        setUser(authenticated);
        return authenticated;
      },
      signOut: async () => {
        await signOutUseCase(auth, sessionStore);
        setUser(undefined);
        setEnvironment('test');
      },
      setEnvironment,
    }),
    [auth, environment, restoring, sessionStore, user],
  );
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('AppProvider no está disponible.');
  return context;
}
