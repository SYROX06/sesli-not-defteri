const http = require('http');
const fs = require('fs');
const path = require('path');
const PORT = 8080;
const ROOT = __dirname;

// "node server.js --arkaplan": sunucuyu penceresiz ayrı bir işlem olarak başlatır,
// hazır olunca çıkar (0 = hazır, 1 = açılamadı). Böylece .bat penceresi hemen kapanabilir.
if (process.argv.includes('--arkaplan')) {
  const { spawn } = require('child_process');
  spawn(process.execPath, [__filename], { cwd: __dirname, detached: true, stdio: 'ignore', windowsHide: true }).unref();
  const t0 = Date.now();
  const dene = () => {
    http.get('http://localhost:' + PORT + '/ping', (r) => { r.resume(); process.exit(r.statusCode === 204 ? 0 : 1); })
      .on('error', () => { if (Date.now() - t0 > 8000) process.exit(1); setTimeout(dene, 200); });
  };
  setTimeout(dene, 200);
  return;
}
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.ico': 'image/x-icon', '.png': 'image/png', '.svg': 'image/svg+xml' };

// Her açık pencere kendi kimliğiyle /ping?id=.. atar, kapanırken /bye?id=.. gönderir.
// Açık pencere kalmayınca sunucu kendini kapatır; arkada boşta process kalmaz.
// Kimlik sayesinde sayfa yenilemede eski sayfanın geç gelen /bye'ı yeni sayfayı etkilemez.
const IDLE_MS = 3 * 60 * 1000;   // gizli/küçültülmüş pencerede Chrome zamanlayıcıları dakikada bire düşebilir
const EMPTY_GRACE_MS = 8000;     // pencere kalmayınca bu kadar bekle (yenileme arası)
const STARTUP_GRACE_MS = 60000;  // Chrome soğuk açılışta geç gelebilir
const clients = new Map();       // id -> son ping zamanı
const closed = new Set();        // kapanmış pencereler (geç gelen ping'leri yok say)
const startedAt = Date.now();
let everSeen = false;
let emptySince = null;

let lastCheck = Date.now();
setInterval(() => {
  const now = Date.now();
  // Bilgisayar uykudan uyandıysa sayfalar henüz ping atamamıştır; hemen kapanma
  if (now - lastCheck > 60000) { for (const id of clients.keys()) clients.set(id, now); emptySince = null; }
  lastCheck = now;
  for (const [id, t] of clients) if (now - t > IDLE_MS) clients.delete(id);
  if (clients.size) { emptySince = null; return; }
  if (!everSeen) { if (now - startedAt > STARTUP_GRACE_MS) process.exit(0); return; }
  if (emptySince === null) emptySince = now;
  else if (now - emptySince > EMPTY_GRACE_MS) process.exit(0);
}, 2000);

// PDF'te Türkçe karakterler için Windows'un Arial fontu
const FONT = path.join(process.env.WINDIR || 'C:\\Windows', 'Fonts', 'arial.ttf');

const server = http.createServer((req, res) => {
  let u, urlPath;
  // Bozuk adres (ör. /%E0) eskiden decodeURIComponent hatasıyla sunucuyu çökertiyordu
  try { u = new URL(req.url, 'http://localhost'); urlPath = decodeURIComponent(u.pathname); }
  catch { res.writeHead(400); res.end(); return; }
  const id = u.searchParams.get('id');
  if (urlPath === '/ping') {
    if (id && !closed.has(id)) { clients.set(id, Date.now()); everSeen = true; }
    res.writeHead(204); res.end(); return;
  }
  if (urlPath === '/bye') {
    if (id) { clients.delete(id); closed.add(id); }
    res.writeHead(204); res.end(); return;
  }
  if (urlPath === '/font.ttf') {
    if (!fs.existsSync(FONT)) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'Content-Type': 'font/ttf' });
    fs.createReadStream(FONT).on('error', () => res.destroy()).pipe(res);
    return;
  }
  if (urlPath === '/') urlPath = '/Chrome-ile-Kullan.html';
  const file = path.join(ROOT, urlPath);
  if (!file.startsWith(ROOT + path.sep) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404); res.end('bulunamadi');
    return;
  }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'text/plain', 'Cache-Control': 'no-store' });
  fs.createReadStream(file).on('error', () => res.destroy()).pipe(res);
});

// Zaten açık bir sunucu varsa (port dolu) sessizce çık; pencere mevcut sunucuya bağlanır.
server.on('error', (e) => { if (e.code === 'EADDRINUSE') process.exit(0); throw e; });
server.listen(PORT, () => console.log('Acik: http://localhost:' + PORT + '/Chrome-ile-Kullan.html'));
