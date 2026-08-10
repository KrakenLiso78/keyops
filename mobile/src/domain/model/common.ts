export type EntityId = string;
export type Instant = string;
export type Environment = 'test' | 'production';
export type UserProfile = 'analyst' | 'senior_analyst' | 'administrator' | 'auditor';
export type Permission =
  | 'applications:read'
  | 'credentials:issue'
  | 'credentials:transition'
  | 'credentials:revoke'
  | 'audit:read'
  | 'users:manage';

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
