import { createServer, get } from 'node:http';

describe('stub de contrato local', () => {
  it('expone una respuesta versionada y una evidencia simulada', async () => {
    const server = createServer((_request, response) => {
      response.setHeader('content-type', 'application/json');
      response.end(
        JSON.stringify({
          contractVersion: '1',
          requestId: 'req-local',
          auditEventId: 'aud-local',
          result: 'succeeded',
        }),
      );
    });
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('Stub no disponible');
    const body = await new Promise<{
      contractVersion: string;
      requestId: string;
      auditEventId: string;
      result: string;
    }>((resolve, reject) => {
      get(`http://127.0.0.1:${address.port}/v1/test/applications`, (response) => {
        let text = '';
        response.setEncoding('utf8');
        response.on('data', (chunk) => (text += chunk));
        response.on('end', () => resolve(JSON.parse(text)));
      }).on('error', reject);
    });
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
    expect(body).toEqual({
      contractVersion: '1',
      requestId: 'req-local',
      auditEventId: 'aud-local',
      result: 'succeeded',
    });
  });
});
