/**
 * Storage utilities for managing localStorage quota and IndexedDB fallback
 */
import { get, set, del, clear } from 'idb-keyval';
import { compress, decompress } from 'lz-string';

const QUOTA_THRESHOLD_MB = 4; // warn at 4MB
const QUOTA_THRESHOLD_BYTES = QUOTA_THRESHOLD_MB * 1024 * 1024;

export interface StorageResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Estimate localStorage usage in bytes
 */
export function getLocalStorageSize(): number {
  let total = 0;
  for (const key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      total += key.length + (localStorage[key]?.length || 0);
    }
  }
  return total * 2; // UTF-16 encoding (2 bytes per char)
}

/**
 * Check if localStorage is approaching quota
 */
export function checkStorageQuota(): { used: number; warning: boolean } {
  const used = getLocalStorageSize();
  const warning = used > QUOTA_THRESHOLD_BYTES;
  
  if (warning) {
    console.warn(
      `localStorage usage: ${(used / (1024 * 1024)).toFixed(2)}MB / ~5MB limit`
    );
  }
  
  return { used, warning };
}

/**
 * Save data to localStorage with compression
 */
export function saveToLocalStorage<T>(
  key: string,
  data: T
): StorageResult<void> {
  try {
    const json = JSON.stringify(data);
    const compressed = compress(json);
    localStorage.setItem(key, compressed);
    return { success: true };
  } catch (error) {
    console.error(`Failed to save to localStorage (${key}):`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Load data from localStorage with decompression
 */
export function loadFromLocalStorage<T>(key: string): StorageResult<T> {
  try {
    const compressed = localStorage.getItem(key);
    if (!compressed) {
      return { success: false, error: 'Key not found' };
    }
    
    const json = decompress(compressed);
    if (!json) {
      return { success: false, error: 'Decompression failed' };
    }
    
    const data = JSON.parse(json) as T;
    return { success: true, data };
  } catch (error) {
    console.error(`Failed to load from localStorage (${key}):`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Save large data to IndexedDB
 */
export async function saveToIndexedDB<T>(
  key: string,
  data: T
): Promise<StorageResult<void>> {
  try {
    await set(key, data);
    return { success: true };
  } catch (error) {
    console.error(`Failed to save to IndexedDB (${key}):`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Load data from IndexedDB
 */
export async function loadFromIndexedDB<T>(
  key: string
): Promise<StorageResult<T>> {
  try {
    const data = await get<T>(key);
    if (data === undefined) {
      return { success: false, error: 'Key not found' };
    }
    return { success: true, data };
  } catch (error) {
    console.error(`Failed to load from IndexedDB (${key}):`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Delete from IndexedDB
 */
export async function deleteFromIndexedDB(
  key: string
): Promise<StorageResult<void>> {
  try {
    await del(key);
    return { success: true };
  } catch (error) {
    console.error(`Failed to delete from IndexedDB (${key}):`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Clear all IndexedDB data
 */
export async function clearIndexedDB(): Promise<StorageResult<void>> {
  try {
    await clear();
    return { success: true };
  } catch (error) {
    console.error('Failed to clear IndexedDB:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Estimate data size in bytes
 */
export function estimateSize(data: unknown): number {
  try {
    return JSON.stringify(data).length * 2; // UTF-16
  } catch {
    return 0;
  }
}
