import { Pressable, StyleSheet, Text, View } from 'react-native';
import type {
  AuditEvent,
  AuditFilters as AuditFilterValues,
  OperationResult,
} from '@/domain/model/audit';
import { Body, Button, Card, Field } from '@/presentation/components/base';
import { EnvironmentBadge, SectionLabel } from '@/presentation/components/chrome';
import { EmptyState, LoadingState, PersistentError } from '@/presentation/components/feedback';
import { colors, space } from '@/presentation/design-system';

const operationLabels: Record<string, string> = {
  'session.create.v1': 'Inicio de sesión',
  'session.restore.v1': 'Restauración de sesión',
  'application.list.v1': 'Consulta de aplicaciones',
  'application.view.v1': 'Consulta de detalle',
  'application.update.v1': 'Actualización de gestión',
  'credential.issue.v1': 'Emisión de credenciales',
  'credential.regenerate.v1': 'Regeneración de credenciales',
  'credential.suspend.v1': 'Suspensión de credenciales',
  'credential.reactivate.v1': 'Reactivación de credenciales',
  'credential.revoke.v1': 'Revocación de credenciales',
  'credential.delivery.v1': 'Generación de entrega',
  'delivery.consume.v1': 'Consumo de entrega',
  'audit.list.v1': 'Consulta de auditoría',
};

const resultContent: Record<OperationResult, { label: string; tone: string; color: string }> = {
  succeeded: { label: 'Completada', tone: colors.mint, color: colors.success },
  failed: { label: 'Fallida', tone: colors.rose, color: colors.error },
  rejected: { label: 'Rechazada', tone: colors.yellow, color: colors.warning },
};

export function AuditEventCard({ event }: { event: AuditEvent }) {
  const result = resultContent[event.result];
  return (
    <Card style={styles.eventCard}>
      <View style={styles.eventHeader}>
        <Text style={styles.operation}>{operationLabels[event.operation] ?? event.operation}</Text>
        <View style={[styles.resultBadge, { backgroundColor: result.tone }]}>
          <Text style={[styles.resultText, { color: result.color }]}>{result.label}</Text>
        </View>
      </View>
      {event.environment ? <EnvironmentBadge environment={event.environment} /> : null}
      <Body>{event.actorDisplayName}</Body>
      <Text style={styles.timestamp}>{new Date(event.occurredAt).toLocaleString('es-ES')}</Text>
      {event.institutionId || event.applicationId ? (
        <Body>{[event.institutionId, event.applicationId].filter(Boolean).join(' · ')}</Body>
      ) : null}
      {event.failureCause ? <Text style={styles.failure}>{event.failureCause}</Text> : null}
      <View style={styles.divider} />
      <SectionLabel>Solicitud</SectionLabel>
      <Text selectable style={styles.requestId}>
        {event.requestId}
      </Text>
    </Card>
  );
}

type FilterProps = {
  filters: AuditFilterValues;
  setFrom: (value: string) => void;
  setTo: (value: string) => void;
  setInstitutionId: (value: string) => void;
  setApplicationId: (value: string) => void;
  setActorUserId: (value: string) => void;
  setResult: (value: OperationResult | undefined) => void;
};

