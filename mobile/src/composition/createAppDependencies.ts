import { fakeRepository } from '@/data/fake/FakeKeyOpsRepository';
import { FakeAuthRepository } from '@/data/fake/FakeAuthRepository';
import { FetchHttpClient } from '@/data/http/FetchHttpClient';
import { RestAuthRepository } from '@/data/repositories/RestAuthRepository';
import { RestApplicationRepository } from '@/data/repositories/RestApplicationRepository';
import { RestCredentialRepository } from '@/data/repositories/RestCredentialRepository';
import { RestAuditRepository } from '@/data/repositories/RestAuditRepository';
import { fakeApplicationRepository } from '@/data/fake/FakeApplicationRepository';
import { fakeAuditRepository } from '@/data/fake/FakeAuditRepository';
import type { ApplicationRepository } from '@/domain/ports/ApplicationRepository';
import type { CredentialRepository } from '@/domain/ports/CredentialRepository';
import { SecureStoreSessionStore } from '@/data/session/SecureStoreSessionStore';
import type { AuthRepository } from '@/domain/ports/AuthRepository';
import type { AuditRepository } from '@/domain/ports/AuditRepository';
import type { UserRepository } from '@/domain/ports/UserRepository';
import { RestUserRepository } from '@/data/repositories/RestUserRepository';
import { FakeUserRepository } from '@/data/fake/FakeUserRepository';
import { runtimeConfig } from './runtimeConfig';

export interface AppDependencies {
  dataSource: 'remote' | 'fake';
  sessionStore: SecureStoreSessionStore;
  auth: AuthRepository;
  applications: ApplicationRepository;
  credentials?: CredentialRepository;
  audit: AuditRepository;
  users: UserRepository;
  getWorkerMode: () => Promise<'fake' | 'real'>;
  setWorkerMode: (mode: 'fake' | 'real') => Promise<'fake' | 'real'>;
  reloadWorkerMode: () => Promise<'fake' | 'real'>;
  resetFakeData: () => Promise<void>;
  keyOps: typeof fakeRepository;
}
export function createAppDependencies(
  dataSource: 'remote' | 'fake' = runtimeConfig.EXPO_PUBLIC_DATA_SOURCE,
): AppDependencies {
  const sessionStore = new SecureStoreSessionStore();
  const http = new FetchHttpClient(
    runtimeConfig.EXPO_PUBLIC_API_BASE_URL,
    async () => (await sessionStore.read())?.accessToken,
  );
  const getWorkerMode = async () =>
    dataSource === 'remote'
      ? (await http.request<{ mode: 'fake' | 'real' }>('/v1/health')).mode
      : ('fake' as const);
  return {
    dataSource,
    sessionStore,
    auth:
      dataSource === 'remote'
        ? new RestAuthRepository(http, undefined, runtimeConfig.EXPO_PUBLIC_AUTH_MODE)
        : new FakeAuthRepository(),
    applications:
      dataSource === 'remote' ? new RestApplicationRepository(http) : fakeApplicationRepository,
    credentials:
      dataSource === 'remote' ? new RestCredentialRepository(http, getWorkerMode) : undefined,
    audit:
      dataSource === 'remote' ? new RestAuditRepository(http, getWorkerMode) : fakeAuditRepository,
    users: dataSource === 'remote' ? new RestUserRepository(http) : new FakeUserRepository(),
    getWorkerMode,
    setWorkerMode: async (mode) =>
      (
        await http.request<{ mode: 'fake' | 'real' }>('/v1/runtime-configuration', {
          method: 'PUT',
          body: JSON.stringify({ mode }),
        })
      ).mode,
    reloadWorkerMode: async () =>
      (
        await http.request<{ mode: 'fake' | 'real' }>('/v1/runtime-configuration/reload', {
          method: 'POST',
        })
      ).mode,
    resetFakeData: async () => {
      if (dataSource !== 'remote') throw new Error('El servidor de demostración no está activo.');
      await http.request('/v1/fake/reset', { method: 'POST' });
    },
    keyOps: fakeRepository,
  };
}
