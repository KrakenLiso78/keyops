export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly retryable = false,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function errorResponse(
  error: unknown,
  requestId: string,
  contractVersion = "1",
): Response {
  const controlled =
    error instanceof ApiError
      ? error
      : new ApiError(
          500,
          "unexpected_error",
          "No se pudo completar la solicitud.",
          true,
        );
  return Response.json(
    {
      contractVersion,
      code: controlled.code,
      message: controlled.message,
      requestId,
      retryable: controlled.retryable,
    },
    { status: controlled.status, headers: { "x-request-id": requestId } },
  );
}
