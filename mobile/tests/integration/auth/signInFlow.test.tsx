import { fakeRepository } from '@/data/fake/FakeKeyOpsRepository';
describe('cobertura de auditoría P1', () => {
  it('registra acceso y operación', () => {
    const user = fakeRepository.signIn('analista');
    const receipt = fakeRepository.operate(user, 'app-001', 'test', 'issue');
    const events = fakeRepository.listAudit();
    expect(receipt.auditEventId).toBeTruthy();
    expect(events.some((event) => event.requestId === receipt.requestId)).toBe(true);
  });
});
