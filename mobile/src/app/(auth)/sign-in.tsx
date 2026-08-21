import { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { appVersion, appVersionLabel } from '@/constants/appVersion';
import { Button, Field, Heading, Screen } from '@/presentation/components/base';
import { colors, space } from '@/presentation/design-system';
import { firstAllowedPath } from '@/presentation/navigation/authorization';
import { useSignInController } from '@/presentation/controllers/useSignInController';
import { useApp } from '@/presentation/state/AppProvider';

export default function SignInScreen() {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const { signIn, authMode, beginCorporateSignIn } = useApp();
  const { error, setError, submitting, submit, startCorporate } = useSignInController(
    signIn,
    (user) => {
      const path = firstAllowedPath(user);
      if (path) router.replace(path);
    },
    beginCorporateSignIn,
  );

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
            <Text style={styles.description}>
              {authMode === 'corporate'
                ? 'Acceso restringido mediante identidad corporativa.'
                : 'Acceso restringido a analistas autorizados.'}
            </Text>
          </View>
          <View style={styles.form}>
            {authMode === 'corporate' ? (
              <Button
                disabled={submitting}
                title="Acceder con identidad corporativa"
                onPress={() => void startCorporate()}
              />
            ) : (
              <>
                <Field
                  label="Usuario"
                  value={login}
                  onChangeText={setLogin}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <Field
                  label="Contraseña"
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                />
                <Button
                  disabled={submitting}
                  title="Ingresar"
                  onPress={() => void submit(login, password)}
                />
              </>
            )}
            {error ? (
              <Text accessibilityRole="alert" style={styles.error}>
                {error}
              </Text>
            ) : null}
          </View>
          {authMode === 'credentials' ? (
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
          ) : null}
          <Text accessibilityLabel={`Versión ${appVersion}`} style={styles.version}>
            {appVersionLabel}
          </Text>
          <View style={styles.cornerDecoration} />
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
  version: { color: colors.slate, fontSize: 11, marginTop: 'auto', textAlign: 'center' },
  cornerDecoration: {
    pointerEvents: 'none',
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
