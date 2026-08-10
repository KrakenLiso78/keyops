import { createContext, useContext, useMemo, useState, type PropsWithChildren } from 'react';
import { fakeRepository } from '@/data/fake/FakeKeyOpsRepository';
import type { Environment, User } from '@/domain/model/types';

type AppContextValue = {
  user?: User;
  environment: Environment;
  signIn: (login: string) => void;
  signOut: () => void;
  setEnvironment: (environment: Environment) => void;
};
const AppContext = createContext<AppContextValue | undefined>(undefined);

export function AppProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User>();
  const [environment, setEnvironment] = useState<Environment>('test');
  const value = useMemo(
    () => ({
      user,
      environment,
      signIn: (login: string) => setUser(fakeRepository.signIn(login)),
      signOut: () => setUser(undefined),
      setEnvironment,
    }),
    [user, environment],
  );
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('AppProvider no está disponible.');
  return context;
}
