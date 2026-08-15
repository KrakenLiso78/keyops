import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { PropsWithChildren } from 'react';
import { DependenciesProvider } from '@/composition/DependenciesProvider';
import { createAppDependencies } from '@/composition/createAppDependencies';
import type { ApplicationRepository } from '@/domain/ports/ApplicationRepository';
import { useApplicationListController } from '@/presentation/controllers/useApplicationListController';
import { EnvironmentProvider } from '@/presentation/state/EnvironmentProvider';

const application = {
  id: 'app-1',
  name: 'Pago en Línea',
  institution: 'Ministerio de Salud',
  environment: 'test' as const,
  apiRole: 'Mensajes',
  declaredIps: [],
  credentialState: 'active' as const,
  lastChangedAt: '2026-08-15T09:00:00.000Z',
  updatedAt: '2026-08-15T09:00:00.000Z',
};

const wrapperFor = (applications: ApplicationRepository) => {
  const dependencies = { ...createAppDependencies('fake'), applications };
  return function Wrapper({ children }: PropsWithChildren) {
    return (
      <DependenciesProvider value={dependencies}>
        <EnvironmentProvider>{children}</EnvironmentProvider>
      </DependenciesProvider>
    );
  };
};

describe('controlador del inventario persistente', () => {
  it('expone loading y después los resultados filtrados', async () => {
    let resolve!: (value: Awaited<ReturnType<ApplicationRepository['list']>>) => void;
    const applications: ApplicationRepository = {
      list: jest.fn(
        () =>
          new Promise((done) => {
            resolve = done;
          }),
      ),
      get: jest.fn(),
      updateManagement: jest.fn(),
    };
    const { result } = renderHook(() => useApplicationListController('test'), {
      wrapper: wrapperFor(applications),
    });
    expect(result.current.status).toBe('loading');
    await act(async () => resolve({ items: [application], page: 1, pageSize: 20, total: 1 }));
    expect(result.current.status).toBe('success');
    expect(result.current.items).toEqual([application]);
  });

  it('conserva la consulta en vacío y permite reintentar un error', async () => {
    const list = jest
      .fn()
      .mockRejectedValueOnce(new Error('Persistencia no disponible'))
      .mockResolvedValue({ items: [], page: 1, pageSize: 20, total: 0 });
    const applications: ApplicationRepository = {
      list,
      get: jest.fn(),
      updateManagement: jest.fn(),
    };
    const { result } = renderHook(() => useApplicationListController('test'), {
      wrapper: wrapperFor(applications),
    });
    await waitFor(() => expect(result.current.status).toBe('error'));
    act(() => result.current.setQuery('sin coincidencias'));
    await waitFor(() => expect(result.current.status).toBe('success'));
    expect(result.current.query).toBe('sin coincidencias');
    expect(result.current.items).toEqual([]);
  });

  it('conecta filtros, orden y página sin polling', async () => {
    const list = jest.fn().mockResolvedValue({
      items: [application],
      page: 1,
      pageSize: 20,
      total: 21,
    });
    const applications: ApplicationRepository = {
      list,
      get: jest.fn(),
      updateManagement: jest.fn(),
    };
    const { result } = renderHook(() => useApplicationListController('test'), {
      wrapper: wrapperFor(applications),
    });
    await waitFor(() => expect(result.current.status).toBe('success'));
    act(() => result.current.setState('active'));
    await waitFor(() =>
      expect(list).toHaveBeenLastCalledWith('test', expect.objectContaining({ state: 'active' })),
    );
    act(() => result.current.setSort('institution'));
    await waitFor(() =>
      expect(list).toHaveBeenLastCalledWith(
        'test',
        expect.objectContaining({ sort: 'institution' }),
      ),
    );
    act(() => result.current.setPage(2));
    await waitFor(() =>
      expect(list).toHaveBeenLastCalledWith('test', expect.objectContaining({ page: 2 })),
    );
    expect(list).toHaveBeenCalledTimes(4);
  });
});
