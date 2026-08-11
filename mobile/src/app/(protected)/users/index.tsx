import { useState } from 'react';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { listAuthorizedUsers, updateAuthorizedUser } from '@/domain/use-cases/users/manageUsers';
import type { UserProfile } from '@/domain/model/types';
import { Body, Card, Heading, Screen } from '@/presentation/components/base';
import { BackHeader, SectionLabel } from '@/presentation/components/chrome';
import { colors, space } from '@/presentation/design-system';
import { useApp } from '@/presentation/state/AppProvider';

const profiles: { value: UserProfile; label: string }[] = [
  { value: 'analyst', label: 'Analista' },
  { value: 'senior_analyst', label: 'Senior' },
  { value: 'administrator', label: 'Admin' },
  { value: 'auditor', label: 'Auditor' },
];

function Unauthorized() {
  return (
    <Screen>
      <BackHeader onBack={() => router.back()} />
      <Heading>Acceso no autorizado</Heading>
    </Screen>
  );
}

export default function UsersScreen() {
  const { user } = useApp();
  const [, refresh] = useState(0);
  if (!user) return <Unauthorized />;
  const update = (id: string, profile: UserProfile, enabled: boolean) => {
    updateAuthorizedUser(user, id, profile, enabled);
    refresh((value) => value + 1);
  };
  let users;
  try {
    users = listAuthorizedUsers(user);
  } catch {
    return <Unauthorized />;
  }
  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <BackHeader onBack={() => router.back()} />
        <View style={styles.titleBlock}>
          <Heading level={1}>Usuarios autorizados</Heading>
          <Body>Asigna perfiles y controla el acceso a KeyOps.</Body>
        </View>
        {users.map((item) => (
          <Card key={item.id} style={styles.userCard}>
            <View style={styles.userHeader}>
              <View style={styles.userIdentity}>
                <Text style={styles.userName}>{item.displayName}</Text>
                <Text style={styles.login}>{item.loginIdentifier}</Text>
              </View>
              <View style={[styles.accessBadge, !item.enabled && styles.disabledBadge]}>
                <Text style={[styles.accessText, !item.enabled && styles.disabledText]}>
                  {item.enabled ? 'Habilitado' : 'Deshabilitado'}
                </Text>
              </View>
            </View>
            <SectionLabel>Perfil</SectionLabel>
            <View accessibilityRole="radiogroup" style={styles.profiles}>
              {profiles.map((profile) => {
                const selected = item.profile === profile.value;
                return (
                  <Pressable
                    key={profile.value}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: selected }}
                    onPress={() => update(item.id, profile.value, item.enabled)}
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
                <Text style={styles.switchHelp}>
                  Permite iniciar sesión y operar según el perfil.
                </Text>
              </View>
              <Switch
                value={item.enabled}
                onValueChange={(enabled) => update(item.id, item.profile, enabled)}
                trackColor={{ false: colors.hairline, true: '#bcb3f5' }}
                thumbColor={item.enabled ? colors.primary : colors.slate}
              />
            </View>
          </Card>
        ))}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: space.md, paddingBottom: space.xxl },
  titleBlock: { gap: space.xxs },
  userCard: { gap: space.sm },
  userHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: space.sm },
  userIdentity: { flex: 1, gap: 2 },
  userName: { color: colors.navy, fontSize: 17, fontWeight: '800' },
  login: { color: colors.slate, fontSize: 14 },
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
