import { describe, expect, it } from "vitest";
import { prepareSecureDelivery } from "../../src/delivery/prepareSecureDelivery";
import { SecureDeliveryStub } from "../support/SecureDeliveryStub";

describe("secure delivery boundary", () => {
  it("returns only an expiring reference with separate channels", async () => {
    const now = new Date("2026-08-15T12:00:00.000Z").getTime();
    const delivery = new SecureDeliveryStub(() => now);
    const first = await prepareSecureDelivery({
      delivery,
      operationId: "operation-delivery",
      sealedDeliveryHandle: "sealed-delivery",
      now: () => now,
    });
    const replay = await prepareSecureDelivery({
      delivery,
      operationId: "operation-delivery",
      sealedDeliveryHandle: "sealed-delivery",
      now: () => now,
    });

    expect(replay).toEqual(first);
    expect(first.passwordChannelId).not.toBe(first.otpChannelId);
    expect(first.expiresAt).toBe("2026-08-15T12:02:00.000Z");
    expect(Object.keys(first).toSorted()).toEqual([
      "deliveryId",
      "expiresAt",
      "otpChannelId",
      "passwordChannelId",
    ]);
    expect(JSON.stringify(first)).not.toMatch(
      /482193|client.?secret|download/iu,
    );
  });
});
