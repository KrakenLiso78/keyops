import { managementContextPatchSchema } from '@/data/schemas/managementContext';

describe('contrato de contexto de gestión', () => {
  it('acepta campos opcionales normalizados', () => {
    expect(
      managementContextPatchSchema.parse({
        technicalContact: { name: ' Marta ', email: 'marta@example.invalid' },
        reason: ' Alta ',
        requestOrTicketId: ' REQ-10 ',
      }),
    ).toEqual({
      technicalContact: { name: 'Marta', email: 'marta@example.invalid' },
      reason: 'Alta',
      requestOrTicketId: 'REQ-10',
    });
  });

  it('rechaza valores vacíos declarados', () => {
    expect(() => managementContextPatchSchema.parse({ technicalContact: { name: ' ' } })).toThrow();
  });
});
