import { TextBlock, TranslationResult } from '../types';

export interface SavedProject {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  formattedDate: string;
  thumbnail: string;
  fullImage: string;
  mimeType: string;
  detectedLanguage: string;
  summary: string;
  textBlocks: TextBlock[];
  blockCount: number;
  offlineCreated?: boolean;
}

const DB_NAME = 'GorselCevirPCStore';
const DB_VERSION = 1;
const STORE_NAME = 'projects';

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error('IndexedDB bu tarayıcıda desteklenmiyor.'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('updatedAt', 'updatedAt', { unique: false });
      }
    };

    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };

    request.onerror = (event) => {
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
}

/**
 * Saves or updates a project in IndexedDB on the local PC disk
 */
export async function saveProjectToLocalDB(project: SavedProject): Promise<void> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_NAME], 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(project);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('IndexedDB save failed, falling back to localStorage:', err);
    try {
      const existing = JSON.parse(localStorage.getItem('gorsel_cevir_projects_fallback') || '[]');
      const filtered = existing.filter((p: SavedProject) => p.id !== project.id);
      filtered.unshift(project);
      localStorage.setItem('gorsel_cevir_projects_fallback', JSON.stringify(filtered.slice(0, 15)));
    } catch (lsErr) {
      console.error('LocalStorage fallback also failed:', lsErr);
    }
  }
}

/**
 * Retrieves all saved projects sorted by newest first
 */
export async function getAllProjectsFromLocalDB(): Promise<SavedProject[]> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_NAME], 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();

      req.onsuccess = () => {
        const list: SavedProject[] = req.result || [];
        list.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
        resolve(list);
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('IndexedDB read failed, falling back to localStorage:', err);
    try {
      const raw = localStorage.getItem('gorsel_cevir_projects_fallback');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }
}

/**
 * Deletes a project from the local PC database
 */
export async function deleteProjectFromLocalDB(id: string): Promise<void> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_NAME], 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(id);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('IndexedDB delete failed, falling back to localStorage:', err);
    try {
      const existing = JSON.parse(localStorage.getItem('gorsel_cevir_projects_fallback') || '[]');
      const filtered = existing.filter((p: SavedProject) => p.id !== id);
      localStorage.setItem('gorsel_cevir_projects_fallback', JSON.stringify(filtered));
    } catch {
      // ignore
    }
  }
}

/**
 * Exports all local data to a JSON backup file directly on the user's PC
 */
export async function exportAllProjectsToFile(): Promise<void> {
  const projects = await getAllProjectsFromLocalDB();
  const backupData = {
    appName: 'GörselÇevir PC',
    version: '2.0.0',
    exportDate: new Date().toISOString(),
    projectCount: projects.length,
    projects,
  };

  const jsonStr = JSON.stringify(backupData, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `GorselCevir_PC_Yedek_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Imports projects from a JSON file into the local PC database
 */
export async function importProjectsFromFile(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        const data = JSON.parse(text);
        const projectsToImport: SavedProject[] = Array.isArray(data) ? data : data.projects;
        if (!Array.isArray(projectsToImport)) {
          throw new Error('Geçersiz yedek dosyası biçimi.');
        }

        for (const proj of projectsToImport) {
          if (proj.id && proj.fullImage) {
            await saveProjectToLocalDB(proj);
          }
        }
        resolve(projectsToImport.length);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Dosya okunamadı.'));
    reader.readAsText(file);
  });
}
