import React, { useState } from 'react';
import { BrainCircuit, Sparkles, CheckCircle2, AlertTriangle, ArrowRight, Lightbulb, RefreshCw } from 'lucide-react';
import { LearningPattern } from '../../types/creatorAutopilot';

interface LearningTabProps {
  learning: LearningPattern | null;
  onRefreshLearning: () => void;
  loading: boolean;
}

export const LearningTab: React.FC<LearningTabProps> = ({ learning, onRefreshLearning, loading }) => {
  const hasData = learning && (
    (learning.winningPatterns && learning.winningPatterns.length > 0) ||
    (learning.weakPatterns && learning.weakPatterns.length > 0) ||
    (learning.recommendedNextTopics && learning.recommendedNextTopics.length > 0)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <BrainCircuit className="w-5 h-5 text-purple-400" />
            Virality Learning Loop (Astra Engine)
          </h2>
          <p className="text-xs text-slate-400">Analisis pola pembelajaran dari historis performa konten untuk mengoptimalkan strategi selanjutnya</p>
        </div>

        <button
          onClick={onRefreshLearning}
          disabled={loading}
          className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition-all shadow-lg shadow-purple-600/30 flex items-center gap-2 self-start sm:self-auto disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Perbarui Analisis Virality
        </button>
      </div>

      {/* Workflow Diagram Banner */}
      <div className="bg-gradient-to-r from-purple-950/50 via-slate-900 to-indigo-950/50 border border-purple-800/40 rounded-2xl p-5 text-xs text-slate-300">
        <div className="font-bold text-purple-300 uppercase tracking-wider mb-2">Siklus Pembelajaran Otomatis (Virality Loop):</div>
        <div className="flex flex-wrap items-center gap-2 font-semibold text-white">
          <span className="px-3 py-1 rounded-lg bg-slate-800 border border-slate-700">1. PUBLISH</span>
          <ArrowRight className="w-3.5 h-3.5 text-purple-400" />
          <span className="px-3 py-1 rounded-lg bg-slate-800 border border-slate-700">2. ANALYZE</span>
          <ArrowRight className="w-3.5 h-3.5 text-purple-400" />
          <span className="px-3 py-1 rounded-lg bg-slate-800 border border-slate-700">3. LEARN</span>
          <ArrowRight className="w-3.5 h-3.5 text-purple-400" />
          <span className="px-3 py-1 rounded-lg bg-slate-800 border border-slate-700">4. UPDATE STRATEGY</span>
          <ArrowRight className="w-3.5 h-3.5 text-purple-400" />
          <span className="px-3 py-1 rounded-lg bg-purple-600 text-white">5. NEXT CONTENT</span>
        </div>
      </div>

      {!hasData ? (
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-8 text-center space-y-3">
          <BrainCircuit className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-sm font-semibold text-slate-300">Belum Cukup Data Historis untuk Analisis Virality</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {learning?.recommendedPublishingStrategy || 'Publikasikan Shorts pertama Anda di YouTube untuk membuka otomatisasi siklus Virality Learning Loop.'}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Winning Patterns */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm space-y-4">
              <h3 className="text-base font-bold text-emerald-400 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                Winning Patterns (Pola Berhasil)
              </h3>
              <ul className="space-y-2.5 text-xs text-slate-200">
                {(learning.winningPatterns || []).map((pat, idx) => (
                  <li key={idx} className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-800/30 flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold shrink-0 text-[10px] mt-0.5">{idx + 1}</span>
                    <span>{pat}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Weak Patterns */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm space-y-4">
              <h3 className="text-base font-bold text-rose-400 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-400" />
                Weak Patterns (Pola Perlu Dihindari)
              </h3>
              <ul className="space-y-2.5 text-xs text-slate-200">
                {(learning.weakPatterns || []).map((pat, idx) => (
                  <li key={idx} className="p-3 rounded-xl bg-rose-950/20 border border-rose-800/30 flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-rose-500/20 text-rose-300 flex items-center justify-center font-bold shrink-0 text-[10px] mt-0.5">{idx + 1}</span>
                    <span>{pat}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Recommended Strategy */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-amber-400" />
              Rekomendasi Strategi Konten Selanjutnya
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/50 space-y-2">
                <div className="font-bold text-purple-300 uppercase tracking-wider">Rekomendasi Topik Selanjutnya:</div>
                <ul className="list-disc list-inside space-y-1 text-slate-300">
                  {(learning.recommendedNextTopics || []).map((top, i) => (
                    <li key={i}>{top}</li>
                  ))}
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/50 space-y-2">
                <div className="font-bold text-indigo-300 uppercase tracking-wider">Rekomendasi Formula Hook:</div>
                <ul className="list-disc list-inside space-y-1 text-slate-300">
                  {(learning.recommendedHooks || []).map((hk, i) => (
                    <li key={i}>"{hk}"</li>
                  ))}
                </ul>
              </div>
            </div>

            {learning.recommendedPublishingStrategy && (
              <div className="p-4 rounded-xl bg-purple-950/30 border border-purple-800/40 text-xs text-purple-200">
                <span className="font-bold text-white">Strategi Jadwal Upload: </span>
                {learning.recommendedPublishingStrategy}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
