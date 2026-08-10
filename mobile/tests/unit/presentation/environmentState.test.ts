import { resetEnvironmentState } from '@/presentation/state/resetEnvironmentState';
describe('estado de ambiente', () => {
  it('reinicia datos dependientes al cambiar', () => {
    const reset = jest.fn();
    resetEnvironmentState([reset]);
    expect(reset).toHaveBeenCalledTimes(1);
  });
});
