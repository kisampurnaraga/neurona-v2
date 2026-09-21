import React from 'react';
import { DollarSign, Target, ShoppingBag, Briefcase, Award, CheckCircle, ArrowRight } from 'lucide-react';
import { MonetizationIntelligenceData } from '../../types/creatorAutopilot';

interface MonetizationTabProps {
  monetization: MonetizationIntelligenceData | null;
}

export const MonetizationTab: React.FC<MonetizationTabProps> = ({ monetization }) => {
  const data = monetization || {
    youtubePartnerProgress: {
      subscriberCount: 0,
      subscriberTarget: 1000,
      shortsViews: 0,
      shortsViewsTarget: 10000000,
      watchHours: 0,
      watchHoursTarget: 4000,
      isEligible: false
    },
    affiliateOpportunities: [
      {
        title: 'NEURONA AI Studio Affiliate Program',
        category: 'Digital Product & SaaS',
        estimatedCommission: 'Komisi 40% per penjualan',
        fitScore: 'Program Resmi NEURONA'
      }
    ],
    sponsorshipOpportunities: [
      {
        brandCategory: 'Aplikasi AI & Productivity Tools',
        recommendedRate: 'Hubungkan Channel YouTube untuk Estimasi Rate',
        pitchAngle: 'Demonstrasi workflow produktivitas instan dengan fitur nyata'
      }
    ],
    digitalProductIdeas: [
      {
        productType: 'Digital Template',
        title: 'Template Prompt YouTube Shorts High-Engagement',
        targetPrice: 'Rp 49.000'
      }
    ]
  };

  const yt = data.youtubePartnerProgress;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-emerald-400" />
          Monetization Intelligence
        </h2>
        <p className="text-xs text-slate-400">Pantau progres YouTube Partner Program, komisi affiliate, peluang sponsor, dan penjualan produk digital</p>
      </div>

      {/* YPP Progress Card */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-amber-400" />
            <h3 className="text-lg font-bold text-white">YouTube Partner Program (YPP) Status</h3>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${yt.isEligible ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'}`}>
            {yt.isEligible ? 'ELIGIBLE UNTUK MONETISASI' : 'IN PROGRESS'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/50 space-y-2">
            <div className="flex justify-between text-slate-300">
              <span>Subscribers Requirement</span>
              <span className="font-bold text-white">{yt.subscriberCount.toLocaleString('id-ID')} / {yt.subscriberTarget.toLocaleString('id-ID')}</span>
            </div>
            <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
              <div className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full rounded-full" style={{ width: `${Math.min(100, (yt.subscriberCount / yt.subscriberTarget) * 100)}%` }} />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/50 space-y-2">
            <div className="flex justify-between text-slate-300">
              <span>Shorts Views (90 Hari)</span>
              <span className="font-bold text-white">{yt.shortsViews.toLocaleString('id-ID')} / {yt.shortsViewsTarget.toLocaleString('id-ID')}</span>
            </div>
            <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-500 to-cyan-500 h-full rounded-full" style={{ width: `${Math.min(100, (yt.shortsViews / yt.shortsViewsTarget) * 100)}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Affiliate Opportunities */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm space-y-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <ShoppingBag className="w-5 h-5 text-purple-400" />
          Recommended Affiliate Opportunities
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {data.affiliateOpportunities.map((aff, i) => (
            <div key={i} className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-sm">{aff.title}</span>
                <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 text-[10px] font-bold">{aff.fitScore}</span>
              </div>
              <p className="text-slate-400">Kategori: {aff.category}</p>
              <p className="text-emerald-400 font-bold">{aff.estimatedCommission}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Sponsorship & Digital Products */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-indigo-400" />
            Sponsorship Rate Estimate
          </h3>
          {data.sponsorshipOpportunities.map((spon, i) => (
            <div key={i} className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/50 text-xs space-y-1">
              <div className="font-bold text-white">{spon.brandCategory}</div>
              <div className="text-emerald-400 font-semibold">{spon.recommendedRate}</div>
              <div className="text-slate-400 italic">"Pitch Angle: {spon.pitchAngle}"</div>
            </div>
          ))}
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
            Digital Product Ideas
          </h3>
          {data.digitalProductIdeas.map((prod, i) => (
            <div key={i} className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/50 text-xs space-y-1">
              <div className="font-bold text-white">{prod.title}</div>
              <div className="text-slate-400">Tipe: {prod.productType}</div>
              <div className="text-purple-300 font-semibold">Harga Jual Rekomendasi: {prod.targetPrice}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
