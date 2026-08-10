import * as SecureStore from 'expo-secure-store';
import { SecureStoreSessionStore } from '@/data/session/SecureStoreSessionStore';
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));
describe('SecureStoreSessionStore', () => {
  const store = new SecureStoreSessionStore();
  it('solo guarda tokens y permite borrarlos', async () => {
    jest.mocked(SecureStore.getItemAsync).mockResolvedValue(JSON.stringify({ accessToken: 'a' }));
    await expect(store.read()).resolves.toEqual({ accessToken: 'a' });
    await store.write({ accessToken: 'a', refreshToken: 'r' });
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
      'keyops.session.tokens',
      expect.any(String),
    );
    await store.clear();
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('keyops.session.tokens');
  });
});
