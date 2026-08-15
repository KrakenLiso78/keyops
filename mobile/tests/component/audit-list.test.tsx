import { fireEvent, render } from '@testing-library/react-native';
import { AuditList, type AuditListProps } from '@/presentation/components/audit';

const actions = {
  setFrom: jest.fn(),
  setTo: jest.fn(),
  setInstitutionId: jest.fn(),
  setApplicationId: jest.fn(),
  setActorUserId: jest.fn(),
  setResult: jest.fn(),
  setPage: jest.fn(),
  retry: jest.fn(),
};

function props(overrides: Partial<AuditListProps> = {}): AuditListProps {
  return {
    authorized: true,
    status: 'success',
    filters: { actorUserId: 'user-auditor', result: 'rejected', page: 1 },
    items: [],
    total: 0,
    page: 1,
    pageSize: 20,
    ...actions,
    ...overrides,
  };
}

describe('lista de auditoría', () => {
  beforeEach(() => jest.clearAllMocks());

  it('mantiene visibles los filtros durante loading, vacío y error', () => {
    const loading = render(<AuditList {...props({ status: 'loading' })} />);
    expect(loading.getByText('Cargando auditoría…')).toBeTruthy();
    expect(loading.getByLabelText('Usuario').props.value).toBe('user-auditor');
    loading.unmount();

    const empty = render(<AuditList {...props()} />);
    expect(empty.getByText('No hay eventos que coincidan con los filtros aplicados.')).toBeTruthy();
    expect(empty.getByLabelText('Resultado: Rechazadas').props.accessibilityState.selected).toBe(
      true,
    );
    empty.unmount();

    const failed = render(
      <AuditList {...props({ status: 'error', error: 'Servicio no disponible' })} />,
    );
    fireEvent.press(failed.getByText('Reintentar'));
    expect(actions.retry).toHaveBeenCalledTimes(1);
    expect(failed.getByLabelText('Usuario')).toBeTruthy();
  });

  it('propaga los cinco filtros y el resultado seleccionado', () => {
    const screen = render(<AuditList {...props()} />);
    fireEvent.changeText(screen.getByLabelText('Desde'), '2026-08-15T00:00:00Z');
    fireEvent.changeText(screen.getByLabelText('Hasta'), '2026-08-16T00:00:00Z');
    fireEvent.changeText(screen.getByLabelText('Institución'), 'inst-1');
    fireEvent.changeText(screen.getByLabelText('Aplicación'), 'app-1');
    fireEvent.changeText(screen.getByLabelText('Usuario'), 'user-1');
    fireEvent.press(screen.getByLabelText('Resultado: Fallidas'));
    expect(actions.setFrom).toHaveBeenCalledWith('2026-08-15T00:00:00Z');
    expect(actions.setTo).toHaveBeenCalledWith('2026-08-16T00:00:00Z');
    expect(actions.setInstitutionId).toHaveBeenCalledWith('inst-1');
    expect(actions.setApplicationId).toHaveBeenCalledWith('app-1');
    expect(actions.setActorUserId).toHaveBeenCalledWith('user-1');
    expect(actions.setResult).toHaveBeenCalledWith('failed');
  });

  it('oculta filtros y datos a un usuario sin permiso', () => {
    const screen = render(<AuditList {...props({ authorized: false })} />);
    expect(screen.getByText('Acceso no autorizado')).toBeTruthy();
    expect(screen.queryByLabelText('Usuario')).toBeNull();
  });
});
