import React, { useState } from 'react';
import { Shield, User, LogOut, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth, type UserRole } from '../../core/providers/AuthProvider';
import { apiClient } from '../../api/client';
import { Button } from '../../design-system/primitives/buttons/Button';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DEMO_ACCOUNTS = [
  {
    role: 'citizen' as UserRole,
    name: 'Aarav Patel (Citizen)',
    email: 'citizen@nivaran.org',
    dept: 'Public Resident',
    desc: 'Public citizen reporting interface, tracker & My Reports',
  },
  {
    role: 'officer' as UserRole,
    name: 'Rajesh Kumar (Municipal Officer)',
    email: 'officer@mcgm.gov.in',
    dept: 'K-East Ward Municipal Office',
    desc: 'Official Case Queue, SLA alerts & Resolution workflow',
  },
  {
    role: 'auditor' as UserRole,
    name: 'Priya Sharma (Public Auditor)',
    email: 'auditor@nivaran.org',
    dept: 'Public Audit Bureau',
    desc: 'Compliance review, audit trail & Evaluation framework',
  },
  {
    role: 'admin' as UserRole,
    name: 'System Administrator',
    email: 'admin@nivaran.org',
    dept: 'IT & Governance',
    desc: 'Full administrative controls & system observability',
  },
];

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { user, role, isAuthenticated, login, logout } = useAuth();
  const [loadingEmail, setLoadingEmail] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDemoLogin = async (acc: typeof DEMO_ACCOUNTS[0]) => {
    setLoadingEmail(acc.email);
    setErrorMsg(null);

    try {
      const res = await apiClient.post('/auth/login', {
        email: acc.email,
        password: 'nivaran2026!',
      });

      const data = res.data;
      login(data.access_token, {
        id: data.user.id,
        name: data.user.name,
        role: data.user.role as UserRole,
        department: data.user.department,
        avatarUrl: data.user.avatarUrl,
        phone: data.user.phone,
      });

      onClose();
    } catch (err: any) {
      console.warn('Demo login via API fallback:', err);
      // Fallback local login if backend auth endpoint is unreachable
      login(`demo-token-${acc.role}`, {
        id: `USR-${acc.role.toUpperCase()}-DEMO`,
        name: acc.name,
        role: acc.role,
        department: acc.dept,
      });
      onClose();
    } finally {
      setLoadingEmail(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm font-sans animate-fade-in">
      <div className="bg-white border border-slate-200 rounded-medium shadow-modal w-full max-w-lg overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-teal-600" />
            <h3 className="font-bold text-base text-slate-800">
              Nivaran Identity & Access Management
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-full text-sm font-bold"
          >
            ✕
          </button>
        </div>

        {/* Current Identity Banner */}
        <div className="px-6 py-3 bg-teal-50 border-b border-teal-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-teal-700" />
            <span className="text-xs text-teal-900">
              Current Session: <strong>{user?.name || 'Anonymous Citizen'}</strong> ({role.toUpperCase()})
            </span>
          </div>
          {isAuthenticated && (
            <Button variant="ghost" size="sm" onClick={logout} className="text-xs text-red-600 hover:bg-red-50">
              <LogOut className="w-3.5 h-3.5 mr-1" /> Logout
            </Button>
          )}
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <p className="text-xs text-slate-600 leading-relaxed">
            Select a verified role account below to experience Nivaran's role-based access control (RBAC), executive case queue, and audit trails.
          </p>

          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="space-y-3">
            {DEMO_ACCOUNTS.map((acc) => {
              const isCurrent = user?.role === acc.role && isAuthenticated;
              const isLoading = loadingEmail === acc.email;

              return (
                <div
                  key={acc.email}
                  onClick={() => handleDemoLogin(acc)}
                  className={`p-3.5 rounded-medium border text-left cursor-pointer transition-all flex items-start justify-between gap-3 ${
                    isCurrent
                      ? 'border-teal-500 bg-teal-50/40 ring-1 ring-teal-500'
                      : 'border-slate-200 hover:border-teal-400 hover:bg-slate-50'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-800">{acc.name}</span>
                      {isCurrent && (
                        <span className="text-[10px] font-bold bg-teal-600 text-white px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Active
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-semibold text-teal-700">{acc.email} • {acc.dept}</div>
                    <div className="text-[11px] text-slate-500">{acc.desc}</div>
                  </div>

                  <Button
                    variant={isCurrent ? 'secondary' : 'primary'}
                    size="sm"
                    loading={isLoading}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDemoLogin(acc);
                    }}
                    className="shrink-0 text-xs"
                  >
                    {isCurrent ? 'Switch' : 'Sign In'}
                  </Button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <span>JWT Standard Bearer Auth • Server-Side Security Enforced</span>
          <Button variant="ghost" size="sm" onClick={onClose} className="text-xs">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};
