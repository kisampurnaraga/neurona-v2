import React, { useState } from 'react';
import { Layers, Sparkles, Send, Copy, Check, ArrowRight, Video, FileText, Hash, Megaphone, Wand2 } from 'lucide-react';
import { ContentPlan } from '../../types/creatorAutopilot';

interface ContentPlannerTabProps {
  plans: ContentPlan[];
  selectedPlan: ContentPlan | null;
  onSelectPlan: (plan: ContentPlan) => void;
  onSendToGeminiWorkspace: (plan: ContentPlan) => void;
}

export const ContentPlannerTab: React.FC<ContentPlannerTabProps> = ({
  plans,
  selectedPlan,
  onSelectPlan,
  onSendToGeminiWorkspace
}) => {
  const [copied, setCopied] = useState(false);
  const plan = selectedPlan || plans[0] || null;

  const handleCopyScript = () => {
    if (!plan) return;
    const text = `JUDUL: ${plan.title}\n\nHOOK 0-3s: ${plan.hook0to3s}\n\nARAHAN SKRIP:\n${plan.scriptDirection}\n\nCALL TO ACTION: ${plan.cta}\n\nDESKRIPSI YOUTUBE:\n${plan.description}\n\nHASHTAGS: ${plan.hashtags.join(' ')}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-purple-400" />
            Content Planner ({plans.length})
          </h2>
          <p className="text-xs text-slate-400">Rancangan skrip, arahan produksi, dan Storyboard Brief siap kirim ke Gemini Workspace</p>
        </div>
      </div>

      {plans.length === 0 ? (
        <div className="text-center py-12 bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
          <p className="text-sm text-slate-400">Belum ada Content Plan. Pilih Content Opportunity lalu klik "Buat Content Plan".</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: List of Plans */}
          <div className="space-y-3">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1">Daftar Content Plan</div>
            {plans.map((p) => (
              <div
                key={p.id}
                onClick={() => onSelectPlan(p)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  plan?.id === p.id 
                    ? 'bg-purple-950/40 border-purple-500 shadow-md shadow-purple-500/10' 
                    : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    p.status === 'SENT_TO_WORKSPACE' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                  }`}>
                    {p.status === 'SENT_TO_WORKSPACE' ? 'SENT TO WORKSPACE' : 'PLANNED'}
                  </span>
                  <span className="text-[10px] text-slate-400">{new Date(p.createdAt).toLocaleDateString('id-ID')}</span>
                </div>
                <h4 className="font-semibold text-white text-sm line-clamp-1">{p.title}</h4>
                <p className="text-xs text-slate-400 mt-1 line-clamp-1 italic">"{p.hook0to3s}"</p>
              </div>
            ))}
          </div>

          {/* Right Column (2 cols): Selected Plan Detail */}
          {plan && (
            <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-6 backdrop-blur-xl">
              {/* Header Title & CTA Button */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div>
                  <span className="text-xs text-purple-400 font-semibold uppercase tracking-wider block mb-1">Astra Content Strategy</span>
                  <h3 className="text-xl font-bold text-white">{plan.title}</h3>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyScript}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition-all flex items-center gap-1.5"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Tersalin' : 'Salin Skrip'}
                  </button>

                  <button
                    onClick={() => onSendToGeminiWorkspace(plan)}
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold transition-all shadow-lg shadow-purple-600/30 flex items-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    Send to Gemini Workspace
                  </button>
                </div>
              </div>

              {/* Hook 0-3 Seconds */}
              <div className="p-4 rounded-xl bg-purple-950/30 border border-purple-800/40 space-y-1.5">
                <div className="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> Hook 0-3 Detik (Scroll Stopper):
                </div>
                <p className="text-sm font-semibold text-white italic">"{plan.hook0to3s}"</p>
              </div>

              {/* Script Direction */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-indigo-400" /> Arahan Skrip & Narrative Arc:
                </div>
                <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/50 text-xs text-slate-200 whitespace-pre-line leading-relaxed">
                  {plan.scriptDirection}
                </div>
              </div>

              {/* Call To Action */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Megaphone className="w-4 h-4 text-amber-400" /> Call to Action (CTA):
                </div>
                <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/50 text-xs text-emerald-300 font-medium">
                  {plan.cta}
                </div>
              </div>

              {/* Storyboard Brief for Workspace Gemini */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Wand2 className="w-4 h-4 text-purple-400" /> Storyboard Brief (Untuk Gemini Workspace):
                </div>
                <div className="p-4 rounded-xl bg-slate-950 border border-purple-900/40 text-xs text-purple-200 leading-relaxed font-mono">
                  {plan.storyboardBrief}
                </div>
              </div>

              {/* SEO Description & Hashtags */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">Deskripsi YouTube Shorts:</div>
                  <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/50 text-xs text-slate-300 h-24 overflow-y-auto">
                    {plan.description}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1">
                    <Hash className="w-3.5 h-3.5 text-indigo-400" /> Hashtags:
                  </div>
                  <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/50 text-xs text-indigo-300 flex flex-wrap gap-1.5">
                    {plan.hashtags.map((h, i) => (
                      <span key={i} className="px-2 py-0.5 rounded bg-indigo-950/60 border border-indigo-800/40">{h}</span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Banner to Send */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-purple-900/30 via-indigo-900/20 to-slate-900 border border-purple-500/20 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-xs text-slate-300">
                  <span className="font-semibold text-white">Siap untuk Produksi Visual?</span> Kirim brief ini ke Storyboard Engine di Workspace Gemini.
                </div>
                <button
                  onClick={() => onSendToGeminiWorkspace(plan)}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-all shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  Kirim ke Gemini Workspace
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
