import React from 'react';
import { PlaySquare, Calendar, Eye, ThumbsUp, MessageSquare, Users, ExternalLink, Clock } from 'lucide-react';
import { PublishedContent } from '../../types/creatorAutopilot';

interface PublishedTabProps {
  publishedList: PublishedContent[];
}

export const PublishedTab: React.FC<PublishedTabProps> = ({ publishedList }) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <PlaySquare className="w-5 h-5 text-purple-400" />
          Published & Scheduled Shorts
        </h2>
        <p className="text-xs text-slate-400">Kelola dan pantau Shorts yang telah dipublikasikan atau dijadwalkan di YouTube</p>
      </div>

      {publishedList.length === 0 ? (
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-8 text-center space-y-3">
          <PlaySquare className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-sm font-semibold text-slate-300">Belum ada Shorts yang dipublikasikan atau dijadwalkan</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Buat ide di Astra Research, lalu susun Content Plan dan teruskan ke Gemini Workspace untuk proses produksi dan publikasi.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {publishedList.map((pub) => (
            <div key={pub.id} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 backdrop-blur-sm">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    pub.status === 'PUBLISHED' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}>
                    {pub.status}
                  </span>
                  <span className="text-xs text-slate-400">
                    {pub.status === 'PUBLISHED' ? `Dipublikasi: ${new Date(pub.publishedTime!).toLocaleDateString('id-ID')}` : `Dijadwalkan: ${new Date(pub.scheduledTime!).toLocaleDateString('id-ID')}`}
                  </span>
                </div>

                <h3 className="font-bold text-white text-base">{pub.title}</h3>
                {pub.hook && <p className="text-xs text-slate-300 italic">"Hook: {pub.hook}"</p>}

                {pub.status === 'PUBLISHED' && (
                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 pt-1">
                    <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5 text-purple-400" /> {(pub.views || 0).toLocaleString('id-ID')} Views</span>
                    <span className="flex items-center gap-1"><ThumbsUp className="w-3.5 h-3.5 text-indigo-400" /> {(pub.likes || 0).toLocaleString('id-ID')} Likes</span>
                    <span className="flex items-center gap-1"><MessageSquare className="w-3.5 h-3.5 text-amber-400" /> {pub.comments || 0} Komentar</span>
                    <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5 text-emerald-400" /> +{pub.subscribersGained || 0} Subs</span>
                    {pub.retentionRate && <span className="text-purple-300 font-semibold">Retention: {pub.retentionRate}%</span>}
                  </div>
                )}
              </div>

              {pub.youtubeUrl && (
                <a
                  href={pub.youtubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition-all flex items-center gap-1.5 self-start md:self-center"
                >
                  Lihat di YouTube
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
