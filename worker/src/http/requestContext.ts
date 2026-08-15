import type { AuthorizedUser } from "../airtable/userSchema";

export interface RequestContext {
  requestId: string;
  originIp: string;
  startedAt: string;
  actor?: AuthorizedUser;
  auditRecorded?: boolean;
}

function normalizeIp(value: string | null): string {
  const candidate = value?.trim();
  if (!candidate || candidate.length > 45) return "unknown";
  if (/^\d{1,3}(?:\.\d{1,3}){3}$/u.test(candidate)) {
    return candidate
      .split(".")
      .every((part) => Number(part) >= 0 && Number(part) <= 255)
      ? candidate
      : "unknown";
  }
  if (/^[0-9a-f:]+$/iu.test(candidate) && candidate.includes(":")) {
    try {
      new URL(`http://[${candidate}]/`);
      return candidate.toLowerCase();
    } catch {
      return "unknown";
    }
  }
  return "unknown";
}

export function createRequestContext(request: Request): RequestContext {
  const supplied = request.headers.get("x-request-id");
  return {
    requestId:
      supplied && /^[A-Za-z0-9._:-]{8,128}$/.test(supplied)
        ? supplied
        : crypto.randomUUID(),
    originIp: normalizeIp(request.headers.get("cf-connecting-ip")),
    startedAt: new Date().toISOString(),
  };
}

export function withRequestActor(
  context: RequestContext,
  actor: AuthorizedUser,
): RequestContext {
  context.actor = actor;
  return context;
}

export function markAuditRecorded(context: RequestContext): void {
  context.auditRecorded = true;
}
