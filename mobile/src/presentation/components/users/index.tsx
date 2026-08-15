import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import type { AuthorizedUser } from '@/domain/model/user';
import type { UserProfile } from '@/domain/model/common';
import { Card } from '@/presentation/components/base';
import { SectionLabel } from '@/presentation/components/chrome';
import { colors, space } from '@/presentation/design-system';

const profiles: { value: UserProfile; label: string }[] = [
  { value: 'analyst', label: 'Analista' },
  { value: 'senior_analyst', label: 'Senior' },
  { value: 'administrator', label: 'Admin' },
  { value: 'auditor', label: 'Auditor' },
];

export function UserCard({
  user,
  disabled = false,
  onUpdate,
}: {
  user: AuthorizedUser;
  disabled?: boolean;
  onUpdate: (profile: UserProfile, enabled: boolean) => void;
}) {
  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={styles.identity}>
          <Text style={styles.name}>{user.displayName}</Text>
          <Text style={styles.subject}>{user.corporateSubject}</Text>
          <Text style={styles.issuer}>{user.corporateIssuer}</Text>
        </View>
        <View style={[styles.accessBadge, !user.enabled && styles.disabledBadge]}>
          <Text style={[styles.accessText, !user.enabled && styles.disabledText]}>
            {user.enabled ? 'Habilitado' : 'Deshabilitado'}
          </Text>
        </View>
      </View>
      <SectionLabel>Perfil</SectionLabel>
      <View accessibilityRole="radiogroup" style={styles.profiles}>
        {profiles.map((profile) => {
          const selected = user.profile === profile.value;
          return (
            <Pressable
              key={profile.value}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected, disabled }}
              disabled={disabled}
              onPress={() => onUpdate(profile.value, user.enabled)}
              style={[styles.profileChoice, selected && styles.profileSelected]}
            >
              <Text style={[styles.profileText, selected && styles.profileSelectedText]}>
                {profile.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.switchRow}>
        <View style={styles.switchCopy}>
          <Text style={styles.switchTitle}>Acceso habilitado</Text>
          <Text style={styles.switchHelp}>Permite iniciar sesión y operar según el perfil.</Text>
        </View>
        <Switch
          value={user.enabled}
          disabled={disabled}
          onValueChange={(enabled) => onUpdate(user.profile, enabled)}
          trackColor={{ false: colors.hairline, true: '#bcb3f5' }}
          thumbColor={user.enabled ? colors.primary : colors.slate}
        />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: space.sm },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: space.sm },
  identity: { flex: 1, gap: 2 },
  name: { color: colors.navy, fontSize: 17, fontWeight: '800' },
  subject: { color: colors.slate, fontSize: 14 },
  issuer: { color: colors.slate, fontSize: 11 },
  accessBadge: {
    borderRadius: 14,
    backgroundColor: colors.mint,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  disabledBadge: { backgroundColor: colors.muted },
  accessText: { color: colors.success, fontSize: 12, fontWeight: '700' },
  disabledText: { color: colors.slate },
  profiles: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs },
  profileChoice: {
    minHeight: 40,
    justifyContent: 'center',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.hairline,
    paddingHorizontal: space.sm,
    backgroundColor: colors.canvas,
  },
  profileSelected: { borderColor: colors.primary, backgroundColor: colors.lavender },
  profileText: { color: colors.slate, fontSize: 13, fontWeight: '600' },
  profileSelectedText: { color: colors.primaryDeep, fontWeight: '800' },
  switchRow: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    borderTopWidth: 1,
    borderTopColor: colors.hairline,
    paddingTop: space.sm,
  },
  switchCopy: { flex: 1, gap: 2 },
  switchTitle: { color: colors.ink, fontWeight: '700' },
  switchHelp: { color: colors.slate, fontSize: 12, lineHeight: 17 },
});
