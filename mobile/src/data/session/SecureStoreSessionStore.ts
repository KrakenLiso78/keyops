import * as SecureStore from 'expo-secure-store';
import type { SessionTokens } from '@/domain/model/user';
const KEY = 'keyops.session.tokens';
export class SecureStoreSessionStore {
  async read(): Promise<SessionTokens | undefined> {
    const value = await SecureStore.getItemAsync(KEY);
    return value ? (JSON.parse(value) as SessionTokens) : undefined;
  }
  async write(tokens: SessionTokens): Promise<void> {
    await SecureStore.setItemAsync(KEY, JSON.stringify(tokens));
  }
  async clear(): Promise<void> {
    await SecureStore.deleteItemAsync(KEY);
  }
}
