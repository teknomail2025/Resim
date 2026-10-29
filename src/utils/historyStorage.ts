import { TextBlock, TranslationResult } from '../types';

export interface HistoryItem {
  id: string;
  timestamp: number;
  formattedDate: string;
  thumbnail: string;
  fullImage: string;
  mimeType: string;
  detectedLanguage: string;
  summary: string;
  textBlocks: TextBlock[];
  blockCount: number;
}

const STORAGE_KEY = 'gorsel_cevir_history_v1';
const MAX_HISTORY_ITEMS = 5;

/**
 * Creates a lightweight compressed image/thumbnail using an offscreen canvas
 */
export async function createThumbnail(
  imageSource: string,
  maxWidth = 300,
  maxHeight = 220,
  quality = 0.7
): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      let w = img.width;
      let h = img.height;
      if (w > maxWidth || h > maxHeight) {
        const ratio = Math.min(maxWidth / w, maxHeight / h);
        w = Math.round(w * ratio);
        h = Math.round(h * ratio);
      }

      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(imageSource);
        return;
      }

      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => resolve(imageSource);
    img.src = imageSource;
  });
}

/**
 * Loads history items from localStorage
 */
export function getHistoryItems(): HistoryItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.slice(0, MAX_HISTORY_ITEMS);
    }
  } catch (err) {
    console.error('Error reading history from localStorage:', err);
  }
  return [];
}

/**
 * Saves a new translation item to localStorage, keeping only the last 5
 */
export async function saveToHistory(
  imageSrc: string,
  mimeType: string,
  result: TranslationResult
): Promise<HistoryItem[]> {
  try {
    // Generate thumbnail
    const thumbnail = await createThumbnail(imageSrc, 240, 180, 0.65);
    // Compress full image if it's very large so it fits comfortably in localStorage
    const savedFullImage = await createThumbnail(imageSrc, 1200, 1200, 0.85);

    const now = new Date();
    const formattedDate = new Intl.DateTimeFormat('tr-TR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(now);

    const newItem: HistoryItem = {
      id: `hist-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: Date.now(),
      formattedDate,
      thumbnail,
      fullImage: savedFullImage,
      mimeType,
      detectedLanguage: result.detectedLanguage,
      summary: result.summary,
      textBlocks: result.textBlocks,
      blockCount: result.textBlocks.length,
    };

    const currentHistory = getHistoryItems();
    // Prepend new item and keep max 5
    const updatedHistory = [newItem, ...currentHistory.filter((item) => item.summary !== newItem.summary)].slice(
      0,
      MAX_HISTORY_ITEMS
    );

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistory));
    } catch (quotaError) {
      // If quota exceeded, store without fullImage or with lower quality
      console.warn('LocalStorage quota warning, compressing history items further...');
      const compactHistory = updatedHistory.map((item) => ({
        ...item,
        fullImage: item.thumbnail, // fallback to thumbnail as fullImage if tight
      }));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(compactHistory));
      return compactHistory;
    }

    return updatedHistory;
  } catch (err) {
    console.error('Error saving to history:', err);
    return getHistoryItems();
  }
}

/**
 * Deletes a single history item by id
 */
export function deleteHistoryItem(id: string): HistoryItem[] {
  try {
    const current = getHistoryItems();
    const filtered = current.filter((item) => item.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return filtered;
  } catch (err) {
    console.error('Error deleting history item:', err);
    return [];
  }
}

/**
 * Clears all history items
 */
export function clearAllHistory(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error('Error clearing history:', err);
  }
}
