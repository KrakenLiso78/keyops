import { fakeRepository } from '@/data/fake/FakeKeyOpsRepository';

describe('adaptador fake', () => {
  it('emite una credencial con entrega separada', () => {
    const user = fakeRepository.signIn('analista');
    const result = fakeRepository.operate(user, 'app-001', 'test', 'issue');
    expect(result.delivery?.deliveryUrl).toMatch(/^https:/);
    expect(result.delivery?.otp).toMatch(/^\d{6}$/);
  });
  it('rechaza una suspensión sin motivo', () => {
    const user = fakeRepository.signIn('analista');
    expect(() => fakeRepository.operate(user, 'app-002', 'test', 'suspend')).toThrow('motivo');
  });
});
