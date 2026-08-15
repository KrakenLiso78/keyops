import { fireEvent, render } from '@testing-library/react-native';
import { EnvironmentBar } from '@/presentation/components/environment';
import { EnvironmentProvider } from '@/presentation/state/EnvironmentProvider';

describe('identificación del ambiente de demostración', () => {
  it('permanece visible y anuncia el ambiente activo', () => {
    const screen = render(
      <EnvironmentProvider>
        <EnvironmentBar />
      </EnvironmentProvider>,
    );

    expect(screen.getByText('AMBIENTE DE DEMOSTRACIÓN')).toBeTruthy();
    expect(screen.getByLabelText('Ambiente activo: Pruebas de demostración')).toBeTruthy();

    fireEvent.press(screen.getByRole('tab', { name: 'Producción' }));

    expect(screen.getByLabelText('Ambiente activo: Producción de demostración')).toBeTruthy();
    expect(screen.getByRole('alert')).toBeTruthy();
  });
});
