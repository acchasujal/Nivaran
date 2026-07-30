import React from 'react';
import { usePageTitle } from '../../core/hooks/usePageTitle';
import { Tabs } from '../../design-system/composites/navigation/Tabs';
import { AdminDashboardOverview } from '../../features/admin/components/AdminDashboardOverview';
import { ModerationQueueTable } from '../../features/admin/components/ModerationQueueTable';
import { AuditLogExplorer } from '../../features/admin/components/AuditLogExplorer';
import { UserRoleManager } from '../../features/admin/components/UserRoleManager';
import { FeatureFlagDashboard } from '../../features/admin/components/FeatureFlagDashboard';

export const AdminPage: React.FC = () => {
  usePageTitle('Platform Administration & Governance Console — Nivaran');

  return (
    <div className="space-y-6 font-sans py-2">
      <div className="border-b border-neutral-200 pb-3">
        <h1 className="text-2xl font-bold text-neutral-900">Platform Governance & Administration Hub</h1>
        <p className="text-xs text-neutral-700 mt-0.5">
          Executive controls, content moderation, cryptographic audit trail, and user role management
        </p>
      </div>

      <Tabs
        tabs={[
          {
            id: 'overview',
            label: 'System Overview',
            content: <AdminDashboardOverview />,
          },
          {
            id: 'moderation',
            label: 'Moderation Queue',
            content: <ModerationQueueTable />,
          },
          {
            id: 'audit',
            label: 'Audit Log Explorer',
            content: <AuditLogExplorer />,
          },
          {
            id: 'users',
            label: 'User Roles & Access',
            content: <UserRoleManager />,
          },
          {
            id: 'flags',
            label: 'Feature Flags & System Toggles',
            content: <FeatureFlagDashboard />,
          },
        ]}
      />
    </div>
  );
};

export default AdminPage;
