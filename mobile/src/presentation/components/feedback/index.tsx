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
  const labels: Record<CredentialDisplayState, string> = {
    active: 'Activa',
    suspended: 'Suspendida',
    no_credentials: 'Sin credenciales',
    rotated_inactive: 'Inactiva por rotación',
    revoked: 'Revocada',
  };
  return (
    <Text
      accessibilityLabel={`Estado: ${state}`}
      style={[
        styles.badge,
        state === 'active' && styles.active,
        state === 'suspended' && styles.suspended,
        state === 'revoked' && styles.revoked,
        !['active', 'suspended', 'revoked'].includes(state) && styles.neutral,
      ]}
    >
      {labels[state]}
    </Text>
  );
}
export function ProductionBanner() {
  return (
    <View accessibilityRole="alert" style={styles.production}>
      <Text style={styles.productionText}>
        Estás operando en PRODUCCIÓN. Confirma cada acción antes de continuar.
      </Text>
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
  suspended: { backgroundColor: '#fff6d8', color: '#b54708' },
  revoked: { backgroundColor: '#fde8ef', color: '#c62828' },
  neutral: { backgroundColor: '#e6e0f5', color: '#5645d4' },
  production: { backgroundColor: '#fde0ec', padding: tokens.spacing.sm, minHeight: 32 },
  productionText: { color: tokens.colors.error, fontWeight: '600' },
});
