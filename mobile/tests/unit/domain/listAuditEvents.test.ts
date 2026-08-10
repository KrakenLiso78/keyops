import { fakeRepository } from '@/data/fake/FakeKeyOpsRepository';
import { listAuditEvents } from '@/domain/use-cases/audit/listAuditEvents';

describe('consulta de auditoría', () => {
  const auditor = fakeRepository.signIn('auditor');

  it('autoriza al auditor, filtra y pagina por datos visibles', () => {
    fakeRepository.signIn('analista');
    const page = listAuditEvents(auditor, { query: 'Ana', pageSize: 1 });
    expect(page).toMatchObject({ page: 1, pageSize: 1, total: expect.any(Number) });
    expect(page.items[0]?.actorDisplayName).toBe('Ana Torres');
  });

  it('rechaza la consulta al analista', () => {
    expect(() => listAuditEvents(fakeRepository.signIn('analista'))).toThrow('permiso');
  });
});
