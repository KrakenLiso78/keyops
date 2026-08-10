import { fakeRepository } from '@/data/fake/FakeKeyOpsRepository';
import { operateCredential } from '@/domain/use-cases/credentials/operateCredential';
describe('operaciones de credencial', () => {
  const analyst = fakeRepository.signIn('analista');
  const senior = fakeRepository.signIn('senior');
  it('emite y prepara entrega', () => {
    const result = operateCredential(analyst, 'test', 'app-001', 'issue');
    expect(result.delivery?.otp).toMatch(/^\d{6}$/);
  });
  it('exige motivo y aplica suspensión/reactivación', () => {
    expect(() => operateCredential(analyst, 'test', 'app-002', 'suspend')).toThrow('motivo');
    operateCredential(analyst, 'test', 'app-002', 'suspend', 'Mantenimiento');
    expect(
      operateCredential(analyst, 'test', 'app-002', 'reactivate', 'Vuelto a operar').result,
    ).toBe('succeeded');
  });
  it('revoca de forma terminal', () => {
    expect(operateCredential(senior, 'production', 'app-003', 'revoke', 'Incidente').result).toBe(
      'succeeded',
    );
    expect(() => operateCredential(senior, 'production', 'app-003', 'reactivate', 'No')).toThrow();
  });
});
