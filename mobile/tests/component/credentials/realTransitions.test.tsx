import { fireEvent, render, screen } from '@testing-library/react-native';
import {
  CredentialOperationFeedback,
  CredentialReasonForm,
} from '@/presentation/components/credentials';

describe('transiciones reales', () => {
  it('exige motivo y distingue confirmación de reconciliación', () => {
    const submit = jest.fn();
    const { rerender } = render(
      <CredentialReasonForm
        actionLabel="Suspender credencial real"
        reason=""
        onReasonChange={jest.fn()}
        onSubmit={submit}
      />,
    );
    fireEvent.press(screen.getByText('Suspender credencial real'));
    expect(submit).not.toHaveBeenCalled();

    rerender(
      <CredentialReasonForm
        actionLabel="Suspender credencial real"
        reason="Incidencia operativa"
        onReasonChange={jest.fn()}
        onSubmit={submit}
      />,
    );
    fireEvent.press(screen.getByText('Suspender credencial real'));
    expect(submit).toHaveBeenCalledTimes(1);
    const feedback = render(
      <CredentialOperationFeedback
        submitting={false}
        receipt={{
          operationId: 'operation-transition',
          requestId: 'request-transition',
          status: 'reconciliation_required',
          result: 'failed',
        }}
      />,
    );
    expect(feedback.toJSON()).toMatchObject({ props: { accessibilityRole: 'alert' } });
  });
});
