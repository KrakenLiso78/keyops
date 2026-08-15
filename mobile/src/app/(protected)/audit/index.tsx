import { router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Body, Heading, Screen } from '@/presentation/components/base';
import { AuditList } from '@/presentation/components/audit';
import { BackHeader } from '@/presentation/components/chrome';
import { useAuditController } from '@/presentation/controllers/useAuditController';
import { space } from '@/presentation/design-system';
import { useApp } from '@/presentation/state/AppProvider';

function MissingSession() {
  return (
    <Screen>
      <BackHeader onBack={() => router.back()} />
      <Heading>Acceso no autorizado</Heading>
      <Body>Inicia sesión para consultar la auditoría.</Body>
    </Screen>
  );
}

function AuthorizedAuditScreen({ user }: { user: NonNullable<ReturnType<typeof useApp>['user']> }) {
  const controller = useAuditController(user);
  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <BackHeader onBack={() => router.back()} />
        <View style={styles.titleBlock}>
          <Heading level={1}>Auditoría</Heading>
          <Body>Historial persistente de accesos, operaciones e intentos.</Body>
        </View>
        <AuditList {...controller} />
      </ScrollView>
    </Screen>
  );
}

export default function AuditScreen() {
  const { user } = useApp();
  return user ? <AuthorizedAuditScreen user={user} /> : <MissingSession />;
}

const styles = StyleSheet.create({
  content: { gap: space.md, paddingBottom: space.xxl },
  titleBlock: { gap: space.xxs },
});
