const DB_NAME = "dashs-wake-audio";
const DB_VERSION = 1;
const STORE_NAME = "audio-blobs";

interface AudioRecord {
  blob: Blob;
  key: string;
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "key" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function runTransaction<T>(
  mode: IDBTransactionMode,
  work: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return openDatabase().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, mode);
        const store = tx.objectStore(STORE_NAME);
        const request = work(store);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
        tx.oncomplete = () => db.close();
        tx.onerror = () => db.close();
      }),
  );
}

export async function putAudioBlob(blob: Blob): Promise<string> {
  const key = `audio-${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
  const record: AudioRecord = { blob, key };
  await runTransaction("readwrite", (store) => store.put(record));
  return key;
}

export async function getAudioBlob(key: string): Promise<Blob | undefined> {
  const record = await runTransaction<AudioRecord | undefined>(
    "readonly",
    (store) => store.get(key) as IDBRequest<AudioRecord | undefined>,
  );
  return record?.blob;
}
