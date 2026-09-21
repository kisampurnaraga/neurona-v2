import React, { useState } from 'react';
import { Target, Zap, ArrowRight, DollarSign, Filter, Search, Sparkles } from 'lucide-react';
import { ContentOpportunity } from '../../types/creatorAutopilot';

interface OpportunitiesTabProps {
  opportunities: ContentOpportunity[];
  onCreatePlanFromOpportunity: (opp: ContentOpportunity) => void;
  onSelectTab: (tab: string) => void;
}

export const OpportunitiesTab: React.FC<OpportunitiesTabProps> = ({
  opportunities,
  onCreatePlanFromOpportunity,
  onSelectTab
}) => {
  const [filterPriority, setFilterPriority] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = opportunities.filter((opp) => {
    const matchesPriority = filterPriority === 'ALL' || opp.priority === filterPriority;
    const matchesSearch = opp.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          opp.hook.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          opp.niche.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesPriority && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Target className="w-5 h-5 text-amber-400" />
            Content Opportunities ({opportunities.length})
          </h2>
          <p className="text-xs text-slate-400">Peluang ide konten berpotensi tinggi dari Astra Research Engine</p>
        </div>

        <button
          onClick={() => onSelectTab('research')}
          className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition-all shadow-lg shadow-purple-600/30 flex items-center gap-2 self-start sm:self-auto"
        >
          <Sparkles className="w-4 h-4" />
          Riset Opportunity Baru
        </button>
      </div>

      {/* Filter & Search Controls */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari topik atau hook..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-purple-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-slate-400 flex items-center gap-1"><Filter className="w-3.5 h-3.5" /> Prioritas:</span>
          {['ALL', 'HIGH', 'MEDIUM', 'LOW'].map((p) => (
            <button
              key={p}
              onClick={() => setFilterPriority(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${filterPriority === p ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-slate-200'}`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Opportunities List */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
          <p className="text-sm text-slate-400">Tidak ada Content Opportunity yang sesuai filter.</p>
          <button
            onClick={() => onSelectTab('research')}
            className="mt-3 px-4 py-2 rounded-xl bg-purple-600 text-white font-medium text-xs hover:bg-purple-500 transition-all"
          >
            Jalankan Astra Research Baru
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((opp) => (
            <div key={opp.id} className="bg-slate-900/80 border border-slate-800 hover:border-purple-500/40 rounded-2xl p-5 flex flex-col justify-between space-y-4 backdrop-blur-sm transition-all shadow-md">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${opp.priority === 'HIGH' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'}`}>
                    {opp.priority} PRIORITY
                  </span>
                  <span className="text-[11px] text-slate-400">{opp.niche}</span>
                </div>

                <div>
                  <h3 className="font-bold text-white text-base leading-snug">{opp.topic}</h3>
                  <p className="text-xs text-slate-400 mt-1">{opp.estimatedOpportunity}</p>
                </div>

                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/50">
                  <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider block mb-1">Hook 0-3 Detik</span>
                  <p className="text-xs text-slate-200 italic font-medium">"{opp.hook}"</p>
                </div>

                <div className="text-xs text-emerald-400 font-medium flex items-center gap-1.5 pt-1">
                  <DollarSign className="w-3.5 h-3.5" />
                  {opp.monetizationAngle}
                </div>
              </div>

              <button
                onClick={() => onCreatePlanFromOpportunity(opp)}
                className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition-all shadow-md shadow-purple-600/20 flex items-center justify-center gap-1.5"
              >
                Buat Content Plan
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
