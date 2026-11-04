/* Grease Monkey · private page service worker.
   Every file of the page is stored encrypted (AES-256-GCM). Once the visitor enters the password, the key is kept on
   this device and this worker decrypts each file as the browser asks for it. Without the key nothing can be read. */
const BASE = new URL('./', self.location).pathname;          // e.g. /greasemonkey/
const APP = BASE + 'app/';
let KEY = null, MAN = null;

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
self.addEventListener('message', (e) => { if (e.data && (e.data.type === 'key' || e.data.type === 'lock')) { KEY = null; MAN = null; } });

function idb(mode, fn) {
  return new Promise((res, rej) => {
    const r = indexedDB.open('gm-private', 1);
    r.onupgradeneeded = () => r.result.createObjectStore('kv');
    r.onerror = () => rej(r.error);
    r.onsuccess = () => { const tx = r.result.transaction('kv', mode); const q = fn(tx.objectStore('kv')); tx.oncomplete = () => res(q && q.result); tx.onerror = () => rej(tx.error); };
  });
}
async function getKey() {
  if (KEY) return KEY;
  const raw = await idb('readonly', (s) => s.get('k')).catch(() => null);
  if (!raw) return null;
  KEY = await crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['decrypt']);
  return KEY;
}
async function dec(buf) { return crypto.subtle.decrypt({ name: 'AES-GCM', iv: new Uint8Array(buf, 0, 12) }, KEY, new Uint8Array(buf, 12)); }
async function manifest() {
  if (MAN) return MAN;
  const r = await fetch(BASE + 'm.bin', { cache: 'no-cache' });
  MAN = JSON.parse(new TextDecoder().decode(await dec(await r.arrayBuffer())));
  return MAN;
}
const toGate = (req) => req.mode === 'navigate' ? Response.redirect(BASE, 302) : new Response('locked', { status: 403 });

self.addEventListener('fetch', (e) => {
  const u = new URL(e.request.url);
  if (u.origin !== self.location.origin || !u.pathname.startsWith(APP)) return;
  e.respondWith(serve(e.request, u).catch((err) => e.request.mode === 'navigate'
    ? new Response('<!DOCTYPE html><meta charset="utf-8"><script>var n=+(sessionStorage.gmr||0)+1;sessionStorage.gmr=n;setTimeout(function(){if(n>3){sessionStorage.gmr=0;location.replace("' + BASE + '")}else location.reload()},500)</script>', { headers: { 'Content-Type': 'text/html' } })
    : new Response('error', { status: 503 })));
});
async function serve(req, u) {
  {
    if (!(await getKey())) return toGate(req);
    let man;
    try { man = await manifest(); } catch (err) { KEY = null; await idb('readwrite', (s) => s.delete('k')).catch(() => {}); return toGate(req); }
    let rel = decodeURIComponent(u.pathname.slice(APP.length));
    if (rel === '' || rel.endsWith('/')) rel += 'index.html';
    const f = man.files[rel];
    if (!f) return new Response('not found', { status: 404 });
    const r = await fetch(BASE + 'v/' + f.id + '.bin');
    if (!r.ok) return new Response('missing', { status: 502 });
    const body = await dec(await r.arrayBuffer());
    return new Response(body, { headers: { 'Content-Type': f.type, 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' } });
  }
}
