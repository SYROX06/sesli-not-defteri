const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  listNotes: () => ipcRenderer.invoke('list-notes'),
  loadNote: (name) => ipcRenderer.invoke('load-note', name),
  saveNote: (name, content) => ipcRenderer.invoke('save-note', { name, content }),
  deleteNote: (name) => ipcRenderer.invoke('delete-note', name),
  renameNote: (oldName, newName) => ipcRenderer.invoke('rename-note', { oldName, newName }),
  exportTxt: (name, content) => ipcRenderer.invoke('export-txt', { name, content }),
  exportDocx: (name, content) => ipcRenderer.invoke('export-docx', { name, content }),
  exportPdf: (name, content) => ipcRenderer.invoke('export-pdf', { name, content })
});
