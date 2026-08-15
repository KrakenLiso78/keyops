import { fireEvent, render } from '@testing-library/react-native';
import ApplicationsScreen from '@/app/(protected)/applications';

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn() },
}));
jest.mock('@/presentation/state/AppProvider', () => {
  const signOut = jest.fn(async () => undefined);
  return {
    mockSignOut: signOut,
    useApp: () => ({
      environment: 'test',
      user: { displayName: 'Administradora', profile: 'administrator' },
      signOut,
    }),
  };
});
jest.mock('@/presentation/state/EnvironmentProvider', () => ({
  useEnvironment: () => ({
    environment: 'test',
    changeEnvironment: jest.fn(),
    registerReset: () => () => undefined,
  }),
}));

describe('navegación web visible', () => {
  const mockRouter = jest.requireMock('expo-router').router;
  const mockSignOut = jest.requireMock('@/presentation/state/AppProvider').mockSignOut;

  beforeEach(() => jest.clearAllMocks());

  it('asigna nombre, rol y recorrido a los controles del menú', async () => {
    const screen = render(<ApplicationsScreen />);
    fireEvent.press(screen.getByRole('button', { name: 'Abrir menú' }));

    fireEvent.press(screen.getByRole('button', { name: 'Abrir auditoría' }));
    expect(mockRouter.push).toHaveBeenCalledWith('/audit');
    fireEvent.press(screen.getByRole('button', { name: 'Gestionar usuarios autorizados' }));
    expect(mockRouter.push).toHaveBeenCalledWith('/users');
    fireEvent.press(screen.getByRole('button', { name: 'Cerrar sesión' }));
    await expect(mockSignOut).toHaveBeenCalled();
  });
});
