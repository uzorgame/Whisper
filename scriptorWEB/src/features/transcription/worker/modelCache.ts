/**
 * transformers.js stores weights in Cache Storage by default. Chrome refuses to
 * persist single entries past a few hundred megabytes, which silently drops the
 * largest file of every big model — measured here: the 185 MB turbo decoder is
 * kept, the 353 MB turbo encoder is not. The result is a multi-hundred-megabyte
 * re-download on every single run.
 *
 * IndexedDB has no such per-record ceiling, so this is a drop-in replacement
 * that transformers.js can use through `env.customCache`.
 */

const DB_NAME = 'whisper-weights'
const DB_VERSION = 1
const STORE = 'responses'

interface StoredResponse {
  url: string
  body: ArrayBuffer
  headers: [string, string][]
  status: number
  statusText: string
  savedAt: number
}

let dbPromise: Promise<IDBDatabase> | null = null

function openDatabase(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'url' })
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })

  return dbPromise
}

function keyOf(request: RequestInfo | URL): string {
  if (typeof request === 'string') return request
  if (request instanceof URL) return request.href
  return request.url
}

function transact<T>(
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return openDatabase().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(STORE, mode)
        const request = run(tx.objectStore(STORE))
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
      }),
  )
}

export const indexedDbCache = {
  async match(request: RequestInfo | URL): Promise<Response | undefined> {
    try {
      const record = await transact<StoredResponse | undefined>('readonly', (store) =>
        store.get(keyOf(request)),
      )
      if (!record) return undefined

      return new Response(record.body, {
        status: record.status,
        statusText: record.statusText,
        headers: new Headers(record.headers),
      })
    } catch {
      // a cache miss is always safe — the network path still works
      return undefined
    }
  },

  async put(request: RequestInfo | URL, response: Response): Promise<void> {
    try {
      const body = await response.clone().arrayBuffer()

      const record: StoredResponse = {
        url: keyOf(request),
        body,
        headers: [...response.headers.entries()],
        status: response.status,
        statusText: response.statusText,
        savedAt: Date.now(),
      }

      await transact('readwrite', (store) => store.put(record))
    } catch {
      // out of quota or a blocked write — fall through, the model still loads
    }
  },
}

/** Total bytes currently held, for diagnostics and a future "clear models" action. */
export async function cachedWeightsSize(): Promise<number> {
  try {
    const records = await transact<StoredResponse[]>('readonly', (store) =>
      store.getAll(),
    )
    return records.reduce((sum, record) => sum + record.body.byteLength, 0)
  } catch {
    return 0
  }
}
