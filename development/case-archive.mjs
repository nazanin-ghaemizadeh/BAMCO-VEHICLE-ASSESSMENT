/** Move no data: copy legacy browser state into a versioned, verifiable archive. */
export const LEGACY_KEYS = ['bamco-vehicle-assessment','bamco-vehicle-expert-weights','bamco-manager-weight-control'];
export function archiveLegacyCase(storage, id, now = new Date().toISOString()) {
  if (!id || !/^[a-zA-Z0-9_-]+$/.test(id)) throw new Error('Invalid archive ID');
  const key = `bamco-case-archive:${id}`;
  if (storage.getItem(key) !== null) throw new Error('Archive already exists');
  const entries = Object.fromEntries(LEGACY_KEYS.map(name => [name,storage.getItem(name)]));
  if (Object.values(entries).every(value => value === null)) return null;
  const archive = JSON.stringify({format:'bamco-legacy-case',version:1,createdAt:now,entries});
  // A storage quota failure throws before any original data is touched.
  storage.setItem(key,archive);
  if (storage.getItem(key) !== archive) throw new Error('Archive verification failed');
  return key;
}
export function readLegacyArchive(storage,id) {
  const raw=storage.getItem(`bamco-case-archive:${id}`);
  if (raw === null) throw new Error('Archive not found');
  const data=JSON.parse(raw);
  if(data.format!=='bamco-legacy-case' || data.version!==1 || !data.entries || LEGACY_KEYS.some(k=>!(k in data.entries))) throw new Error('Invalid archive');
  return data;
}
