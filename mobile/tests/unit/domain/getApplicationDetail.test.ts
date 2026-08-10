import { getApplicationDetail } from '@/domain/use-cases/applications/getApplicationDetail';
describe('getApplicationDetail', () => {
  it('devuelve detalle seguro o 404', () => {
    expect(getApplicationDetail('test', 'app-002').clientId).toBeTruthy();
    expect(() => getApplicationDetail('test', 'none')).toThrow('no encontrada');
  });
});
