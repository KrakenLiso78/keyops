import { z } from "zod";
import { ApiError } from "../http/ApiError";
import type {
  ComplianceAppendReceipt,
  ComplianceAuditPort,
  ComplianceEventPage,
  ComplianceIntegrityResult,
  ComplianceQuery,
  RecoveryEvidence,
  RecoveryProbeRequest,
} from "./ComplianceAuditPort";
import type { ComplianceEvent, ComplianceStoredEvent } from "./eventEnvelope";
import { integrityStatusSchema } from "./eventEnvelope";
import { readComplianceEvent } from "./schemaRegistry";

const receiptSchema = z
  .object({
    eventId: z.string(),
    providerRecordId: z.string().min(1),
    acceptedAt: z.string().datetime({ offset: true }),
    retentionUntil: z.string().datetime({ offset: true }),
    integrityReference: z.string().min(1),
    integrity: integrityStatusSchema,
  })
  .strict();
const integritySchema = z
  .object({
    eventId: z.string(),
    status: integrityStatusSchema,
    verifiedAt: z.string().datetime({ offset: true }),
    retentionUntil: z.string().datetime({ offset: true }),
  })
  .strict();
const recoverySchema = z
  .object({
    runId: z.string().min(1),
    completedAt: z.string().datetime({ offset: true }),
    sourceCount: z.number().int().nonnegative(),
    recoveredCount: z.number().int().nonnegative(),
    firstEventId: z.string().optional(),
    lastEventId: z.string().optional(),
    countMatches: z.boolean(),
    orderMatches: z.boolean(),
    integrityVerified: z.boolean(),
  })
  .strict();

export class ComplianceAuditHttpAdapter implements ComplianceAuditPort {
  private readonly baseUrl: string;

  constructor(
    configuration: {
      baseUrl: string;
      appendToken: string;
      queryToken: string;
    },
    private readonly fetcher: typeof fetch = fetch,
  ) {
    this.baseUrl = configuration.baseUrl.replace(/\/$/u, "");
    this.appendToken = configuration.appendToken;
    this.queryToken = configuration.queryToken;
  }

  private readonly appendToken: string;
  private readonly queryToken: string;

  async append(event: ComplianceEvent, idempotencyKey: string) {
    return receiptSchema.parse(
      await this.request(
        "/events",
        {
          method: "POST",
          headers: {
            authorization: `Bearer ${this.appendToken}`,
            "content-type": "application/json",
            "idempotency-key": idempotencyKey,
          },
          body: JSON.stringify(event),
        },
        201,
      ),
    );
  }

  async get(eventId: string): Promise<ComplianceStoredEvent | undefined> {
    const response = await this.raw(
      `/events/${encodeURIComponent(eventId)}`,
      this.queryHeaders(),
    );
    if (response.status === 404) return undefined;
    return readComplianceEvent(await this.parse(response, 200));
  }

  async query(query: ComplianceQuery): Promise<ComplianceEventPage> {
    const parameters = new URLSearchParams({ limit: String(query.limit) });
    for (const key of [
      "from",
      "to",
      "applicationId",
      "actorUserId",
      "result",
      "cursor",
    ] as const) {
      const value = query[key];
      if (value) parameters.set(key, value);
    }
    const body = z
      .object({
        items: z.array(z.unknown()),
        nextCursor: z.string().optional(),
      })
      .strict()
      .parse(
        await this.request(`/events?${parameters}`, this.queryHeaders(), 200),
      );
    return {
      items: body.items.map(readComplianceEvent),
      nextCursor: body.nextCursor,
    };
  }

  async verify(eventId: string): Promise<ComplianceIntegrityResult> {
    return integritySchema.parse(
      await this.request(
        `/events/${encodeURIComponent(eventId)}/integrity`,
        this.queryHeaders(),
        200,
      ),
    );
  }

  async runRecoveryProbe(
    request: RecoveryProbeRequest,
  ): Promise<RecoveryEvidence> {
    return recoverySchema.parse(
      await this.request(
        "/recovery-probes",
        {
          method: "POST",
          headers: {
            authorization: `Bearer ${this.queryToken}`,
            "content-type": "application/json",
          },
          body: JSON.stringify(request),
        },
        200,
      ),
    );
  }

  private queryHeaders(): RequestInit {
    return { headers: { authorization: `Bearer ${this.queryToken}` } };
  }

  private async request(
    path: string,
    init: RequestInit,
    expectedStatus: number,
  ): Promise<unknown> {
    return this.parse(await this.raw(path, init), expectedStatus);
  }

  private async raw(path: string, init: RequestInit): Promise<Response> {
    try {
      return await this.fetcher(`${this.baseUrl}${path}`, init);
    } catch {
      throw new ApiError(
        503,
        "compliance_store_unavailable",
        "El almacén de cumplimiento no está disponible.",
        true,
      );
    }
  }

  private async parse(
    response: Response,
    expectedStatus: number,
  ): Promise<unknown> {
    const body = await response.json().catch(() => undefined);
    if (response.status !== expectedStatus) {
      throw new ApiError(
        response.status >= 500 ? 503 : response.status,
        response.status === 409
          ? "compliance_event_conflict"
          : "compliance_store_rejected",
        "El almacén de cumplimiento rechazó la solicitud.",
        response.status >= 500,
      );
    }
    return body;
  }
}
