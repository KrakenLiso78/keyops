import { useMemo, useState } from 'react';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { fakeRepository } from '@/data/fake/FakeKeyOpsRepository';
import { Body, Card, Heading, Screen } from '@/presentation/components/base';
import { AppHeader, CredentialStateBadge, RoleBadge } from '@/presentation/components/chrome';
import { EnvironmentBar } from '@/presentation/components/environment';
import { colors, space } from '@/presentation/design-system';
import { useApp } from '@/presentation/state/AppProvider';

export default function ApplicationsScreen() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { environment, user, signOut } = useApp();
  const apps = useMemo(() => fakeRepository.listApplications(environment), [environment]);

  return (
    <Screen style={styles.screen}>
      <AppHeader onMenu={() => setMenuOpen((open) => !open)} />
      {menuOpen ? (
        <View style={styles.menu}>
          {user?.profile !== 'analyst' ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Abrir auditoría"
              onPress={() => router.push('/audit')}
              style={styles.menuItem}
            >
              <Text style={styles.menuText}>Auditoría</Text>
            </Pressable>
          ) : null}
          {user?.profile === 'administrator' ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Gestionar usuarios autorizados"
              onPress={() => router.push('/users')}
              style={styles.menuItem}
            >
              <Text style={styles.menuText}>Usuarios autorizados</Text>
            </Pressable>
          ) : null}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Cerrar sesión"
            onPress={() => {
              signOut();
              router.replace('/sign-in');
            }}
            style={styles.menuItem}
          >
            <Text style={styles.menuText}>Cerrar sesión</Text>
          </Pressable>
          <Text style={styles.menuProfile}>{user?.displayName}</Text>
        </View>
      ) : null}
      <EnvironmentBar />
      <View style={styles.titleBlock}>
        <Heading level={1}>Credenciales</Heading>
        <Body>Aplicaciones y estado de sus credenciales</Body>
      </View>
      <ScrollView contentContainerStyle={styles.list}>
        {apps.map((app) => (
          <Pressable
            key={app.id}
            accessibilityRole="button"
            accessibilityLabel={`Abrir ${app.name}`}
            onPress={() =>
              router.push({
                pathname: '/applications/[applicationId]',
                params: { applicationId: app.id },
              })
            }
          >
            <Card style={styles.applicationCard}>
              <View style={styles.cardTop}>
                <Text style={styles.institution}>{app.institution}</Text>
                <Text accessibilityLabel="Abrir detalle" style={styles.more}>
                  •••
                </Text>
              </View>
              <Text style={styles.row}>
                <Text style={styles.rowLabel}>Aplicación: </Text>
                {app.name}
              </Text>
              <View style={styles.infoRow}>
                <Text style={styles.rowLabel}>Rol</Text>
                <RoleBadge>{app.apiRole}</RoleBadge>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.rowLabel}>Estado</Text>
                <CredentialStateBadge state={app.credentialState} />
              </View>
            </Card>
          </Pressable>
        ))}
        {apps.length === 0 ? (
          <Body>No existen aplicaciones en el ambiente seleccionado.</Body>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.canvas },
  titleBlock: { gap: 2, marginHorizontal: 12, marginTop: 8 },
  list: { gap: 14, paddingHorizontal: 12, paddingTop: 4, paddingBottom: space.xxl },
  applicationCard: {
    gap: 12,
    borderColor: colors.hairline,
    borderRadius: 10,
    padding: 18,
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: space.sm },
  institution: { flex: 1, color: colors.ink, fontSize: 18, fontWeight: '800' },
  more: { color: colors.steel, fontSize: 16, letterSpacing: 1 },
  row: { color: colors.ink, fontSize: 16, lineHeight: 23 },
  rowLabel: { color: colors.ink, fontSize: 16, fontWeight: '400' },
  infoRow: { minHeight: 28, flexDirection: 'row', alignItems: 'center', gap: space.sm },
  menu: {
    backgroundColor: colors.canvas,
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: 10,
    padding: space.xs,
    gap: 2,
  },
  menuItem: { minHeight: 44, justifyContent: 'center', paddingHorizontal: space.sm },
  menuText: { color: colors.primaryDeep, fontWeight: '700' },
  menuProfile: { color: colors.steel, fontSize: 13, padding: space.sm },
});
