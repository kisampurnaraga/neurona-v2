import React from 'react';
import { DollarSign, Target, ShoppingBag, Briefcase, Award } from 'lucide-react';
import { MonetizationIntelligenceData } from '../../types/creatorAutopilot';

interface MonetizationTabProps {
  monetization: MonetizationIntelligenceData | null;
}

export const MonetizationTab: React.FC<MonetizationTabProps> = ({ monetization }) => {
  const yt = monetization?.youtubePartnerProgress || {
    subscriberCount: 0,
    subscriberTarget: 1000,
    shortsViews: 0,
    shortsViewsTarget: 10000000,
    watchHours: 0,
    watchHoursTarget: 4000,
    isEligible: false
  };

  const affiliateOpps = monetization?.affiliateOpportunities || [];
  const sponsorshipOpps = monetization?.sponsorshipOpportunities || [];
  const productIdeas = monetization?.digitalProductIdeas || [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-emerald-400" />
          Monetization Intelligence
        </h2>
        <p className="text-xs text-slate-400">Pantau progres YouTube Partner Program (Data Riil API) dan Rekomendasi Monetisasi Berbasis Analisis Astra</p>
      </div>

      {/* YPP Progress Card */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-amber-400" />
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              YouTube Partner Program (YPP)
              <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono text-[10px] font-bold">
                ELIGIBILITY TRACKER
              </span>
            </h3>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${yt.isEligible ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'}`}>
            {yt.isEligible ? 'MEMENUHI SYARAT SUBSCRIBER' : 'IN PROGRESS'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Subscribers Requirement - ACTUAL DATA */}
          <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/50 space-y-2">
            <div className="flex justify-between items-center text-slate-300">
              <span className="flex items-center gap-1.5 font-medium">
                Subscribers Requirement
                <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[9px] font-bold">
                  ACTUAL DATA
                </span>
              </span>
              <span className="font-bold text-white">{yt.subscriberCount.toLocaleString('id-ID')} / {yt.subscriberTarget.toLocaleString('id-ID')}</span>
            </div>
            <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
              <div className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full rounded-full" style={{ width: `${Math.min(100, (yt.subscriberCount / yt.subscriberTarget) * 100)}%` }} />
            </div>
            <p className="text-[10px] text-slate-400">Data live dari YouTube Data API v3.</p>
          </div>

          {/* Total Channel Views - ACTUAL DATA */}
          <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/50 space-y-2">
            <div className="flex justify-between items-center text-slate-300">
              <span className="flex items-center gap-1.5 font-medium">
                Total Channel Views (Lifetime)
                <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[9px] font-bold">
                  ACTUAL DATA
                </span>
              </span>
              <span className="font-bold text-white">{(yt.totalChannelViews || 0).toLocaleString('id-ID')} views</span>
            </div>
            <p className="text-[10px] text-slate-400">Akumulasi seluruh video channel via YouTube Data API.</p>
          </div>

          {/* Shorts Views 90 Hari - UNAVAILABLE IN PUBLIC API */}
          <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/40 space-y-1.5">
            <div className="flex justify-between items-center text-slate-300">
              <span className="flex items-center gap-1.5 font-medium">
                Shorts Views (90 Hari)
                <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[9px] font-mono">
                  DATA TIDAK TERSEDIA
                </span>
              </span>
              <span className="font-semibold text-amber-300 text-xs">N/A / Data tidak tersedia</span>
            </div>
            <p className="text-[10px] text-slate-500">
              Target 10.000.000 views Shorts dalam 90 hari hanya dapat dipantau langsung di YouTube Studio (tidak disediakan oleh YouTube Data API publik).
            </p>
          </div>

          {/* Watch Hours 365 Hari - UNAVAILABLE IN PUBLIC API */}
          <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/40 space-y-1.5">
            <div className="flex justify-between items-center text-slate-300">
              <span className="flex items-center gap-1.5 font-medium">
                Jam Waktu Tonton Publik (365 Hari)
                <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[9px] font-mono">
                  DATA TIDAK TERSEDIA
                </span>
              </span>
              <span className="font-semibold text-amber-300 text-xs">N/A / Data tidak tersedia</span>
            </div>
            <p className="text-[10px] text-slate-500">
              Target 4.000 jam tonton publik dalam 365 hari hanya dapat dipantau di dashboard monetisasi YouTube Studio.
            </p>
          </div>
        </div>
      </div>

      {/* Affiliate Opportunities */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-purple-400" />
            Recommended Affiliate Opportunities
          </h3>
          <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 text-[10px] font-bold">
            RECOMMENDATION
          </span>
        </div>

        {affiliateOpps.length === 0 ? (
          <div className="p-6 rounded-xl bg-slate-800/40 border border-slate-700/40 text-center text-xs text-slate-400">
            Belum ada data rekomendasi affiliate. Hubungkan Channel YouTube & jalankan Astra Intelligence untuk menganalisis kecocokan produk.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {affiliateOpps.map((aff, i) => (
              <div key={i} className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-sm">{aff.title}</span>
                  <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 text-[10px] font-bold">{aff.fitScore}</span>
                </div>
                <p className="text-slate-400">Kategori: {aff.category}</p>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-emerald-400 font-bold">{aff.estimatedCommission}</p>
                  <span className="text-[10px] text-amber-400 font-mono bg-amber-500/10 px-1.5 py-0.5 rounded">ESTIMATE</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sponsorship & Digital Products */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-indigo-400" />
              Sponsorship Rate Estimate
            </h3>
            <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-[10px] font-bold">
              ESTIMATE
            </span>
          </div>

          {sponsorshipOpps.length === 0 ? (
            <div className="p-6 rounded-xl bg-slate-800/40 border border-slate-700/40 text-center text-xs text-slate-400">
              Belum ada estimasi sponsorship rate. Hubungkan Channel YouTube untuk kalkulasi riil berbasis performa channel.
            </div>
          ) : (
            sponsorshipOpps.map((spon, i) => (
              <div key={i} className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/50 text-xs space-y-1">
                <div className="font-bold text-white">{spon.brandCategory}</div>
                <div className="text-emerald-400 font-semibold">{spon.recommendedRate}</div>
                <div className="text-slate-400 italic">"Pitch Angle: {spon.pitchAngle}"</div>
              </div>
            ))
          )}
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-400" />
              Digital Product Ideas
            </h3>
            <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold">
              RECOMMENDATION
            </span>
          </div>

          {productIdeas.length === 0 ? (
            <div className="p-6 rounded-xl bg-slate-800/40 border border-slate-700/40 text-center text-xs text-slate-400">
              Belum ada ide produk digital. Analisis niche audiens Anda dengan Astra untuk rekomendasi produk digital.
            </div>
          ) : (
            productIdeas.map((prod, i) => (
              <div key={i} className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/50 text-xs space-y-1">
                <div className="font-bold text-white">{prod.title}</div>
                <div className="text-slate-400">Tipe: {prod.productType}</div>
                <div className="text-purple-300 font-semibold">Harga Jual Rekomendasi: {prod.targetPrice}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

