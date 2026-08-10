import { runtimeConfig } from '@/composition/runtimeConfig';

describe('runtimeConfig', () => {
  it('uses a non-sensitive fake default', () =>
    expect(runtimeConfig.EXPO_PUBLIC_DATA_SOURCE).toBe('fake'));
});
