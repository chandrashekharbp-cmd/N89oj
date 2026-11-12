/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Persistent Offline Storage Engine using IndexedDB with LocalStorage fallback.
 * Supports SHIFTED, CABLE SHORTAGE, DOOR LOCK, and NOT UPDATED statuses.
 */

import { Consumer, MeterShiftingStatus, StaffMember, UpdateHistoryItem } from '../types';
import { PRELOADED_CONSUMERS } from './initialData';

const DB_NAME = 'TPWODL_Titlagarh_MeterShifting_v2';
const DB_VERSION = 2;
const STORE_CONSUMERS = 'consumers';
const STORE_STAFF = 'staff';
const STORE_AUDIT = 'audit_logs';

const LS_BACKUP_KEY = 'TPWODL_CONSUMERS_BACKUP_V2';
const LS_STAFF_KEY = 'TPWODL_STAFF_BACKUP_V2';
const LS_DATA_DELETED_FLAG = 'TPWODL_DATA_DELETED_BY_SUPERVISOR';

export const INITIAL_STAFF: StaffMember[] = [
  { id: 'STF-01', name: 'Subrat & Rajesh', role: 'Lineman', team: 'Team A', active: true },
  { id: 'STF-02', name: 'Pradeep & Santosh', role: 'Lineman', team: 'Team B', active: true },
  { id: 'STF-03', name: 'Manas & Bikash', role: 'Lineman', team: 'Team C', active: true },
  { id: 'STF-04', name: 'Rakesh & Amit', role: 'Lineman', team: 'Team D', active: true },
  { id: 'STF-05', name: 'Sanjay Lineman', role: 'MRT Squad', team: 'MRT Squad 1', active: true },
  { id: 'STF-06', name: 'Birendra Lineman', role: 'MRT Squad', team: 'MRT Squad 2', active: true },
  { id: 'STF-07', name: 'M/s Shree Power Squad', role: 'Contractor Squad', team: 'Contractor Squad 1', active: true },
  { id: 'STF-08', name: 'M/s Maa Samaleswari Squad', role: 'Contractor Squad', team: 'Contractor Squad 2', active: true },
  { id: 'STF-09', name: 'Supervisor Titlagarh', role: 'Supervisor', team: 'Inspection & Verification', active: true }
];

/**
 * Normalizes any legacy or external status into one of the 4 strict statuses:
 * SHIFTED | CABLE SHORTAGE | DOOR LOCK | NOT UPDATED
 */
