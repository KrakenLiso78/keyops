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
import { runtimeConfig } from './runtimeConfig';

export interface AppDependencies {
  dataSource: 'remote' | 'fake';
  sessionStore: SecureStoreSessionStore;
  auth: AuthRepository;
  applications: ApplicationRepository;
  credentials?: CredentialRepository;
  audit: AuditRepository;
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
  return {
    dataSource,
    sessionStore,
    auth: dataSource === 'remote' ? new RestAuthRepository(http) : new FakeAuthRepository(),
    applications:
      dataSource === 'remote' ? new RestApplicationRepository(http) : fakeApplicationRepository,
    credentials: dataSource === 'remote' ? new RestCredentialRepository(http) : undefined,
    audit: dataSource === 'remote' ? new RestAuditRepository(http) : fakeAuditRepository,
    keyOps: fakeRepository,
  };
}
