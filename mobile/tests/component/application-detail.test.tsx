import { act, renderHook } from '@testing-library/react-native';
import type { PropsWithChildren } from 'react';
import { DependenciesProvider } from '@/composition/DependenciesProvider';
import { createAppDependencies } from '@/composition/createAppDependencies';
import type { ApplicationRepository } from '@/domain/ports/ApplicationRepository';
import { useApplicationDetailController } from '@/presentation/controllers/useApplicationDetailController';
import { EnvironmentProvider } from '@/presentation/state/EnvironmentProvider';

describe('detalle persistente de aplicación', () => {
  it('muestra el modelo allowlist sin ningún Client Secret', async () => {
    const application = {
      id: 'app-1',
      name: 'Pago en Línea',
      institution: 'Ministerio de Salud',
      environment: 'test' as const,
      apiRole: 'Mensajes',
      declaredIps: ['10.1.2.3'],
      technicalContact: 'Ana Ruiz',
      credentialState: 'active' as const,
      clientId: 'client-public-id',
      lastChangedAt: '2026-08-15T09:00:00.000Z',
      updatedAt: '2026-08-15T09:00:00.000Z',
    };
    const applications: ApplicationRepository = {
      list: jest.fn(),
      get: jest.fn().mockResolvedValue(application),
      updateManagement: jest.fn(),
    };
    const dependencies = { ...createAppDependencies('fake'), applications };
    const wrapper = ({ children }: PropsWithChildren) => (
      <DependenciesProvider value={dependencies}>
        <EnvironmentProvider>{children}</EnvironmentProvider>
      </DependenciesProvider>
    );
    const { result } = renderHook(() => useApplicationDetailController('test', 'app-1'), {
      wrapper,
    });
    await act(async () => Promise.resolve());
    expect(result.current.application).toEqual(application);
    expect(JSON.stringify(result.current.application)).not.toMatch(/clientSecret|password|otp/u);
  });
});