export function AuditFilters({
  filters,
  setFrom,
  setTo,
  setInstitutionId,
  setApplicationId,
  setActorUserId,
  setResult,
}: FilterProps) {
  return (
    <Card tone="lavender" style={styles.filters}>
      <Text style={styles.filterTitle}>Filtros</Text>
      <View style={styles.dateRow}>
        <View style={styles.dateField}>
          <Field
            label="Desde"
            accessibilityHint="Fecha y hora ISO"
            placeholder="2026-08-15T00:00:00Z"
            value={filters.from ?? ''}
            onChangeText={setFrom}
            autoCapitalize="none"
          />
        </View>
        <View style={styles.dateField}>
          <Field
            label="Hasta"
            accessibilityHint="Fecha y hora ISO"
            placeholder="2026-08-15T23:59:59Z"
            value={filters.to ?? ''}
            onChangeText={setTo}
            autoCapitalize="none"
          />
        </View>
      </View>
      <Field
        label="Institución"
        value={filters.institutionId ?? ''}
        onChangeText={setInstitutionId}
        placeholder="Identificador de institución"
      />
      <Field
        label="Aplicación"
        value={filters.applicationId ?? ''}
        onChangeText={setApplicationId}
        placeholder="Identificador de aplicación"
      />
      <Field
        label="Usuario"
        value={filters.actorUserId ?? ''}
        onChangeText={setActorUserId}
        placeholder="Identificador de usuario"
      />
      <SectionLabel>Resultado</SectionLabel>
      <View style={styles.resultOptions}>
        {[
          ['Todos', undefined],
          ['Completadas', 'succeeded'],
          ['Fallidas', 'failed'],
          ['Rechazadas', 'rejected'],
        ].map(([label, value]) => {
          const selected = filters.result === value;
          return (
            <Pressable
              key={label}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={`Resultado: ${label}`}
              onPress={() => setResult(value as OperationResult | undefined)}
              style={[styles.resultOption, selected && styles.resultOptionSelected]}
            >
              <Text style={[styles.resultOptionText, selected && styles.resultOptionTextSelected]}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </Card>
  );
}

export type AuditListProps = FilterProps & {
  authorized: boolean;
  status: 'idle' | 'loading' | 'success' | 'error';
  error?: string;
  items: AuditEvent[];
  total: number;
  page: number;
  pageSize: number;
  setPage: (page: number) => void;
  retry: () => void;
};

export function AuditList(props: AuditListProps) {
  if (!props.authorized) {
    return (
      <Card tone="rose">
        <Text style={styles.emptyTitle}>Acceso no autorizado</Text>
        <Body>No tienes permiso para consultar la auditoría.</Body>
      </Card>
    );
  }
  return (
    <View style={styles.list}>
      <AuditFilters {...props} />
      {props.status === 'loading' ? <LoadingState label="Cargando auditoría…" /> : null}
      {props.status === 'error' ? (
        <PersistentError
          message={props.error ?? 'No se pudo cargar la auditoría.'}
          onRetry={props.retry}
        />
      ) : null}
      {props.status === 'success' && props.items.length === 0 ? (
        <EmptyState message="No hay eventos que coincidan con los filtros aplicados." />
      ) : null}
      {props.status === 'success' ? (
        <>
          {props.items.map((event) => (
            <AuditEventCard key={event.id} event={event} />
          ))}
          <Text style={styles.total}>
            {props.total} {props.total === 1 ? 'evento' : 'eventos'}
          </Text>
          {props.total > props.pageSize ? (
            <View style={styles.pagination}>
              <View style={styles.pageAction}>
                <Button
                  title="Anterior"
                  variant="secondary"
                  disabled={props.page === 1}
                  onPress={() => props.setPage(props.page - 1)}
                />
              </View>
              <Text style={styles.pageLabel}>Página {props.page}</Text>
              <View style={styles.pageAction}>
                <Button
                  title="Siguiente"
                  variant="secondary"
                  disabled={props.page * props.pageSize >= props.total}
                  onPress={() => props.setPage(props.page + 1)}
                />
              </View>
            </View>
          ) : null}
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: space.md },
  filters: { gap: space.sm },
  filterTitle: { color: colors.navy, fontSize: 18, fontWeight: '800' },
  dateRow: { flexDirection: 'row', gap: space.sm },
  dateField: { flex: 1 },
  resultOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs },
  resultOption: {
    minHeight: 44,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: 22,
    backgroundColor: colors.canvas,
    paddingHorizontal: space.sm,
  },
  resultOptionSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  resultOptionText: { color: colors.ink, fontSize: 14, fontWeight: '700' },
  resultOptionTextSelected: { color: colors.canvas },
  eventCard: { gap: space.sm },
  eventHeader: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: space.xs,
  },
  operation: { flex: 1, color: colors.navy, fontSize: 17, fontWeight: '800' },
  resultBadge: { borderRadius: 14, paddingHorizontal: 10, paddingVertical: 5 },
  resultText: { fontSize: 13, fontWeight: '700' },
  timestamp: { color: colors.steel, fontSize: 14 },
  failure: { color: colors.error, fontSize: 14, fontWeight: '700' },
  divider: { height: 1, backgroundColor: colors.hairline },
  requestId: { color: colors.primaryDeep, fontFamily: 'monospace', fontSize: 13 },
  emptyTitle: { color: colors.navy, fontSize: 18, fontWeight: '800' },
  total: { color: colors.slate, textAlign: 'center', fontSize: 14 },
  pagination: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  pageAction: { flex: 1 },
  pageLabel: { color: colors.ink, fontWeight: '700' },
});
