import type {
  Application,
  CredentialHistoryEntry,
  CredentialState,
  Environment,
  User,
} from '@/domain/model/types';

export const fakeUsers: User[] = [
  {
    id: 'u-1',
    displayName: 'Ana Torres',
    loginIdentifier: 'analista',
    profile: 'analyst',
    enabled: true,
  },
  {
    id: 'u-2',
    displayName: 'Sergio Vidal',
    loginIdentifier: 'senior',
    profile: 'senior_analyst',
    enabled: true,
  },
  {
    id: 'u-3',
    displayName: 'Lucía Moreno',
    loginIdentifier: 'admin',
    profile: 'administrator',
    enabled: true,
  },
  {
    id: 'u-4',
    displayName: 'Elena Ruiz',
    loginIdentifier: 'auditor',
    profile: 'auditor',
    enabled: true,
  },
];

const baseApplications: Application[] = [
  {
    id: 'app-001',
    name: 'Notificaciones judiciales',
    institution: 'Ayuntamiento de Sevilla',
    environment: 'test',
    apiRole: 'Notificaciones',
    declaredIps: ['10.20.1.12'],
    technicalContact: 'María López',
    requestOrTicketId: 'REQ-2026-001',
    credentialState: 'no_credentials',
    lastChangedAt: '2026-08-10T08:30:00Z',
    credentialHistory: [{ state: 'no_credentials', changedAt: '2026-08-10T08:30:00Z' }],
  },
  {
    id: 'app-002',
    name: 'Sede electrónica',
    institution: 'Comunidad de Madrid',
    environment: 'test',
    apiRole: 'Consulta',
    declaredIps: ['10.20.2.40'],
    technicalContact: 'Javier Sánchez',
    requestOrTicketId: 'REQ-2026-002',
    credentialState: 'active',
    clientId: 'cli_test_6sR9',
    lastChangedAt: '2026-08-09T15:20:00Z',
    credentialHistory: [
      {
        state: 'active',
        changedAt: '2026-08-09T15:20:00Z',
        actorDisplayName: 'Ana Torres',
      },
      { state: 'rotated_inactive', changedAt: '2026-07-24T10:44:00Z' },
      { state: 'no_credentials', changedAt: '2026-07-20T09:15:00Z' },
    ],
    messagesSent: 1240,
    consumedServices: ['Consulta', 'Notificación'],
    usedIps: ['10.20.2.40'],
    lastConsumedAt: '2026-08-10T07:50:00Z',
  },
  {
    id: 'app-003',
    name: 'Registro municipal',
    institution: 'Ayuntamiento de Valencia',
    environment: 'production',
    apiRole: 'Notificaciones',
    declaredIps: ['172.18.0.10'],
    technicalContact: 'Carlos Pérez',
    requestOrTicketId: 'REQ-2026-003',
    credentialState: 'suspended',
    clientId: 'cli_prod_4dX1',
    lastChangedAt: '2026-08-08T10:10:00Z',
    credentialHistory: [
      {
        state: 'suspended',
        changedAt: '2026-08-08T10:10:00Z',
        actorDisplayName: 'Sergio Vidal',
      },
      { state: 'active', changedAt: '2026-07-30T11:30:00Z' },
      { state: 'no_credentials', changedAt: '2026-07-29T08:00:00Z' },
    ],
  },
];

type AdditionalApplication = {
  institution: string;
  name: string;
  environment: Environment;
  credentialState: CredentialState;
  apiRole: string;
  technicalContact: string;
};

