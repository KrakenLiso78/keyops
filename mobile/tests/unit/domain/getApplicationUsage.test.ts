import { getApplicationUsage } from '@/domain/use-cases/usage/getApplicationUsage';

describe('consulta de uso', () => {
  it('devuelve la proyección fake sin agregar valores locales', () => {
    expect(getApplicationUsage('test', 'app-002')).toMatchObject({
      availability: 'available',
      messagesSent: 1240,
      consumedServices: ['Consulta', 'Notificación'],
    });
  });

  it('distingue ausencia de datos de un cero de consumo', () => {
    const usage = getApplicationUsage('test', 'app-001');
    expect(usage.availability).toBe('no_data');
    expect(usage).not.toHaveProperty('messagesSent');
  });
});
