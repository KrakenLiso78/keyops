export function healthResponse(
  requestId: string,
  mode: "fake" | "real",
): Response {
  return Response.json(
    {
      contractVersion: "1",
      service: "keyops-worker",
      status: "ok",
      mode,
      requestId,
    },
    { headers: { "cache-control": "no-store", "x-request-id": requestId } },
  );
}
