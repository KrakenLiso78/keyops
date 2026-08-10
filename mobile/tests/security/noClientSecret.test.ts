import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
describe('sin Client Secret', () => {
  it('no declara secretos en los tipos ni fixtures móviles', () => {
    const root = resolve(__dirname, '../..');
    const source = [
      readFileSync(resolve(root, 'src/domain/model/credential.ts'), 'utf8'),
      readFileSync(resolve(root, 'src/data/fake/seed.ts'), 'utf8'),
    ].join('\n');
    expect(source).not.toMatch(/clientSecret/i);
  });
});
