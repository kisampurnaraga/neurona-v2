import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  Sparkles, 
  Target, 
  Layers, 
  Clapperboard, 
  PlaySquare, 
  TrendingUp, 
  BrainCircuit, 
  DollarSign, 
  Key, 
  Lock, 
  CheckCircle, 
  ArrowRight, 
  ShieldAlert,
  Loader2,
  Tv
} from 'lucide-react';
import { OverviewTab } from './OverviewTab';
import { ResearchTab } from './ResearchTab';
import { OpportunitiesTab } from './OpportunitiesTab';
import { ContentPlannerTab } from './ContentPlannerTab';
import { ProductionQueueTab } from './ProductionQueueTab';
import { PublishedTab } from './PublishedTab';
import { AnalyticsTab } from './AnalyticsTab';
import { LearningTab } from './LearningTab';
import { MonetizationTab } from './MonetizationTab';
import { AdminAstraSettings } from './AdminAstraSettings';

import { ContentOpportunity, ContentPlan, PublishedContent, MonetizationIntelligenceData, YouTubeChannelInfo, LearningPattern } from '../../types/creatorAutopilot';

interface CreatorAutopilotModuleProps {
  getAuthToken: () => Promise<string | null>;
  isAdmin?: boolean;
  onSendToGeminiWorkspace: (plan: ContentPlan) => void;
  onNavigateToPayment?: () => void;
}

