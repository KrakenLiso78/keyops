import { fireEvent, render, within } from '@testing-library/react-native';
import * as Clipboard from 'expo-clipboard';
import { StyleSheet } from 'react-native';
import { CopyableValue } from '@/presentation/components/CopyableValue';
import { colors } from '@/presentation/design-system';

jest.mock('expo-clipboard', () => ({
  setStringAsync: jest.fn(() => Promise.resolve()),
}));

const setStringAsync = Clipboard.setStringAsync as jest.MockedFunction<
  typeof Clipboard.setStringAsync
>;

describe('CopyableValue', () => {
  beforeEach(() => setStringAsync.mockClear());

  it.each([
    ['Copiar Client ID', 'cli_prod_84F2A91C'],
    ['Copiar enlace', 'https://delivery.example.test/7K9M2Q'],
  ])('copia exactamente el valor de %s', async (copyLabel, value) => {
    const { getByRole } = await render(<CopyableValue copyLabel={copyLabel} value={value} />);

    fireEvent.press(getByRole('button', { name: copyLabel }));

    expect(setStringAsync).toHaveBeenCalledTimes(1);
    expect(setStringAsync).toHaveBeenCalledWith(value);
  });

  it('superpone el rectángulo delantero opaco arriba y a la derecha', async () => {
    const { getByRole } = await render(
      <CopyableValue copyLabel="Copiar Client ID" value="cli_test_001" />,
    );
    const copyButton = getByRole('button', { name: 'Copiar Client ID' });
    const back = within(copyButton).getByTestId('copy-icon-back');
    const front = within(copyButton).getByTestId('copy-icon-front');
    const backStyle = StyleSheet.flatten(back.props.style);
    const frontStyle = StyleSheet.flatten(front.props.style);

    expect(frontStyle.backgroundColor).toBe(colors.canvas);
    expect(frontStyle.left).toBeGreaterThan(backStyle.left);
    expect(frontStyle.top).toBeLessThan(backStyle.top);
    expect(frontStyle.zIndex).toBeGreaterThan(backStyle.zIndex ?? 0);
  });

  it('adapta el relleno opaco del icono al fondo que lo contiene', async () => {
    const { getByTestId } = await render(
      <CopyableValue
        copyLabel="Copiar enlace"
        iconBackgroundColor={colors.sky}
        value="https://delivery.example.test/7K9M2Q"
      />,
    );

    expect(StyleSheet.flatten(getByTestId('copy-icon-front').props.style).backgroundColor).toBe(
      colors.sky,
    );
  });

  it('oculta la acción cuando no existe un valor copiable', async () => {
    const { getByText, queryByRole } = await render(
      <CopyableValue copyLabel="Copiar Client ID" placeholder="Aún no disponible" />,
    );

    expect(getByText('Aún no disponible')).toBeTruthy();
    expect(queryByRole('button', { name: 'Copiar Client ID' })).toBeNull();
  });
});