const additionalApplications: AdditionalApplication[] = [
  {
    institution: 'Agencia Tributaria de Aragón',
    name: 'Intercambio tributario',
    environment: 'test',
    credentialState: 'active',
    apiRole: 'Consulta',
    technicalContact: 'Laura Gil',
  },
  {
    institution: 'Diputación de Barcelona',
    name: 'Gestión de expedientes',
    environment: 'test',
    credentialState: 'revoked',
    apiRole: 'Tramitación',
    technicalContact: 'Marc Ferrer',
  },
  {
    institution: 'Junta de Andalucía',
    name: 'Carpeta ciudadana',
    environment: 'test',
    credentialState: 'rotated_inactive',
    apiRole: 'Consulta',
    technicalContact: 'Rocío Martín',
  },
  {
    institution: 'Gobierno de Canarias',
    name: 'Registro electrónico',
    environment: 'test',
    credentialState: 'suspended',
    apiRole: 'Registro',
    technicalContact: 'Daniel Suárez',
  },
  {
    institution: 'Ayuntamiento de Zaragoza',
    name: 'Padrón municipal',
    environment: 'test',
    credentialState: 'no_credentials',
    apiRole: 'Consulta',
    technicalContact: 'Irene Calvo',
  },
  {
    institution: 'Principado de Asturias',
    name: 'Notificaciones administrativas',
    environment: 'test',
    credentialState: 'active',
    apiRole: 'Notificaciones',
    technicalContact: 'Pablo Menéndez',
  },
  {
    institution: 'Diputación Foral de Bizkaia',
    name: 'Recaudación ejecutiva',
    environment: 'test',
    credentialState: 'suspended',
    apiRole: 'Tramitación',
    technicalContact: 'Ane Arrieta',
  },
  {
    institution: 'Universidad de Sevilla',
    name: 'Sede universitaria',
    environment: 'test',
    credentialState: 'revoked',
    apiRole: 'Registro',
    technicalContact: 'Álvaro Romero',
  },
  {
    institution: 'Servicio de Salud de Castilla-La Mancha',
    name: 'Comunicaciones clínicas',
    environment: 'test',
    credentialState: 'rotated_inactive',
    apiRole: 'Notificaciones',
    technicalContact: 'Nuria Molina',
  },
  {
    institution: 'Ayuntamiento de Málaga',
    name: 'Tributos locales',
    environment: 'test',
    credentialState: 'active',
    apiRole: 'Consulta',
    technicalContact: 'Víctor Rojas',
  },
  {
    institution: 'Generalitat de Catalunya',
    name: 'Canal de notificaciones',
    environment: 'production',
    credentialState: 'active',
    apiRole: 'Notificaciones',
    technicalContact: 'Marta Soler',
  },
  {
    institution: 'Xunta de Galicia',
    name: 'Registro autonómico',
    environment: 'production',
    credentialState: 'no_credentials',
    apiRole: 'Registro',
    technicalContact: 'Brais Varela',
  },
  {
    institution: 'Gobierno de Navarra',
    name: 'Carpeta fiscal',
    environment: 'production',
    credentialState: 'suspended',
    apiRole: 'Consulta',
    technicalContact: 'Leire Etxeberria',
  },
  {
    institution: 'Ayuntamiento de Bilbao',
    name: 'Sede municipal',
    environment: 'production',
    credentialState: 'revoked',
    apiRole: 'Tramitación',
    technicalContact: 'Jon Aguirre',
  },
  {
    institution: 'Junta de Castilla y León',
    name: 'Intermediación de datos',
    environment: 'production',
    credentialState: 'rotated_inactive',
    apiRole: 'Consulta',
    technicalContact: 'Beatriz Sanz',
  },
  {
    institution: 'Generalitat Valenciana',
    name: 'Notificación electrónica',
    environment: 'production',
    credentialState: 'active',
    apiRole: 'Notificaciones',
    technicalContact: 'Pau Navarro',
  },
  {
    institution: 'Cabildo de Tenerife',
    name: 'Gestión insular',
    environment: 'production',
    credentialState: 'no_credentials',
    apiRole: 'Tramitación',
    technicalContact: 'Elena Hernández',
  },
  {
    institution: 'Región de Murcia',
    name: 'Registro de apoderamientos',
    environment: 'production',
    credentialState: 'suspended',
    apiRole: 'Registro',
    technicalContact: 'Pedro Cánovas',
  },
  {
    institution: 'Ayuntamiento de Valladolid',
    name: 'Gestión tributaria',
    environment: 'production',
    credentialState: 'active',
    apiRole: 'Consulta',
    technicalContact: 'Sara Ortega',
  },
  {
    institution: 'Gobierno de Cantabria',
    name: 'Expedientes administrativos',
    environment: 'production',
    credentialState: 'revoked',
    apiRole: 'Tramitación',
    technicalContact: 'Diego Cobo',
  },
  {
    institution: 'Universidad de Granada',
    name: 'Administración electrónica',
    environment: 'production',
    credentialState: 'rotated_inactive',
    apiRole: 'Registro',
    technicalContact: 'Clara Carmona',
  },
];

const dayInMilliseconds = 24 * 60 * 60 * 1000;

function changedAt(sequence: number) {
  return new Date(Date.UTC(2026, 7, 11 - sequence, 9, 15)).toISOString();
}

function credentialHistory(
  state: CredentialState,
  stateChangedAt: string,
): CredentialHistoryEntry[] {
  const earlier = (days: number) =>
    new Date(Date.parse(stateChangedAt) - days * dayInMilliseconds).toISOString();
  const current = {
    state,
    changedAt: stateChangedAt,
    actorDisplayName: 'Ana Torres',
  };

  if (state === 'no_credentials') return [current];
  if (state === 'active') {
    return [current, { state: 'no_credentials', changedAt: earlier(6) }];
  }
  if (state === 'suspended') {
    return [
      current,
      { state: 'active', changedAt: earlier(4) },
      { state: 'no_credentials', changedAt: earlier(10) },
    ];
  }
  if (state === 'rotated_inactive') {
    return [
      current,
      { state: 'active', changedAt: earlier(7) },
      { state: 'no_credentials', changedAt: earlier(15) },
    ];
  }
  return [
    current,
    { state: 'suspended', changedAt: earlier(2) },
    { state: 'active', changedAt: earlier(9) },
    { state: 'no_credentials', changedAt: earlier(18) },
  ];
}

function createAdditionalApplication(
  definition: AdditionalApplication,
  index: number,
): Application {
  const sequence = index + 4;
  const paddedSequence = String(sequence).padStart(3, '0');
  const stateChangedAt = changedAt(sequence);
  const ip = definition.environment === 'test' ? `10.20.${sequence}.10` : `172.18.${sequence}.10`;
  const hasCredentials = definition.credentialState !== 'no_credentials';

  return {
    id: `app-${paddedSequence}`,
    name: definition.name,
    institution: definition.institution,
    environment: definition.environment,
    apiRole: definition.apiRole,
    declaredIps: [ip],
    technicalContact: definition.technicalContact,
    requestOrTicketId: `REQ-2026-${paddedSequence}`,
    credentialState: definition.credentialState,
    clientId: hasCredentials
      ? `cli_${definition.environment === 'test' ? 'test' : 'prod'}_${paddedSequence}`
      : undefined,
    lastChangedAt: stateChangedAt,
    credentialHistory: credentialHistory(definition.credentialState, stateChangedAt),
    messagesSent: hasCredentials ? sequence * 137 : undefined,
    consumedServices: hasCredentials
      ? Array.from(new Set([definition.apiRole, 'Consulta']))
      : undefined,
    usedIps: hasCredentials ? [ip] : undefined,
    lastConsumedAt: hasCredentials ? stateChangedAt : undefined,
  };
}

export const fakeApplications: Application[] = [
  ...baseApplications,
  ...additionalApplications.map(createAdditionalApplication),
];
