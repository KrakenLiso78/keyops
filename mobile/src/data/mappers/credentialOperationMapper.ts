import {
  credentialOperationSchema,
  realCredentialOperationSchema,
  syntheticArtifactSchema,
} from '@/data/schemas/credentialOperation';

export const mapCredentialOperation = (input: unknown) => credentialOperationSchema.parse(input);
export const mapRealCredentialOperation = (input: unknown) =>
  realCredentialOperationSchema.parse(input);
export const mapSyntheticArtifact = (input: unknown) => syntheticArtifactSchema.parse(input);
