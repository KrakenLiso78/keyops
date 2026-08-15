import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import type { SessionTokens } from '@/domain/model/user';
const KEY = 'keyops.session.tokens';
let volatileWebTokens: SessionTokens | undefined;
export class SecureStoreSessionStore {
  async read(): Promise<SessionTokens | undefined> {
    if (Platform.OS === 'web') return volatileWebTokens;
    const value = await SecureStore.getItemAsync(KEY);
    return value ? (JSON.parse(value) as SessionTokens) : undefined;
  }
  async write(tokens: SessionTokens): Promise<void> {
    if (Platform.OS === 'web') {
      volatileWebTokens = { ...tokens };
      return;
    }
    await SecureStore.setItemAsync(KEY, JSON.stringify(tokens));
  }
  async clear(): Promise<void> {
    if (Platform.OS === 'web') {
      volatileWebTokens = undefined;
      return;
    }
    await SecureStore.deleteItemAsync(KEY);
  }
}
