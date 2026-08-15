import { describe, expect, it } from "vitest";
import { SecureDeliveryStub } from "../support/SecureDeliveryStub";

describe("secure delivery stub flow", () => {
  it("uses a distinct password and rejects OTP reuse", async () => {
    let now = new Date("2026-08-15T12:00:00.000Z").getTime();
    const delivery = new SecureDeliveryStub(() => now);
    const reference = await delivery.prepare({
      operationId: "operation-one-use",
      sealedDeliveryHandle: "sealed-one-use",
    });
    const material = delivery.materialForTest(reference.deliveryId)!;

    expect(material.zipPassword).not.toBe(material.otp);
    expect(
      delivery.consumeForTest(reference.deliveryId, material.otp),
    ).toMatchObject({
      zipPassword: material.zipPassword,
    });
    expect(() =>
      delivery.consumeForTest(reference.deliveryId, material.otp),
    ).toThrow("OTP unavailable");

    const expiring = await delivery.prepare({
      operationId: "operation-expiring",
      sealedDeliveryHandle: "sealed-expiring",
    });
    const expiringMaterial = delivery.materialForTest(expiring.deliveryId)!;
    now += 2 * 60 * 1_000;
    expect(() =>
      delivery.consumeForTest(expiring.deliveryId, expiringMaterial.otp),
    ).toThrow("OTP expired");
  });
});
