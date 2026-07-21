import React, { useState } from 'react';
import { useNotificationsStore } from '../state/useNotificationsStore';
import { Surface } from '../../../design-system/primitives/foundation/Surface';
import { StatusChip } from '../../../design-system/composites/status/StatusChip';
import { Button } from '../../../design-system/primitives/buttons/Button';
import { IconButton } from '../../../design-system/primitives/buttons/IconButton';
import { EmptyState } from '../../../design-system/primitives/feedback/EmptyState';
import { Bell, CheckCheck, Trash2, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const NotificationCenter: React.FC = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, removeNotification } = useNotificationsStore();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const navigate = useNavigate();

  const filtered = notifications.filter((n) => (filter === 'unread' ? !n.read : true));

  return (
    <div className="space-y-4 font-sans py-2">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-neutral-200 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-primary-500/10 text-primary-700 rounded-pill">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-neutral-900">Notification Center</h1>
            <p className="text-xs text-neutral-700">Realtime SLA alerts, official responses, and community updates</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead} leadingIcon={<CheckCheck className="w-4 h-4 text-primary-700" />}>
              Mark All as Read ({unreadCount})
            </Button>
          )}
        </div>
      </div>

      <div className="flex gap-2">
        <Button variant={filter === 'all' ? 'primary' : 'secondary'} size="sm" onClick={() => setFilter('all')}>
          All Notifications ({notifications.length})
        </Button>
        <Button variant={filter === 'unread' ? 'primary' : 'secondary'} size="sm" onClick={() => setFilter('unread')}>
          Unread ({unreadCount})
        </Button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No notifications" description="You have no notifications matching the selected filter." />
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => (
            <Surface
              key={item.id}
              variant="card"
              elevation={item.read ? 0 : 1}
              className={`p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-l-4 ${
                item.read ? 'border-l-neutral-300 bg-neutral-50/50' : 'border-l-primary-500 bg-white'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <StatusChip
                    category={item.category === 'government' ? 'government' : item.category === 'community' ? 'community' : 'verified'}
                    label={item.category.toUpperCase()}
                    size="sm"
                  />
                  <span className="text-xs font-mono text-neutral-700">{item.timestamp}</span>
                </div>

                <h4 className="text-sm font-semibold text-neutral-900">{item.title}</h4>
                <p className="text-xs text-neutral-700 leading-relaxed">{item.message}</p>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                {!item.read && (
                  <Button variant="ghost" size="sm" onClick={() => markAsRead(item.id)}>
                    Mark Read
                  </Button>
                )}

                {item.caseId && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => navigate(`/issue/${item.caseId}`)}
                    leadingIcon={<ArrowRight className="w-3.5 h-3.5" />}
                  >
                    View Case
                  </Button>
                )}

                <IconButton
                  icon={<Trash2 className="w-4 h-4 text-neutral-700 hover:text-danger" />}
                  label="Remove notification"
                  onClick={() => removeNotification(item.id)}
                  size="sm"
                />
              </div>
            </Surface>
          ))}
        </div>
      )}
    </div>
  );
};
