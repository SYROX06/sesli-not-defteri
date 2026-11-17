const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { Document, Packer, Paragraph, TextRun } = require('docx');

let win = null;
const NOTES_DIR = path.join(app.getPath('documents'), 'Sesli Not Defteri');

function ensureNotesDir() {
  if (!fs.existsSync(NOTES_DIR)) fs.mkdirSync(NOTES_DIR, { recursive: true });
}

function safeName(name) {
  return name.replace(/[\\/:*?"<>|]/g, '-').slice(0, 80) || 'notsuz';
}

function createWindow() {
  win = new BrowserWindow({
    width: 1100,
    height: 750,
    minWidth: 900,
    minHeight: 600,
    title: 'Sesli Not Defteri',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  win.loadFile('index.html');
}

app.whenReady().then(() => {
  ensureNotesDir();
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// --- Not işlemleri ---
ipcMain.handle('list-notes', async () => {
  ensureNotesDir();
  const files = fs.readdirSync(NOTES_DIR).filter(f => f.endsWith('.txt'));
  return files.map(f => {
    const st = fs.statSync(path.join(NOTES_DIR, f));
    return { name: f.replace(/\.txt$/, ''), file: f, mtime: st.mtimeMs, size: st.size };
  }).sort((a, b) => b.mtime - a.mtime);
});

ipcMain.handle('load-note', async (e, name) => {
  const p = path.join(NOTES_DIR, safeName(name) + '.txt');
  if (!fs.existsSync(p)) return '';
  return fs.readFileSync(p, 'utf-8');
});

ipcMain.handle('save-note', async (e, { name, content }) => {
  ensureNotesDir();
  const n = safeName(name);
  if (!n) throw new Error('Dosya adı boş');
  fs.writeFileSync(path.join(NOTES_DIR, n + '.txt'), content ?? '', 'utf-8');
  return n;
});

ipcMain.handle('delete-note', async (e, name) => {
  const p = path.join(NOTES_DIR, safeName(name) + '.txt');
  if (fs.existsSync(p)) fs.unlinkSync(p);
  return true;
});

ipcMain.handle('rename-note', async (e, { oldName, newName }) => {
  const o = path.join(NOTES_DIR, safeName(oldName) + '.txt');
  const n = path.join(NOTES_DIR, safeName(newName) + '.txt');
  if (!fs.existsSync(o)) throw new Error('Eski dosya bulunamadı');
  if (fs.existsSync(n)) throw new Error('Bu isimde bir not zaten var');
  fs.renameSync(o, n);
  return safeName(newName);
});

ipcMain.handle('export-txt', async (e, { name, content }) => {
  const r = await dialog.showSaveDialog(win, {
    defaultPath: safeName(name) + '.txt',
    filters: [{ name: 'Metin', extensions: ['txt'] }]
  });
  if (r.canceled || !r.filePath) return null;
  fs.writeFileSync(r.filePath, content ?? '', 'utf-8');
  return r.filePath;
});

ipcMain.handle('export-docx', async (e, { name, content }) => {
  const r = await dialog.showSaveDialog(win, {
    defaultPath: safeName(name) + '.docx',
    filters: [{ name: 'Word', extensions: ['docx'] }]
  });
  if (r.canceled || !r.filePath) return null;
  const paragraphs = String(content ?? '').split(/\n/).map(
    line => new Paragraph({ children: [new TextRun(line || ' ')] })
  );
  const doc = new Document({ sections: [{ children: paragraphs.length ? paragraphs : [new Paragraph('')] }] });
  const buf = await Packer.toBuffer(doc);
  fs.writeFileSync(r.filePath, buf);
  return r.filePath;
});

ipcMain.handle('export-pdf', async (e, { name, content }) => {
  const r = await dialog.showSaveDialog(win, {
    defaultPath: safeName(name) + '.pdf',
    filters: [{ name: 'PDF', extensions: ['pdf'] }]
  });
  if (r.canceled || !r.filePath) return null;
  // Geçici yazdırma penceresi
  const printWin = new BrowserWindow({ show: false });
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>
    body{font-family:Segoe UI,Arial;font-size:13pt;line-height:1.6;padding:40px;white-space:pre-wrap;word-wrap:break-word}
  </style></head><body>${escapeHtml(content ?? '')}</body></html>`;
  await printWin.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html));
  const data = await printWin.webContents.printToPDF({});
  fs.writeFileSync(r.filePath, data);
  printWin.close();
  return r.filePath;
});

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
