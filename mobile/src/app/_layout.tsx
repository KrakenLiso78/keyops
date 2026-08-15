import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DependenciesProvider } from '@/composition/DependenciesProvider';
import { AppProvider } from '@/presentation/state/AppProvider';

export default function RootLayout() {
  useFonts({ Inter: require('../../assets/fonts/Inter-Variable.ttf') });
  return (
    <SafeAreaProvider>
      <DependenciesProvider>
        <AppProvider>
          <Stack screenOptions={{ headerShown: false }} />
        </AppProvider>
      </DependenciesProvider>
    </SafeAreaProvider>
  );
}
