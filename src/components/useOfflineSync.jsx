import { useState, useEffect, useCallback, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import {
  enqueueOperation,
  getPendingOps,
  markOpSynced,
  getPendingCount,
} from './offlineQueue';

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  useEffect(() => {
    const on = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);
  return isOnline;
}

async function replayOp(op) {
  if (op.type === 'task_update') {
    await base44.entities.Task.update(op.entityId, op.payload);
  } else if (op.type === 'time_entry_create') {
    const { _tempId, ...payload } = op.payload;
    await base44.entities.TimeEntry.create(payload);
  } else if (op.type === 'time_entry_update') {
    await base44.entities.TimeEntry.update(op.entityId, op.payload);
  }
}

export function useOfflineSync(onSyncComplete) {
  const isOnline = useOnlineStatus();
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const syncingRef = useRef(false);
  const wentOfflineRef = useRef(false);

  const refreshPendingCount = useCallback(async () => {
    const count = await getPendingCount();
    setPendingCount(count);
  }, []);

  const sync = useCallback(async () => {
    if (syncingRef.current) return;
    const ops = await getPendingOps();
    if (ops.length === 0) return;

    syncingRef.current = true;
    setIsSyncing(true);
    let successCount = 0;
    for (const op of ops) {
      try {
        await replayOp(op);
        await markOpSynced(op.id);
        successCount++;
      } catch (err) {
        console.warn('Sync failed for op', op.id, err);
      }
    }
    syncingRef.current = false;
    setIsSyncing(false);
    await refreshPendingCount();
    if (successCount > 0 && onSyncComplete) onSyncComplete(successCount);
  }, [onSyncComplete, refreshPendingCount]);

  useEffect(() => {
    if (!isOnline) {
      wentOfflineRef.current = true;
    }
    if (isOnline && wentOfflineRef.current) {
      wentOfflineRef.current = false;
      sync();
    }
  }, [isOnline, sync]);

  useEffect(() => { refreshPendingCount(); }, [refreshPendingCount]);

  return { isOnline, pendingCount, isSyncing, sync, refreshPendingCount };
}

export async function updateTaskOffline(taskId, data, isOnline) {
  if (isOnline) {
    return base44.entities.Task.update(taskId, data);
  }
  await enqueueOperation({ type: 'task_update', entityId: taskId, payload: data });
  return { offline: true };
}

export async function createTimeEntryOffline(data, isOnline) {
  if (isOnline) {
    return base44.entities.TimeEntry.create(data);
  }
  const tempId = `offline_${Date.now()}`;
  await enqueueOperation({ type: 'time_entry_create', payload: { ...data, _tempId: tempId } });
  return { offline: true, _tempId: tempId, ...data };
}

export async function updateTimeEntryOffline(entryId, data, isOnline) {
  if (isOnline) {
    return base44.entities.TimeEntry.update(entryId, data);
  }
  await enqueueOperation({ type: 'time_entry_update', entityId: entryId, payload: data });
  return { offline: true };
}