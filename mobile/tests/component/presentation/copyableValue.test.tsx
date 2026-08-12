import { fireEvent, render, within } from '@testing-library/react-native';
import * as Clipboard from 'expo-clipboard';
import { CopyableValue } from '@/presentation/components/CopyableValue';

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

  it('representa copiar mediante dos rectángulos superpuestos', async () => {
    const { getByRole } = await render(
      <CopyableValue copyLabel="Copiar Client ID" value="cli_test_001" />,
    );
    const copyButton = getByRole('button', { name: 'Copiar Client ID' });

    expect(within(copyButton).getByTestId('copy-icon-back')).toBeTruthy();
    expect(within(copyButton).getByTestId('copy-icon-front')).toBeTruthy();
  });

  it('oculta la acción cuando no existe un valor copiable', async () => {
    const { getByText, queryByRole } = await render(
      <CopyableValue copyLabel="Copiar Client ID" placeholder="Aún no disponible" />,
    );

    expect(getByText('Aún no disponible')).toBeTruthy();
    expect(queryByRole('button', { name: 'Copiar Client ID' })).toBeNull();
  });
});
