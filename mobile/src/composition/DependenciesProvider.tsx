import { createContext, useContext, useMemo, type PropsWithChildren } from 'react';
import { createAppDependencies, type AppDependencies } from './createAppDependencies';
const DependenciesContext = createContext<AppDependencies | undefined>(undefined);
export function DependenciesProvider({ children }: PropsWithChildren) {
  const dependencies = useMemo(() => createAppDependencies(), []);
  return (
    <DependenciesContext.Provider value={dependencies}>{children}</DependenciesContext.Provider>
  );
}
export function useDependencies() {
  const value = useContext(DependenciesContext);
  if (!value) throw new Error('DependenciesProvider no está disponible.');
  return value;
}
