/**
 * WhatsAppReportBanner.tsx
 *
 * Hero mobile reporting section rendered below the PhotoUploader in Step 1.
 * Gives citizens an immediate alternative entry point to nivaran
 * without hiding it in a sidebar or modal.
 *
 * Design intent:
 *   "WhatsApp is simply another entry point into nivaran's unified
 *    accountability engine — not a separate product."
 *
 * QR code: Generated via Google Charts API (a Google Technology already
 * approved for this project). Encodes the wa.me deep link so scanning
 * on any phone immediately opens WhatsApp with a pre-filled greeting.
 *
 * The WhatsApp number is read from the VITE_WHATSAPP_NUMBER env var.
 * If not configured, the banner renders without the QR code and shows
 * the web upload as the primary option.
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QrCode, ExternalLink, ChevronDown, ChevronUp, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WhatsAppReportBannerProps {
  className?: string;
}

const WhatsAppIcon: React.FC<{ size?: number; className?: string }> = ({ size = 20, className }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

export const WhatsAppReportBanner: React.FC<WhatsAppReportBannerProps> = ({ className }) => {
  const [expanded, setExpanded] = useState(false);
  const [configWaNumber, setConfigWaNumber] = useState<string>(() => {
    return import.meta.env.VITE_WHATSAPP_NUMBER || '';
  });
  const [waEnabled, setWaEnabled] = useState<boolean>(true);
  const [dismissed, setDismissed] = useState(() => {
    return sessionStorage.getItem('wa_banner_dismissed') === '1';
  });

  React.useEffect(() => {
    // Dynamically query runtime backend configuration to fallback/override build-time env
    fetch('/api/config')
      .then(res => res.json())
      .then(data => {
        if (data.whatsapp_number) {
          setConfigWaNumber(data.whatsapp_number);
        }
        if (data.whatsapp_enabled !== undefined) {
          setWaEnabled(Boolean(data.whatsapp_enabled));
        }
      })
      .catch(() => {
        // Silent fallback to VITE_WHATSAPP_NUMBER
      });
  }, []);

  const waNumberClean = configWaNumber.replace(/\D/g, '');
  const waGreeting = encodeURIComponent('Hi');
  const waDeepLink = (waEnabled && waNumberClean) ? `https://wa.me/${waNumberClean}?text=${waGreeting}` : null;
  const qrUrl = waDeepLink
    ? `https://chart.googleapis.com/chart?chs=200x200&cht=qr&chl=${encodeURIComponent(waDeepLink)}&choe=UTF-8`
    : null;


  if (dismissed) return null;

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    sessionStorage.setItem('wa_banner_dismissed', '1');
    setDismissed(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.15 }}
      className={cn(
        'relative border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white rounded-medium overflow-hidden shadow-sm',
        className
      )}
    >
      {/* Subtle green accent line */}
      <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-emerald-400 to-emerald-600" />

      {/* Dismiss button */}
      <button
        onClick={handleDismiss}
        aria-label="Dismiss WhatsApp banner"
        className="absolute top-3 right-3 p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer z-10"
      >
        <X size={13} />
      </button>

      {/* Header row — always visible */}
      <button
        type="button"
        onClick={() => setExpanded(prev => !prev)}
        className="w-full flex items-center gap-3 px-5 py-4 text-left cursor-pointer group"
        aria-expanded={expanded}
        id="wa-banner-toggle"
      >
        {/* Icon */}
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white shadow-sm">
          <WhatsAppIcon size={18} />
        </span>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-slate-800 leading-tight">
            📱 Report instantly from WhatsApp
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
            On your phone? Skip the form — send a photo & location directly.
          </p>
        </div>

        {/* Expand chevron */}
        <span className="text-slate-400 shrink-0 group-hover:text-slate-600 transition-colors">
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </span>
      </button>

      {/* Expanded content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            key="wa-expanded"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="border-t border-emerald-100 px-5 pb-5 pt-4">
              <div className="flex flex-col sm:flex-row gap-6 items-start">

                {/* Left: Instructions */}
                <div className="flex-1 space-y-3">
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Already on your phone? Scan the QR code or tap the button to open WhatsApp.
                    The same AI pipeline will verify and process your report — no account needed.
                  </p>

                  <div className="space-y-2 text-[11px] text-slate-500">
                    <div className="flex items-center gap-2">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 font-bold text-[10px]">1</span>
                      <span>Send a clear photo of the issue</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 font-bold text-[10px]">2</span>
                      <span>Share your live location</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 font-bold text-[10px]">3</span>
                      <span>Optionally add a description</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 font-bold text-[10px]">✓</span>
                      <span>Get your Case ID and dashboard link instantly</span>
                    </div>
                  </div>

                  {waDeepLink && (
                    <a
                      href={waDeepLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      id="wa-open-link"
                      className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-small shadow-sm transition-colors active:scale-[0.98] cursor-pointer mt-1"
                    >
                      <WhatsAppIcon size={14} />
                      <span>Open WhatsApp</span>
                      <ExternalLink size={11} />
                    </a>
                  )}

                  {!waDeepLink && (
                    <p className="text-[10px] text-slate-400 italic">
                      WhatsApp reporting is not configured in this deployment.
                    </p>
                  )}
                </div>

                {/* Right: QR code */}
                {qrUrl && (
                  <div className="flex flex-col items-center gap-2 shrink-0">
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-medium">
                      <QrCode size={12} />
                      <span>Scan to open WhatsApp</span>
                    </div>
                    <div className="border-2 border-emerald-200 rounded-medium p-2 bg-white shadow-sm">
                      <img
                        src={qrUrl}
                        alt="QR code — scan to open WhatsApp and start reporting"
                        width={140}
                        height={140}
                        className="block rounded"
                        loading="lazy"
                      />
                    </div>

                    <p className="text-[9px] text-slate-400 text-center max-w-[140px] leading-tight">
                      Opens WhatsApp with a pre-filled greeting
                    </p>
                  </div>
                )}
              </div>

              {/* Divider + "Continue with web upload" label */}
              <div className="mt-4 flex items-center gap-3">
                <div className="flex-1 h-px bg-emerald-100" />
                <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider shrink-0">
                  or continue with web upload above
                </span>
                <div className="flex-1 h-px bg-emerald-100" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default WhatsAppReportBanner;
