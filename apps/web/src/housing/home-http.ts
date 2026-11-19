export class HousingRequestError extends Error {
  constructor(message: string, readonly rejected = false) { super(message); }
}
/** A timeout cannot tell whether a mutation committed: callers must retain its operation id. */
export async function housingRequest<T = any>(path: string, body: unknown, options: { signal?: AbortSignal; timeoutMs?: number } = {}): Promise<T> {
  const timeout = AbortSignal.timeout(options.timeoutMs ?? 12000);
  const signal = options.signal ? AbortSignal.any([options.signal, timeout]) : timeout;
  try {
    const response = await fetch(`/api/housing/${path}`, { method: "POST", credentials: "same-origin",
      headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), signal });
    const data = await response.json();
    if (!response.ok) throw new HousingRequestError(data.error ?? "Le serveur n’a pas confirmé cette opération.", response.status >= 400 && response.status < 500);
    return data;
  } catch (failure) {
    if (failure instanceof HousingRequestError || options.signal?.aborted) throw failure;
    throw new HousingRequestError(timeout.aborted ? "Confirmation non reçue. Réessaie pour vérifier la même opération." :
      "Connexion interrompue. Réessaie pour vérifier la même opération.");
  }
}
