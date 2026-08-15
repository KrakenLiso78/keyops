import {
  useCallback,
  createContext,
  useContext,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';
import { EnvironmentRequestScope } from '@/data/http/EnvironmentRequestScope';
import type { Environment } from '@/domain/model/common';
import { resetEnvironmentState, type EnvironmentReset } from './resetEnvironmentState';
type EnvironmentContextValue = {
  environment: Environment;
  changeEnvironment: (environment: Environment) => void;
  resetToTest: () => void;
  registerReset: (reset: EnvironmentReset) => () => void;
  beginRequest: () => ReturnType<EnvironmentRequestScope['begin']>;
  isCurrentRequest: (sequence: number) => boolean;
  operationInProgress: boolean;
  setOperationInProgress: (value: boolean) => void;
};
const EnvironmentContext = createContext<EnvironmentContextValue | undefined>(undefined);
export function EnvironmentProvider({ children }: PropsWithChildren) {
  const [environment, setEnvironment] = useState<Environment>('test');
  const [operationInProgress, setOperationInProgress] = useState(false);
  const resets = useRef(new Set<EnvironmentReset>());
  const requests = useRef(new EnvironmentRequestScope());
  const resetConsumers = useCallback(() => resetEnvironmentState([...resets.current]), []);
  const registerReset = useCallback((reset: EnvironmentReset) => {
    resets.current.add(reset);
    return () => {
      resets.current.delete(reset);
    };
  }, []);
  const changeEnvironment = useCallback(
    (next: Environment) => {
      if (next === environment || operationInProgress) return;
      resetConsumers();
      requests.current.begin(next);
      setEnvironment(next);
    },
    [environment, operationInProgress, resetConsumers],
  );
  const resetToTest = useCallback(() => {
    resetConsumers();
    requests.current.begin('test');
    setOperationInProgress(false);
    setEnvironment('test');
  }, [resetConsumers]);
  const beginRequest = useCallback(() => requests.current.begin(environment), [environment]);
  const isCurrentRequest = useCallback(
    (sequence: number) => requests.current.isCurrent(sequence),
    [],
  );
  const value = useMemo(
    () => ({
      environment,
      operationInProgress,
      setOperationInProgress,
      changeEnvironment,
      resetToTest,
      registerReset,
      beginRequest,
      isCurrentRequest,
    }),
    [
      beginRequest,
      changeEnvironment,
      environment,
      isCurrentRequest,
      operationInProgress,
      registerReset,
      resetToTest,
    ],
  );
  return <EnvironmentContext.Provider value={value}>{children}</EnvironmentContext.Provider>;
}
export function useEnvironment() {
  const value = useContext(EnvironmentContext);
  if (!value) throw new Error('EnvironmentProvider no está disponible.');
  return value;
}
