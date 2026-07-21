import React from 'react';
import { useOffline } from '../../../core/providers/OfflineProvider';
import { useConnectivity } from '../../../core/providers/ConnectivityProvider';
import { Surface } from '../../../design-system/primitives/foundation/Surface';
import { Progress } from '../../../design-system/primitives/feedback/Progress';
import { Button } from '../../../design-system/primitives/buttons/Button';
import { HardDrive, RefreshCw, Wifi, WifiOff, Trash2 } from 'lucide-react';

export const OfflineQueueInspector: React.FC = () => {
  const { pendingDrafts, pendingCount, syncPendingQueue, removeDraft, isSyncing } = useOffline();
  const { isOnline } = useConnectivity();

  return (
    <Surface variant="card" className="p-6 space-y-4 font-sans">
      <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-primary-500/10 text-primary-700 rounded-pill">
            <HardDrive className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-neutral-900">Offline Queue & Storage Inspector</h3>
            <p className="text-xs text-neutral-700">Monitors local storage cache and pending background sync uploads</p>
          </div>
        </div>

        <span
          className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-pill ${
            isOnline ? 'bg-green-100 text-success' : 'bg-amber-100 text-amber-900'
          }`}
        >
          {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
          {isOnline ? 'Online (Ready to Sync)' : 'Offline Mode Active'}
        </span>
      </div>

      {/* Storage usage meter */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs font-medium text-neutral-900">
          <span>Local Offline Queue Capacity</span>
          <span>{pendingCount} Queued Items (~{(pendingCount * 1.2).toFixed(1)} MB)</span>
        </div>
        <Progress value={Math.min(100, pendingCount * 10)} showPercentage label="Offline Storage Meter" />
      </div>

      {/* Queue items list */}
      <div className="pt-2 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-700">
            Pending Queue Items
          </h4>

          <Button
            variant="primary"
            size="sm"
            loading={isSyncing}
            disabled={!isOnline || pendingCount === 0}
            onClick={syncPendingQueue}
            leadingIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Force Sync Queue
          </Button>
        </div>

        {pendingCount === 0 ? (
          <div className="p-4 bg-neutral-50 rounded-md text-center text-xs text-neutral-700">
            All report drafts are fully synchronized with the public ledger.
          </div>
        ) : (
          <div className="space-y-2">
            {pendingDrafts.map((item) => (
              <div
                key={item.id}
                className="p-3 bg-neutral-50 border border-neutral-200 rounded-md flex items-center justify-between text-xs"
              >
                <div>
                  <p className="font-semibold text-neutral-900">{item.title}</p>
                  <p className="font-mono text-neutral-700 mt-0.5">ID: {item.id} | {item.createdAt}</p>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeDraft(item.id)}
                  leadingIcon={<Trash2 className="w-3.5 h-3.5 text-danger" />}
                >
                  Discard
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </Surface>
  );
};
