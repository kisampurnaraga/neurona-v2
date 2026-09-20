import React, { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';

interface FloatingWhatsAppProps {
  phoneNumber: string;
}

export const FloatingWhatsApp: React.FC<FloatingWhatsAppProps> = ({ phoneNumber }) => {
  const [showTooltip, setShowTooltip] = useState(true);

  // Clean phone number to WhatsApp international format (e.g. 628...)
  const getCleanWhatsAppNumber = (num: string): string => {
    let clean = (num || '').replace(/[^0-9]/g, '');
    if (clean.startsWith('0')) {
      clean = '62' + clean.slice(1);
    } else if (clean.startsWith('8')) {
      clean = '62' + clean;
    }
    return clean || '628123456789';
  };

  const targetNumber = getCleanWhatsAppNumber(phoneNumber);
  const waUrl = `https://wa.me/${targetNumber}?text=Halo%20Admin%20Neurona,%20saya%20ingin%20bertanya%20seputar%20Aplikasi%20Storyboard%20AI%20Rp%2099.000`;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3">
      {/* Tooltip / Speech bubble */}
      {showTooltip && (
        <div className="hidden sm:flex items-center gap-2 bg-slate-900/95 text-white px-3.5 py-2 rounded-2xl shadow-xl border border-emerald-500/30 text-xs font-semibold backdrop-blur-md animate-fade-in relative">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
          <span>Tanya Admin via WhatsApp</span>
          <button 
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowTooltip(false);
            }}
            className="text-slate-400 hover:text-slate-200 ml-1 p-0.5 rounded-full"
            title="Tutup pesan"
          >
            <X className="w-3.5 h-3.5" />
          </button>
          
          {/* Little arrow pointing to button */}
          <div className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 bg-slate-900 border-t border-r border-emerald-500/30 rotate-45 pointer-events-none"></div>
        </div>
      )}

      {/* Floating Button with Ripple Effect */}
      <a
        href={waUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat WhatsApp Admin"
        className="relative group flex items-center justify-center w-14 h-14 bg-gradient-to-tr from-emerald-600 to-green-500 hover:from-emerald-500 hover:to-green-400 text-white rounded-full shadow-2xl shadow-emerald-500/40 hover:shadow-emerald-500/60 transition-all duration-300 hover:scale-110 active:scale-95"
      >
        {/* Pulsing ring animation */}
        <span className="absolute inset-0 rounded-full bg-emerald-400 opacity-40 animate-ping pointer-events-none"></span>
        <span className="absolute -inset-1 rounded-full bg-emerald-500/20 blur-sm pointer-events-none"></span>

        {/* WhatsApp Icon */}
        <MessageCircle className="w-7 h-7 fill-white text-white drop-shadow relative z-10" />

        {/* Badge Indicator */}
        <span className="absolute top-0 right-0 w-4 h-4 bg-rose-500 border-2 border-white rounded-full flex items-center justify-center text-[9px] font-black text-white shadow">
          1
        </span>
      </a>
    </div>
  );
};
