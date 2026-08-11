import { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Button, Field, Heading, Screen } from '@/presentation/components/base';
import { colors, space } from '@/presentation/design-system';
import { useApp } from '@/presentation/state/AppProvider';

export default function SignInScreen() {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
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
        <Image
          source={require('../../../assets/images/login-hero-v4.png')}
          accessibilityLabel="KeyOps, gestión segura de credenciales API"
          resizeMode="cover"
          style={styles.hero}
        />
        <View style={styles.formPanel}>
          <View style={styles.headingBlock}>
            <Heading>Iniciar sesión</Heading>
            <Text style={styles.description}>Acceso restringido a analistas autorizados.</Text>
          </View>
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
          <View style={styles.links}>
            <Pressable
              accessibilityRole="link"
              onPress={() => setError('Contacta con soporte para restablecer tu contraseña.')}
            >
              <Text style={styles.link}>Olvidé mi contraseña</Text>
            </Pressable>
            <Pressable
              accessibilityRole="link"
              onPress={() => setError('Soporte técnico: canal interno de KeyOps.')}
            >
              <Text style={styles.link}>Soporte técnico</Text>
            </Pressable>
          </View>
          <View pointerEvents="none" style={styles.cornerDecoration} />
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { padding: 0, backgroundColor: colors.canvas },
  content: { flexGrow: 1, backgroundColor: colors.canvas },
  hero: { width: '100%', aspectRatio: 364 / 287 },
  formPanel: {
    flex: 1,
    overflow: 'hidden',
    alignItems: 'stretch',
    paddingHorizontal: 28,
    paddingTop: 30,
    paddingBottom: 26,
    gap: space.xs,
    backgroundColor: colors.canvas,
  },
  headingBlock: { alignItems: 'center', gap: space.xs },
  description: {
    color: colors.ink,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
  form: { gap: space.sm },
  links: { alignItems: 'center', gap: 12, marginTop: space.sm },
  link: { color: colors.primaryDeep, fontSize: 15, fontWeight: '500' },
  error: { color: colors.error, fontSize: 13, textAlign: 'center' },
  cornerDecoration: {
    position: 'absolute',
    width: 94,
    height: 94,
    right: -34,
    bottom: -32,
    borderWidth: 1,
    borderColor: colors.hairline,
    transform: [{ rotate: '45deg' }],
  },
});
