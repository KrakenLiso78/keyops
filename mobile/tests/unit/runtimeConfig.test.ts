import { runtimeConfig } from '@/composition/runtimeConfig';

describe('runtimeConfig', () => {
  it('uses the persistent remote source by default', () =>
    expect(runtimeConfig.EXPO_PUBLIC_DATA_SOURCE).toBe('remote'));

  it('uses demo credentials unless corporate identity is explicitly configured', () =>
    expect(runtimeConfig.EXPO_PUBLIC_AUTH_MODE).toBe('credentials'));
});
