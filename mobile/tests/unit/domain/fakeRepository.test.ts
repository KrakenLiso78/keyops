import { fakeRepository } from '@/data/fake/FakeKeyOpsRepository';

describe('adaptador fake', () => {
  it.each([
    ['aplicación', 'notificaciones JUDICIALES', 'app-001'],
    ['institución sin acento', 'malaga', 'app-013'],
    ['identificador', 'APP-002', 'app-002'],
    ['actor del historial', 'ana torres', 'app-002'],
    ['contacto técnico sin acento', 'pablo menendez', 'app-009'],
    ['solicitud', 'req-2026-002', 'app-002'],
    ['Client ID', 'CLI_TEST_6SR9', 'app-002'],
    ['rol', 'notificaciones', 'app-001'],
    ['estado visible', 'sin credenciales', 'app-001'],
    ['IP declarada', '10.20.2.40', 'app-002'],
  ])('busca por %s', (_field, query, expectedId) => {
    expect(fakeRepository.listApplications('test', query).map((app) => app.id)).toContain(
      expectedId,
    );
  });

  it('mantiene el ambiente como frontera de la búsqueda', () => {
    expect(fakeRepository.listApplications('test', 'Generalitat de Catalunya')).toEqual([]);
    expect(fakeRepository.listApplications('production', 'Generalitat de Catalunya')).toHaveLength(
      1,
    );
  });

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
