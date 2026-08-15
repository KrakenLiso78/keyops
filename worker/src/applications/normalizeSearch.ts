export function normalizeSearch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/gu, "")
    .toLocaleLowerCase("es")
    .trim()
    .replace(/\s+/gu, " ");
}

export function applicationSearchText(fields: {
  name: string;
  institution: string;
  role: string;
  credentialState: string;
  declaredIps: string[];
  contact?: { name: string; email?: string; phone?: string };
  requestOrTicketId?: string;
  clientId?: string;
  historyActors?: string[];
}): string {
  return normalizeSearch(
    [
      fields.name,
      fields.institution,
      fields.role,
      fields.credentialState,
      ...fields.declaredIps,
      fields.contact?.name,
      fields.contact?.email,
      fields.contact?.phone,
      fields.requestOrTicketId,
      fields.clientId,
      ...(fields.historyActors ?? []),
    ]
      .filter(Boolean)
      .join(" "),
  );
}
