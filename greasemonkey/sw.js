/* Grease Monkey · private page service worker.
   Every file of the page is stored encrypted (AES-256-GCM). Once the visitor enters the password, the key is kept on
   this device and this worker decrypts each file as the browser asks for it. Without the key nothing can be read. */
const BASE = new URL('./', self.location).pathname;          // e.g. /greasemonkey/
const APP = BASE + 'app/';
let KEY = null, MAN = null;
const MEM = new Map();

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
  let raw = null, failed = false;                                   // phones sometimes drop the database connection when the worker restarts: try again before giving up
  for (let i = 0; i < 4 && !raw; i++) { try { raw = await idb('readonly', (s) => s.get('k')); failed = false; } catch (e) { failed = true; await new Promise((r) => setTimeout(r, 150 * (i + 1))); } if (!raw && !failed) break; }
  if (failed) throw new Error('keystore');                          // not the same as "no key": never send the visitor back to the password page for this
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
const pause = (ms) => new Promise((r) => setTimeout(r, ms));
async function getFile(id) {                                          // network hiccups: retry a couple of times
  let last;
  for (let i = 0; i < 3; i++) { try { const r = await fetch(BASE + 'v/' + id + '.bin', { cache: 'no-cache' }); if (r.ok || r.status === 404) return r; last = r; } catch (e) { last = null; } await pause(250 * (i + 1)); }
  return last;
}

self.addEventListener('fetch', (e) => {
  const u = new URL(e.request.url);
  if (u.origin !== self.location.origin || !u.pathname.startsWith(APP)) return;
  e.respondWith(serve(e.request, u).catch((err) => e.request.mode === 'navigate'
    ? new Response('<!DOCTYPE html><meta charset="utf-8"><script>var n=+(sessionStorage.gmr||0)+1;sessionStorage.gmr=n;setTimeout(function(){if(n>3){sessionStorage.gmr=0;location.replace("' + BASE + '")}else location.reload()},500)</script>', { headers: { 'Content-Type': 'text/html' } })
    : new Response('error', { status: 503, headers: { 'Retry-After': '1' } })));
});
async function serve(req, u) {
  {
    if (!(await getKey())) return toGate(req);
    let man;
    try { man = await manifest(); } catch (err) { KEY = null; await idb('readwrite', (s) => s.delete('k')).catch(() => {}); return toGate(req); }
    let rel = decodeURIComponent(u.pathname.slice(APP.length));
    if (rel === '' || rel.endsWith('/')) rel += 'index.html';
    let f = man.files[rel];
    if (!f) return new Response('not found', { status: 404 });
    let body = MEM.get(f.id);
    if (!body) {
      let r = await getFile(f.id);
      if (!r || !r.ok) {                                                  // site was updated since this worker loaded its file list: refresh it and retry
        MAN = null; MEM.clear(); man = await manifest(); f = man.files[rel];
        if (!f) return new Response('not found', { status: 404 });
        r = await getFile(f.id);
        if (!r || !r.ok) throw new Error('missing');                      // handled above: the page retries, then returns to the password page
      }
      try { body = await dec(await r.arrayBuffer()); }
      catch (e) { MAN = null; man = await manifest(); f = man.files[rel]; if (!f) return new Response('not found', { status: 404 }); r = await getFile(f.id); if (!r || !r.ok) throw e; body = await dec(await r.arrayBuffer()); }
      if (/^video\//.test(f.type)) MEM.set(f.id, body);              // keep decrypted video in memory for range requests
    }
    const hd = { 'Content-Type': f.type, 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex', 'Accept-Ranges': 'bytes' };
    const range = req.headers.get('range');
    if (range) {                                                     // Safari/iOS video needs 206 partial responses
      const m = /bytes=(\d*)-(\d*)/.exec(range), size = body.byteLength;
      let start = m && m[1] ? +m[1] : 0, end = m && m[2] ? +m[2] : size - 1;
      if (m && !m[1] && m[2]) { start = Math.max(0, size - +m[2]); end = size - 1; }
      end = Math.min(end, size - 1);
      return new Response(body.slice(start, end + 1), { status: 206, headers: { ...hd, 'Content-Range': `bytes ${start}-${end}/${size}`, 'Content-Length': String(end - start + 1) } });
    }
    return new Response(body, { headers: { ...hd, 'Content-Length': String(body.byteLength) } });
  }
}
