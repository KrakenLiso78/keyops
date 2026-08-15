import { describe, expect, it, vi } from "vitest";
import { CredentialProviderHttpAdapter } from "../../src/credentials/real/CredentialProviderHttpAdapter";
import {
  containsForbiddenSecretKey,
  redactRealCredential,
} from "../../src/credentials/real/redactRealCredential";
import { SecureDeliveryHttpAdapter } from "../../src/delivery/SecureDeliveryHttpAdapter";

describe("real credential secret redaction", () => {
  it("removes forbidden secret-bearing fields recursively", () => {
    const unsafe = {
      providerOperationId: "operation-1",
      clientSecret: "forbidden",
      nested: { otp: "482193", safe: "reference" },
    };

    expect(containsForbiddenSecretKey(unsafe)).toBe(true);
    expect(redactRealCredential(unsafe)).toEqual({
      providerOperationId: "operation-1",
      nested: { safe: "reference" },
    });
  });

  it("rejects provider and delivery responses containing secret fields", async () => {
    const providerFetch = vi.fn<typeof fetch>().mockResolvedValue(
      Response.json({
        providerOperationId: "operation-1",
        status: "confirmed",
        clientSecret: "must-not-cross-boundary",
      }),
    );
    const deliveryFetch = vi.fn<typeof fetch>().mockResolvedValue(
      Response.json({
        deliveryId: "delivery-1",
        expiresAt: "2026-08-15T12:02:00.000Z",
        passwordChannelId: "email",
        otpChannelId: "sms",
        otp: "482193",
      }),
    );

    await expect(
      new CredentialProviderHttpAdapter({
        baseUrl: "https://provider.test",
        token: "provider-token-value",
        fetcher: providerFetch,
      }).issue({
        operationId: "operation-1",
        applicationId: "app-test",
        environment: "test",
      }),
    ).rejects.toMatchObject({ code: "credential_provider_unsafe_response" });
    await expect(
      new SecureDeliveryHttpAdapter({
        baseUrl: "https://delivery.test",
        token: "delivery-token-value",
        fetcher: deliveryFetch,
      }).prepare({
        operationId: "operation-1",
        sealedDeliveryHandle: "sealed-1",
      }),
    ).rejects.toMatchObject({ code: "secure_delivery_unsafe_response" });
  });
});