export function normalizeStatus(rawStatus?: string, irregularity?: string): MeterShiftingStatus {
  if (!rawStatus) {
    if (irregularity && irregularity.toLowerCase().includes('locked')) return 'DOOR LOCK';
    return 'NOT UPDATED';
  }
  const s = String(rawStatus).trim().toUpperCase();
  if (s === 'SHIFTED' || s === 'COMPLETED' || s === 'DONE') return 'SHIFTED';
  if (s.includes('CABLE') || s.includes('SHORTAGE')) return 'CABLE SHORTAGE';
  if (s.includes('LOCK') || s.includes('DOOR')) return 'DOOR LOCK';
  if (s === 'NOT UPDATED' || s === 'PENDING') {
    if (irregularity && irregularity.toLowerCase().includes('locked')) return 'DOOR LOCK';
    return 'NOT UPDATED';
  }
  return 'NOT UPDATED';
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) {
      reject(new Error('IndexedDB not supported in this browser'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_CONSUMERS)) {
        const consumerStore = db.createObjectStore(STORE_CONSUMERS, { keyPath: 'id' });
        consumerStore.createIndex('consumerNumber', 'consumerNumber', { unique: false });
        consumerStore.createIndex('status', 'status', { unique: false });
        consumerStore.createIndex('section', 'section', { unique: false });
      }
      if (!db.objectStoreNames.contains(STORE_STAFF)) {
        db.createObjectStore(STORE_STAFF, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_AUDIT)) {
        db.createObjectStore(STORE_AUDIT, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Scan consumer numbers and mark duplicate entries without deleting or merging
 */
export function flagDuplicates(list: Consumer[]): Consumer[] {
  const numberCounts = new Map<string, number>();
  list.forEach(c => {
    const num = (c.consumerNumber || '').trim();
    if (num) {
      numberCounts.set(num, (numberCounts.get(num) || 0) + 1);
    }
  });

  return list.map(c => {
    const num = (c.consumerNumber || '').trim();
    const count = numberCounts.get(num) || 0;
    const normalizedStatus = normalizeStatus(c.status, c.irregularityType);
    if (count > 1) {
      return {
        ...c,
        status: normalizedStatus,
        isDuplicate: true,
        duplicateNotes: c.duplicateNotes || `Duplicate Consumer Number (${num}) detected across ${count} entries. Verify with supervisor.`
      };
    }
    return {
      ...c,
      status: normalizedStatus,
      isDuplicate: false
    };
  });
}

const LS_CLEAN_START_FLAG = 'TPWODL_PRELOAD_PURGED_V3';

/**
 * Initialize persistent database.
 * Per specification: Starts with ZERO (0) records until the supervisor manually imports an Excel file.
 * Preserves staff profiles and application settings.
 */
export async function initializeDatabase(): Promise<{
  consumers: Consumer[];
  staff: StaffMember[];
}> {
  try {
    const db = await openDB();

    // Check if we need to purge old preloaded records from prior app versions
    const hasPurgedPreloaded = localStorage.getItem(LS_CLEAN_START_FLAG);
    if (!hasPurgedPreloaded) {
      try {
        const purgeTx = db.transaction([STORE_CONSUMERS, STORE_AUDIT], 'readwrite');
        purgeTx.objectStore(STORE_CONSUMERS).clear();
        purgeTx.objectStore(STORE_AUDIT).clear();
        await new Promise((resolve) => {
          purgeTx.oncomplete = resolve;
          purgeTx.onerror = resolve;
        });
        localStorage.removeItem(LS_BACKUP_KEY);
      } catch {
        // ignore
      }
      localStorage.setItem(LS_CLEAN_START_FLAG, 'true');
    }

    // Check existing staff
    const staff = await new Promise<StaffMember[]>((resolve, reject) => {
      const tx = db.transaction(STORE_STAFF, 'readonly');
      const store = tx.objectStore(STORE_STAFF);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });

    const activeStaff = staff.length > 0 ? staff : INITIAL_STAFF;

    // Save staff if it was empty
    if (staff.length === 0) {
      try {
        const sTx = db.transaction(STORE_STAFF, 'readwrite');
        activeStaff.forEach(s => sTx.objectStore(STORE_STAFF).put(s));
      } catch {
        // ignore
      }
    }

    // Check existing consumers
    const consumers = await new Promise<Consumer[]>((resolve, reject) => {
      const tx = db.transaction(STORE_CONSUMERS, 'readonly');
      const store = tx.objectStore(STORE_CONSUMERS);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });

    if (consumers.length > 0) {
      const flagged = flagDuplicates(consumers);
      try {
        localStorage.setItem(LS_BACKUP_KEY, JSON.stringify(flagged));
      } catch {
        // ignore
      }
      return { consumers: flagged, staff: activeStaff };
    }

    // Check localStorage fallback
    try {
      const lsSaved = localStorage.getItem(LS_BACKUP_KEY);
      if (lsSaved) {
        const parsed = JSON.parse(lsSaved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const processed = flagDuplicates(parsed);
          return { consumers: processed, staff: activeStaff };
        }
      }
    } catch {
      // fallback
    }

    // Per user requirement: Startup must start at ZERO (0) records. No auto-seeding.
    return {
      consumers: [],
      staff: activeStaff
    };
  } catch (err) {
    console.warn('IndexedDB unavailable or failed, falling back to empty state', err);
    return { consumers: [], staff: INITIAL_STAFF };
  }
}

/**
 * Save single consumer update (SHIFTED, CABLE SHORTAGE, DOOR LOCK, or NOT UPDATED)
 */
export async function persistConsumerUpdate(
  updatedConsumer: Consumer,
  historyItem: UpdateHistoryItem
): Promise<Consumer> {
  const fullConsumer: Consumer = {
    ...updatedConsumer,
    status: normalizeStatus(updatedConsumer.status, updatedConsumer.irregularityType),
    updatedAt: new Date().toISOString(),
    history: [historyItem, ...(updatedConsumer.history || [])]
  };

  try {
    const db = await openDB();
    const tx = db.transaction([STORE_CONSUMERS, STORE_AUDIT], 'readwrite');
    tx.objectStore(STORE_CONSUMERS).put(fullConsumer);
    tx.objectStore(STORE_AUDIT).put({
      id: historyItem.id,
      consumerId: fullConsumer.id,
      consumerNumber: fullConsumer.consumerNumber,
      timestamp: historyItem.timestamp,
      action: historyItem.action,
      details: historyItem.notes || `Status: ${fullConsumer.status}`,
      staffName: historyItem.assignedStaff || fullConsumer.assignedStaff
    });

    await new Promise((resolve, reject) => {
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('Failed to save to IndexedDB', err);
  }

  try {
    const lsSaved = localStorage.getItem(LS_BACKUP_KEY);
    if (lsSaved) {
      const list: Consumer[] = JSON.parse(lsSaved);
      const idx = list.findIndex(c => c.id === fullConsumer.id);
      if (idx >= 0) {
        list[idx] = fullConsumer;
      } else {
        list.push(fullConsumer);
      }
      localStorage.setItem(LS_BACKUP_KEY, JSON.stringify(list));
    }
  } catch {
    // ignore
  }

  return fullConsumer;
}

/**
 * Bulk persist full consumer list
 */
export async function persistAllConsumers(list: Consumer[]): Promise<Consumer[]> {
  const flagged = flagDuplicates(list);
  localStorage.removeItem(LS_DATA_DELETED_FLAG);

  try {
    const db = await openDB();
    const tx = db.transaction(STORE_CONSUMERS, 'readwrite');
    const store = tx.objectStore(STORE_CONSUMERS);
    await new Promise<void>((resolve, reject) => {
      const clearReq = store.clear();
      clearReq.onsuccess = () => resolve();
      clearReq.onerror = () => reject(clearReq.error);
    });

    for (const item of flagged) {
      store.put(item);
    }

    await new Promise((resolve, reject) => {
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('Failed to bulk write to IndexedDB', err);
  }

  try {
    localStorage.setItem(LS_BACKUP_KEY, JSON.stringify(flagged));
  } catch {
    // ignore
  }

  return flagged;
}

/**
 * Clear all consumer data.
 * Clears all consumer records and update audit logs.
 * Preserves staff profiles and application settings.
 */
export async function clearAllConsumerData(): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction([STORE_CONSUMERS, STORE_AUDIT], 'readwrite');
    tx.objectStore(STORE_CONSUMERS).clear();
    tx.objectStore(STORE_AUDIT).clear();
    await new Promise((resolve, reject) => {
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('Failed to clear IndexedDB consumers', err);
  }

  try {
    localStorage.removeItem(LS_BACKUP_KEY);
    localStorage.setItem(LS_DATA_DELETED_FLAG, 'true');
  } catch {
    // ignore
  }
}

/**
 * Backward-compatible alias for clearAllConsumerData
 */
export const deleteAllConsumerData = clearAllConsumerData;

/**
 * Save staff members
 */
export async function persistStaffList(staffList: StaffMember[]): Promise<StaffMember[]> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_STAFF, 'readwrite');
    const store = tx.objectStore(STORE_STAFF);
    store.clear();
    staffList.forEach(s => store.put(s));
    await new Promise((resolve, reject) => {
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // fallback
  }

  try {
    localStorage.setItem(LS_STAFF_KEY, JSON.stringify(staffList));
  } catch {
    // ignore
  }

  return staffList;
}

/**
 * Reset database back to original 374 Excel records
 */
export async function resetDatabaseToPreloaded(): Promise<{
  consumers: Consumer[];
  staff: StaffMember[];
}> {
  localStorage.removeItem(LS_DATA_DELETED_FLAG);
  const initial = flagDuplicates(PRELOADED_CONSUMERS.map(c => ({
    ...c,
    status: normalizeStatus(c.status, c.irregularityType)
  })));
  await persistAllConsumers(initial);
  await persistStaffList(INITIAL_STAFF);
  return {
    consumers: initial,
    staff: INITIAL_STAFF
  };
}
