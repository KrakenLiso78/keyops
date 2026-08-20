import { describe, expect, it, vi } from "vitest";
import current from "../fixtures/compliance/event-v2.json";
import { ComplianceAuditHttpAdapter } from "../../src/compliance/ComplianceAuditHttpAdapter";
import { readComplianceEvent } from "../../src/compliance/schemaRegistry";

describe("ComplianceAuditHttpAdapter", () => {
  it("uses separated append/query credentials and validates strict responses", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        Response.json(
          {
            eventId: current.eventId,
            providerRecordId: "provider-record-1",
            acceptedAt: current.occurredAt,
            retentionUntil: current.retentionUntil,
            integrityReference: current.integrityReference,
            integrity: "verified",
          },
          { status: 201 },
        ),
      )
      .mockResolvedValueOnce(
        Response.json({ items: [current], nextCursor: "cursor:1" }),
      );
    const adapter = new ComplianceAuditHttpAdapter(
      {
        baseUrl: "https://compliance.example.invalid",
        appendToken: "append-only-token-value",
        queryToken: "query-only-token-value",
      },
      fetcher,
    );
    const {
      integrityReference: _proof,
      integrity: _integrity,
      ...event
    } = readComplianceEvent(current);

    await expect(adapter.append(event, event.eventId)).resolves.toMatchObject({
      integrity: "verified",
    });
    await expect(adapter.query({ limit: 20 })).resolves.toMatchObject({
      items: [expect.objectContaining({ eventId: current.eventId })],
      nextCursor: "cursor:1",
    });
    expect(fetcher.mock.calls[0]?.[1]?.headers).toMatchObject({
      authorization: "Bearer append-only-token-value",
    });
    expect(fetcher.mock.calls[1]?.[1]?.headers).toMatchObject({
      authorization: "Bearer query-only-token-value",
    });
  });

  it("maps network loss to a retryable controlled error", async () => {
    const adapter = new ComplianceAuditHttpAdapter(
      {
        baseUrl: "https://compliance.example.invalid",
        appendToken: "append-only-token-value",
        queryToken: "query-only-token-value",
      },
      vi.fn<typeof fetch>().mockRejectedValue(new Error("network")),
    );

    await expect(adapter.query({ limit: 20 })).rejects.toMatchObject({
      code: "compliance_store_unavailable",
      retryable: true,
    });
  });
});
