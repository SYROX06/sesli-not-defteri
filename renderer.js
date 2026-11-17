const $ = id => document.getElementById(id);
const editor = $('editor'), noteTitle = $('noteTitle'), noteList = $('noteList');
const micBtn = $('micBtn'), micStatus = $('micStatus'), livePreview = $('livePreview');
const langSelect = $('langSelect'), cmdChk = $('cmdChk'), autoChk = $('autoChk');

let currentNote = 'Yeni Not';
let dirty = false, autoTimer = null;
let recognizing = false, recognition = null;

// ---------- Yardımcılar ----------
function toast(msg) {
  const t = $('toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('show'), 2200);
}
function updateCounts() {
  const txt = editor.value;
  const words = txt.trim() ? txt.trim().split(/\s+/).length : 0;
  $('wordCount').textContent = words + ' kelime';
  $('charCount').textContent = txt.length + ' karakter';
}
function markDirty() {
  dirty = true; $('saveState').textContent = 'kaydedilmedi ●';
  updateCounts();
  clearTimeout(autoTimer);
  if (autoChk.checked) autoTimer = setTimeout(() => saveCurrent(true), 1500);
}
editor.addEventListener('input', markDirty);
noteTitle.addEventListener('input', markDirty);

// ---------- Tema ----------
if (localStorage.getItem('theme') === 'dark') document.body.classList.add('dark');
$('themeBtn').textContent = document.body.classList.contains('dark') ? '☀️' : '🌙';
$('themeBtn').onclick = () => {
  document.body.classList.toggle('dark');
  const dark = document.body.classList.contains('dark');
  localStorage.setItem('theme', dark ? 'dark' : 'light');
  $('themeBtn').textContent = dark ? '☀️' : '🌙';
};

// ---------- Sesli noktalama komutları ----------
function applyVoiceCommands(text, lang) {
  let s = ' ' + text + ' ';
  const rep = (pattern, val) => { s = s.replace(pattern, val); };
  if (lang.startsWith('tr')) {
    rep(/\s+nokta\s+/gi, '. ');
    rep(/\s+virgül\s+/gi, ', ');
    rep(/\s+soru işareti\s+/gi, '? ');
    rep(/\s+ünlem(\s+işareti)?\s+/gi, '! ');
    rep(/\s+iki nokta(\s+üst üste)?\s+/gi, ': ');
    rep(/\s+noktalı virgül\s+/gi, '; ');
    rep(/\s+aç parantez\s+/gi, ' (');
    rep(/\s+kapa parantez\s+/gi, ') ');
    rep(/\s+yeni paragraf\s+/gi, '\n\n');
    rep(/\s+yeni satır\s+/gi, '\n');
    rep(/\s+alt satır\s+/gi, '\n');
  } else {
    rep(/\s+period\s+/gi, '. ');
    rep(/\s+dot\s+/gi, '. ');
    rep(/\s+comma\s+/gi, ', ');
    rep(/\s+question mark\s+/gi, '? ');
    rep(/\s+exclamation mark\s+/gi, '! ');
    rep(/\s+colon\s+/gi, ': ');
    rep(/\s+semicolon\s+/gi, '; ');
    rep(/\s+open parenthesis\s+/gi, ' (');
    rep(/\s+close parenthesis\s+/gi, ') ');
    rep(/\s+new paragraph\s+/gi, '\n\n');
    rep(/\s+new line\s+/gi, '\n');
  }
  // "son kelimeyi sil" komutu editörde işlenir (aşağıda)
  return s.trim().replace(/^./, c => c); // baştaki boşluğu at
}

function handleDeleteCommand(transcript, lang) {
  const tr = /son kelimeyi sil|son kelime sil/i;
  const en = /delete last word/i;
  if (lang.startsWith('tr') ? tr.test(transcript) : en.test(transcript)) {
    editor.value = editor.value.replace(/\s*\S+\s*$/, '');
    markDirty();
    return true;
  }
  return false;
}

// ---------- Konuşma tanıma (Bas-konuş-durdur) ----------
function supportCheck() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) {
    micStatus.textContent = 'bu Electron sürümü konuşmayı desteklemiyor — Chrome tabanlı güncel Electron gerekli';
    micBtn.disabled = true;
    return null;
  }
  return SR;
}

micBtn.onclick = () => {
  if (recognizing) { stopRec(); return; }
  const SR = supportCheck();
  if (!SR) return;
  recognition = new SR();
  recognition.lang = langSelect.value;
  recognition.interimResults = true;
  recognition.continuous = false; // bas-konuş-durdur: tek parça
  recognition.maxAlternatives = 1;

  let finalText = '';

  recognition.onstart = () => {
    recognizing = true;
    micBtn.textContent = '⏹ Durdur';
    micBtn.classList.add('listening');
    micStatus.textContent = 'dinleniyor... konuşun';
    micStatus.classList.add('rec');
    livePreview.classList.remove('hidden');
    livePreview.textContent = 'dinleniyor...';
  };
  recognition.onresult = (e) => {
    let interim = '';
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const t = e.results[i][0].transcript;
      if (e.results[i].isFinal) finalText += t + ' ';
      else interim += t;
    }
    livePreview.textContent = (finalText + interim) || 'dinleniyor...';
  };
  recognition.onerror = (e) => {
    toast('Mikrofon hatası: ' + e.error);
  };
  recognition.onend = () => {
    const raw = finalText.trim() || livePreview.textContent.trim();
    if (raw && raw !== 'dinleniyor...') {
      if (!handleDeleteCommand(raw, recognition.lang)) {
        let out = cmdChk.checked ? applyVoiceCommands(raw, recognition.lang) : raw;
        insertAtCursor(editor, (needsSpace() ? ' ' : '') + out);
        markDirty();
      }
    }
    stopRecUI();
  };
  try { recognition.start(); } catch (err) { toast(String(err)); }
};

