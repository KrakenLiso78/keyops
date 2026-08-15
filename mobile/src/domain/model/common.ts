export type EntityId = string;
export type Instant = string;
export type Environment = 'test' | 'production';
export type UserProfile = 'analyst' | 'senior_analyst' | 'administrator' | 'auditor';
export const permissionValues = [
  'applications:read',
  'credentials:issue',
  'credentials:regenerate',
  'credentials:deliver',
  'credentials:suspend',
  'credentials:reactivate',
  'credentials:revoke',
  'management:write',
  'usage:read',
  'audit:read',
  'users:write',
] as const;
export type Permission = (typeof permissionValues)[number];

export interface Institution {
  id: EntityId;
  name: string;
}
export interface ApiRole {
  id: EntityId;
  name: string;
  serviceIdentifiers: string[];
}
export const isEnvironment = (value: unknown): value is Environment =>
  value === 'test' || value === 'production';
export const isIsoInstant = (value: string) =>
  !Number.isNaN(Date.parse(value)) && value.endsWith('Z');
