import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { tokens } from '@/presentation/design-system/tokens';
import type { CredentialDisplayState } from '@/domain/model/credential';
export function LoadingState({ label = 'Cargando…' }: { label?: string }) {
  return (
    <View accessibilityRole="progressbar" style={styles.box}>
      <ActivityIndicator color={tokens.colors.primary} />
      <Text>{label}</Text>
    </View>
  );
}
export function EmptyState({ message }: { message: string }) {
  return (
    <View accessibilityRole="text" style={styles.box}>
      <Text>{message}</Text>
    </View>
  );
}
export function PersistentError({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <View accessibilityRole="alert" style={[styles.box, styles.error]}>
      <Text>{message}</Text>
      {onRetry ? (
        <Text accessibilityRole="button" onPress={onRetry}>
          Reintentar
        </Text>
      ) : null}
    </View>
  );
}
export function CredentialBadge({ state }: { state: CredentialDisplayState }) {
  return (
    <Text
      accessibilityLabel={`Estado: ${state}`}
      style={[styles.badge, state === 'active' ? styles.active : styles.neutral]}
    >
      {state.replaceAll('_', ' ')}
    </Text>
  );
}
export function ProductionBanner() {
  return (
    <View accessibilityRole="alert" style={styles.production}>
      <Text>Producción: las acciones afectan al entorno real.</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  box: {
    minHeight: tokens.touchTarget,
    justifyContent: 'center',
    alignItems: 'center',
    gap: tokens.spacing.xs,
    padding: tokens.spacing.md,
  },
  error: { backgroundColor: '#fde0ec' },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: tokens.radius.sm,
    paddingHorizontal: tokens.spacing.sm,
    paddingVertical: tokens.spacing.xs,
    textTransform: 'capitalize',
  },
  active: { backgroundColor: '#d9f3e1', color: '#168a2f' },
  neutral: { backgroundColor: '#e6e0f5', color: '#5645d4' },
  production: { backgroundColor: '#fde0ec', padding: tokens.spacing.sm, minHeight: 32 },
});
