/**
 * Model weights live in Cache Storage, which browsers treat as best-effort and
 * may evict under pressure — that turns a cached model back into a fresh
 * multi-hundred-megabyte download. Asking for persistent storage makes the
 * browser keep it unless the user clears site data themselves.
 */
export async function requestPersistentStorage(): Promise<boolean> {
  if (!navigator.storage?.persist) return false

  try {
    if (await navigator.storage.persisted()) return true
    return await navigator.storage.persist()
  } catch {
    return false
  }
}
