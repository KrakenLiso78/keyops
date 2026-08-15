export interface RequestContext {
  requestId: string;
  originIp: string;
  startedAt: string;
}

export function createRequestContext(request: Request): RequestContext {
  const supplied = request.headers.get("x-request-id");
  return {
    requestId:
      supplied && /^[A-Za-z0-9._:-]{8,128}$/.test(supplied)
        ? supplied
        : crypto.randomUUID(),
    originIp: request.headers.get("cf-connecting-ip") ?? "unknown",
    startedAt: new Date().toISOString(),
  };
}
