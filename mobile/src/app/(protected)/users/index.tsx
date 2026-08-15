import { useState } from 'react';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { AuthenticatedUser, AuthorizedUser } from '@/domain/model/user';
import type { UserProfile } from '@/domain/model/common';
import { Body, Button, Card, Field, Heading, Screen } from '@/presentation/components/base';
import { BackHeader, EnvironmentBadge, SectionLabel } from '@/presentation/components/chrome';
import { EmptyState, LoadingState, PersistentError } from '@/presentation/components/feedback';
import { colors, space } from '@/presentation/design-system';
import { useApp } from '@/presentation/state/AppProvider';
import { useDependencies } from '@/composition/DependenciesProvider';
import { useUsersController } from '@/presentation/controllers/useUsersController';
import { UserCard } from '@/presentation/components/users';

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
  const { environment, user } = useApp();
  if (!user?.permissions.includes('users:write')) return <Unauthorized />;
  return <AuthorizedUsersScreen actor={user} environment={environment} />;
}

function AuthorizedUsersScreen({
  actor,
  environment,
}: {
  actor: AuthenticatedUser;
  environment: 'test' | 'production';
}) {
  const { users: repository } = useDependencies();
  const controller = useUsersController(actor, repository);
  const [issuer, setIssuer] = useState('');
  const [subject, setSubject] = useState('');
  const [newProfile, setNewProfile] = useState<UserProfile>('analyst');
  const [pending, setPending] = useState<{
    user: AuthorizedUser;
    profile: UserProfile;
    enabled: boolean;
  }>();

  const register = async () => {
    await controller.register({
      corporateIssuer: issuer,
      corporateSubject: subject,
      profile: newProfile,
      enabled: true,
    });
    setIssuer('');
    setSubject('');
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.topControls}>
          <BackHeader onBack={() => router.back()} />
          <EnvironmentBadge environment={environment} />
        </View>
        <View style={styles.titleBlock}>
          <Heading level={1}>Usuarios autorizados</Heading>
          <Body>Asigna perfiles y controla el acceso a KeyOps.</Body>
        </View>
        <Card tone="lavender" style={styles.userCard}>
          <SectionLabel>Registrar identidad corporativa</SectionLabel>
          <Field
            label="Issuer corporativo"
            value={issuer}
            onChangeText={setIssuer}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Field
            label="Subject corporativo"
            value={subject}
            onChangeText={setSubject}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <View accessibilityRole="radiogroup" style={styles.profiles}>
            {profiles.map((profile) => {
              const selected = newProfile === profile.value;
              return (
                <Pressable
                  key={profile.value}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selected }}
                  onPress={() => setNewProfile(profile.value)}
                  style={[styles.profileChoice, selected && styles.profileSelected]}
                >
                  <Text style={[styles.profileText, selected && styles.profileSelectedText]}>
                    {profile.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Button
            title="Registrar autorización"
            disabled={controller.submitting || !issuer.trim() || !subject.trim()}
            onPress={() => void register()}
          />
        </Card>
        {controller.error ? (
          <PersistentError message={controller.error} onRetry={() => void controller.load()} />
        ) : null}
        {controller.loading ? <LoadingState label="Cargando usuarios…" /> : null}
        {!controller.loading && controller.users.length === 0 ? (
          <EmptyState message="No hay usuarios corporativos autorizados." />
        ) : null}
        {pending ? (
          <Card tone="yellow" style={styles.userCard}>
            <Text style={styles.switchTitle}>Confirma el cambio de autorización</Text>
            <Body>
              {pending.user.displayName}: perfil {pending.profile} y acceso{' '}
              {pending.enabled ? 'habilitado' : 'deshabilitado'}.
            </Body>
            <View style={styles.confirmActions}>
              <Button title="Cancelar" onPress={() => setPending(undefined)} />
              <Button
                title="Confirmar cambio"
                disabled={controller.submitting}
                onPress={() => {
                  void controller.update(pending.user, {
                    profile: pending.profile,
                    enabled: pending.enabled,
                  });
                  setPending(undefined);
                }}
              />
            </View>
          </Card>
        ) : null}
        {controller.users.map((item) => (
          <UserCard
            key={item.id}
            user={item}
            disabled={controller.submitting || item.id === actor.id}
            onUpdate={(profile, enabled) => setPending({ user: item, profile, enabled })}
          />
        ))}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: space.md, paddingBottom: space.xxl },
  topControls: { alignItems: 'flex-start', gap: space.xs },
  titleBlock: { gap: space.xxs },
  userCard: { gap: space.sm },
  userHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: space.sm },
  userIdentity: { flex: 1, gap: 2 },
  userName: { color: colors.navy, fontSize: 17, fontWeight: '800' },
  login: { color: colors.slate, fontSize: 14 },
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
  confirmActions: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs },
});
