import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '@/presentation/design-system';
import { useApp } from '@/presentation/state/AppProvider';

export function EnvironmentBar() {
  const { environment, setEnvironment } = useApp();
  return (
    <View>
      <View accessibilityRole="tablist" style={styles.tabs}>
        {(['test', 'production'] as const).map((value) => (
          <Pressable
            key={value}
            accessibilityRole="tab"
            accessibilityState={{ selected: environment === value }}
            onPress={() => setEnvironment(value)}
            style={[
              styles.tab,
              environment === value && (value === 'test' ? styles.test : styles.production),
            ]}
          >
            <Text style={styles.text}>{value === 'test' ? 'Pruebas' : 'Producción'}</Text>
          </Pressable>
        ))}
      </View>
      {environment === 'production' && (
        <Text accessibilityRole="alert" style={styles.alert}>
          Producción simulada: las acciones afectan solo a datos locales.
        </Text>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  tabs: { flexDirection: 'row', gap: 8 },
  tab: {
    minHeight: 44,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 3,
    borderColor: 'transparent',
  },
  test: { borderColor: colors.test },
  production: { borderColor: colors.production },
  text: { fontWeight: '700', color: colors.ink },
  alert: {
    marginTop: 8,
    backgroundColor: '#fde0ec',
    color: colors.error,
    padding: 8,
    fontWeight: '600',
  },
});
