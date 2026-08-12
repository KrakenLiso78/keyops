import { fireEvent, render } from '@testing-library/react-native';
import ApplicationsScreen from '@/app/(protected)/applications';
import { AppProvider } from '@/presentation/state/AppProvider';

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn() },
}));

describe('inventario de aplicaciones', () => {
  it('filtra desde una única línea por campos operativos y sin distinguir acentos', async () => {
    const { getByLabelText, getByRole, getByText, queryByRole } = await render(
      <AppProvider>
        <ApplicationsScreen />
      </AppProvider>,
    );
    const search = getByLabelText('Buscar en aplicaciones');

    fireEvent.changeText(search, 'malaga');

    expect(search.props.value).toBe('malaga');
    expect(getByText('1 resultado')).toBeTruthy();
    expect(getByRole('button', { name: 'Abrir Tributos locales' })).toBeTruthy();
    expect(queryByRole('button', { name: 'Abrir Sede electrónica' })).toBeNull();
  });

  it('encuentra por el usuario registrado en el historial', async () => {
    const { getByLabelText, getByRole } = await render(
      <AppProvider>
        <ApplicationsScreen />
      </AppProvider>,
    );

    fireEvent.changeText(getByLabelText('Buscar en aplicaciones'), 'Ana Torres');

    expect(getByRole('button', { name: 'Abrir Sede electrónica' })).toBeTruthy();
  });

  it('conserva la consulta cuando no hay coincidencias', async () => {
    const { getByLabelText, getByText } = await render(
      <AppProvider>
        <ApplicationsScreen />
      </AppProvider>,
    );
    const search = getByLabelText('Buscar en aplicaciones');

    fireEvent.changeText(search, 'registro inexistente');

    expect(search.props.value).toBe('registro inexistente');
    expect(getByText('No hay resultados para “registro inexistente”.')).toBeTruthy();
  });
});
