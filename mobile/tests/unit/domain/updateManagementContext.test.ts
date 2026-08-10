import { fakeRepository } from '@/data/fake/FakeKeyOpsRepository';
import { updateManagementContext } from '@/domain/use-cases/applications/updateManagementContext';

describe('actualización de contexto de gestión', () => {
  it('normaliza y guarda los datos independientes del motivo de operación', () => {
    expect(
      updateManagementContext('test', 'app-001', {
        technicalContact: ' Laura ',
        requestOrTicketId: ' REQ-77 ',
      }),
    ).toMatchObject({ technicalContact: 'Laura', requestOrTicketId: 'REQ-77' });
  });

  it('permite limpiar los campos opcionales', () => {
    updateManagementContext('test', 'app-001', {});
    expect(fakeRepository.getApplication('app-001', 'test')).toMatchObject({
      technicalContact: undefined,
      requestOrTicketId: undefined,
    });
  });
});
