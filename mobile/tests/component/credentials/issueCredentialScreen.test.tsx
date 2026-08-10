import { render } from '@testing-library/react-native';
import {
  CredentialBadge,
  EmptyState,
  LoadingState,
  PersistentError,
  ProductionBanner,
} from '@/presentation/components/feedback';
describe('feedback de pantalla', () => {
  it('expone estados accesibles', async () => {
    const { getByText, getByLabelText } = await render(
      <>
        <LoadingState />
        <EmptyState message="Sin resultados" />
        <PersistentError message="Error persistente" />
        <CredentialBadge state="active" />
        <ProductionBanner />
      </>,
    );
    expect(getByText('Cargando…')).toBeTruthy();
    expect(getByText('Sin resultados')).toBeTruthy();
    expect(getByText('Error persistente')).toBeTruthy();
    expect(getByLabelText('Estado: active')).toBeTruthy();
  });
});
