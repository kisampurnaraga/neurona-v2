import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Cpu, 
  Zap, 
  Clock, 
  TrendingUp, 
  BarChart3, 
  ShieldCheck, 
  Loader2, 
  AlertCircle,
  Sparkles,
  RefreshCw,
  CheckCircle2
} from 'lucide-react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { AstraUsageRecord } from '../../types/creatorAutopilot';

interface AstraUsageStatsProps {
  monthlyLimit?: number;
  compact?: boolean;
  className?: string;
}

export const AstraUsageStats: React.FC<AstraUsageStatsProps> = ({
  monthlyLimit = 1000,
  compact = false,
  className = ''
}) => {
  const [logs, setLogs] = useState<AstraUsageRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const q = query(
        collection(db, 'astra_usage'),
        where('userId', '==', user.uid)
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const fetchedLogs: AstraUsageRecord[] = snapshot.docs.map((docDoc) => {
            const data = docDoc.data();
            let timestampStr = new Date().toISOString();
            if (data.timestamp) {
              if (typeof data.timestamp === 'string') {
                timestampStr = data.timestamp;
              } else if (data.timestamp.toDate) {
                timestampStr = data.timestamp.toDate().toISOString();
              }
            }
            return {
              id: docDoc.id,
              userId: data.userId || user.uid,
              userEmail: data.userEmail || user.email || '',
              feature: data.feature || 'ASTRA_AI_REQUEST',
              requestCount: Number(data.requestCount) || 1,
              estimatedTokens: Number(data.estimatedTokens) || 0,
              timestamp: timestampStr
            };
          });

          // Sort descending by timestamp
          fetchedLogs.sort(
            (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          );

          setLogs(fetchedLogs);
          setLastSyncTime(new Date());
          setLoading(false);
        },
        (err) => {
          console.warn('Real-time astra_usage snapshot listener warning:', err);
          setError('Gagal memuat real-time usage dari Firestore');
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (err: any) {
      console.error('Error attaching astra_usage listener:', err);
      setError(err.message || 'Gagal menghubungkan listener usage');
      setLoading(false);
    }
  }, []);

  // Filter current calendar month logs
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  const currentMonthLogs = logs.filter((log) => {
    const logDate = new Date(log.timestamp);
    return logDate.getFullYear() === currentYear && logDate.getMonth() === currentMonth;
  });

  const totalMonthlyRequests = currentMonthLogs.reduce((sum, item) => sum + (item.requestCount || 1), 0);
  const totalMonthlyTokens = currentMonthLogs.reduce((sum, item) => sum + (item.estimatedTokens || 0), 0);
  const usagePercentage = Math.min(100, Math.round((totalMonthlyRequests / monthlyLimit) * 100));

  // Feature breakdown
  const featureBreakdown = currentMonthLogs.reduce((acc, item) => {
    const feat = item.feature || 'ASTRA_AI';
    if (!acc[feat]) {
      acc[feat] = { requests: 0, tokens: 0 };
    }
    acc[feat].requests += item.requestCount || 1;
    acc[feat].tokens += item.estimatedTokens || 0;
    return acc;
  }, {} as Record<string, { requests: number; tokens: number }>);

  // Remaining quota
  const remainingRequests = Math.max(0, monthlyLimit - totalMonthlyRequests);

  // Next reset date (1st of next month)
  const nextMonth = new Date(currentYear, currentMonth + 1, 1);
  const daysUntilReset = Math.ceil((nextMonth.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  // Status color badge
  const getStatusColor = () => {
    if (usagePercentage >= 90) return { bg: 'bg-rose-500/20', text: 'text-rose-300', border: 'border-rose-500/30', bar: 'bg-rose-500' };
    if (usagePercentage >= 70) return { bg: 'bg-amber-500/20', text: 'text-amber-300', border: 'border-amber-500/30', bar: 'bg-amber-500' };
    return { bg: 'bg-emerald-500/20', text: 'text-emerald-300', border: 'border-emerald-500/30', bar: 'bg-emerald-400' };
  };

  const statusStyle = getStatusColor();

  const formatFeatureName = (feat: string) => {
    switch (feat) {
      case 'ASTRA_RESEARCH':
        return 'Trend Opportunity Research';
      case 'ASTRA_CONTENT_PLAN':
        return 'Script & Hook Planner';
      case 'ASTRA_STORYBOARD':
        return 'Storyboard Visual Generator';
      case 'ASTRA_ANALYTICS':
        return 'Virality Learning Loop';
      default:
        return feat.replace(/_/g, ' ');
    }
  };

  if (compact) {
    return (
      <div className={`bg-slate-900/90 border border-slate-800 rounded-xl p-4 text-white backdrop-blur-md space-y-2.5 ${className}`}>
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-purple-400" />
            <span className="font-bold">Astra Monthly Quota</span>
          </div>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}>
            {totalMonthlyRequests} / {monthlyLimit} Req ({usagePercentage}%)
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-500 ${statusStyle.bar}`}
            style={{ width: `${usagePercentage}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <span>{totalMonthlyTokens.toLocaleString('id-ID')} Total Tokens</span>
          <span>Sisa: {remainingRequests} Request</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-slate-900/90 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl text-white space-y-6 ${className}`}>
      {/* Title & Real-time Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-600/30 border border-purple-500/40 flex items-center justify-center text-purple-300 shrink-0">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white">Astra Real-Time Usage Statistics</h3>
              <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-bold uppercase tracking-wider">
                Firestore Sync
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Monitoring konsumsi kuota & estimasi token GPT Astra bulan ini
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[11px] text-slate-400">
            Terakhir update: {lastSyncTime.toLocaleTimeString('id-ID')}
          </span>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-12 text-slate-400 space-y-3">
          <Loader2 className="w-7 h-7 animate-spin text-purple-500" />
          <p className="text-xs">Menghubungkan ke koleksi 'astra_usage' Firestore...</p>
        </div>
      ) : error ? (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : (
        <>
          {/* Main Usage Meter Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Monthly Consumed Quota Box */}
            <div className="p-5 rounded-2xl bg-slate-800/60 border border-slate-700/50 space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                <span>Kuota Bulanan Terpakai</span>
                <Cpu className="w-4 h-4 text-purple-400" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-white">{totalMonthlyRequests}</span>
                <span className="text-xs text-slate-400">/ {monthlyLimit} Request</span>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1.5 pt-1">
                <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden border border-slate-700/50">
                  <div
                    className={`h-full transition-all duration-500 ${statusStyle.bar}`}
                    style={{ width: `${usagePercentage}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] font-semibold">
                  <span className={statusStyle.text}>{usagePercentage}% Terkonsumsi</span>
                  <span className="text-slate-400">Sisa {remainingRequests} Req</span>
                </div>
              </div>
            </div>

            {/* Total Estimated Tokens Box */}
            <div className="p-5 rounded-2xl bg-slate-800/60 border border-slate-700/50 space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                <span>Estimasi Token Digunakan</span>
                <Sparkles className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-3xl font-black text-amber-300">
                {totalMonthlyTokens.toLocaleString('id-ID')}
              </div>
              <p className="text-xs text-slate-400">
                Astra AI reasoning tokens dihitung otomatis dari riwayat prompt.
              </p>
            </div>

            {/* Quota Reset Info Box */}
            <div className="p-5 rounded-2xl bg-slate-800/60 border border-slate-700/50 space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                <span>Siklus Reset Kuota</span>
                <Clock className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-bold text-emerald-300">
                {daysUntilReset} Hari Lagi
              </div>
              <p className="text-xs text-slate-400">
                Reset otomatis pada tanggal 1 bulan berikutnya ({nextMonth.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}).
              </p>
            </div>
          </div>

          {/* Breakdown by Feature & Recent Activity Logs */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
            {/* Feature Usage Breakdown */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4 text-purple-400" />
                Konsumsi Berdasarkan Fitur
              </h4>

              {Object.keys(featureBreakdown).length === 0 ? (
                <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 text-slate-500 text-xs text-center">
                  Belum ada penggunaan fitur Astra bulan ini.
                </div>
              ) : (
                <div className="space-y-2">
                  {(Object.entries(featureBreakdown) as [string, { requests: number; tokens: number }][]).map(([featKey, stats]) => (
                    <div
                      key={featKey}
                      className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/40 flex items-center justify-between text-xs"
                    >
                      <div className="space-y-0.5">
                        <span className="font-semibold text-white">{formatFeatureName(featKey)}</span>
                        <div className="text-[10px] text-slate-400">{stats.tokens.toLocaleString('id-ID')} tokens</div>
                      </div>
                      <span className="px-2.5 py-1 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/30 font-mono font-bold">
                        {stats.requests} req
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Firestore Logs */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-indigo-400" />
                  Aktivitas Terbaru (Real-Time)
                </h4>
                <span className="text-[10px] text-slate-400">{currentMonthLogs.length} Entri Bulan Ini</span>
              </div>

              {currentMonthLogs.length === 0 ? (
                <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 text-slate-500 text-xs text-center">
                  Belum ada log penggunaan tercatat bulan ini.
                </div>
              ) : (
                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1 scrollbar-thin">
                  {currentMonthLogs.slice(0, 6).map((item) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-xl bg-slate-800/30 border border-slate-800/60 flex items-center justify-between text-xs hover:border-slate-700 transition-all"
                    >
                      <div className="space-y-0.5">
                        <div className="font-medium text-slate-200">{formatFeatureName(item.feature)}</div>
                        <div className="text-[10px] text-slate-400">
                          {new Date(item.timestamp).toLocaleString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                      <span className="text-emerald-400 font-mono text-[11px] font-semibold">
                        +{item.estimatedTokens} tokens
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
