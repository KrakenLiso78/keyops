import { render } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import { ApplicationDetailTitle } from '@/presentation/components/applications/ApplicationDetailTitle';
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

describe('cabecera del detalle de aplicación', () => {
  it('reserva una franja que impide que la decoración invada el título', async () => {
    const { getByTestId, getByText } = await render(<ApplicationDetailTitle />);
    const titleBlock = StyleSheet.flatten(
      getByTestId('application-detail-title-block').props.style,
    );
    const decorationStrip = StyleSheet.flatten(
      getByTestId('application-detail-decoration-strip', {
        includeHiddenElements: true,
      }).props.style,
    );

    expect(getByText('Detalle de aplicación')).toBeTruthy();
    expect(titleBlock.gap).toBeGreaterThan(0);
    expect(decorationStrip.minHeight).toBeGreaterThanOrEqual(40);
    expect(decorationStrip.overflow).toBe('hidden');
  });
});
