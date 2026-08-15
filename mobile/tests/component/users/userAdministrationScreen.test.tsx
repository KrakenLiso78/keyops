import { fireEvent, render } from '@testing-library/react-native';
import { UserCard } from '@/presentation/components/users';

const user = {
  id: 'user-2',
  corporateIssuer: 'https://identity.example.test',
  corporateSubject: 'subject-2',
  displayName: 'Corporate User',
  profile: 'analyst' as const,
  enabled: true,
  permissions: ['applications:read' as const],
  updatedAt: '2026-08-15T10:00:00.000Z',
};

describe('tarjeta de administración corporativa', () => {
  it('muestra identidad, perfil y solicita el cambio al controlador', () => {
    const onUpdate = jest.fn();
    const screen = render(<UserCard user={user} onUpdate={onUpdate} />);
    expect(screen.getByText('subject-2')).toBeTruthy();
    expect(screen.getByText('https://identity.example.test')).toBeTruthy();
    fireEvent.press(screen.getByRole('radio', { name: 'Auditor' }));
    expect(onUpdate).toHaveBeenCalledWith('auditor', true);
  });

  it('bloquea la autoedición en la presentación', () => {
    const onUpdate = jest.fn();
    const screen = render(<UserCard user={user} disabled onUpdate={onUpdate} />);
    fireEvent.press(screen.getByRole('radio', { name: 'Admin' }));
    expect(onUpdate).not.toHaveBeenCalled();
  });
});
