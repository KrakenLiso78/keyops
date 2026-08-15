import { Redirect, Stack, usePathname } from 'expo-router';
import { useApp } from '@/presentation/state/AppProvider';
import {
  firstAllowedPath,
  requiredPermissionForPath,
} from '@/presentation/navigation/authorization';

export default function ProtectedLayout() {
  const { restoring, user } = useApp();
  const pathname = usePathname();
  if (restoring) return null;
  if (!user) return <Redirect href="/sign-in" />;

  const requiredPermission = requiredPermissionForPath(pathname);
  if (!user.permissions.includes(requiredPermission)) {
    return <Redirect href={firstAllowedPath(user) ?? '/sign-in'} />;
  }
  return <Stack screenOptions={{ headerShown: false }} />;
}
