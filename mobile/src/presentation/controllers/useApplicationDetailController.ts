import { useCallback, useEffect, useReducer, useState } from 'react';
import { useDependencies } from '@/composition/DependenciesProvider';
import type { Application, Environment } from '@/domain/model/types';
import { queryReducer } from '@/presentation/state/queryReducer';
import { useEnvironment } from '@/presentation/state/EnvironmentProvider';
import { getPersistentApplicationDetail } from '@/domain/use-cases/applications/getApplicationDetail';

export function useApplicationDetailController(environment: Environment, applicationId: string) {
  const { applications } = useDependencies();
  const { beginRequest, isCurrentRequest } = useEnvironment();
  const [refreshToken, setRefreshToken] = useState(0);
  const [result, dispatch] = useReducer(queryReducer<Application>, { status: 'idle' });

  useEffect(() => {
    const request = beginRequest();
    dispatch({ type: 'load' });
    getPersistentApplicationDetail(applications, environment, applicationId, request.signal)
      .then((data) => {
        if (isCurrentRequest(request.sequence)) dispatch({ type: 'success', data });
      })
      .catch((error: unknown) => {
        if (request.signal.aborted) return;
        if (isCurrentRequest(request.sequence)) {
          dispatch({
            type: 'error',
            error: error instanceof Error ? error.message : 'No se pudo cargar la aplicación.',
          });
        }
      });
  }, [applicationId, applications, beginRequest, environment, isCurrentRequest, refreshToken]);
  const retry = useCallback(() => setRefreshToken((value) => value + 1), []);

  return {
    ...result,
    application: result.data,
    retry,
  };
}
