import React, { useState } from 'react';
import { useCommunityStore } from '../state/useCommunityStore';
import { Surface } from '../../../design-system/primitives/foundation/Surface';
import { TextField } from '../../../design-system/primitives/forms/TextField';
import { Button } from '../../../design-system/primitives/buttons/Button';
import { Users, UserPlus, ShieldCheck, MapPin } from 'lucide-react';

export interface VolunteerDirectoryProps {
  className?: string;
}

export const VolunteerDirectory: React.FC<VolunteerDirectoryProps> = ({ className }) => {
  const { volunteers, registerVolunteer } = useCommunityStore();
  const [showSignup, setShowSignup] = useState(false);
  const [name, setName] = useState('');
  const [ward, setWard] = useState('Ward 14 (Sector 62)');
  const [skills, setSkills] = useState('Site Inspection, Photography');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    registerVolunteer(
      name,
      ward,
      skills.split(',').map((s) => s.trim())
    );
    setName('');
    setShowSignup(false);
  };

  return (
    <div className={`space-y-4 font-sans ${className || ''}`}>
      <Surface variant="card" className="p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
          <div className="flex items-center gap-2 text-primary-700 font-semibold">
            <Users className="w-5 h-5" />
            <h3 className="text-base text-neutral-900">Ward Community Volunteer Directory</h3>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowSignup(!showSignup)}
            leadingIcon={<UserPlus className="w-4 h-4" />}
          >
            {showSignup ? 'Close Signup' : 'Register as Ward Volunteer'}
          </Button>
        </div>

        {showSignup && (
          <form onSubmit={handleSubmit} className="p-4 bg-neutral-50 rounded-lg border border-neutral-200 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
              Join Local Civic Audit Volunteer Corps
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <TextField
                name="volName"
                label="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <TextField
                name="volWard"
                label="Municipal Ward"
                value={ward}
                onChange={(e) => setWard(e.target.value)}
                required
              />
            </div>

            <TextField
              name="volSkills"
              label="Skills / Capabilities (Comma separated)"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
            />

            <div className="flex justify-end">
              <Button type="submit" variant="primary" size="sm">
                Submit Volunteer Registration
              </Button>
            </div>
          </form>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          {volunteers.map((vol) => (
            <div key={vol.id} className="p-3 bg-white border border-neutral-200 rounded-md space-y-2">
              <div className="flex items-center justify-between">
                <h5 className="text-sm font-semibold text-neutral-900">{vol.name}</h5>
                <span className="text-[10px] font-mono font-bold text-success bg-green-100 px-2 py-0.5 rounded-pill flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Active Volunteer
                </span>
              </div>

              <p className="text-xs text-neutral-700 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-neutral-700" /> {vol.ward}
              </p>

              <div className="flex flex-wrap gap-1 pt-1">
                {vol.skills.map((skill, idx) => (
                  <span key={idx} className="text-[10px] font-mono text-neutral-700 bg-neutral-100 px-1.5 py-0.5 rounded-sm">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Surface>
    </div>
  );
};
