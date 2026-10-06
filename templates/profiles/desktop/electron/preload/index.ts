import { contextBridge } from 'electron';
// Exposer uniquement les opérations réellement nécessaires ; aucun ipcRenderer brut.
contextBridge.exposeInMainWorld('desktop', Object.freeze({ platform: process.platform }));
