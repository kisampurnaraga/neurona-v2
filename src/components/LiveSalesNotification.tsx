import React, { useState, useEffect } from 'react';
import { CheckCircle2, Sparkles, X, ShoppingBag } from 'lucide-react';

interface PurchaseNotification {
  name: string;
  city: string;
  product: string;
  timeAgo: string;
  avatarColor: string;
}

const NOTIFICATIONS_LIST: PurchaseNotification[] = [
  {
    name: 'Budi Santoso',
    city: 'Jakarta Selatan',
    product: 'Akses Seumur Hidup Storyboard AI',
    timeAgo: 'Baru saja',
    avatarColor: 'from-blue-500 to-cyan-500'
  },
  {
    name: 'Rian Pratama',
    city: 'Bandung',
    product: 'Promo Rp 99.000 (Sekali Bayar)',
    timeAgo: '1 menit yang lalu',
    avatarColor: 'from-purple-500 to-pink-500'
  },
  {
    name: 'Siti Rahmawati',
    city: 'Surabaya',
    product: 'Akses Seumur Hidup Storyboard AI',
    timeAgo: '2 menit yang lalu',
    avatarColor: 'from-emerald-500 to-teal-500'
  },
  {
    name: 'Dina Marlina',
    city: 'Medan',
    product: 'Aplikasi Penghasil Storyboard AI',
    timeAgo: '3 menit yang lalu',
    avatarColor: 'from-amber-500 to-orange-500'
  },
  {
    name: 'Ahmad Fauzi',
    city: 'Semarang',
    product: 'Promo Rp 99.000 (Sekali Bayar)',
    timeAgo: 'Baru saja',
    avatarColor: 'from-cyan-500 to-blue-600'
  },
  {
    name: 'Fajar Nugraha',
    city: 'Yogyakarta',
    product: 'Akses Seumur Hidup Storyboard AI',
    timeAgo: '2 menit yang lalu',
    avatarColor: 'from-rose-500 to-red-500'
  },
  {
    name: 'Dewi Lestari',
    city: 'Denpasar',
    product: 'Aplikasi Penghasil Storyboard AI',
    timeAgo: '4 menit yang lalu',
    avatarColor: 'from-violet-500 to-purple-600'
  },
  {
    name: 'Eko Prasetyo',
    city: 'Bekasi',
    product: 'Promo Rp 99.000 (Sekali Bayar)',
    timeAgo: '1 menit yang lalu',
    avatarColor: 'from-teal-500 to-emerald-600'
  },
  {
    name: 'Maya Anggraini',
    city: 'Makassar',
    product: 'Akses Seumur Hidup Storyboard AI',
    timeAgo: '3 menit yang lalu',
    avatarColor: 'from-pink-500 to-rose-500'
  },
  {
    name: 'Hendro Wijaya',
    city: 'Tangerang',
    product: 'Promo Rp 99.000 (Sekali Bayar)',
    timeAgo: 'Baru saja',
    avatarColor: 'from-indigo-500 to-cyan-500'
  }
];

interface LiveSalesNotificationProps {
  onActionClick?: () => void;
}

export const LiveSalesNotification: React.FC<LiveSalesNotificationProps> = ({ onActionClick }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [isPermanentlyClosed, setIsPermanentlyClosed] = useState(false);

  useEffect(() => {
    if (isPermanentlyClosed) return;

    // First appearance after 4 seconds
    const initialTimer = setTimeout(() => {
      setIsVisible(true);
    }, 4000);

    // Loop interval
    const interval = setInterval(() => {
      // Hide first
      setIsVisible(false);

      // Wait 3-5 seconds then show next
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % NOTIFICATIONS_LIST.length);
        setIsVisible(true);
      }, 4000);
    }, 11000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [isPermanentlyClosed]);

  if (isPermanentlyClosed) return null;

  const current = NOTIFICATIONS_LIST[currentIndex];
  const initial = current.name.charAt(0);

  return (
    <div 
      className={`fixed bottom-5 left-4 sm:left-6 z-40 max-w-sm transition-all duration-500 transform ${
        isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-6 pointer-events-none scale-95'
      }`}
    >
      <div 
        onClick={onActionClick}
        className="bg-slate-900/95 backdrop-blur-md text-white p-3.5 rounded-2xl shadow-2xl border border-cyan-500/30 hover:border-cyan-400 cursor-pointer transition-all flex items-start gap-3 relative group"
      >
        {/* Dismiss Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsVisible(false);
            setTimeout(() => setIsPermanentlyClosed(true), 400);
          }}
          className="absolute -top-2 -right-2 w-6 h-6 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-full flex items-center justify-center border border-slate-600 shadow-md transition-colors"
          title="Tutup Notifikasi"
        >
          <X className="w-3.5 h-3.5" />
        </button>

        {/* User Initial Avatar */}
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${current.avatarColor} flex items-center justify-center font-bold text-white shadow-md text-sm shrink-0`}>
          {initial}
        </div>

        {/* Content */}
        <div className="flex-1 pr-2 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-bold text-xs text-white truncate max-w-[130px]">{current.name}</span>
            <span className="text-[10px] text-slate-400 font-medium">({current.city})</span>
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 bg-emerald-950/80 text-emerald-400 text-[9px] font-bold rounded-full border border-emerald-500/30">
              <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" /> Terverifikasi
            </span>
          </div>

          <p className="text-[11px] text-slate-300 font-medium mt-0.5 line-clamp-1">
            Membeli: <strong className="text-cyan-300">{current.product}</strong>
          </p>

          <div className="flex items-center justify-between mt-1 text-[10px] text-slate-400">
            <span>{current.timeAgo}</span>
            <span className="text-cyan-400 font-bold group-hover:underline flex items-center gap-0.5">
              Amankan Slot &rarr;
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
