import { EnvironmentRequestScope } from '@/data/http/EnvironmentRequestScope';
describe('solicitudes por ambiente', () => {
  it('cancela e ignora la respuesta anterior', () => {
    const scope = new EnvironmentRequestScope();
    const test = scope.begin('test');
    const production = scope.begin('production');
    expect(test.signal.aborted).toBe(true);
    expect(scope.isCurrent(test.sequence)).toBe(false);
    expect(scope.isCurrent(production.sequence)).toBe(true);
  });
});
