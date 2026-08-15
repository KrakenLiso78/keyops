export function healthResponse(requestId: string): Response {
  return Response.json(
    { contractVersion: "1", service: "keyops-worker", status: "ok", requestId },
    { headers: { "cache-control": "no-store", "x-request-id": requestId } },
  );
}
