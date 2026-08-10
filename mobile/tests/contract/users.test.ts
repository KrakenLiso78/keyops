import { managementContextPatchSchema } from '@/data/schemas/managementContext';

describe('contrato de contexto de gestión', () => {
  it('acepta campos opcionales normalizados', () => {
    expect(
      managementContextPatchSchema.parse({
        technicalContact: ' Marta ',
        requestOrTicketId: ' REQ-10 ',
      }),
    ).toEqual({ technicalContact: 'Marta', requestOrTicketId: 'REQ-10' });
  });

  it('rechaza valores vacíos declarados', () => {
    expect(() => managementContextPatchSchema.parse({ technicalContact: ' ' })).toThrow();
  });
});
