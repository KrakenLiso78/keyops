import type { PropsWithChildren } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { CredentialState, Environment } from '@/domain/model/types';
import { colors, space } from '@/presentation/design-system';

const stateContent: Record<CredentialState, { label: string; background: string; color: string }> =
  {
    active: { label: 'Activa', background: colors.mint, color: colors.success },
    suspended: { label: 'Suspendida', background: colors.yellow, color: colors.warning },
    no_credentials: { label: 'Sin credenciales', background: colors.muted, color: colors.slate },
    rotated_inactive: {
      label: 'Inactiva por rotación',
      background: colors.lavender,
      color: colors.primaryDeep,
    },
    revoked: { label: 'Revocada', background: colors.rose, color: colors.error },
  };

export function AppHeader({ onMenu, onSignOut }: { onMenu?: () => void; onSignOut?: () => void }) {
  return (
    <View style={styles.header}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Abrir menú"
        onPress={onMenu}
        style={styles.iconButton}
      >
        <Text style={styles.menuIcon}>☰</Text>
      </Pressable>
      <View style={styles.brandMark} />
      <Text style={styles.brand}>
        Key<Text style={styles.brandAccent}>Ops</Text>
      </Text>
      <View style={styles.headerSpacer} />
      {onSignOut ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Cerrar sesión"
          onPress={onSignOut}
          style={styles.signOut}
        >
          <Text style={styles.signOutText}>Salir</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function BackHeader({ onBack }: { onBack: () => void }) {
  return (
    <View style={styles.backRow}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Atrás"
        onPress={onBack}
        style={styles.backButton}
      >
        <Text style={styles.backIcon}>‹</Text>
        <Text style={styles.backText}>Atrás</Text>
      </Pressable>
    </View>
  );
}

export function EnvironmentBadge({ environment }: { environment: Environment }) {
  const production = environment === 'production';
  return (
    <View
      accessibilityLabel={`Ambiente: ${production ? 'Producción' : 'Pruebas'}`}
      style={[styles.environmentBadge, production ? styles.production : styles.test]}
    >
      <View style={[styles.environmentDot, production ? styles.productionDot : styles.testDot]} />
      <Text style={[styles.environmentText, production && styles.productionText]}>
        {production ? 'PRODUCCIÓN' : 'PRUEBAS'}
      </Text>
    </View>
  );
}

export function CredentialStateBadge({ state }: { state: CredentialState }) {
  const content = stateContent[state];
  return (
    <View
      accessibilityLabel={`Estado: ${content.label}`}
      style={[styles.badge, { backgroundColor: content.background }]}
    >
      <View style={[styles.badgeDot, { backgroundColor: content.color }]} />
      <Text style={[styles.badgeText, { color: content.color }]}>{content.label}</Text>
    </View>
  );
}

export function RoleBadge({ children }: PropsWithChildren) {
  return (
    <View style={[styles.badge, styles.roleBadge]}>
      <Text style={[styles.badgeText, styles.roleText]}>{children}</Text>
    </View>
  );
}

export function SectionLabel({ children }: PropsWithChildren) {
  return <Text style={styles.sectionLabel}>{children}</Text>;
}

const styles = StyleSheet.create({
  header: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: -space.md,
    marginTop: -space.md,
    paddingHorizontal: space.xs,
    backgroundColor: colors.canvas,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
  },
  iconButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuIcon: { color: colors.navy, fontSize: 24, fontWeight: '700' },
  brandMark: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 4,
    borderColor: colors.cyan,
    transform: [{ rotate: '45deg' }],
    marginRight: space.xs,
  },
  brand: { color: colors.navy, fontSize: 20, fontWeight: '800' },
  brandAccent: { color: colors.cyan },
  headerSpacer: { flex: 1 },
  signOut: { minHeight: 48, justifyContent: 'center', paddingHorizontal: space.sm },
  signOutText: { color: colors.primary, fontWeight: '700' },
  backRow: { minHeight: 48, justifyContent: 'center' },
  backButton: {
    minHeight: 40,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space.sm,
    borderRadius: 20,
    backgroundColor: colors.canvas,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  backIcon: { color: colors.primary, fontSize: 28, lineHeight: 28, marginRight: space.xxs },
  backText: { color: colors.primary, fontWeight: '700' },
  environmentBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  test: { backgroundColor: colors.lavender },
  production: { backgroundColor: colors.rose },
  environmentDot: { width: 7, height: 7, borderRadius: 4 },
  testDot: { backgroundColor: colors.test },
  productionDot: { backgroundColor: colors.production },
  environmentText: { color: colors.primaryDeep, fontSize: 12, fontWeight: '800' },
  productionText: { color: colors.production },
  badge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 28,
    borderRadius: 14,
    paddingHorizontal: 10,
  },
  badgeDot: { width: 7, height: 7, borderRadius: 4 },
  badgeText: { fontSize: 13, fontWeight: '700' },
  roleBadge: { backgroundColor: colors.lavender },
  roleText: { color: colors.primaryDeep },
  sectionLabel: {
    color: colors.slate,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});
