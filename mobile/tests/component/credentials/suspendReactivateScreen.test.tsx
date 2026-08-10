import { render } from '@testing-library/react-native';
import { Button, Field, Screen } from '@/presentation/components/base';
describe('controles base', () => {
  it('tiene etiquetas y objetivo táctil', async () => {
    const { getByLabelText, getByRole } = await render(
      <Screen>
        <Field label="Usuario" />
        <Button title="Acceder" onPress={() => undefined} />
      </Screen>,
    );
    expect(getByLabelText('Usuario')).toBeTruthy();
    expect(getByRole('button', { name: 'Acceder' })).toBeTruthy();
  });
});
