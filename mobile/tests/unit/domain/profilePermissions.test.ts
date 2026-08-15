import { permissionsByProfile, permissionsForProfile } from '@/domain/policies/profilePermissions';

describe('permisos canónicos por perfil', () => {
  it('asigna al analista cada operación permitida por la matriz funcional', () => {
    expect(permissionsByProfile.analyst).toEqual([
      'applications:read',
      'credentials:issue',
      'credentials:regenerate',
      'credentials:deliver',
      'credentials:suspend',
      'credentials:reactivate',
      'management:write',
      'usage:read',
    ]);
  });

  it('añade revocación y auditoría al analista senior', () => {
    expect(permissionsByProfile.senior_analyst).toEqual([
      ...permissionsByProfile.analyst,
      'credentials:revoke',
      'audit:read',
    ]);
  });

  it('asigna los once permisos al administrador', () => {
    expect(permissionsByProfile.administrator).toEqual([
      ...permissionsByProfile.analyst,
      'credentials:revoke',
      'audit:read',
      'users:write',
    ]);
    expect(new Set(permissionsByProfile.administrator).size).toBe(11);
  });

  it('limita al auditor a la lectura de auditoría y devuelve copias mutables', () => {
    expect(permissionsByProfile.auditor).toEqual(['audit:read']);
    expect(permissionsForProfile('auditor')).not.toBe(permissionsByProfile.auditor);
  });
});
