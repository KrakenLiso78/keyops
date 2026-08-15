import { fireEvent, render, screen } from '@testing-library/react-native';
import { RevokeConfirmation } from '@/presentation/components/credentials/RevokeConfirmation';

describe('confirmación de revocación', () => {
  it('requires two explicit steps and hides actions once revoked', () => {
    const onConfirm = jest.fn();
    const view = render(<RevokeConfirmation onConfirm={onConfirm} />);
    fireEvent.press(screen.getByText('Revisar revocación'));
    expect(onConfirm).not.toHaveBeenCalled();
    fireEvent.press(screen.getByText('Confirmar revocación'));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('Confirmar revocación')).toBeNull();

    view.rerender(<RevokeConfirmation onConfirm={onConfirm} revoked />);
    expect(screen.queryByText('Revisar revocación')).toBeNull();
    expect(screen.getByText('La credencial está revocada definitivamente.')).toBeTruthy();
  });
});
