import React from 'react';
import { Clapperboard, Clock, ArrowRight, Wand2, CheckCircle2 } from 'lucide-react';
import { ContentPlan } from '../../types/creatorAutopilot';

interface ProductionQueueTabProps {
  plans: ContentPlan[];
  onSelectPlanForProduction: (plan: ContentPlan) => void;
  onSendToGeminiWorkspace: (plan: ContentPlan) => void;
}

export const ProductionQueueTab: React.FC<ProductionQueueTabProps> = ({
  plans,
  onSelectPlanForProduction,
  onSendToGeminiWorkspace
}) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Clapperboard className="w-5 h-5 text-indigo-400" />
          Production Queue
        </h2>
        <p className="text-xs text-slate-400">Status antrean produksi konten yang siap dirender di Workspace Gemini</p>
      </div>

      {plans.length === 0 ? (
        <div className="text-center py-12 bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
          <p className="text-sm text-slate-400">Belum ada konten dalam antrean produksi.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {plans.map((plan) => (
            <div key={plan.id} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 backdrop-blur-sm">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    plan.status === 'SENT_TO_WORKSPACE' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                  }`}>
                    {plan.status === 'SENT_TO_WORKSPACE' ? 'IN WORKSPACE' : 'READY FOR PRODUCTION'}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">• {plan.contentAngle}</span>
                </div>
                <h3 className="font-bold text-white text-base">{plan.title}</h3>
                <p className="text-xs text-slate-300 italic">"Hook: {plan.hook0to3s}"</p>
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto">
                <button
                  onClick={() => onSendToGeminiWorkspace(plan)}
                  className="w-full md:w-auto px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition-all shadow-md shadow-purple-600/20 flex items-center justify-center gap-2"
                >
                  <Wand2 className="w-4 h-4" />
                  Buka di Gemini Workspace
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
