import { describe, expect, it } from "vitest";
import { AirtableClient } from "../../src/airtable/AirtableClient";
import { AuditEventRepository } from "../../src/airtable/AuditEventRepository";
import { AuditRecorder } from "../../src/audit/AuditRecorder";

declare const process: { env: Record<string, string | undefined> };

const enabled = process.env.RUN_AIRTABLE_INTEGRATION === "1";

async function removeTestRun(baseId: string, token: string, testRunId: string) {
  const tableUrl = `https://api.airtable.com/v0/${baseId}/AuditEvents`;
  const response = await fetch(tableUrl, {
    headers: { authorization: `Bearer ${token}` },
  });
  if (!response.ok)
    throw new Error(`No se pudo leer AuditEvents (${response.status}).`);
  const payload = (await response.json()) as {
    records: Array<{ id: string; fields: Record<string, unknown> }>;
  };
  const owned = payload.records.filter(
    ({ fields }) => fields.testRunId === testRunId,
  );
  for (let index = 0; index < owned.length; index += 10) {
    const url = new URL(tableUrl);
    for (const { id } of owned.slice(index, index + 10))
      url.searchParams.append("records[]", id);
    const deleted = await fetch(url, {
      method: "DELETE",
      headers: { authorization: `Bearer ${token}` },
    });
    if (!deleted.ok)
      throw new Error(`No se pudo limpiar AuditEvents (${deleted.status}).`);
  }
}

describe.skipIf(!enabled)("Airtable persistent audit", () => {
  it("reads success, failure and rejection from a fresh repository", async () => {
    const baseId = process.env.AIRTABLE_BASE_ID;
    const token = process.env.AIRTABLE_PAT;
    if (!baseId || !token)
      throw new Error("Faltan AIRTABLE_BASE_ID o AIRTABLE_PAT.");
    const testRunId = `audit-integration-${Date.now()}`;
    const context = {
      requestId: "request-integration-audit",
      originIp: "203.0.113.50",
      startedAt: new Date().toISOString(),
    };
    try {
      const recorder = new AuditRecorder(
        new AuditEventRepository(new AirtableClient({ baseId, token })),
      );
      for (const [index, result] of [
        "succeeded",
        "failed",
        "rejected",
      ].entries()) {
        await recorder.append({
          operation: "credential.issue.v1",
          resourceType: "credential",
          resourceId: `cred-integration-${index}`,
          environment: "test",
          applicationId: `app-integration-${index}`,
          result: result as "succeeded" | "failed" | "rejected",
          failureCode:
            result === "succeeded" ? undefined : "integration_outcome",
          operationId: `operation-integration-${testRunId}-${index}`,
          testRunId,
          context: { ...context, requestId: `${context.requestId}-${index}` },
        });
      }

      const fresh = new AuditEventRepository(
        new AirtableClient({ baseId, token }),
      );
      const persisted = (await fresh.list()).filter(
        ({ fields }) => fields.testRunId === testRunId,
      );
      expect(persisted).toHaveLength(3);
      expect(new Set(persisted.map(({ fields }) => fields.result))).toEqual(
        new Set(["succeeded", "failed", "rejected"]),
      );
    } finally {
      await removeTestRun(baseId, token, testRunId);
    }
  });
});
