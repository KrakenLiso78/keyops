import type { SessionTokens } from '@/domain/model/user';

export interface SessionStore {
  read(): Promise<SessionTokens | undefined>;
  write(tokens: SessionTokens): Promise<void>;
  clear(): Promise<void>;
}
