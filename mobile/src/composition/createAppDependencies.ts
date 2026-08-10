import { fakeRepository } from '@/data/fake/FakeKeyOpsRepository';
import { SecureStoreSessionStore } from '@/data/session/SecureStoreSessionStore';
import { runtimeConfig } from './runtimeConfig';

export interface AppDependencies {
  dataSource: 'fake';
  sessionStore: SecureStoreSessionStore;
  keyOps: typeof fakeRepository;
}
export function createAppDependencies(): AppDependencies {
  return {
    dataSource: runtimeConfig.EXPO_PUBLIC_DATA_SOURCE,
    sessionStore: new SecureStoreSessionStore(),
    keyOps: fakeRepository,
  };
}
