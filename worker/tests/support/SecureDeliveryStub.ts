import type {
  PrepareSecureDeliveryCommand,
  SafeDeliveryReference,
  SecureDeliveryPort,
} from "../../src/delivery/SecureDeliveryPort";
import { ApiError } from "../../src/http/ApiError";

interface TestDeliveryMaterial {
  otp: string;
  zipPassword: string;
  encryptedZip: Uint8Array;
  expiresAt: string;
  consumedAt?: string;
}

export class SecureDeliveryStub implements SecureDeliveryPort {
  readonly calls: PrepareSecureDeliveryCommand[] = [];
  private readonly references = new Map<string, SafeDeliveryReference>();
  private readonly material = new Map<string, TestDeliveryMaterial>();
  private failNext = false;

  constructor(
    private readonly now: () => number = () =>
      new Date("2026-08-15T12:00:00.000Z").getTime(),
  ) {}

  failNextPreparation(): void {
    this.failNext = true;
  }

  async prepare(
    command: PrepareSecureDeliveryCommand,
  ): Promise<SafeDeliveryReference> {
    this.calls.push(structuredClone(command));
    const replay = this.references.get(command.operationId);
    if (replay) return structuredClone(replay);
    if (this.failNext) {
      this.failNext = false;
      throw new ApiError(
        503,
        "delivery_unavailable",
        "Injected failure.",
        true,
      );
    }
    const deliveryId = `delivery-${command.operationId}`;
    const otp = "482193";
    const zipPassword = `zip-${command.operationId}-password`;
    const expiresAt = new Date(this.now() + 2 * 60 * 1_000).toISOString();
    const reference = {
      deliveryId,
      expiresAt,
      passwordChannelId: "corporate-email",
      otpChannelId: "corporate-sms",
    };
    this.references.set(command.operationId, reference);
    this.material.set(deliveryId, {
      otp,
      zipPassword,
      encryptedZip: new Uint8Array([0x50, 0x4b, 0x03, 0x04, 0x01]),
      expiresAt,
    });
    return structuredClone(reference);
  }

  consumeForTest(deliveryId: string, otp: string) {
    const material = this.material.get(deliveryId);
    if (!material || material.consumedAt) {
      throw new ApiError(410, "otp_already_used", "OTP unavailable.");
    }
    if (new Date(material.expiresAt).getTime() <= this.now()) {
      throw new ApiError(410, "otp_expired", "OTP expired.");
    }
    if (otp !== material.otp) {
      throw new ApiError(403, "otp_invalid", "OTP invalid.");
    }
    material.consumedAt = new Date(this.now()).toISOString();
    return structuredClone(material);
  }

  materialForTest(deliveryId: string) {
    return structuredClone(this.material.get(deliveryId));
  }
}
