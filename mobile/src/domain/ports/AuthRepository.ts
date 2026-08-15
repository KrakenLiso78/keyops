import type { AuthenticatedUser, SessionTokens } from '@/domain/model/user';
export interface AuthRepository {
  readonly mode: 'credentials' | 'corporate';
  signIn(
    loginIdentifier: string,
    password: string,
  ): Promise<{ user: AuthenticatedUser; tokens: SessionTokens }>;
  restore(): Promise<AuthenticatedUser>;
  signOut(): Promise<void>;
  beginCorporateSignIn(returnPath?: string): Promise<void>;
}
