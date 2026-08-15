import { fireEvent, render } from '@testing-library/react-native';
import { Button, Field } from '@/presentation/components/base';
import { EnvironmentBar } from '@/presentation/components/environment';
import { EnvironmentProvider } from '@/presentation/state/EnvironmentProvider';

describe('regresión de accesibilidad', () => {
  it('mantiene etiquetas, tabs y controles accesibles', async () => {
    const { getByLabelText, getAllByRole, getByRole } = await render(
      <EnvironmentProvider>
        <Field label="Motivo" />
        <Button title="Confirmar" onPress={() => undefined} />
        <EnvironmentBar />
      </EnvironmentProvider>,
    );
    expect(getByLabelText('Motivo')).toBeTruthy();
    expect(getByRole('button', { name: 'Confirmar' })).toBeTruthy();
    expect(getAllByRole('tab')).toHaveLength(2);
    fireEvent.press(getByRole('tab', { name: 'Producción' }));
    expect(getByRole('alert')).toBeTruthy();
  });
});
