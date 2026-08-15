import { describe, expect, it } from "vitest";
import { realOperationReceiptSchema } from "../../src/credentials/real/realCredentialSchemas";

describe("secure delivery receipt v2 contract", () => {
  it("accepts only an opaque delivery identifier and expiry", () => {
    const parsed = realOperationReceiptSchema.parse({
      operationId: "operation-1",
      requestId: "request-1",
      status: "confirmed",
      result: "succeeded",
      delivery: {
        deliveryId: "delivery-1",
        expiresAt: "2026-08-15T12:02:00.000Z",
      },
    });
    expect(parsed.delivery).toEqual({
      deliveryId: "delivery-1",
      expiresAt: "2026-08-15T12:02:00.000Z",
    });
    expect(() =>
      realOperationReceiptSchema.parse({
        ...parsed,
        delivery: { ...parsed.delivery, otp: "482193" },
      }),
    ).toThrow();
  });
});
