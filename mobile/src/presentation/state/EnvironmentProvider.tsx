import {
  createContext,
  useContext,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';
import type { Environment } from '@/domain/model/common';
import { resetEnvironmentState, type EnvironmentReset } from './resetEnvironmentState';
type EnvironmentContextValue = {
  environment: Environment;
  changeEnvironment: (environment: Environment) => void;
  registerReset: (reset: EnvironmentReset) => () => void;
  operationInProgress: boolean;
  setOperationInProgress: (value: boolean) => void;
};
const EnvironmentContext = createContext<EnvironmentContextValue | undefined>(undefined);
export function EnvironmentProvider({ children }: PropsWithChildren) {
  const [environment, setEnvironment] = useState<Environment>('test');
  const [operationInProgress, setOperationInProgress] = useState(false);
  const resets = useRef(new Set<EnvironmentReset>());
  const value = useMemo(
    () => ({
      environment,
      operationInProgress,
      setOperationInProgress,
      changeEnvironment: (next: Environment) => {
        if (next === environment || operationInProgress) return;
        resetEnvironmentState([...resets.current]);
        setEnvironment(next);
      },
      registerReset: (reset: EnvironmentReset) => {
        resets.current.add(reset);
        return () => resets.current.delete(reset);
      },
    }),
    [environment, operationInProgress],
  );
  return <EnvironmentContext.Provider value={value}>{children}</EnvironmentContext.Provider>;
}
export function useEnvironment() {
  const value = useContext(EnvironmentContext);
  if (!value) throw new Error('EnvironmentProvider no está disponible.');
  return value;
}
