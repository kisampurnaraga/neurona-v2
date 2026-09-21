import React from 'react';
import { 
  TrendingUp, 
  Users, 
  Eye, 
  DollarSign, 
  Zap, 
  Sparkles, 
  CheckCircle, 
  ArrowUpRight, 
  Clock, 
  PlaySquare, 
  Target, 
  Lightbulb,
  ChevronRight
} from 'lucide-react';
import { ContentOpportunity, ContentPlan, MonetizationIntelligenceData, YouTubeChannelInfo } from '../../types/creatorAutopilot';

interface OverviewTabProps {
  channelInfo: YouTubeChannelInfo;
  opportunities: ContentOpportunity[];
  plans: ContentPlan[];
  monetization: MonetizationIntelligenceData | null;
  onSelectTab: (tab: string) => void;
  onCreatePlanFromOpportunity: (opp: ContentOpportunity) => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  channelInfo,
  opportunities,
  plans,
  monetization,
  onSelectTab,
  onCreatePlanFromOpportunity
}) => {
  const subCount = channelInfo.subscriberCount || 320;
  const viewCount = channelInfo.viewCount || 125000;
  const ytProgress = monetization?.youtubePartnerProgress;

  return (
    <div className="space-y-6">
      {/* Channel Health Header Banner */}
      <div className="bg-gradient-to-r from-purple-900/40 via-indigo-900/30 to-slate-900 border border-purple-500/20 rounded-2xl p-6 text-white backdrop-blur-xl relative overflow-hidden shadow-xl">
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-500/20 text-white font-bold text-2xl">
              {channelInfo.title ? channelInfo.title.substring(0, 2).toUpperCase() : 'YT'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white">
                  {channelInfo.title || 'Channel YouTube Shorts'}
                </h2>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${channelInfo.connected ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'}`}>
                  {channelInfo.connected ? 'YouTube Connected' : 'Auto-Pilot Mode'}
                </span>
              </div>
              <p className="text-sm text-slate-400 mt-1">
                Engine: <span className="text-purple-300 font-semibold">GPT Astra Growth Intelligence</span> • Status Channel: <span className="text-emerald-400 font-medium">Optimal Health</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            <button
              onClick={() => onSelectTab('research')}
              className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-sm transition-all shadow-lg shadow-purple-600/30 flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Astra Research
            </button>
            <button
              onClick={() => onSelectTab('monetization')}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium text-sm transition-all flex items-center gap-2"
            >
              <DollarSign className="w-4 h-4 text-emerald-400" />
              Monetisasi
            </button>
          </div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 backdrop-blur-sm hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Subscriber Progress</span>
            <Users className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-white">{subCount.toLocaleString('id-ID')}</div>
          <div className="mt-3 flex items-center justify-between text-xs">
            <span className="text-slate-400">Target 1,000 Subs</span>
            <span className="text-purple-400 font-semibold">{Math.min(100, Math.round((subCount / 1000) * 100))}%</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, (subCount / 1000) * 100)}%` }} />
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 backdrop-blur-sm hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Shorts Views Progress</span>
            <Eye className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-white">{viewCount.toLocaleString('id-ID')}</div>
          <div className="mt-3 flex items-center justify-between text-xs">
            <span className="text-slate-400">Target 10M Views</span>
            <span className="text-indigo-400 font-semibold">{((viewCount / 10000000) * 100).toFixed(2)}%</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-500 to-cyan-500 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, (viewCount / 10000000) * 100)}%` }} />
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 backdrop-blur-sm hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Monetization Progress</span>
            <Target className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-300">
            {ytProgress?.isEligible ? 'Sangat Siap (Eligible)' : 'Dalam Progres'}
          </div>
          <p className="text-xs text-slate-400 mt-2">
            {ytProgress?.isEligible ? 'Syarat YPP terpenuhi!' : 'Mendekati milestone monetisasi YouTube Shorts'}
          </p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 backdrop-blur-sm hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Revenue Opportunity</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400">Rp 1.5M - 4.5M</div>
          <p className="text-xs text-slate-400 mt-2">
            Estimasi peluang gabungan YPP + Affiliate
          </p>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 cols): Today's Opportunities & Content Queue */}
        <div className="lg:col-span-2 space-y-6">
          {/* Today's Opportunities */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-400" />
                <h3 className="text-lg font-bold text-white">Today's Opportunities (Astra Intel)</h3>
              </div>
              <button
                onClick={() => onSelectTab('opportunities')}
                className="text-xs text-purple-400 hover:text-purple-300 font-medium flex items-center gap-1"
              >
                Lihat Semua ({opportunities.length})
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              {opportunities.slice(0, 3).map((opp) => (
                <div key={opp.id} className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 hover:border-purple-500/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${opp.priority === 'HIGH' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'}`}>
                        {opp.priority} PRIORITY
                      </span>
                      <span className="text-xs text-slate-400">• {opp.niche}</span>
                    </div>
                    <h4 className="font-semibold text-white text-sm">{opp.topic}</h4>
                    <p className="text-xs text-slate-300 italic">"Hook: {opp.hook}"</p>
                  </div>
                  <button
                    onClick={() => onCreatePlanFromOpportunity(opp)}
                    className="px-3.5 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-medium text-xs transition-all whitespace-nowrap self-start sm:self-center shadow-md shadow-purple-600/20"
                  >
                    Buat Content Plan
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Winning Hook Patterns */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-purple-400" />
              <h3 className="text-lg font-bold text-white">Winning Hook Patterns</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-purple-950/30 border border-purple-800/40">
                <div className="text-xs font-bold text-purple-300 uppercase tracking-wide">Pola #1: Loss Aversion</div>
                <p className="text-xs text-slate-200 mt-1 font-medium">"Jangan Beli [Produk] Sebelum Tahu 1 Rahasia Ini..."</p>
                <div className="text-[11px] text-emerald-400 mt-2 font-semibold">Retention Rate: ~82%</div>
              </div>
              <div className="p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-800/40">
                <div className="text-xs font-bold text-indigo-300 uppercase tracking-wide">Pola #2: Speed & Efficiency</div>
                <p className="text-xs text-slate-200 mt-1 font-medium">"Cara Bikin 30 Shorts Cuma Dalam 10 Menit!"</p>
                <div className="text-[11px] text-emerald-400 mt-2 font-semibold">Share Rate: High</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (1 col): Astra Recommendations & Scheduled Content */}
        <div className="space-y-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-4">
              <Lightbulb className="w-5 h-5 text-amber-400" />
              <h3 className="text-lg font-bold text-white">Astra Recommendations</h3>
            </div>
            <ul className="space-y-3 text-xs text-slate-300">
              <li className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/50 flex items-start gap-2.5">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Publikasikan Shorts pada jam konsisten (12:00 WIB / 18:30 WIB) untuk retensi maksimal.</span>
              </li>
              <li className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/50 flex items-start gap-2.5">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Gunakan teks berwarna kontras tinggi di 3 detik pertama sebagai scroll-stopper.</span>
              </li>
              <li className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/50 flex items-start gap-2.5">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Tambahkan Call to Action mengarah ke link bio untuk konversi affiliate.</span>
              </li>
            </ul>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-400" />
                <h3 className="text-lg font-bold text-white">Content Queue</h3>
              </div>
              <span className="text-xs text-slate-400 font-semibold">{plans.length} Planned</span>
            </div>
            {plans.length === 0 ? (
              <div className="text-center py-6 text-slate-500 text-xs">
                Belum ada antrean konten. Gunakan Astra Research untuk membuat perencanaan.
              </div>
            ) : (
              <div className="space-y-2.5">
                {plans.slice(0, 3).map((plan) => (
                  <div key={plan.id} className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/50 text-xs">
                    <div className="font-semibold text-white truncate">{plan.title}</div>
                    <div className="text-slate-400 mt-1 flex items-center justify-between">
                      <span>Status: {plan.status}</span>
                      <span className="text-purple-400 font-medium">Ready for Workspace</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
