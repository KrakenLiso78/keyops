import { fireEvent, render, waitFor } from '@testing-library/react-native';
import type { PropsWithChildren } from 'react';
import { Text } from 'react-native';
import { DependenciesProvider } from '@/composition/DependenciesProvider';
import { createAppDependencies } from '@/composition/createAppDependencies';
import type { ApplicationRepository } from '@/domain/ports/ApplicationRepository';
import { useApplicationListController } from '@/presentation/controllers/useApplicationListController';
import { EnvironmentProvider } from '@/presentation/state/EnvironmentProvider';
import { CorporateCatalogError } from '@/presentation/components/applications/CorporateCatalogStatus';

function Probe() {
  const controller = useApplicationListController('test');
  return (
    <>
      <Text>{controller.status}</Text>
      <Text>{controller.error ?? ''}</Text>
      {controller.items.map((application) => (
        <Text key={application.id}>{application.name}</Text>
      ))}
    </>
  );
}

function wrapper(applications: ApplicationRepository) {
  const dependencies = { ...createAppDependencies('fake'), applications };
  return function Wrapper({ children }: PropsWithChildren) {
    return (
      <DependenciesProvider value={dependencies}>
        <EnvironmentProvider>{children}</EnvironmentProvider>
      </DependenciesProvider>
    );
  };
}

describe('inventario corporativo sin fallback', () => {
  it('muestra loading y después la indisponibilidad sin aplicaciones demo', async () => {
    const applications: ApplicationRepository = {
      list: jest.fn().mockRejectedValue(new Error('Catálogo corporativo no disponible')),
      get: jest.fn(),
      updateManagement: jest.fn(),
    };
    const screen = render(<Probe />, { wrapper: wrapper(applications) });
    expect(screen.getByText('loading')).toBeTruthy();
    await waitFor(() => expect(screen.getByText('error')).toBeTruthy());
    expect(screen.getByText('Catálogo corporativo no disponible')).toBeTruthy();
    expect(screen.queryByText('Sede electrónica')).toBeNull();
    expect(screen.queryByText('Pago en Línea')).toBeNull();
  });

  it('explica que no sustituye la fuente corporativa y permite reintentar', () => {
    const retry = jest.fn();
    const screen = render(
      <CorporateCatalogError message="Datos externos inválidos" onRetry={retry} />,
    );
    expect(screen.getByText('Catálogo corporativo no disponible')).toBeTruthy();
    expect(
      screen.getByText('No se mostrarán datos de demostración como sustitución.'),
    ).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Reintentar catálogo' }));
    expect(retry).toHaveBeenCalledTimes(1);
  });
});
