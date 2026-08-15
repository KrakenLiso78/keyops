import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Body, Card, Heading, Screen } from '@/presentation/components/base';
import { AppHeader, CredentialStateBadge, RoleBadge } from '@/presentation/components/chrome';
import { EnvironmentBar } from '@/presentation/components/environment';
import { colors, space } from '@/presentation/design-system';
import { useApp } from '@/presentation/state/AppProvider';
import { useEnvironment } from '@/presentation/state/EnvironmentProvider';
import { useApplicationListController } from '@/presentation/controllers/useApplicationListController';
import { LoadingState } from '@/presentation/components/feedback';
import { CorporateCatalogError } from '@/presentation/components/applications/CorporateCatalogStatus';
import type { CredentialState } from '@/domain/model/types';

const stateFilters: { value?: CredentialState; label: string }[] = [
  { label: 'Todas' },
  { value: 'active', label: 'Activas' },
  { value: 'no_credentials', label: 'Sin credenciales' },
  { value: 'suspended', label: 'Suspendidas' },
  { value: 'revoked', label: 'Revocadas' },
];

const sortLabels = {
  name: 'aplicación',
  institution: 'institución',
  lastChangedAt: 'último cambio',
} as const;

export default function ApplicationsScreen() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { environment, user, signOut } = useApp();
  const { registerReset } = useEnvironment();
  const controller = useApplicationListController(environment);
  const { query, setQuery } = controller;
  useEffect(
    () =>
      registerReset(() => {
        setMenuOpen(false);
        setQuery('');
      }),
    [registerReset, setQuery],
  );
  const apps = controller.items;
  const resultCount = controller.total === 1 ? '1 resultado' : `${controller.total} resultados`;

  return (
    <Screen style={styles.screen}>
      <AppHeader onMenu={() => setMenuOpen((open) => !open)} />
      {menuOpen ? (
        <View style={styles.menu}>
          {user?.profile !== 'analyst' ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Abrir auditoría"
              onPress={() => router.push('/audit')}
              style={styles.menuItem}
            >
              <Text style={styles.menuText}>Auditoría</Text>
            </Pressable>
          ) : null}
          {user?.profile === 'administrator' ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Gestionar usuarios autorizados"
              onPress={() => router.push('/users')}
              style={styles.menuItem}
            >
              <Text style={styles.menuText}>Usuarios autorizados</Text>
            </Pressable>
          ) : null}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Cerrar sesión"
            onPress={() => {
              void signOut().then(() => router.replace('/sign-in'));
            }}
            style={styles.menuItem}
          >
            <Text style={styles.menuText}>Cerrar sesión</Text>
          </Pressable>
          <Text style={styles.menuProfile}>{user?.displayName}</Text>
        </View>
      ) : null}
      <EnvironmentBar />
      <View style={styles.titleBlock}>
        <Heading level={1}>Credenciales</Heading>
        <Body>Aplicaciones y estado de sus credenciales</Body>
      </View>
      <View style={styles.searchBlock}>
        <View style={styles.searchRow}>
          <View
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            style={styles.searchIcon}
          >
            <View style={styles.searchIconCircle} />
            <View style={styles.searchIconHandle} />
          </View>
          <TextInput
            accessibilityLabel="Buscar en aplicaciones"
            autoCapitalize="none"
            autoCorrect={false}
            onChangeText={setQuery}
            placeholder="Aplicación, entidad, usuario, Client ID…"
            placeholderTextColor={colors.slate}
            returnKeyType="search"
            style={styles.searchInput}
            value={query}
          />
          {query ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Limpiar búsqueda"
              onPress={() => setQuery('')}
              style={styles.clearSearch}
            >
              <Text style={styles.clearSearchText}>×</Text>
            </Pressable>
          ) : null}
        </View>
        <Text accessibilityLiveRegion="polite" style={styles.resultCount}>
          {resultCount}
        </Text>
        <ScrollView
          horizontal
          accessibilityLabel="Filtros de estado"
          contentContainerStyle={styles.filters}
          showsHorizontalScrollIndicator={false}
        >
          {stateFilters.map((filter) => {
            const selected = controller.state === filter.value;
            return (
              <Pressable
                key={filter.label}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => controller.setState(filter.value)}
                style={[styles.filter, selected && styles.filterSelected]}
              >
                <Text style={[styles.filterText, selected && styles.filterTextSelected]}>
                  {filter.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Ordenar por ${sortLabels[controller.sort]}`}
          onPress={() =>
            controller.setSort(
              controller.sort === 'name'
                ? 'institution'
                : controller.sort === 'institution'
                  ? 'lastChangedAt'
                  : 'name',
            )
          }
          style={styles.sortButton}
        >
          <Text style={styles.sortText}>Orden: {sortLabels[controller.sort]}</Text>
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={styles.list}>
        {controller.status === 'loading' && apps.length === 0 ? (
          <LoadingState label="Cargando aplicaciones…" />
        ) : null}
        {controller.status === 'error' ? (
          <CorporateCatalogError
            message={controller.error ?? 'No se pudo cargar el inventario.'}
            onRetry={controller.retry}
          />
        ) : null}
        {apps.map((app) => (
          <Pressable
            key={app.id}
            accessibilityRole="button"
            accessibilityLabel={`Abrir ${app.name}`}
            onPress={() =>
              router.push({
                pathname: '/applications/[applicationId]',
                params: { applicationId: app.id },
              })
            }
          >
            <Card style={styles.applicationCard}>
              <View style={styles.cardTop}>
                <Text style={styles.institution}>{app.institution}</Text>
                <Text accessibilityLabel="Abrir detalle" style={styles.more}>
                  •••
                </Text>
              </View>
              <Text style={styles.row}>
                <Text style={styles.rowLabel}>Aplicación: </Text>
                {app.name}
              </Text>
              <View style={styles.infoRow}>
                <Text style={styles.rowLabel}>Rol</Text>
                <RoleBadge>{app.apiRole}</RoleBadge>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.rowLabel}>Estado</Text>
                <CredentialStateBadge state={app.credentialState} />
              </View>
            </Card>
          </Pressable>
        ))}
        {controller.status === 'success' && apps.length === 0 ? (
          <Body>
            {query.trim()
              ? `No hay resultados para “${query.trim()}”.`
              : 'No existen aplicaciones en el ambiente seleccionado.'}
          </Body>
        ) : null}
        {controller.total > controller.pageSize ? (
          <View style={styles.pagination}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Página anterior"
              disabled={controller.page === 1}
              onPress={() => controller.setPage(Math.max(1, controller.page - 1))}
              style={styles.pageButton}
            >
              <Text style={styles.pageText}>Anterior</Text>
            </Pressable>
            <Text style={styles.resultCount}>Página {controller.page}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Página siguiente"
              disabled={controller.page * controller.pageSize >= controller.total}
              onPress={() => controller.setPage(controller.page + 1)}
              style={styles.pageButton}
            >
              <Text style={styles.pageText}>Siguiente</Text>
            </Pressable>
          </View>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.canvas },
  titleBlock: { gap: 2, marginHorizontal: 12, marginTop: 8 },
  searchBlock: { gap: 6, marginHorizontal: 12 },
  searchRow: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: 12,
    backgroundColor: colors.canvas,
    paddingLeft: 16,
  },
  searchIcon: { width: 20, height: 20 },
  searchIconCircle: {
    width: 14,
    height: 14,
    borderWidth: 1.8,
    borderColor: colors.slate,
    borderRadius: 7,
  },
  searchIconHandle: {
    position: 'absolute',
    width: 7,
    height: 1.8,
    left: 11,
    top: 13,
    backgroundColor: colors.slate,
    transform: [{ rotate: '45deg' }],
  },
  searchInput: {
    minHeight: 48,
    flex: 1,
    paddingHorizontal: 12,
    color: colors.ink,
    fontSize: 16,
  },
  clearSearch: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  clearSearchText: { color: colors.slate, fontSize: 26, lineHeight: 28 },
  resultCount: { color: colors.slate, fontSize: 13, textAlign: 'right' },
  filters: { gap: 8, paddingVertical: 2 },
  filter: {
    minHeight: 36,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: 18,
    paddingHorizontal: 12,
  },
  filterSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterText: { color: colors.ink, fontSize: 13, fontWeight: '600' },
  filterTextSelected: { color: colors.canvas },
  sortButton: { minHeight: 36, justifyContent: 'center', alignSelf: 'flex-end' },
  sortText: { color: colors.primaryDeep, fontSize: 13, fontWeight: '700' },
  list: { gap: 14, paddingHorizontal: 12, paddingTop: 4, paddingBottom: space.xxl },
  applicationCard: {
    gap: 12,
    borderColor: colors.hairline,
    borderRadius: 10,
    padding: 18,
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: space.sm },
  institution: { flex: 1, color: colors.ink, fontSize: 18, fontWeight: '800' },
  more: { color: colors.steel, fontSize: 16, letterSpacing: 1 },
  row: { color: colors.ink, fontSize: 16, lineHeight: 23 },
  rowLabel: { color: colors.ink, fontSize: 16, fontWeight: '400' },
  infoRow: { minHeight: 28, flexDirection: 'row', alignItems: 'center', gap: space.sm },
  menu: {
    backgroundColor: colors.canvas,
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: 10,
    padding: space.xs,
    gap: 2,
  },
  menuItem: { minHeight: 44, justifyContent: 'center', paddingHorizontal: space.sm },
  menuText: { color: colors.primaryDeep, fontWeight: '700' },
  menuProfile: { color: colors.steel, fontSize: 13, padding: space.sm },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pageButton: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 12 },
  pageText: { color: colors.primaryDeep, fontWeight: '700' },
});
