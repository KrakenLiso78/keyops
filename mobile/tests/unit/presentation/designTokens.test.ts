import { tokens } from '@/presentation/design-system/tokens';
import { typography } from '@/presentation/design-system/typography';
describe('tokens de diseño', () => {
  it('conserva colores y espaciado de KeyOps', () => {
    expect(tokens.colors.primary).toBe('#5645d4');
    expect(tokens.spacing.md).toBe(16);
    expect(tokens.touchTarget).toBe(48);
  });
  it('usa tipografía legible', () => expect(typography.heading1.fontSize).toBe(32));
});
