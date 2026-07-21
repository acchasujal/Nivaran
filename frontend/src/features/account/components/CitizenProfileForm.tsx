import React, { useState } from 'react';
import { useAuth } from '../../../core/providers/AuthProvider';
import { useTheme } from '../../../core/providers/ThemeProvider';
import { useAccessibility } from '../../../core/providers/AccessibilityProvider';
import { Surface } from '../../../design-system/primitives/foundation/Surface';
import { TextField } from '../../../design-system/primitives/forms/TextField';
import { Switch } from '../../../design-system/primitives/forms/Switch';
import { Button } from '../../../design-system/primitives/buttons/Button';
import { ShieldCheck, UserCheck, EyeOff, Lock, Download, Trash2 } from 'lucide-react';

export const CitizenProfileForm: React.FC = () => {
  const { user, logout } = useAuth();
  const { mode, toggleHighContrast } = useTheme();
  const { textScale, setTextScale } = useAccessibility();

  const [name, setName] = useState(user?.name || 'Priya Sharma');
  const [phone, setPhone] = useState(user?.phone || '+91 98765 43210');
  const [anonymousMode, setAnonymousMode] = useState(false);
  const [hidePhone, setHidePhone] = useState(true);

  return (
    <div className="space-y-6 font-sans py-2">
      <div className="flex items-center gap-2 border-b border-neutral-200 pb-3">
        <div className="p-2 bg-primary-500/10 text-primary-700 rounded-pill">
          <UserCheck className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-neutral-900">Citizen Identity & Privacy Settings</h1>
          <p className="text-xs text-neutral-700">Manage persona, accessibility, and cryptographic identity options</p>
        </div>
      </div>

      {/* Persona Details */}
      <Surface variant="card" className="p-6 space-y-4">
        <h3 className="text-base font-semibold text-neutral-900 border-b border-neutral-100 pb-2">
          Personal Information
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <TextField
            name="citizenName"
            label="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <TextField
            name="citizenPhone"
            label="Phone Number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>

        <div className="pt-2 flex justify-end">
          <Button variant="primary" size="sm">
            Save Profile Changes
          </Button>
        </div>
      </Surface>

      {/* Privacy & Anonymous Mode */}
      <Surface variant="card" className="p-6 space-y-4">
        <div className="flex items-center gap-2 border-b border-neutral-100 pb-2 text-neutral-900 font-semibold">
          <EyeOff className="w-5 h-5 text-primary-700" />
          <h3>Privacy Controls & Anonymous Reporting</h3>
        </div>

        <Switch
          label="Enable Anonymous Reporting Mode"
          description="Hides your name and avatar from public case feeds while preserving cryptographic verification"
          checked={anonymousMode}
          onChange={setAnonymousMode}
        />

        <Switch
          label="Mask Phone Number in Municipal Dispatches"
          description="Conceals your phone number from contractor dispatch records"
          checked={hidePhone}
          onChange={setHidePhone}
        />
      </Surface>

      {/* Accessibility & Visual contrast */}
      <Surface variant="card" className="p-6 space-y-4">
        <div className="flex items-center gap-2 border-b border-neutral-100 pb-2 text-neutral-900 font-semibold">
          <ShieldCheck className="w-5 h-5 text-primary-700" />
          <h3>Visual Contrast & Typography Preferences</h3>
        </div>

        <Switch
          label="High Contrast Outdoor Mode"
          description="Enforces black/white contrast borders for high daylight visibility"
          checked={mode === 'high-contrast'}
          onChange={toggleHighContrast}
        />

        <div className="pt-2 space-y-2">
          <label className="block text-sm font-medium text-neutral-900">Font Scale</label>
          <div className="flex gap-2">
            {(['standard', 'large', 'extra-large'] as const).map((scale) => (
              <Button
                key={scale}
                variant={textScale === scale ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setTextScale(scale)}
              >
                {scale.toUpperCase()}
              </Button>
            ))}
          </div>
        </div>
      </Surface>

      {/* Account Security & Data Export */}
      <Surface variant="card" className="p-6 space-y-4 border-l-4 border-l-danger">
        <div className="flex items-center gap-2 text-danger font-semibold border-b border-neutral-100 pb-2">
          <Lock className="w-5 h-5" />
          <h3>Account Security & Data Sovereignty</h3>
        </div>

        <p className="text-xs text-neutral-700 leading-relaxed">
          CivicPulse enforces citizen data sovereignty. You can export your evidence ledger or sign out at any time.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Button variant="secondary" size="sm" leadingIcon={<Download className="w-4 h-4" />}>
            Export My Evidence Data (JSON)
          </Button>

          <Button variant="danger" size="sm" onClick={logout} leadingIcon={<Trash2 className="w-4 h-4" />}>
            Sign Out / Reset Identity
          </Button>
        </div>
      </Surface>
    </div>
  );
};
