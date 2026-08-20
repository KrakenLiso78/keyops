import { fireEvent, render } from '@testing-library/react-native';
import { AuditList, type AuditListProps } from '@/presentation/components/audit';

const event = {
  id: 'cmp-verified-1',
  schemaVersion: 2,
  occurredAt: '2026-08-15T12:00:00Z',
  actorUserId: 'auditor-1',
  operation: 'credential.issue.v2',
  resourceType: 'real_credential',
  applicationId: 'app-one',
  environment: 'production' as const,
  result: 'succeeded' as const,
  originIp: '203.0.113.29',
  requestId: 'request-mobile-compliance-001',
  integrity: 'verified' as const,
  retentionUntil: '2031-08-15T12:00:00Z',
};

function props(overrides: Partial<AuditListProps> = {}): AuditListProps {
  return {
    authorized: true,
    status: 'success',
    filters: {},
    items: [event],
    page: 1,
    canPrevious: false,
    setFrom: jest.fn(),
    setTo: jest.fn(),
    setApplicationId: jest.fn(),
    setActorUserId: jest.fn(),
    setResult: jest.fn(),
    next: jest.fn(),
    previous: jest.fn(),
    verifications: {},
    verifyEvent: jest.fn(),
    retry: jest.fn(),
    ...overrides,
  };
}

describe('auditoría de cumplimiento móvil', () => {
  it('muestra integridad, versión, retención y permite verificar el evento', () => {
    const verifyEvent = jest.fn();
    const screen = render(<AuditList {...props({ verifyEvent })} />);

    expect(screen.getByText('Íntegro')).toBeTruthy();
    expect(screen.getByText('Esquema v2')).toBeTruthy();
    expect(screen.getByText(/Hasta 15\/8\/2031/u)).toBeTruthy();
    fireEvent.press(screen.getByText('Verificar integridad'));
    expect(verifyEvent).toHaveBeenCalledWith(event.id);
  });

  it('mantiene filtros y estados vacío y error sin exponer eventos', () => {
    const empty = render(<AuditList {...props({ items: [] })} />);
    expect(empty.getByText('No hay eventos que coincidan con los filtros aplicados.')).toBeTruthy();
    empty.unmount();

    const failed = render(
      <AuditList {...props({ status: 'error', items: [], error: 'Integridad no disponible' })} />,
    );
    expect(failed.getByText('Integridad no disponible')).toBeTruthy();
    expect(failed.getByLabelText('Aplicación')).toBeTruthy();
  });

  it('destaca una verificación fallida de forma persistente', () => {
    const screen = render(
      <AuditList
        {...props({
          verifications: {
            [event.id]: {
              status: 'success',
              result: {
                eventId: event.id,
                status: 'failed',
                verifiedAt: '2026-08-15T12:30:00Z',
                retentionUntil: event.retentionUntil,
              },
            },
          },
        })}
      />,
    );
    expect(screen.getByText('Integridad fallida')).toBeTruthy();
  });
});