function stopRec() { try { recognition && recognition.stop(); } catch {} }
function stopRecUI() {
  recognizing = false;
  micBtn.textContent = '🎤 Konuşmaya Başla';
  micBtn.classList.remove('listening');
  micStatus.textContent = 'hazır';
  micStatus.classList.remove('rec');
  setTimeout(() => livePreview.classList.add('hidden'), 800);
}
function needsSpace() {
  return editor.value.length > 0 && !/\s|\n$/.test(editor.value.slice(-1));
}
function insertAtCursor(el, text) {
  const s = el.selectionStart ?? el.value.length, e = el.selectionEnd ?? el.value.length;
  el.value = el.value.slice(0, s) + text + el.value.slice(e);
  el.selectionStart = el.selectionEnd = s + text.length;
  el.focus();
}

// ---------- Not işlemleri ----------
async function refreshList(filter = '') {
  const notes = await window.api.listNotes();
  $('storageInfo').textContent = notes.length + ' not • Belgeler/Sesli Not Defteri';
  noteList.innerHTML = '';
  notes
    .filter(n => n.name.toLowerCase().includes(filter.toLowerCase()))
    .forEach(n => {
      const d = document.createElement('div');
      d.className = 'note-item' + (n.name === currentNote ? ' active' : '');
      d.innerHTML = `<div class="t"></div><div class="m">${new Date(n.mtime).toLocaleString('tr-TR')}</div>`;
      d.querySelector('.t').textContent = n.name;
      d.onclick = () => openNote(n.name);
      d.ondblclick = () => renameNote(n.name);
      noteList.appendChild(d);
    });
}

async function openNote(name) {
  if (dirty && !confirm('Kaydedilmemiş değişiklik var. Yine de geçiş yapılsın mı?')) return;
  const content = await window.api.loadNote(name);
  currentNote = name; noteTitle.value = name; editor.value = content;
  dirty = false; $('saveState').textContent = 'kayıtlı ✓'; updateCounts(); refreshList($('search').value);
}

async function saveCurrent(silent = false) {
  const name = noteTitle.value.trim() || 'notsuz';
  try {
    await window.api.saveNote(name, editor.value);
    currentNote = name;
    dirty = false; $('saveState').textContent = 'kayıtlı ✓ • ' + new Date().toLocaleTimeString('tr-TR');
    refreshList($('search').value);
    if (!silent) toast('Kaydedildi: ' + name);
  } catch (e) { toast('Kaydetme hatası: ' + e.message); }
}

async function renameNote(oldName) {
  const n = prompt('Yeni isim:', oldName);
  if (!n || n === oldName) return;
  try { await window.api.renameNote(oldName, n); currentNote = n; noteTitle.value = n; refreshList(); toast('Yeniden adlandırıldı'); }
  catch (e) { toast(e.message); }
}

$('btnSave').onclick = () => saveCurrent(false);
$('btnNew').onclick = async () => {
  if (dirty && !confirm('Kaydedilmemiş değişiklik var. Yeni nota geçilsin mi?')) return;
  currentNote = 'Yeni Not'; noteTitle.value = 'Yeni Not'; editor.value = '';
  dirty = false; updateCounts(); refreshList($('search').value); editor.focus();
};
$('btnCopy').onclick = async () => { await navigator.clipboard.writeText(editor.value); toast('Panoya kopyalandı'); };
$('btnClear').onclick = () => { if (confirm('Metin temizlensin mi?')) { editor.value = ''; markDirty(); } };
$('btnDelete').onclick = async () => {
  if (!confirm(`"${currentNote}" silinsin mi?`)) return;
  await window.api.deleteNote(currentNote);
  currentNote = 'Yeni Not'; noteTitle.value = 'Yeni Not'; editor.value = '';
  dirty = false; updateCounts(); refreshList(); toast('Silindi');
};
$('search').oninput = (e) => refreshList(e.target.value);
$('btnTxt').onclick = async () => { const p = await window.api.exportTxt(noteTitle.value, editor.value); if (p) toast('TXT: ' + p); };
$('btnDocx').onclick = async () => { const p = await window.api.exportDocx(noteTitle.value, editor.value); if (p) toast('DOCX: ' + p); };
$('btnPdf').onclick = async () => { toast('PDF hazırlanıyor...'); const p = await window.api.exportPdf(noteTitle.value, editor.value); if (p) toast('PDF: ' + p); };

// Kapanışta oto-kaydet
window.addEventListener('beforeunload', () => { if (dirty && autoChk.checked) window.api.saveNote(noteTitle.value.trim() || currentNote, editor.value); });

refreshList(); updateCounts();
