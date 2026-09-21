import React, { useState } from 'react';
import { Sparkles, Search, Loader2, Zap, ArrowRight, Target, DollarSign, Layers } from 'lucide-react';
import { ContentOpportunity } from '../../types/creatorAutopilot';

interface ResearchTabProps {
  onResearchComplete: (opportunities: ContentOpportunity[]) => void;
  onCreatePlanFromOpportunity: (opp: ContentOpportunity) => void;
  getAuthToken: () => Promise<string | null>;
}

export const ResearchTab: React.FC<ResearchTabProps> = ({
  onResearchComplete,
  onCreatePlanFromOpportunity,
  getAuthToken
}) => {
  const [niche, setNiche] = useState('Digital Product & AI Tools');
  const [targetAudience, setTargetAudience] = useState('Kreator Konten & Pejuang Monetisasi');
  const [seedTopic, setSeedTopic] = useState('Affiliate Marketing & Monetisasi Shorts');
  const [monetizationGoal, setMonetizationGoal] = useState('Affiliate Commission + YPP');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<ContentOpportunity[]>([]);

  const handleRunResearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const token = await getAuthToken();
      if (!token) {
        throw new Error('Anda harus login terlebih dahulu.');
      }

      const res = await fetch('/api/v1/creator-autopilot/research', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          niche,
          targetAudience,
          seedTopic,
          monetizationGoal
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Astra Research gagal memproses data.');
      }

      setResults(data.opportunities || []);
      onResearchComplete(data.opportunities || []);
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat memproses Astra Research.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Astra Research Engine</h2>
            <p className="text-xs text-slate-400">Riset Niche, Ide Topik, Analisis Tren, Hook Pattern & Peluang Monetisasi Otomatis</p>
          </div>
        </div>

        {/* Input Form */}
        <form onSubmit={handleRunResearch} className="mt-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Niche Konten</label>
              <input
                type="text"
                value={niche}
                onChange={(e) => setNiche(e.target.value)}
                placeholder="Contoh: Digital Product, Dongeng Anak, Edukasi AI, Film"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-purple-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Target Audience</label>
              <input
                type="text"
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                placeholder="Contoh: Mahasiswa, Pemula Digital Marketing, Ibu Rumah Tangga"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-purple-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Seed Topic / Kata Kunci Awal</label>
              <input
                type="text"
                value={seedTopic}
                onChange={(e) => setSeedTopic(e.target.value)}
                placeholder="Contoh: Tutorial AI, Trik Monetisasi, Cara Edit Video"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-purple-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Target Monetisasi</label>
              <select
                value={monetizationGoal}
                onChange={(e) => setMonetizationGoal(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-purple-500"
              >
                <option value="Affiliate Commission + YPP">Affiliate Commission + YouTube Partner Program</option>
                <option value="Direct Digital Product Sales">Penjualan Produk Digital Sendiri</option>
                <option value="Sponsorship & Brand Deals">Sponsorship & Brand Deals</option>
                <option value="Lead Generation">Lead Generation & Email List</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-sm transition-all shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Menganalisis Tren & Peluang dengan Astra...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                Jalankan Astra Research
              </>
            )}
          </button>
        </form>

        {error && (
          <div className="mt-4 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
            {error}
          </div>
        )}
      </div>

      {/* Results Section */}
      {results.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              Hasil Research Opportunity ({results.length})
            </h3>
            <span className="text-xs text-slate-400">Peluang berbasis Astra Pattern Analysis</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {results.map((opp) => (
              <div key={opp.id} className="bg-slate-900/90 border border-slate-800 hover:border-purple-500/40 rounded-2xl p-5 flex flex-col justify-between space-y-4 backdrop-blur-sm transition-all shadow-lg">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${opp.priority === 'HIGH' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'}`}>
                      {opp.priority} PRIORITY
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">{opp.source}</span>
                  </div>

                  <div>
                    <h4 className="font-bold text-white text-base leading-snug">{opp.topic}</h4>
                    <p className="text-xs text-slate-400 mt-1">Niche: <span className="text-slate-200">{opp.niche}</span></p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/50 space-y-1.5">
                    <div className="text-xs font-semibold text-purple-300 flex items-center gap-1.5">
                      <Target className="w-3.5 h-3.5" /> Hook Formula (0-3s):
                    </div>
                    <p className="text-xs text-slate-200 italic">"{opp.hook}"</p>
                  </div>

                  <div className="space-y-1 text-xs">
                    <div className="text-slate-400">Angle: <span className="text-slate-200 font-medium">{opp.angle}</span></div>
                    <div className="text-slate-400">Format: <span className="text-slate-200 font-medium">{opp.contentFormat}</span></div>
                    <div className="text-emerald-400 font-medium flex items-center gap-1 mt-1">
                      <DollarSign className="w-3.5 h-3.5" /> {opp.monetizationAngle}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => onCreatePlanFromOpportunity(opp)}
                  className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition-all shadow-md shadow-purple-600/20 flex items-center justify-center gap-1.5 mt-2"
                >
                  Buat Content Plan
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
