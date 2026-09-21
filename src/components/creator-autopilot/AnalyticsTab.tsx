import React from 'react';
import { TrendingUp, Users, Eye, PlaySquare, Clock, BarChart3, ArrowUpRight } from 'lucide-react';
import { YouTubeChannelInfo } from '../../types/creatorAutopilot';

interface AnalyticsTabProps {
  channelInfo: YouTubeChannelInfo;
}

export const AnalyticsTab: React.FC<AnalyticsTabProps> = ({ channelInfo }) => {
  const views = channelInfo.connected ? (channelInfo.viewCount || 0) : 0;
  const subs = channelInfo.connected ? (channelInfo.subscriberCount || 0) : 0;
  const videos = channelInfo.connected ? (channelInfo.videoCount || 0) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-indigo-400" />
          Shorts Analytics & Growth Index
        </h2>
        <p className="text-xs text-slate-400">Analisis kinerja tayangan, retensi penonton, dan pertumbuhan subscriber channel</p>
      </div>

      {!channelInfo.connected && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-5 text-amber-200 text-xs flex items-center justify-between gap-4">
          <div>
            <div className="font-semibold text-sm text-amber-300">Channel YouTube Belum Terhubung</div>
            <p className="text-slate-400 mt-0.5">Hubungkan channel YouTube Anda untuk menampilkan metrik analitik real-time.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 backdrop-blur-sm">
          <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">Total Shorts Views</div>
          <div className="text-2xl font-bold text-white">{views.toLocaleString('id-ID')}</div>
          <div className="text-xs text-slate-400 mt-2">
            {channelInfo.connected ? 'Data langsung dari YouTube API' : 'Hubungkan YouTube'}
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 backdrop-blur-sm">
          <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">Total Subscribers</div>
          <div className="text-2xl font-bold text-white">{subs.toLocaleString('id-ID')}</div>
          <div className="text-xs text-slate-400 mt-2">
            {channelInfo.connected ? 'Data langsung dari YouTube API' : 'Hubungkan YouTube'}
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 backdrop-blur-sm">
          <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">Total Videos</div>
          <div className="text-2xl font-bold text-purple-400">{videos.toLocaleString('id-ID')}</div>
          <div className="text-xs text-slate-400 mt-2">
            {channelInfo.connected ? 'Video terpublikasi di channel' : 'Hubungkan YouTube'}
          </div>
        </div>
      </div>

      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm space-y-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-purple-400" />
          Performance Benchmarks (Astra Analytics)
        </h3>

        {channelInfo.connected ? (
          <div className="space-y-3 text-xs">
            <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="font-semibold text-white">Hook Retention (0-3 Detik)</div>
                <div className="text-slate-400">Persentase penonton yang bertahan setelah 3 detik pertama</div>
              </div>
              <div className="text-xs text-slate-400">Memerlukan data penayangan aktif</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="font-semibold text-white">Completion Rate</div>
                <div className="text-slate-400">Persentase penonton yang menyaksikan Shorts hingga detik terakhir</div>
              </div>
              <div className="text-xs text-slate-400">Memerlukan data penayangan aktif</div>
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-400 italic">Analisis benchmark akan diaktifkan setelah channel YouTube terhubung dan menghasilkan penayangan.</p>
        )}
      </div>
    </div>
  );
};
