export interface PrepareSecureDeliveryCommand {
  operationId: string;
  sealedDeliveryHandle: string;
}

export interface SafeDeliveryReference {
  deliveryId: string;
  expiresAt: string;
  passwordChannelId: string;
  otpChannelId: string;
}

export interface SecureDeliveryPort {
  prepare(
    command: PrepareSecureDeliveryCommand,
  ): Promise<SafeDeliveryReference>;
}
