import React, { useState, useEffect } from 'react';
import { Clock, Flame, Zap } from 'lucide-react';

interface PromoCountdownProps {
  variant?: 'compact' | 'card' | 'banner';
  priceSetting?: {
    flashSaleHours?: number;
    flashSaleMinutes?: number;
    normalPrice?: number;
    promoPrice?: number;
  };
  onExpire?: () => void;
}

export const PromoCountdown: React.FC<PromoCountdownProps> = ({ variant = 'card', priceSetting }) => {
  const defaultHours = priceSetting?.flashSaleHours ?? 4;
  const defaultMins = priceSetting?.flashSaleMinutes ?? 15;

  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number }>({
    hours: defaultHours,
    minutes: defaultMins,
    seconds: 0
  });

  useEffect(() => {
    // Determine target end timestamp for countdown
    // Store/retrieve target timestamp relative to when admin updated or when current session started
    const totalMs = (defaultHours * 3600000) + (defaultMins * 60000);
    const sessionKey = `neurona_timer_target_${defaultHours}_${defaultMins}`;
    
    let targetTime = Number(sessionStorage.getItem(sessionKey));
    if (!targetTime || isNaN(targetTime) || targetTime <= Date.now()) {
      targetTime = Date.now() + (totalMs > 0 ? totalMs : 14400000);
      sessionStorage.setItem(sessionKey, targetTime.toString());
    }

    const updateTimer = () => {
      const now = Date.now();
      let diff = targetTime - now;

      if (diff <= 0) {
        // Reset when timer finishes
        targetTime = Date.now() + (totalMs > 0 ? totalMs : 14400000);
        sessionStorage.setItem(sessionKey, targetTime.toString());
        diff = targetTime - now;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ hours, minutes, seconds });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [defaultHours, defaultMins]);

  const format2Digits = (num: number) => String(num).padStart(2, '0');

  if (variant === 'banner') {
    return (
      <div className="inline-flex items-center gap-2 font-mono font-bold text-amber-300 text-xs sm:text-sm">
        <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
        <span>Sisa Waktu Promo:</span>
        <span className="bg-amber-950/80 px-2 py-0.5 rounded border border-amber-500/30 text-amber-300">
          {format2Digits(timeLeft.hours)} : {format2Digits(timeLeft.minutes)} : {format2Digits(timeLeft.seconds)}
        </span>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-1.5 font-mono text-xs">
        <span className="bg-slate-900 text-cyan-400 font-black px-2 py-1 rounded-md border border-cyan-500/30">
          {format2Digits(timeLeft.hours)}
        </span>
        <span className="text-slate-400 font-bold">:</span>
        <span className="bg-slate-900 text-cyan-400 font-black px-2 py-1 rounded-md border border-cyan-500/30">
          {format2Digits(timeLeft.minutes)}
        </span>
        <span className="text-slate-400 font-bold">:</span>
        <span className="bg-slate-900 text-cyan-400 font-black px-2 py-1 rounded-md border border-cyan-500/30">
          {format2Digits(timeLeft.seconds)}
        </span>
      </div>
    );
  }

  // Variant: 'card' (Featured in Pricing & Hero)
  return (
    <div className="bg-gradient-to-r from-rose-950/80 via-slate-900 to-amber-950/80 border border-amber-500/40 rounded-2xl p-4 shadow-xl backdrop-blur-md">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
          <span className="text-xs font-black text-rose-400 uppercase tracking-wider flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 text-rose-500 fill-rose-500" /> Flash Sale Terbatas
          </span>
        </div>
        <span className="text-[11px] font-semibold text-amber-300/90 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
          Harga Naik Kembali ke Rp {(priceSetting?.normalPrice ?? 499000).toLocaleString('id-ID')}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2.5 text-center">
        <div className="bg-black/60 rounded-xl p-2 border border-white/10 shadow-inner">
          <div className="font-mono text-2xl sm:text-3xl font-black text-white tracking-wider">
            {format2Digits(timeLeft.hours)}
          </div>
          <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mt-0.5">Jam</div>
        </div>

        <div className="bg-black/60 rounded-xl p-2 border border-white/10 shadow-inner">
          <div className="font-mono text-2xl sm:text-3xl font-black text-cyan-400 tracking-wider">
            {format2Digits(timeLeft.minutes)}
          </div>
          <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mt-0.5">Menit</div>
        </div>

        <div className="bg-black/60 rounded-xl p-2 border border-white/10 shadow-inner">
          <div className="font-mono text-2xl sm:text-3xl font-black text-amber-400 tracking-wider">
            {format2Digits(timeLeft.seconds)}
          </div>
          <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mt-0.5">Detik</div>
        </div>
      </div>
    </div>
  );
};
