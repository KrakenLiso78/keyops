import { render } from '@testing-library/react-native';
import { Button, Field } from '@/presentation/components/base';
import { EnvironmentBar } from '@/presentation/components/environment';

jest.mock('@/presentation/state/AppProvider', () => ({
  useApp: () => ({ environment: 'production', setEnvironment: jest.fn() }),
}));

describe('regresión de accesibilidad', () => {
  it('mantiene etiquetas, tabs y controles accesibles', async () => {
    const { getByLabelText, getAllByRole, getByRole } = await render(
      <>
        <Field label="Motivo" />
        <Button title="Confirmar" onPress={() => undefined} />
        <EnvironmentBar />
      </>,
    );
    expect(getByLabelText('Motivo')).toBeTruthy();
    expect(getByRole('button', { name: 'Confirmar' })).toBeTruthy();
    expect(getAllByRole('tab')).toHaveLength(2);
    expect(getByRole('alert')).toBeTruthy();
  });
});
