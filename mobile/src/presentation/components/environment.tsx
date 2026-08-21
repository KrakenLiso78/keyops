import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '@/presentation/design-system';
import { useEnvironment } from '@/presentation/state/EnvironmentProvider';

export function EnvironmentBar() {
  const { environment, changeEnvironment } = useEnvironment();
  const environmentName = environment === 'test' ? 'Pruebas' : 'Producción';
  return (
    <View
      accessibilityLabel={`Ambiente activo: ${environmentName} de demostración`}
      style={styles.container}
    >
      <Text style={styles.demoLabel}>MODO DEMO</Text>
      <View accessibilityRole="tablist" style={styles.tabs}>
        {(['test', 'production'] as const).map((value) => (
          <Pressable
            key={value}
            accessibilityRole="tab"
            accessibilityLabel={value === 'test' ? 'Pruebas' : 'Producción'}
            accessibilityState={{ selected: environment === value }}
            onPress={() => changeEnvironment(value)}
            style={[
              styles.tab,
              environment === value && styles.selectedTab,
              environment === value && value === 'production' && styles.productionTab,
            ]}
          >
            <Text
              style={[
                styles.text,
                environment === value && styles.selectedText,
                environment === value && value === 'production' && styles.productionText,
              ]}
            >
              {value === 'test' ? 'PRUEBAS' : 'PRODUCCIÓN'}
            </Text>
          </Pressable>
        ))}
      </View>
      {environment === 'production' && (
        <Text accessibilityRole="alert" style={styles.alert}>
          Estás operando en PRODUCCIÓN. Confirma cada acción antes de continuar.
        </Text>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    marginHorizontal: -16,
    marginTop: -16,
    backgroundColor: colors.canvas,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
  },
  demoLabel: {
    color: colors.steel,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.7,
    paddingHorizontal: 16,
    paddingTop: 6,
    textAlign: 'center',
  },
  tabs: { flexDirection: 'row' },
  tab: {
    minHeight: 44,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 4,
    borderColor: 'transparent',
  },
  selectedTab: { borderColor: colors.ink },
  productionTab: { borderColor: colors.production },
  text: { fontSize: 13, fontWeight: '700', color: colors.slate, letterSpacing: 0.5 },
  selectedText: { color: colors.ink },
  productionText: { color: colors.production },
  alert: {
    backgroundColor: colors.rose,
    color: colors.error,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontWeight: '600',
    fontSize: 13,
  },
});
