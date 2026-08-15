import { createContext, useContext, useMemo, type PropsWithChildren } from 'react';
import { createAppDependencies, type AppDependencies } from './createAppDependencies';
const DependenciesContext = createContext<AppDependencies | undefined>(undefined);
export function DependenciesProvider({
  children,
  value,
}: PropsWithChildren<{ value?: AppDependencies }>) {
  const created = useMemo(() => createAppDependencies(), []);
  const dependencies = value ?? created;
  return (
    <DependenciesContext.Provider value={dependencies}>{children}</DependenciesContext.Provider>
  );
}
export function useDependencies() {
  const value = useContext(DependenciesContext);
  if (!value) throw new Error('DependenciesProvider no está disponible.');
  return value;
}
