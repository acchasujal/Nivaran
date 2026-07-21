import React, { useState } from 'react';
import { Surface } from '../../../design-system/primitives/foundation/Surface';
import { Switch } from '../../../design-system/primitives/forms/Switch';
import { Bell } from 'lucide-react';

export const NotificationPreferences: React.FC = () => {
  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [whatsAppEnabled, setWhatsAppEnabled] = useState(true);
  const [slaAlertsOnly, setSlaAlertsOnly] = useState(false);

  return (
    <Surface variant="card" className="p-6 space-y-4 font-sans">
      <div className="flex items-center gap-2 border-b border-neutral-100 pb-2 text-neutral-900 font-semibold">
        <Bell className="w-5 h-5 text-primary-700" />
        <h3>Notification Channels & Delivery Settings</h3>
      </div>

      <div className="space-y-3">
        <Switch
          label="Browser Push Notifications"
          description="Receive instant alerts for official SLA breaches and case status changes"
          checked={pushEnabled}
          onChange={setPushEnabled}
        />

        <Switch
          label="WhatsApp Status Delivery"
          description="Opt-in to WhatsApp message notifications when official work orders are issued"
          checked={whatsAppEnabled}
          onChange={setWhatsAppEnabled}
        />

        <Switch
          label="Email Reports Summary"
          description="Receive weekly digest of verified community repairs in your ward"
          checked={emailEnabled}
          onChange={setEmailEnabled}
        />

        <div className="pt-2 border-t border-neutral-100">
          <Switch
            label="SLA Escalation Alerts Only"
            description="Filter out community comments; only alert when official government SLA deadline is reached"
            checked={slaAlertsOnly}
            onChange={setSlaAlertsOnly}
          />
        </div>
      </div>
    </Surface>
  );
};
