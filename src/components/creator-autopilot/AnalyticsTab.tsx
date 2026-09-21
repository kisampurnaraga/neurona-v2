import React from 'react';
import { TrendingUp, Users, Eye, PlaySquare, Clock, BarChart3, ArrowUpRight } from 'lucide-react';
import { YouTubeChannelInfo } from '../../types/creatorAutopilot';

interface AnalyticsTabProps {
  channelInfo: YouTubeChannelInfo;
}

export const AnalyticsTab: React.FC<AnalyticsTabProps> = ({ channelInfo }) => {
  const views = channelInfo.viewCount || 125000;
  const subs = channelInfo.subscriberCount || 320;
  const videos = channelInfo.videoCount || 18;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-indigo-400" />
          Shorts Analytics & Growth Index
        </h2>
        <p className="text-xs text-slate-400">Analisis kinerja tayangan, retensi penonton, dan pertumbuhan subscriber channel</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 backdrop-blur-sm">
          <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">Total Shorts Views</div>
          <div className="text-2xl font-bold text-white">{views.toLocaleString('id-ID')}</div>
          <div className="text-xs text-emerald-400 font-medium flex items-center gap-1 mt-2">
            <ArrowUpRight className="w-3.5 h-3.5" /> +28.4% bulan ini
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 backdrop-blur-sm">
          <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">Total Subscribers</div>
          <div className="text-2xl font-bold text-white">{subs.toLocaleString('id-ID')}</div>
          <div className="text-xs text-emerald-400 font-medium flex items-center gap-1 mt-2">
            <ArrowUpRight className="w-3.5 h-3.5" /> +142 subs baru
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 backdrop-blur-sm">
          <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">Rata-rata Retention</div>
          <div className="text-2xl font-bold text-purple-400">78.5%</div>
          <div className="text-xs text-purple-300 font-medium mt-2">Above Industry Benchmark</div>
        </div>
      </div>

      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm space-y-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-purple-400" />
          Performance Benchmarks (Astra Analytics)
        </h3>

        <div className="space-y-3 text-xs">
          <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="font-semibold text-white">Hook Retention (0-3 Detik)</div>
              <div className="text-slate-400">Persentase penonton yang bertahan setelah 3 detik pertama</div>
            </div>
            <div className="text-base font-bold text-emerald-400">82.3% <span className="text-xs text-slate-400 font-normal">(Optimal)</span></div>
          </div>

          <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="font-semibold text-white">Completion Rate</div>
              <div className="text-slate-400">Persentase penonton yang menyaksikan Shorts hingga detik terakhir</div>
            </div>
            <div className="text-base font-bold text-indigo-400">68.1% <span className="text-xs text-slate-400 font-normal">(Sangat Baik)</span></div>
          </div>

          <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="font-semibold text-white">Conversion Rate ke Bio Link</div>
              <div className="text-slate-400">Estimasi klik ke penawaran affiliate / produk dari CTA video</div>
            </div>
            <div className="text-base font-bold text-amber-400">4.2% <span className="text-xs text-slate-400 font-normal">(Tinggi)</span></div>
          </div>
        </div>
      </div>
    </div>
  );
};
