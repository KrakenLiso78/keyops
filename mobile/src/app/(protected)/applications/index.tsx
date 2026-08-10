import { useMemo, useState } from 'react';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { fakeRepository } from '@/data/fake/FakeKeyOpsRepository';
import { Body, Card, Field, Heading, Screen } from '@/presentation/components/base';
import { EnvironmentBar } from '@/presentation/components/environment';
import { useApp } from '@/presentation/state/AppProvider';

export default function ApplicationsScreen() {
  const [query, setQuery] = useState('');
  const { environment, user } = useApp();
  const apps = useMemo(
    () => fakeRepository.listApplications(environment, query),
    [environment, query],
  );
  return (
    <Screen>
      <EnvironmentBar />
      <Heading>Aplicaciones</Heading>
      <Field
        label="Buscar institución, aplicación o solicitud"
        value={query}
        onChangeText={setQuery}
        placeholder="Buscar"
      />
      {user?.profile !== 'analyst' ? (
        <Pressable onPress={() => router.push('/(protected)/audit')}>
          <Text style={styles.link}>Ver auditoría</Text>
        </Pressable>
      ) : null}
      {user?.profile === 'administrator' ? (
        <Pressable onPress={() => router.push('/(protected)/users')}>
          <Text style={styles.link}>Gestionar usuarios</Text>
        </Pressable>
      ) : null}
      <ScrollView contentContainerStyle={styles.list}>
        {apps.map((app) => (
          <Pressable
            key={app.id}
            accessibilityRole="button"
            accessibilityLabel={`Abrir ${app.name}`}
            onPress={() =>
              router.push({
                pathname: '/(protected)/applications/[applicationId]',
                params: { applicationId: app.id },
              })
            }
          >
            <Card>
              <Text style={styles.name}>{app.name}</Text>
              <Body>{app.institution}</Body>
              <Text style={styles.state}>{app.credentialState.replaceAll('_', ' ')}</Text>
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
  list: { gap: 12 },
  name: { fontSize: 17, fontWeight: '700' },
  state: { textTransform: 'capitalize', color: '#5645d4', fontWeight: '600' },
  link: { color: '#0075de', fontWeight: '700' },
});
