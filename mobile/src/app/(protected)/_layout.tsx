import { useEffect } from 'react';
import { router, Stack, usePathname } from 'expo-router';
import { useApp } from '@/presentation/state/AppProvider';
import {
  firstAllowedPath,
  requiredPermissionForPath,
} from '@/presentation/navigation/authorization';

export default function ProtectedLayout() {
  const { restoring, user } = useApp();
  const pathname = usePathname();
  const requiredPermission = requiredPermissionForPath(pathname);
  const redirectTo = !user
    ? '/sign-in'
    : !user.permissions.includes(requiredPermission)
      ? (firstAllowedPath(user) ?? '/sign-in')
      : undefined;

  useEffect(() => {
    if (!restoring && redirectTo && pathname !== redirectTo) router.replace(redirectTo);
  }, [pathname, redirectTo, restoring]);

  if (restoring) return null;
  if (redirectTo) return null;
  return <Stack screenOptions={{ headerShown: false }} />;
}
