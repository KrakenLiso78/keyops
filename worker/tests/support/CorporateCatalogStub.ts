import fixture from "../fixtures/catalog/applications.json";

export class CorporateCatalogStub {
  calls: Array<{ method: string; url: string; authorization?: string }> = [];
  status = 200;
  payload: unknown = structuredClone(fixture);

  fetch: typeof fetch = async (input, init = {}) => {
    const url = new URL(
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input
          : input.url,
    );
    const headers = new Headers(init.headers);
    this.calls.push({
      method: init.method ?? "GET",
      url: url.toString(),
      authorization: headers.get("authorization") ?? undefined,
    });
    if (this.status !== 200) {
      return Response.json(
        { code: "provider_error", message: "simulated" },
        { status: this.status },
      );
    }
    if (url.pathname.match(/\/applications\/[^/]+$/u)) {
      const id = decodeURIComponent(url.pathname.split("/").at(-1)!);
      const page = this.payload as typeof fixture;
      const item = page.items.find(
        (candidate) =>
          candidate.externalApplicationId === id &&
          candidate.environment === url.searchParams.get("environment"),
      );
      return item
        ? Response.json(item)
        : Response.json({ code: "not_found" }, { status: 404 });
    }
    const page = structuredClone(this.payload) as typeof fixture;
    page.items = page.items.filter(
      (item) => item.environment === url.searchParams.get("environment"),
    );
    return Response.json(page);
  };
}
