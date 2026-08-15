import { ApiError } from './ApiError';
import { errorSchema } from '@/data/schemas/error';
export class FetchHttpClient {
  constructor(
    private readonly baseUrl: string,
    private readonly getToken: () => Promise<string | undefined>,
    private readonly timeoutMs = 10_000,
  ) {}

  resolve(path: string): string {
    return `${this.baseUrl}${path}`;
  }
  async request<T>(path: string, init: RequestInit = {}, signal?: AbortSignal): Promise<T> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    const token = await this.getToken();
    const onAbort = () => controller.abort();
    signal?.addEventListener('abort', onAbort, { once: true });
    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        ...init,
        signal: controller.signal,
        headers: {
          accept: 'application/json',
          ...(init.body ? { 'content-type': 'application/json' } : {}),
          ...(token ? { authorization: `Bearer ${token}` } : {}),
          ...init.headers,
        },
      });
      if (!response.ok) {
        const parsed = errorSchema.safeParse(await response.json().catch(() => ({})));
        throw new ApiError(
          response.status,
          parsed.success ? parsed.data.code : 'unexpected_error',
          parsed.success ? parsed.data.message : 'No se pudo completar la solicitud.',
          parsed.success ? parsed.data.requestId : undefined,
          parsed.success ? parsed.data.retryable : false,
        );
      }
      return response.status === 204 ? (undefined as T) : ((await response.json()) as T);
    } catch (error) {
      if (error instanceof ApiError || error instanceof DOMException) throw error;
      throw new ApiError(
        0,
        'network_error',
        'No se pudo conectar con el servicio.',
        undefined,
        true,
      );
    } finally {
      clearTimeout(timer);
      signal?.removeEventListener('abort', onAbort);
    }
  }
}
