import { describe, expect, it } from "vitest";
import legacy from "../fixtures/compliance/event-v1.json";
import current from "../fixtures/compliance/event-v2.json";
import { readComplianceEvent } from "../../src/compliance/schemaRegistry";

describe("compliance schema registry", () => {
  it("reads current events and upcasts historical version one", () => {
    expect(readComplianceEvent(current)).toEqual(current);
    expect(readComplianceEvent(legacy)).toMatchObject({
      eventId: legacy.eventId,
      schemaVersion: 2,
      occurredAt: legacy.timestamp,
      actorUserId: legacy.actorId,
      operation: legacy.action,
      result: legacy.outcome,
      requestId: legacy.correlationId,
      integrity: "verified",
    });
  });

  it("rejects an unknown or incompatible schema", () => {
    expect(() =>
      readComplianceEvent({ ...current, schemaVersion: 99 }),
    ).toThrow(
      expect.objectContaining({ code: "unsupported_compliance_schema" }),
    );
  });
});
