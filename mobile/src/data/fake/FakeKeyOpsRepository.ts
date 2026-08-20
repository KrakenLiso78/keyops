import { fakeApplications, fakeUsers } from '@/data/fake/seed';
import { nextCredentialState } from '@/domain/policies/credentialTransitions';
import type {
  Application,
  AuditEvent,
  CredentialState,
  Environment,
  Receipt,
  User,
  UserProfile,
} from '@/domain/model/types';

let applications = [...fakeApplications];
let users = [...fakeUsers];
let events: AuditEvent[] = [];
const now = () => new Date().toISOString();
const id = () => Math.random().toString(36).slice(2, 10);

const credentialStateLabels: Record<CredentialState, string> = {
  no_credentials: 'Sin credenciales',
  active: 'Activa',
  suspended: 'Suspendida',
  rotated_inactive: 'Inactiva por rotación',
  revoked: 'Revocada',
};

function normalizeSearchValue(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('es')
    .trim();
}

function applicationMatches(app: Application, query: string) {
  const normalizedQuery = normalizeSearchValue(query);
  if (!normalizedQuery) return true;

  const authorizedValues = [
    app.id,
    app.name,
    app.institution,
    app.apiRole,
    app.technicalContact,
    app.requestOrTicketId,
    app.clientId,
    app.credentialState,
    credentialStateLabels[app.credentialState],
    ...app.declaredIps,
    ...(app.usedIps ?? []),
    ...(app.consumedServices ?? []),
    ...(app.credentialHistory?.map((entry) => entry.actorDisplayName) ?? []),
  ];

  return authorizedValues.some(
    (value) => value !== undefined && normalizeSearchValue(value).includes(normalizedQuery),
  );
}

function receipt(
  actor: User,
  operation: AuditEvent['operation'],
  environment: Environment,
  application?: Application,
  delivery = false,
): Receipt {
  const requestId = `req-${id()}`;
  const auditEventId = `aud-${id()}`;
  events = [
    {
      id: auditEventId,
      occurredAt: now(),
      actorDisplayName: actor.displayName,
      operation,
      environment,
      institution: application?.institution,
      application: application?.name,
      result: 'succeeded',
      requestId,
    },
    ...events,
  ];
  return {
    operationId: `op-${id()}`,
    requestId,
    auditEventId,
    result: 'succeeded',
    delivery: delivery
      ? {
          deliveryUrl: `https://delivery.example.invalid/${id()}`,
          otp: String(Math.floor(100000 + Math.random() * 900000)),
          otpExpiresAt: new Date(Date.now() + 120000).toISOString(),
        }
      : undefined,
  };
}

export const fakeRepository = {
  signIn(login: string): User {
    const user = users.find((candidate) => candidate.loginIdentifier === login);
    if (!user || !user.enabled) throw new Error('Usuario no autorizado o inactivo.');
    receipt(user, 'sign_in', 'test');
    return user;
  },
  listApplications(environment: Environment, query = ''): Application[] {
    return applications.filter(
      (app) => app.environment === environment && applicationMatches(app, query),
    );
  },
  getApplication(id: string, environment: Environment): Application | undefined {
    return applications.find((app) => app.id === id && app.environment === environment);
  },
  operate(
    actor: User,
    applicationId: string,
    environment: Environment,
    action: string,
    reason?: string,
  ): Receipt {
    const application = this.getApplication(applicationId, environment);
    if (!application) throw new Error('Aplicación no encontrada.');
    if (['suspend', 'reactivate', 'revoke'].includes(action) && !reason?.trim())
      throw new Error('El motivo es obligatorio.');
    if (action === 'delivery' && application.credentialState !== 'active')
      throw new Error('Solo se pueden entregar credenciales activas.');
    if (action !== 'delivery') {
      const credentialState: CredentialState = nextCredentialState(
        action,
        application.credentialState,
      );
      application.credentialState = credentialState;
      if (action === 'issue') application.credentialId ??= `cred_${environment}_${id()}`;
      application.clientId ??= `cli_${environment}_${id()}`;
      application.lastChangedAt = now();
      application.credentialHistory = [
        {
          state: credentialState,
          changedAt: application.lastChangedAt,
          actorDisplayName: actor.displayName,
        },
        ...(application.credentialHistory ?? []),
      ];
    }
    return receipt(
      actor,
      action as AuditEvent['operation'],
      environment,
      application,
      ['issue', 'regenerate', 'delivery'].includes(action),
    );
  },
  updateManagement(
    applicationId: string,
    environment: Environment,
    technicalContact?: string,
    requestOrTicketId?: string,
  ) {
    const app = this.getApplication(applicationId, environment);
    if (!app) throw new Error('Aplicación no encontrada.');
    app.technicalContact = technicalContact?.trim() || undefined;
    app.requestOrTicketId = requestOrTicketId?.trim() || undefined;
    app.lastChangedAt = now();
    return app;
  },
  listAudit(): AuditEvent[] {
    return events;
  },
  getUsage(applicationId: string, environment: Environment) {
    const application = this.getApplication(applicationId, environment);
    if (!application) throw new Error('Aplicación no encontrada.');
    if (application.messagesSent === undefined) {
      return {
        applicationId,
        environment,
        availability: 'no_data' as const,
        consumedServices: [],
        usedIps: [],
      };
    }
    return {
      applicationId,
      environment,
      availability: 'available' as const,
      messagesSent: application.messagesSent,
      consumedServices: application.consumedServices ?? [],
      usedIps: application.usedIps ?? [],
      lastConsumedAt: application.lastConsumedAt,
    };
  },
  listUsers(): User[] {
    return users;
  },
  updateUser(id: string, profile: UserProfile, enabled: boolean): User {
    const user = users.find((candidate) => candidate.id === id);
    if (!user) throw new Error('Usuario no encontrado.');
    user.profile = profile;
    user.enabled = enabled;
    return user;
  },
  createUser(input: Omit<User, 'id'>): User {
    if (users.some((candidate) => candidate.loginIdentifier === input.loginIdentifier))
      throw new Error('El identificador de acceso ya existe.');
    const user = { ...input, id: `u-${id()}` };
    users = [...users, user];
    return user;
  },
};
