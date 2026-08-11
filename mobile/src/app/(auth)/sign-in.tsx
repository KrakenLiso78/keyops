import { useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Button, Field, Heading, Screen } from '@/presentation/components/base';
import { useApp } from '@/presentation/state/AppProvider';

export default function SignInScreen() {
  const [login, setLogin] = useState('analista');
  const [password, setPassword] = useState('demo');
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
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.hero}>
          <View style={[styles.shape, styles.shapeOne]} />
          <View style={[styles.shape, styles.shapeTwo]} />
          <View style={styles.logoPanel}>
            <Image
              source={require('../../../assets/images/keyops-logo.png')}
              accessibilityLabel="KeyOps"
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.heroCaption}>Gestión segura de credenciales API</Text>
        </View>
        <View style={styles.formPanel}>
          <Heading>Iniciar sesión</Heading>
          <Text style={styles.description}>Acceso restringido a analistas autorizados</Text>
          <View style={styles.form}>
            <Field
              label="Usuario"
              value={login}
              onChangeText={setLogin}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Field label="Contraseña" secureTextEntry value={password} onChangeText={setPassword} />
            <Button title="Ingresar" onPress={submit} />
            {error ? (
              <Text accessibilityRole="alert" style={styles.error}>
                {error}
              </Text>
            ) : null}
          </View>
          <Text style={styles.demoHint}>
            Demo local: analista, senior, admin o auditor · contraseña demo
          </Text>
        </View>
      </ScrollView>
    </Screen>
  );
}
const styles = StyleSheet.create({
  screen: { padding: 0, backgroundColor: '#ffffff' },
  content: { flexGrow: 1, backgroundColor: '#ffffff' },
  hero: {
    minHeight: 270,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#0a1530',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  logoPanel: {
    width: 224,
    height: 128,
    overflow: 'hidden',
    borderRadius: 20,
    backgroundColor: '#ffffff',
  },
  logo: { width: 224, height: 128 },
  heroCaption: { color: '#d8f7fa', fontSize: 14, fontWeight: '600' },
  shape: { position: 'absolute', borderWidth: 2, borderColor: '#12b8c8' },
  shapeOne: {
    width: 92,
    height: 92,
    left: -32,
    top: 32,
    borderRadius: 24,
    transform: [{ rotate: '28deg' }],
  },
  shapeTwo: {
    width: 72,
    height: 72,
    right: -20,
    bottom: 22,
    borderRadius: 20,
    borderColor: '#5645d4',
    transform: [{ rotate: '45deg' }],
  },
  formPanel: { paddingHorizontal: 24, paddingTop: 28, paddingBottom: 24, gap: 8 },
  form: { gap: 16, marginTop: 16 },
  description: { color: '#5d5b54', fontSize: 16, lineHeight: 24 },
  demoHint: { marginTop: 16, color: '#77746c', fontSize: 13, lineHeight: 18 },
  error: { color: '#c62828' },
});
