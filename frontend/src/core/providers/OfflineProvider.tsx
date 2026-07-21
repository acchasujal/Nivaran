import React, { createContext, useContext, useState, useEffect } from 'react';
import { useConnectivity } from './ConnectivityProvider';

export interface OfflineDraft {
  id: string;
  title: string;
  category: string;
  createdAt: string;
  payload: any;
}

export interface OfflineContextType {
  pendingDrafts: OfflineDraft[];
  pendingCount: number;
  saveDraft: (draft: Omit<OfflineDraft, 'id' | 'createdAt'>) => void;
  removeDraft: (id: string) => void;
  syncPendingQueue: () => Promise<void>;
  isSyncing: boolean;
}

const OfflineContext = createContext<OfflineContextType | undefined>(undefined);

export const OfflineProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isOnline } = useConnectivity();
  const [pendingDrafts, setPendingDrafts] = useState<OfflineDraft[]>(() => {
    const saved = localStorage.getItem('civicpulse_offline_queue');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return [];
  });
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    localStorage.setItem('civicpulse_offline_queue', JSON.stringify(pendingDrafts));
  }, [pendingDrafts]);

  // Auto-sync when coming back online
  useEffect(() => {
    if (isOnline && pendingDrafts.length > 0 && !isSyncing) {
      syncPendingQueue();
    }
  }, [isOnline]);

  const saveDraft = (draft: Omit<OfflineDraft, 'id' | 'createdAt'>) => {
    const newDraft: OfflineDraft = {
      ...draft,
      id: `DRAFT-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setPendingDrafts((prev) => [...prev, newDraft]);
  };

  const removeDraft = (id: string) => {
    setPendingDrafts((prev) => prev.filter((d) => d.id !== id));
  };

  const syncPendingQueue = async () => {
    if (pendingDrafts.length === 0) return;
    setIsSyncing(true);
    try {
      // Simulate dispatching local queued drafts to FastAPI backend
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setPendingDrafts([]);
    } catch (err) {
      console.error('Offline sync failed:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <OfflineContext.Provider
      value={{
        pendingDrafts,
        pendingCount: pendingDrafts.length,
        saveDraft,
        removeDraft,
        syncPendingQueue,
        isSyncing,
      }}
    >
      {children}
    </OfflineContext.Provider>
  );
};

export const useOffline = (): OfflineContextType => {
  const context = useContext(OfflineContext);
  if (!context) {
    throw new Error('useOffline must be used within an OfflineProvider');
  }
  return context;
};
