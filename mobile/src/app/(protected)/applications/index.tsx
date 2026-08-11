import { useMemo, useState } from 'react';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { fakeRepository } from '@/data/fake/FakeKeyOpsRepository';
import { Body, Card, Field, Heading, Screen } from '@/presentation/components/base';
import { AppHeader, CredentialStateBadge, RoleBadge } from '@/presentation/components/chrome';
import { EnvironmentBar } from '@/presentation/components/environment';
import { useApp } from '@/presentation/state/AppProvider';

export default function ApplicationsScreen() {
  const [query, setQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const { environment, user, signOut } = useApp();
  const apps = useMemo(
    () => fakeRepository.listApplications(environment, query),
    [environment, query],
  );
  return (
    <Screen>
      <AppHeader
        onMenu={() => setMenuOpen((open) => !open)}
        onSignOut={() => {
          signOut();
          router.replace('/sign-in');
        }}
      />
      {menuOpen ? (
        <View style={styles.menu}>
          {user?.profile !== 'analyst' ? (
            <Pressable onPress={() => router.push('/audit')} style={styles.menuItem}>
              <Text style={styles.menuText}>Auditoría</Text>
            </Pressable>
          ) : null}
          {user?.profile === 'administrator' ? (
            <Pressable onPress={() => router.push('/users')} style={styles.menuItem}>
              <Text style={styles.menuText}>Usuarios autorizados</Text>
            </Pressable>
          ) : null}
          <Text style={styles.menuProfile}>{user?.displayName}</Text>
        </View>
      ) : null}
      <EnvironmentBar />
      <View style={styles.titleBlock}>
        <Heading level={1}>Credenciales</Heading>
        <Body>Selecciona una aplicación para consultar u operar sus credenciales.</Body>
      </View>
      <Field
        label="Buscar institución, aplicación o solicitud"
        value={query}
        onChangeText={setQuery}
        placeholder="Buscar"
      />
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
                <View style={styles.cardTitle}>
                  <Text style={styles.institution}>{app.institution}</Text>
                  <Text style={styles.name}>{app.name}</Text>
                </View>
                <Text accessibilityLabel="Abrir detalle" style={styles.more}>
                  ⋮
                </Text>
              </View>
              <View style={styles.badges}>
                <RoleBadge>{app.apiRole}</RoleBadge>
                <CredentialStateBadge state={app.credentialState} />
              </View>
            </Card>
          </Pressable>
        ))}
        {apps.length === 0 ? (
          <Body>No existen resultados para los criterios indicados.</Body>
        ) : null}
      </ScrollView>
    </Screen>
  );
}
const styles = StyleSheet.create({
  titleBlock: { gap: 4 },
  list: { gap: 12, paddingBottom: 24 },
  applicationCard: {
    borderColor: '#e1dfdc',
    shadowColor: '#0a1530',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start' },
  cardTitle: { flex: 1, gap: 3 },
  institution: { color: '#1a1a1a', fontSize: 17, fontWeight: '800' },
  name: { color: '#5d5b54', fontSize: 15, lineHeight: 21 },
  more: { width: 32, textAlign: 'center', color: '#5d5b54', fontSize: 25, lineHeight: 26 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  menu: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e3df',
    borderRadius: 12,
    padding: 8,
    gap: 4,
  },
  menuItem: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 12 },
  menuText: { color: '#3a2a99', fontWeight: '700' },
  menuProfile: { color: '#77746c', fontSize: 13, padding: 12 },
});
