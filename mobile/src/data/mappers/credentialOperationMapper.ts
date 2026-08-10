import { credentialOperationSchema } from '@/data/schemas/credentialOperation';

export const mapCredentialOperation = (input: unknown) => credentialOperationSchema.parse(input);