export const CreatorAutopilotModule: React.FC<CreatorAutopilotModuleProps> = ({
  getAuthToken,
  isAdmin = false,
  onSendToGeminiWorkspace,
  onNavigateToPayment
}) => {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [entitlementStatus, setEntitlementStatus] = useState<'ACTIVE' | 'LOCKED' | 'EXPIRED'>('LOCKED');
  const [loadingEntitlement, setLoadingEntitlement] = useState(true);

  // Data States
  const [channelInfo, setChannelInfo] = useState<YouTubeChannelInfo>({
    title: 'Shorts Growth Channel',
    subscriberCount: 320,
    viewCount: 125000,
    videoCount: 18,
    connected: false
  });

  const [opportunities, setOpportunities] = useState<ContentOpportunity[]>([
    {
      id: 'opp-1',
      topic: '3 Tool AI Gratis Untuk Edit Shorts Otomatis Tanpa Watermark',
      niche: 'Digital Product & AI Tools',
      targetAudience: 'Kreator Shorts & Pejuang Monetisasi',
      hook: 'Hentikan edit video manual! Ini 3 Tool AI rahasia yang bikin Shorts kamu siap tayang dalam 3 menit...',
      angle: 'Efficiency & Problem Solving',
      contentFormat: 'AI Voiceover + Visual Demo',
      priority: 'HIGH',
      estimatedOpportunity: 'High Virality Potential (Astra Index: 94/100)',
      monetizationAngle: 'Affiliate Link Tool AI di Bio (Komisi ~Rp 150rb per convert)',
      source: 'Astra Trend Radar'
    },
    {
      id: 'opp-2',
      topic: 'Rahasia Trik Reusable Content Yang Lolos Monetisasi 100%',
      niche: 'Monetisasi YouTube Shorts',
      targetAudience: 'Kreator Reupload & Curated Content',
      hook: '90% Kreator Gagal Monetisasi Karena 1 Kesalahan Kecil Ini...',
      angle: 'Loss Aversion & Curiosity',
      contentFormat: 'Talking Head + Screen Capture',
      priority: 'HIGH',
      estimatedOpportunity: 'High Search Intent',
      monetizationAngle: 'E-Book Panduan Reupload Aman (Rp 99.000)',
      source: 'Astra Competitor Intelligence'
    }
  ]);

  const [plans, setPlans] = useState<ContentPlan[]>([
    {
      id: 'plan-1',
      opportunityId: 'opp-1',
      title: '3 Tool AI Gratis Untuk Edit Shorts Otomatis Tanpa Watermark',
      hook0to3s: 'Hentikan edit video manual! Ini 3 Tool AI rahasia yang bikin Shorts kamu siap tayang dalam 3 menit...',
      scriptDirection: '0-3s: Hook visual menakjubkan memperlihatkan layar edit otomatis.\n3-15s: Tampilkan Tool #1 (CapCut AI Script to Video) dengan demo singkat.\n15-30s: Tampilkan Tool #2 & #3 (ElevenLabs + Canva AI).\n30-40s: Rangkuman & ajakan klik link bio.',
      cta: 'Klik link di bio untuk coba ketiga tool gratis ini sekarang!',
      description: '3 Tool AI Gratis untuk buat YouTube Shorts otomatis tanpa watermark. Tonton sampai habis untuk trik rahasia!',
      hashtags: ['#ShortsAI', '#AITools', '#MonetisasiShorts', '#TutorialAI'],
      contentAngle: 'Efficiency & Problem Solving',
      storyboardBrief: 'Visual: Screen capture cepat 3 tool AI. Voiceover: Energik, percaya diri, tempo cepat. Teks layar: Kontras tinggi kuning/putih.',
      productionInstructions: 'Gunakan subtitle otomatis warna kuning-hitam di tengah layar. Durasi ideal: 38-42 detik.',
      status: 'PLANNED',
      createdAt: new Date().toISOString()
    }
  ]);

  const [selectedPlan, setSelectedPlan] = useState<ContentPlan | null>(plans[0] || null);
  const [monetization, setMonetization] = useState<MonetizationIntelligenceData | null>(null);
  const [learning, setLearning] = useState<LearningPattern | null>(null);
  const [loadingLearning, setLoadingLearning] = useState(false);

  useEffect(() => {
    checkEntitlement();
  }, []);

  const checkEntitlement = async () => {
    try {
      setLoadingEntitlement(true);
      const token = await getAuthToken();
      if (!token) {
        setEntitlementStatus('LOCKED');
        return;
      }

      const res = await fetch('/api/v1/creator-autopilot/entitlement', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setEntitlementStatus(data.active ? 'ACTIVE' : (data.entitlementStatus || 'LOCKED'));
      }
    } catch (err) {
      console.warn('Entitlement check error:', err);
      setEntitlementStatus('LOCKED');
    } finally {
      setLoadingEntitlement(false);
    }
  };

  const handleCreatePlanFromOpportunity = (opp: ContentOpportunity) => {
    const newPlan: ContentPlan = {
      id: `plan-${Date.now()}`,
      userId: opp.userId || 'user-1',
      opportunityId: opp.id,
      title: opp.topic,
      hook0to3s: opp.hook,
      scriptDirection: `0-3s: Hook: "${opp.hook}"\n3-20s: Penjelasan poin-poin utama secara singkat & padat.\n20-35s: Tunjukkan solusi / bukti nyata.\n35-40s: Call to action monetisasi.`,
      cta: `Klik link di bio untuk akses penawaran ${opp.monetizationAngle}!`,
      description: `${opp.topic}. Tonton sampai habis untuk rahasia lengkapnya!`,
      hashtags: ['#Shorts', '#YouTubeShorts', `#${opp.niche.replace(/\s+/g, '')}`],
      contentAngle: opp.angle,
      storyboardBrief: `Astra Storyboard Brief: Visual menyorot ${opp.topic}. Gunakan animasi teks tajam dan pace cepat.`,
      productionInstructions: 'Render di Gemini Workspace dengan ratio 9:16 untuk YouTube Shorts.',
      status: 'PLANNED',
      createdAt: new Date().toISOString()
    };

    setPlans([newPlan, ...plans]);
    setSelectedPlan(newPlan);
    setActiveTab('planner');
  };

  const handleRefreshLearning = async () => {
    setLoadingLearning(true);
    try {
      const token = await getAuthToken();
      if (!token) return;
      const res = await fetch('/api/v1/creator-autopilot/learning', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ history: [] })
      });
      const data = await res.json();
      if (data.success && data.learning) {
        setLearning(data.learning);
      }
    } catch (e) {
      console.warn('Refresh learning error:', e);
    } finally {
      setLoadingLearning(false);
    }
  };

  if (loadingEntitlement) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-400 space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
        <p className="text-xs">Memverifikasi Entitlement CREATOR AUTOPILOT...</p>
      </div>
    );
  }

  // Paywall View for Locked / Expired users (Non-admin)
  if (!isAdmin && entitlementStatus !== 'ACTIVE') {
    return (
      <div className="max-w-4xl mx-auto space-y-6 py-6">
        <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 border border-purple-800/40 rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl backdrop-blur-xl">
          <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-white shadow-xl shadow-purple-600/30 shrink-0">
              <Zap className="w-10 h-10" />
            </div>

            <div className="space-y-3 text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs font-bold">
                <Lock className="w-3.5 h-3.5" /> Premium Add-on Module
              </div>

              <h2 className="text-2xl md:text-3xl font-extrabold text-white leading-tight">
                CREATOR AUTOPILOT <span className="text-purple-400 font-light">by GPT Astra</span>
              </h2>

              <p className="text-sm text-slate-300 leading-relaxed max-w-2xl">
                Otomatiskan riset tren, pembuatan rancangan skrip Shorts, optimasi Hook virality, hingga strategi monetisasi YouTube Shorts Anda dalam satu modul kecerdasan terintegrasi.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs text-slate-200 text-left">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Astra Research & Trend Opportunity Radar</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Hook Virality Formula (0-3 Detik)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Integrasi Langsung ke Storyboard Engine</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Monetization & Virality Learning Loop</span>
                </div>
              </div>

              <div className="pt-4 flex flex-col sm:flex-row items-center gap-4 justify-center md:justify-start">
                {onNavigateToPayment && (
                  <button
                    onClick={onNavigateToPayment}
                    className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm transition-all shadow-xl shadow-purple-600/30 flex items-center justify-center gap-2"
                  >
                    Tingkatkan ke VIP Creator Autopilot
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
                <span className="text-xs text-slate-400">Garansi Akses Selamanya & Update Fitur Astra</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Tv },
    { id: 'research', label: 'Astra Research', icon: Sparkles },
    { id: 'opportunities', label: 'Opportunities', icon: Target },
    { id: 'planner', label: 'Content Planner', icon: Layers },
    { id: 'production', label: 'Production Queue', icon: Clapperboard },
    { id: 'published', label: 'Published & Scheduled', icon: PlaySquare },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
    { id: 'learning', label: 'Virality Loop', icon: BrainCircuit },
    { id: 'monetization', label: 'Monetization Intel', icon: DollarSign },
  ];

  if (isAdmin) {
    tabs.push({ id: 'admin-astra', label: 'Admin Astra Config', icon: Key });
  }

  return (
    <div className="space-y-6">
      {/* Module Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-bold tracking-wide uppercase">
              PREMIUM ADD-ON
            </span>
            <span className="text-xs text-slate-400 font-medium">GPT Astra Intelligence Engine</span>
          </div>
          <h1 className="text-2xl font-black text-white mt-1 tracking-tight">
            CREATOR AUTOPILOT
          </h1>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-900 px-3.5 py-2 rounded-xl border border-slate-800">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Status Entitlement: <strong className="text-emerald-400">ACTIVE VIP</strong></span>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none border-b border-slate-800">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-2 shrink-0 ${
                isActive
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                  : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Active Tab View Rendering */}
      <div className="pt-2">
        {activeTab === 'overview' && (
          <OverviewTab
            channelInfo={channelInfo}
            opportunities={opportunities}
            plans={plans}
            monetization={monetization}
            onSelectTab={setActiveTab}
            onCreatePlanFromOpportunity={handleCreatePlanFromOpportunity}
          />
        )}

        {activeTab === 'research' && (
          <ResearchTab
            onResearchComplete={(newOpps) => setOpportunities([...newOpps, ...opportunities])}
            onCreatePlanFromOpportunity={handleCreatePlanFromOpportunity}
            getAuthToken={getAuthToken}
          />
        )}

        {activeTab === 'opportunities' && (
          <OpportunitiesTab
            opportunities={opportunities}
            onCreatePlanFromOpportunity={handleCreatePlanFromOpportunity}
            onSelectTab={setActiveTab}
          />
        )}

        {activeTab === 'planner' && (
          <ContentPlannerTab
            plans={plans}
            selectedPlan={selectedPlan}
            onSelectPlan={setSelectedPlan}
            onSendToGeminiWorkspace={onSendToGeminiWorkspace}
          />
        )}

        {activeTab === 'production' && (
          <ProductionQueueTab
            plans={plans}
            onSelectPlanForProduction={setSelectedPlan}
            onSendToGeminiWorkspace={onSendToGeminiWorkspace}
          />
        )}

        {activeTab === 'published' && (
          <PublishedTab publishedList={[]} />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsTab channelInfo={channelInfo} />
        )}

        {activeTab === 'learning' && (
          <LearningTab
            learning={learning}
            onRefreshLearning={handleRefreshLearning}
            loading={loadingLearning}
          />
        )}

        {activeTab === 'monetization' && (
          <MonetizationTab monetization={monetization} />
        )}

        {activeTab === 'admin-astra' && isAdmin && (
          <AdminAstraSettings getAuthToken={getAuthToken} />
        )}
      </div>
    </div>
  );
};
