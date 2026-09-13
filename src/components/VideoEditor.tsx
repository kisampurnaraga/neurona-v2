import React, { useState, useRef, useEffect } from 'react';
import { 
  Play, Pause, SkipBack, SkipForward, Type, Video, Music, 
  Scissors, Trash2, Download, Plus, Layers, Settings, ChevronLeft,
  Wand2, AlignLeft, AlignCenter, AlignRight, Loader2
} from 'lucide-react';

interface VideoEditorProps {
  onBack: () => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

interface TextOverlay {
  id: string;
  text: string;
  startTime: number;
  endTime: number;
  style: 'tiktok-classic' | 'tiktok-bordered' | 'tiktok-neon' | 'plain';
  position: { x: number; y: number };
  color: string;
}

interface TimelineClip {
  id: string;
  type: 'video' | 'image';
  url: string;
  duration: number; // in seconds
  name: string;
}

export const VideoEditor: React.FC<VideoEditorProps> = ({ onBack, showToast }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(15); // Default 15s timeline
  const [activeTab, setActiveTab] = useState<'media' | 'text' | 'effects'>('media');
  
  const [clips, setClips] = useState<TimelineClip[]>([
    { id: 'c1', type: 'image', url: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?w=800', duration: 5, name: 'Scene 1' },
    { id: 'c2', type: 'image', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800', duration: 5, name: 'Scene 2' },
  ]);
  
  const [texts, setTexts] = useState<TextOverlay[]>([
    { id: 't1', text: 'Racun TikTok Terbaru! 🔥', startTime: 1, endTime: 4, style: 'tiktok-bordered', position: { x: 50, y: 20 }, color: '#ffffff' }
  ]);
  
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const playheadRef = useRef<number>(0);
  const animationRef = useRef<number>();

  useEffect(() => {
    const newTotal = clips.reduce((acc, clip) => acc + clip.duration, 0);
    setTotalDuration(Math.max(newTotal, 15));
  }, [clips]);

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  useEffect(() => {
    if (isPlaying) {
      let lastTime = performance.now();
      const updateTime = (time: number) => {
        const delta = (time - lastTime) / 1000;
        lastTime = time;
        setCurrentTime(prev => {
          const next = prev + delta;
          if (next >= totalDuration) {
            setIsPlaying(false);
            return totalDuration;
          }
          return next;
        });
        animationRef.current = requestAnimationFrame(updateTime);
      };
      animationRef.current = requestAnimationFrame(updateTime);
    } else {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    }
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isPlaying, totalDuration]);

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentTime(parseFloat(e.target.value));
  };

  const addTextOverlay = () => {
    const newText: TextOverlay = {
      id: 'text-' + Date.now(),
      text: 'Teks TikTok Baru',
      startTime: currentTime,
      endTime: Math.min(currentTime + 3, totalDuration),
      style: 'tiktok-bordered',
      position: { x: 50, y: 50 },
      color: '#ffffff'
    };
    setTexts([...texts, newText]);
    setSelectedTextId(newText.id);
    setActiveTab('text');
  };

  const handleExport = async () => {
    setIsExporting(true);
    showToast('Memulai proses render video dan penggabungan scene...', 'info');
    
    // Simulate export process
    await new Promise(r => setTimeout(r, 3000));
    
    setIsExporting(false);
    showToast('Video berhasil dirender! Siap diunduh atau dipublikasikan.', 'success');
  };

  // Helper to determine current active clip for preview
  const currentClip = () => {
    let accTime = 0;
    for (const clip of clips) {
      if (currentTime >= accTime && currentTime < accTime + clip.duration) {
        return clip;
      }
      accTime += clip.duration;
    }
    return clips[clips.length - 1]; // fallback to last
  };

  const activeClip = currentClip();
  const activeTexts = texts.filter(t => currentTime >= t.startTime && currentTime <= t.endTime);
  const selectedText = texts.find(t => t.id === selectedTextId);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 10);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms}`;
  };

  return (
    <div className="flex flex-col h-[85vh] bg-slate-950 text-slate-200 rounded-3xl overflow-hidden border border-slate-800 shadow-2xl">
      {/* HEADER */}
      <div className="h-14 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 border-l border-slate-700 pl-3">
            <div className="w-8 h-8 bg-gradient-to-tr from-purple-600 to-pink-500 rounded-lg flex items-center justify-center">
              <Scissors className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-white tracking-wide">Neurona Video Studio</span>
            <span className="bg-slate-800 text-[10px] px-2 py-0.5 rounded text-slate-400 ml-2 border border-slate-700">OpenCut Engine</span>
          </div>
        </div>
        <div>
          <button 
            onClick={handleExport}
            disabled={isExporting}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold text-sm rounded-lg transition-colors flex items-center gap-2"
          >
            {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {isExporting ? 'Merender Video...' : 'Export Video'}
          </button>
        </div>
      </div>

      {/* WORKSPACE */}
      <div className="flex flex-1 overflow-hidden">
        {/* LEFT TOOLBAR */}
        <div className="w-16 bg-slate-900 border-r border-slate-800 flex flex-col items-center py-4 gap-4 shrink-0">
          <button onClick={() => setActiveTab('media')} className={`p-3 rounded-xl transition-all ${activeTab === 'media' ? 'bg-slate-800 text-cyan-400' : 'text-slate-500 hover:text-slate-300'}`} title="Media">
            <Video className="w-5 h-5" />
          </button>
          <button onClick={() => setActiveTab('text')} className={`p-3 rounded-xl transition-all ${activeTab === 'text' ? 'bg-slate-800 text-cyan-400' : 'text-slate-500 hover:text-slate-300'}`} title="Teks TikTok">
            <Type className="w-5 h-5" />
          </button>
          <button onClick={() => setActiveTab('effects')} className={`p-3 rounded-xl transition-all ${activeTab === 'effects' ? 'bg-slate-800 text-cyan-400' : 'text-slate-500 hover:text-slate-300'}`} title="Efek & Transisi">
            <Wand2 className="w-5 h-5" />
          </button>
        </div>

        {/* ASSET PANEL (Dynamic based on tab) */}
        <div className="w-64 bg-slate-900/50 border-r border-slate-800 flex flex-col shrink-0">
          <div className="p-4 border-b border-slate-800 font-bold text-sm tracking-wide text-white">
            {activeTab === 'media' ? 'Media & Scenes' : activeTab === 'text' ? 'Teks Narasi' : 'Efek & Transisi'}
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {activeTab === 'media' && (
              <div className="space-y-3">
                <button className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-xs font-bold rounded-lg border border-slate-700 flex items-center justify-center gap-2 text-slate-300 transition-colors">
                  <Plus className="w-3.5 h-3.5" /> Tambah Scene
                </button>
                {clips.map((clip, i) => (
                  <div key={clip.id} className="relative group rounded-lg overflow-hidden border border-slate-700 bg-slate-800">
                    <img src={clip.url} alt={clip.name} className="w-full h-20 object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                      <p className="text-[10px] font-bold text-white">{clip.name}</p>
                      <p className="text-[9px] text-slate-400">{clip.duration}s</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'text' && (
              <div className="space-y-4">
                <button onClick={addTextOverlay} className="w-full py-2 bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-500 hover:to-pink-400 text-white text-xs font-bold rounded-lg shadow-lg flex items-center justify-center gap-2 transition-all">
                  <Type className="w-3.5 h-3.5" /> Tambah Teks Gaya TikTok
                </button>

                {selectedText && (
                  <div className="space-y-4 pt-4 border-t border-slate-800">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Edit Teks</label>
                      <textarea 
                        value={selectedText.text}
                        onChange={(e) => setTexts(texts.map(t => t.id === selectedText.id ? {...t, text: e.target.value} : t))}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white resize-none h-20 focus:border-cyan-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Gaya TikTok</label>
                      <div className="grid grid-cols-2 gap-2">
                        {(['tiktok-classic', 'tiktok-bordered', 'tiktok-neon', 'plain'] as const).map(style => (
                          <button
                            key={style}
                            onClick={() => setTexts(texts.map(t => t.id === selectedText.id ? {...t, style} : t))}
                            className={`py-1.5 px-2 text-[10px] font-bold rounded border transition-colors ${selectedText.style === style ? 'bg-cyan-900/40 border-cyan-500 text-cyan-400' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'}`}
                          >
                            {style.replace('tiktok-', '').toUpperCase()}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Warna Utama</label>
                      <div className="flex gap-2">
                        {['#ffffff', '#000000', '#ff0050', '#00f2fe', '#facc15'].map(color => (
                          <button
                            key={color}
                            onClick={() => setTexts(texts.map(t => t.id === selectedText.id ? {...t, color} : t))}
                            className={`w-6 h-6 rounded-full border-2 ${selectedText.color === color ? 'border-cyan-400' : 'border-transparent'}`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>
                    <button 
                      onClick={() => {
                        setTexts(texts.filter(t => t.id !== selectedText.id));
                        setSelectedTextId(null);
                      }}
                      className="w-full py-2 bg-red-950/30 hover:bg-red-900/50 text-red-400 border border-red-900/50 text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Hapus Teks
                    </button>
                  </div>
                )}
                {!selectedText && texts.length > 0 && (
                  <p className="text-[10px] text-slate-500 text-center italic mt-4">Pilih teks di timeline untuk mengedit.</p>
                )}
              </div>
            )}

            {activeTab === 'effects' && (
              <div className="text-center py-10 text-slate-500 text-xs">
                <Wand2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Fitur Transisi Otomatis aktif.</p>
                <p className="text-[10px] mt-2">Setiap scene akan digabung dengan transisi crossfade halus.</p>
              </div>
            )}
          </div>
        </div>

        {/* MAIN PREVIEW PLAYER */}
        <div className="flex-1 bg-black flex flex-col items-center justify-center relative overflow-hidden">
          {/* Mock Canvas Area */}
          <div 
            className="relative bg-slate-900 shadow-2xl overflow-hidden flex items-center justify-center border border-slate-800"
            style={{ width: '380px', height: '676px', maxHeight: '90%', aspectRatio: '9/16' }} // 9:16 Portrait like TikTok
          >
            {activeClip ? (
              <img 
                src={activeClip.url} 
                alt="Preview" 
                className="w-full h-full object-cover" 
              />
            ) : (
              <div className="text-slate-600 flex flex-col items-center">
                <Video className="w-12 h-12 mb-2" />
                <span>Tidak ada media</span>
              </div>
            )}

            {/* Overlays rendering */}
            {activeTexts.map(text => (
              <div 
                key={text.id}
                onClick={() => {
                  setSelectedTextId(text.id);
                  setActiveTab('text');
                }}
                className={`absolute text-center p-2 cursor-pointer select-none whitespace-pre-wrap
                  ${selectedTextId === text.id ? 'ring-2 ring-cyan-400 ring-offset-2 ring-offset-transparent bg-white/10 rounded' : ''}
                `}
                style={{
                  top: `${text.position.y}%`,
                  left: `${text.position.x}%`,
                  transform: 'translate(-50%, -50%)',
                  color: text.color,
                  // TIKTOK STYLES MOCK
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 900,
                  fontSize: '24px',
                  lineHeight: '1.2',
                  textShadow: text.style === 'tiktok-classic' ? '2px 2px 0px rgba(0,0,0,0.8)' : 
                              text.style === 'tiktok-neon' ? `0 0 10px ${text.color}, 0 0 20px ${text.color}` : 'none',
                  backgroundColor: text.style === 'tiktok-bordered' ? 'rgba(0,0,0,0.6)' : 'transparent',
                  padding: text.style === 'tiktok-bordered' ? '8px 16px' : '0',
                  borderRadius: text.style === 'tiktok-bordered' ? '8px' : '0',
                  WebkitTextStroke: text.style === 'tiktok-classic' ? '1px black' : 'none'
                }}
              >
                {text.text}
              </div>
            ))}
          </div>

          {/* Player Controls (Overlay on bottom) */}
          <div className="absolute bottom-4 inset-x-0 flex justify-center">
            <div className="bg-slate-900/80 backdrop-blur border border-slate-700 px-4 py-2 rounded-full flex items-center gap-4 shadow-xl">
              <span className="text-xs font-mono w-14 text-right text-slate-300">{formatTime(currentTime)}</span>
              
              <div className="flex items-center gap-2">
                <button onClick={() => setCurrentTime(0)} className="text-slate-300 hover:text-white transition-colors">
                  <SkipBack className="w-4 h-4" />
                </button>
                <button 
                  onClick={togglePlay}
                  className="w-10 h-10 bg-white text-slate-900 rounded-full flex items-center justify-center hover:scale-105 transition-transform"
                >
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-1" />}
                </button>
                <button onClick={() => setCurrentTime(totalDuration)} className="text-slate-300 hover:text-white transition-colors">
                  <SkipForward className="w-4 h-4" />
                </button>
              </div>

              <span className="text-xs font-mono w-14 text-left text-slate-500">{formatTime(totalDuration)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* TIMELINE (BOTTOM) */}
      <div className="h-64 bg-slate-950 border-t border-slate-800 flex flex-col shrink-0 select-none">
        
        {/* Timeline Tools */}
        <div className="h-10 border-b border-slate-800 flex items-center px-4 bg-slate-900/50 justify-between">
          <div className="flex items-center gap-4 text-xs font-bold text-slate-400">
            <button className="hover:text-white flex items-center gap-1.5"><Scissors className="w-3.5 h-3.5" /> Split</button>
            <button className="hover:text-white flex items-center gap-1.5"><Trash2 className="w-3.5 h-3.5" /> Delete</button>
          </div>
          
          {/* Zoom Slider Mock */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-500">Zoom</span>
            <input type="range" min="1" max="10" defaultValue="5" className="w-24 h-1 bg-slate-700 rounded-full appearance-none cursor-pointer" />
          </div>
        </div>

        {/* Tracks Area */}
        <div className="flex-1 overflow-x-auto overflow-y-auto relative p-4" style={{scrollbarWidth: 'thin'}}>
          
          {/* Ruler */}
          <div className="h-6 relative mb-2 w-[1500px]">
             {/* Mocking ruler ticks */}
             {Array.from({length: 16}).map((_, i) => (
               <div key={i} className="absolute top-0 text-[9px] text-slate-600 border-l border-slate-800 pl-1 h-full" style={{ left: `${(i/15)*100}%` }}>
                 {i}s
               </div>
             ))}
          </div>

          {/* Text Track */}
          <div className="flex items-center gap-4 mb-2 min-w-max w-[1500px] relative">
            <div className="w-16 shrink-0 flex items-center gap-2 text-xs font-bold text-slate-500 sticky left-0 bg-slate-950 z-10 p-1">
              <Type className="w-4 h-4 text-pink-500" /> Teks
            </div>
            <div className="flex-1 h-10 bg-slate-900 rounded-lg relative border border-slate-800/50">
              {texts.map(text => {
                const left = (text.startTime / totalDuration) * 100;
                const width = ((text.endTime - text.startTime) / totalDuration) * 100;
                return (
                  <div 
                    key={text.id}
                    onClick={() => setSelectedTextId(text.id)}
                    className={`absolute top-1 bottom-1 rounded-md px-2 text-[10px] font-bold text-white truncate flex items-center shadow border transition-colors cursor-pointer
                      ${selectedTextId === text.id ? 'bg-pink-600 border-pink-400 z-10' : 'bg-pink-900/60 border-pink-800 hover:bg-pink-800'}`}
                    style={{ left: `${left}%`, width: `${width}%` }}
                  >
                    {text.text}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Video/Image Track */}
          <div className="flex items-center gap-4 mb-2 min-w-max w-[1500px] relative">
            <div className="w-16 shrink-0 flex items-center gap-2 text-xs font-bold text-slate-500 sticky left-0 bg-slate-950 z-10 p-1">
              <Video className="w-4 h-4 text-cyan-500" /> Utama
            </div>
            <div className="flex-1 h-16 bg-slate-900 rounded-lg relative border border-slate-800/50 flex">
               {clips.map((clip, index) => {
                 const width = (clip.duration / totalDuration) * 100;
                 return (
                   <div 
                     key={clip.id}
                     className="h-full border-r border-slate-950 relative overflow-hidden group cursor-pointer"
                     style={{ width: `${width}%` }}
                   >
                     <img src={clip.url} alt="" className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                     <div className="absolute inset-0 border-2 border-transparent group-hover:border-cyan-500/50 rounded pointer-events-none transition-colors" />
                     <span className="absolute bottom-1 left-1 bg-black/60 px-1 rounded text-[8px] text-white font-mono">{clip.duration}s</span>
                   </div>
                 )
               })}
            </div>
          </div>

          {/* Audio Track (Empty mockup) */}
          <div className="flex items-center gap-4 min-w-max w-[1500px] relative">
            <div className="w-16 shrink-0 flex items-center gap-2 text-xs font-bold text-slate-500 sticky left-0 bg-slate-950 z-10 p-1">
              <Music className="w-4 h-4 text-emerald-500" /> Audio
            </div>
            <div className="flex-1 h-10 bg-slate-900 rounded-lg relative border border-slate-800/50 flex items-center justify-center text-slate-700 text-xs font-bold">
              Klik untuk tambah musik TikTok
            </div>
          </div>

          {/* PLAYHEAD (Red Line) */}
          <div 
            className="absolute top-0 bottom-0 w-px bg-red-500 z-20 pointer-events-none"
            style={{ 
              left: `calc(5rem + 1rem + ${(currentTime / totalDuration) * 100}% - 4px)`, // Offset for sticky headers
            }}
          >
            <div className="w-3 h-3 bg-red-500 rounded-sm absolute -top-1 -translate-x-[5px] flex items-center justify-center pointer-events-auto">
              <div className="w-0.5 h-1.5 bg-white/80 rounded-full" />
            </div>
          </div>

        </div>
      </div>
      
    </div>
  );
};
