import { useState } from 'react';
import { Image, StyleSheet, Text } from 'react-native';
import { router } from 'expo-router';
import { Button, Field, Heading, Screen } from '@/presentation/components/base';
import { useApp } from '@/presentation/state/AppProvider';

export default function SignInScreen() {
  const [login, setLogin] = useState('analista');
  const [error, setError] = useState('');
  const { signIn } = useApp();
  const submit = () => {
    try {
      signIn(login);
      router.replace('/applications');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo iniciar sesión.');
    }
  };
  return (
    <Screen style={styles.screen}>
      <Image
        source={require('../../../assets/images/keyops-logo.png')}
        accessibilityLabel="KeyOps"
        style={styles.logo}
        resizeMode="contain"
      />
      <Heading>Acceder a KeyOps</Heading>
      <Text style={styles.description}>
        Introduce una de las identidades de prueba: analista, senior, admin o auditor.
      </Text>
      <Field label="Usuario" value={login} onChangeText={setLogin} autoCapitalize="none" />
      <Field label="Contraseña" secureTextEntry value="demo" editable={false} />
      <Button title="Acceder" onPress={submit} />
      {error ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {error}
        </Text>
      ) : null}
    </Screen>
  );
}
const styles = StyleSheet.create({
  screen: { justifyContent: 'center' },
  logo: { width: 200, height: 110, alignSelf: 'center' },
  description: { color: '#5d5b54', lineHeight: 22 },
  error: { color: '#c62828' },
});
