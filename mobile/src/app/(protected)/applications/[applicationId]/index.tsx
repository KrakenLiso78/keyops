import { useLocalSearchParams, router } from 'expo-router';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { fakeRepository } from '@/data/fake/FakeKeyOpsRepository';
import { permittedActions } from '@/domain/policies/permittedActions';
import { Body, Button, Card, Heading, Screen } from '@/presentation/components/base';
import { useApp } from '@/presentation/state/AppProvider';

export default function ApplicationDetailScreen() {
  const { applicationId } = useLocalSearchParams<{ applicationId: string }>();
  const { environment, user } = useApp();
  const app = fakeRepository.getApplication(applicationId, environment);
  if (!app || !user)
    return (
      <Screen>
        <Heading>Aplicación no encontrada</Heading>
      </Screen>
    );
  const actions = permittedActions(user.profile, app.credentialState);
  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <Heading>{app.name}</Heading>
        <Card>
          <Text style={styles.label}>Institución</Text>
          <Body>{app.institution}</Body>
          <Text style={styles.label}>Ambiente</Text>
          <Body>{environment === 'test' ? 'Pruebas' : 'Producción'}</Body>
          <Text style={styles.label}>Rol API</Text>
          <Body>{app.apiRole}</Body>
          <Text style={styles.label}>Client ID</Text>
          <Body>{app.clientId ?? 'Aún no disponible'}</Body>
          <Text style={styles.label}>Contacto técnico</Text>
          <Body>{app.technicalContact ?? 'Sin registrar'}</Body>
          <Text style={styles.label}>Solicitud</Text>
          <Body>{app.requestOrTicketId ?? 'Sin registrar'}</Body>
        </Card>
        {app.messagesSent !== undefined ? (
          <Card>
            <Text style={styles.label}>Uso</Text>
            <Body>{app.messagesSent} mensajes enviados</Body>
            <Body>{app.consumedServices?.join(', ')}</Body>
          </Card>
        ) : (
          <Card>
            <Text style={styles.label}>Uso</Text>
            <Body>No hay datos de consumo disponibles.</Body>
          </Card>
        )}
        <Button
          title="Editar información de gestión"
          onPress={() =>
            router.push({
              pathname: '/(protected)/applications/[applicationId]/management',
              params: { applicationId },
            })
          }
        />
        {actions.map((action) => (
          <Button
            key={action}
            title={
              action === 'issue'
                ? 'Generar credenciales'
                : action === 'delivery'
                  ? 'Generar nueva entrega'
                  : `${action[0].toUpperCase()}${action.slice(1)} credenciales`
            }
            danger={action === 'revoke'}
            onPress={() =>
              router.push({
                pathname: '/(protected)/applications/[applicationId]/operation',
                params: { applicationId, action },
              })
            }
          />
        ))}
      </ScrollView>
    </Screen>
  );
}
const styles = StyleSheet.create({
  content: { gap: 16 },
  label: { marginTop: 4, fontWeight: '700', color: '#37352f' },
});
