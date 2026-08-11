import type { PropsWithChildren } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, space } from '@/presentation/design-system';

export function Screen({ children, style }: PropsWithChildren<{ style?: ViewStyle }>) {
  return <SafeAreaView style={[styles.screen, style]}>{children}</SafeAreaView>;
}
export function Heading({ children, level = 2 }: PropsWithChildren<{ level?: 1 | 2 | 3 | 4 }>) {
  return <Text style={[styles.heading, styles[`heading${level}`]]}>{children}</Text>;
}
export function Body({ children }: PropsWithChildren) {
  return <Text style={styles.body}>{children}</Text>;
}
export const AppText = Body;
export function Field({ label, ...props }: TextInputProps & { label: string }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        style={styles.input}
        placeholderTextColor={colors.slate}
        {...props}
      />
    </View>
  );
}
export const TextField = Field;
export function Button({
  title,
  onPress,
  disabled = false,
  danger = false,
  variant = 'primary',
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  danger?: boolean;
  variant?: 'primary' | 'secondary' | 'ghost';
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        variant === 'secondary' && styles.secondaryButton,
        variant === 'ghost' && styles.ghostButton,
        danger && styles.danger,
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <Text
        style={[
          styles.buttonText,
          variant !== 'primary' && styles.secondaryButtonText,
          danger && styles.dangerButtonText,
        ]}
      >
        {title}
      </Text>
    </Pressable>
  );
}
export function Card({
  children,
  tone = 'plain',
  style,
}: PropsWithChildren<{
  tone?: 'plain' | 'sky' | 'lavender' | 'mint' | 'rose' | 'yellow';
  style?: ViewStyle;
}>) {
  return <View style={[styles.card, toneStyles[tone], style]}>{children}</View>;
}
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
    backgroundColor: colors.surface,
    padding: space.md,
    gap: space.md,
  },
  heading: { fontFamily: 'Inter', fontWeight: '700', color: colors.ink },
  heading1: { fontSize: 32, lineHeight: 38 },
  heading2: { fontSize: 26, lineHeight: 32 },
  heading3: { fontSize: 22, lineHeight: 28 },
  heading4: { fontSize: 18, lineHeight: 24 },
  body: { fontSize: 16, lineHeight: 24, color: colors.slate },
  field: { gap: space.xs },
  label: { fontSize: 14, fontWeight: '600', color: colors.ink },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: 12,
    backgroundColor: colors.canvas,
    paddingHorizontal: space.sm,
    fontSize: 16,
    color: colors.ink,
  },
  button: {
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.md,
  },
  secondaryButton: {
    backgroundColor: colors.canvas,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  ghostButton: { backgroundColor: 'transparent' },
  danger: { backgroundColor: colors.error },
  pressed: { opacity: 0.82 },
  disabled: { opacity: 0.45 },
  buttonText: { color: colors.canvas, fontWeight: '700', fontSize: 15 },
  secondaryButtonText: { color: colors.primary },
  dangerButtonText: { color: colors.canvas },
  card: {
    backgroundColor: colors.canvas,
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: 16,
    padding: space.md,
    gap: space.xs,
  },
});

const toneStyles = StyleSheet.create({
  plain: { backgroundColor: colors.canvas },
  sky: { backgroundColor: colors.sky, borderColor: '#cce7f2' },
  lavender: { backgroundColor: colors.lavender, borderColor: '#dcd5fa' },
  mint: { backgroundColor: colors.mint, borderColor: '#c6ead7' },
  rose: { backgroundColor: colors.rose, borderColor: '#f6ccd9' },
  yellow: { backgroundColor: colors.yellow, borderColor: '#f1e3ab' },
});
