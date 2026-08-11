import { existsSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
describe('activos de marca', () => {
  it('incluye Inter y logo', () => {
    const root = resolve(__dirname, '../../..');
    expect(existsSync(resolve(root, 'assets/fonts/Inter-Variable.ttf'))).toBe(true);
    expect(existsSync(resolve(root, 'assets/fonts/LICENSE.txt'))).toBe(true);
    expect(statSync(resolve(root, 'assets/images/keyops-logo.png')).size).toBeGreaterThan(0);
    expect(statSync(resolve(root, 'assets/images/login-hero-v4.png')).size).toBeGreaterThan(0);
    expect(statSync(resolve(root, 'assets/images/keyops-compact-v4.png')).size).toBeGreaterThan(0);
  });
});
