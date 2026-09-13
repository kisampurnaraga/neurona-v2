import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Play, Pause, SkipBack, SkipForward, Type, Video, Music, 
  Scissors, Trash2, Download, Plus, Layers, Settings, ChevronLeft,
  Wand2, AlignLeft, AlignCenter, AlignRight, Loader2, Image as ImageIcon
} from 'lucide-react';
import { renderEngine } from '../lib/renderEngine';
import { VideoStore, MediaAsset } from '../lib/videoStore';
import { v4 as uuidv4 } from 'uuid';

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
  assetId: string; // Links to MediaAsset
  type: 'video' | 'image' | 'audio';
  url: string; // ObjectURL for previewing
  duration: number; // in seconds
  name: string;
}

export const VideoEditor: React.FC<VideoEditorProps> = ({ onBack, showToast }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(15);
  const [activeTab, setActiveTab] = useState<'media' | 'text' | 'effects'>('media');
  
  const [mediaAssets, setMediaAssets] = useState<MediaAsset[]>([]);
  const [clips, setClips] = useState<TimelineClip[]>([]);
  const [texts, setTexts] = useState<TextOverlay[]>([]);
  
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null);
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  
  const playheadRef = useRef<number>(0);
  const animationRef = useRef<number>();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize and load project/assets
  useEffect(() => {
    const init = async () => {
      try {
        const assets = await VideoStore.loadMediaAssets();
        setMediaAssets(assets);
        
        const project = await VideoStore.loadProject();
        if (project) {
          // Recreate blob URLs for clips based on assets
          const restoredClips = project.clips.map((clip: any) => {
            const asset = assets.find(a => a.id === clip.assetId);
            return {
              ...clip,
              url: asset ? VideoStore.createBlobUrl(asset) : ''
            };
          }).filter(c => c.url !== ''); // Remove broken refs
          
          setClips(restoredClips);
          setTexts(project.texts || []);
        }
      } catch (err) {
        console.error("Error loading project:", err);
      }
    };
    init();
    
    // Cleanup URLs on unmount
    return () => {
      clips.forEach(c => URL.revokeObjectURL(c.url));
    };
  }, []);

  // Auto-save project changes
  useEffect(() => {
    if (clips.length > 0 || texts.length > 0) {
      // Save metadata only
      const projectClips = clips.map(c => ({
        id: c.id,
        assetId: c.assetId,
        type: c.type,
        duration: c.duration,
        name: c.name
      }));
      VideoStore.saveProject(projectClips, texts).catch(console.error);
    }
  }, [clips, texts]);

  useEffect(() => {
    const newTotal = clips.reduce((acc, clip) => acc + clip.duration, 0);
    setTotalDuration(Math.max(newTotal, 15));
  }, [clips]);

  const togglePlay = () => setIsPlaying(!isPlaying);

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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    showToast('Mengimpor media...', 'info');
    try {
      const newAssets: MediaAsset[] = [];
      for (let i = 0; i < files.length; i++) {
        const asset = await VideoStore.saveMedia(files[i]);
        newAssets.push(asset);
      }
      setMediaAssets(prev => [...prev, ...newAssets]);
      showToast('Media berhasil ditambahkan ke library', 'success');
    } catch (err: any) {
      showToast('Gagal mengimpor media: ' + err.message, 'error');
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const addAssetToTimeline = (asset: MediaAsset) => {
    // Generate a quick local blob url for preview
    const url = VideoStore.createBlobUrl(asset);
    
    // For video, we should ideally read duration, but we'll mock 5s if unknown
    // A robust app would use a hidden <video> element to get duration
    const newClip: TimelineClip = {
      id: uuidv4(),
      assetId: asset.id,
      type: asset.type as any,
      url,
      duration: asset.duration || 5,
      name: asset.name
    };
    
    setClips(prev => [...prev, newClip]);
  };

  const deleteAsset = async (assetId: string) => {
    await VideoStore.deleteMedia(assetId);
    setMediaAssets(prev => prev.filter(a => a.id !== assetId));
    // Remove from timeline too
    setClips(prev => prev.filter(c => c.assetId !== assetId));
  };

  const deleteSelectedClip = () => {
    if (selectedClipId) {
      setClips(prev => prev.filter(c => c.id !== selectedClipId));
      setSelectedClipId(null);
    }
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
    if (clips.length === 0) {
      showToast('Timeline kosong. Tambahkan media terlebih dahulu!', 'error');
      return;
    }
    
    setIsExporting(true);
    setExportProgress(0);
    showToast('Memulai rendering video dengan FFmpeg WASM...', 'info');
    
    try {
      const renderClips = clips.map(c => ({
        id: c.id,
        type: c.type,
        url: c.url,
        duration: c.duration
      }));
      
      const blob = await renderEngine.exportVideo(renderClips, (prog) => {
        setExportProgress(Math.round(prog));
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'neurona_export.mp4';
      a.click();
      URL.revokeObjectURL(url);
      
      showToast('Video berhasil diexport!', 'success');
    } catch (err: any) {
      console.error(err);
      showToast('Gagal merender video: ' + err.message, 'error');
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  };

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
    <div className="flex flex-col h-full w-full bg-slate-950 text-slate-200 overflow-hidden">
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
            {isExporting ? `Rendering ${exportProgress}%` : 'Export Video'}
          </button>
        </div>
      </div>

      {/* WORKSPACE */}
      <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
        
        {/* MOBILE PREVIEW */}
        <div className="md:hidden flex-1 bg-black flex flex-col items-center justify-center relative overflow-hidden min-h-[40vh]">
          <div className="relative bg-slate-900 shadow-2xl overflow-hidden flex items-center justify-center border border-slate-800 h-full max-h-full" style={{ aspectRatio: '9/16' }}>
            {activeClip && activeClip.type !== 'audio' ? (
              <img src={activeClip.url} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <div className="text-slate-600 flex flex-col items-center">
                <Video className="w-12 h-12 mb-2" />
                <span>Tidak ada media video</span>
              </div>
            )}
            
            {activeTexts.map(text => (
              <div 
                key={text.id}
                onClick={() => { setSelectedTextId(text.id); setActiveTab('text'); }}
                className={`absolute text-center p-2 cursor-pointer select-none whitespace-pre-wrap
                  ${selectedTextId === text.id ? 'ring-2 ring-cyan-400 ring-offset-2 ring-offset-transparent bg-white/10 rounded' : ''}
                `}
                style={{
                  top: `${text.position.y}%`, left: `${text.position.x}%`, transform: 'translate(-50%, -50%)',
                  color: text.color, fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: '16px',
                  textShadow: text.style === 'tiktok-classic' ? '2px 2px 0px rgba(0,0,0,0.8)' : text.style === 'tiktok-neon' ? `0 0 10px ${text.color}, 0 0 20px ${text.color}` : 'none',
                  backgroundColor: text.style === 'tiktok-bordered' ? 'rgba(0,0,0,0.6)' : 'transparent',
                  padding: text.style === 'tiktok-bordered' ? '6px 12px' : '0',
                  borderRadius: text.style === 'tiktok-bordered' ? '6px' : '0',
                  WebkitTextStroke: text.style === 'tiktok-classic' ? '1px black' : 'none'
                }}
              >
                {text.text}
              </div>
            ))}
          </div>
          <div className="absolute bottom-4 inset-x-0 flex justify-center z-10 scale-90">
            <div className="bg-slate-900/80 backdrop-blur border border-slate-700 px-4 py-2 rounded-full flex items-center gap-4 shadow-xl">
              <span className="text-[10px] font-mono w-10 text-right text-slate-300">{formatTime(currentTime)}</span>
              <div className="flex items-center gap-2">
                <button onClick={() => setCurrentTime(0)} className="text-slate-300 hover:text-white transition-colors p-1"><SkipBack className="w-3.5 h-3.5" /></button>
                <button onClick={togglePlay} className="w-8 h-8 bg-white text-slate-900 rounded-full flex items-center justify-center hover:scale-105 transition-transform">
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                </button>
                <button onClick={() => setCurrentTime(totalDuration)} className="text-slate-300 hover:text-white transition-colors p-1"><SkipForward className="w-3.5 h-3.5" /></button>
              </div>
              <span className="text-[10px] font-mono w-10 text-left text-slate-500">{formatTime(totalDuration)}</span>
            </div>
          </div>
        </div>

        {/* LEFT TOOLBAR */}
        <div className="w-full md:w-16 bg-slate-900 border-b md:border-b-0 md:border-r border-slate-800 flex flex-row md:flex-col items-center justify-around md:justify-start py-2 md:py-4 md:gap-4 shrink-0 overflow-x-auto">
          <button onClick={() => setActiveTab('media')} className={`p-2.5 md:p-3 rounded-xl transition-all flex flex-col md:block items-center gap-1 ${activeTab === 'media' ? 'bg-slate-800 text-cyan-400' : 'text-slate-500 hover:text-slate-300'}`} title="Media">
            <Video className="w-5 h-5 md:w-5 md:h-5" />
            <span className="text-[9px] md:hidden font-bold">Media</span>
          </button>
          <button onClick={() => setActiveTab('text')} className={`p-2.5 md:p-3 rounded-xl transition-all flex flex-col md:block items-center gap-1 ${activeTab === 'text' ? 'bg-slate-800 text-cyan-400' : 'text-slate-500 hover:text-slate-300'}`} title="Teks TikTok">
            <Type className="w-5 h-5 md:w-5 md:h-5" />
            <span className="text-[9px] md:hidden font-bold">Teks</span>
          </button>
          <button onClick={() => setActiveTab('effects')} className={`p-2.5 md:p-3 rounded-xl transition-all flex flex-col md:block items-center gap-1 ${activeTab === 'effects' ? 'bg-slate-800 text-cyan-400' : 'text-slate-500 hover:text-slate-300'}`} title="Efek & Transisi">
            <Wand2 className="w-5 h-5 md:w-5 md:h-5" />
            <span className="text-[9px] md:hidden font-bold">Efek</span>
          </button>
        </div>

        {/* ASSET PANEL */}
        <div className="w-full md:w-64 bg-slate-900/50 border-b md:border-b-0 md:border-r border-slate-800 flex flex-col shrink-0 h-48 md:h-auto overflow-hidden">
          <div className="p-3 md:p-4 border-b border-slate-800 font-bold text-xs md:text-sm tracking-wide text-white shrink-0">
            {activeTab === 'media' ? 'Media Library' : activeTab === 'text' ? 'Teks Narasi' : 'Efek & Transisi'}
          </div>
          
          <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-4 custom-scrollbar">
            {activeTab === 'media' && (
              <div className="space-y-3">
                <input type="file" ref={fileInputRef} className="hidden" accept="video/*,image/*" multiple onChange={handleFileUpload} />
                <button onClick={() => fileInputRef.current?.click()} className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-xs font-bold rounded-lg border border-slate-700 flex items-center justify-center gap-2 text-slate-300 transition-colors">
                  <Plus className="w-3.5 h-3.5" /> Import Media
                </button>
                <div className="grid grid-cols-2 md:grid-cols-2 gap-2">
                  {mediaAssets.map(asset => (
                    <div key={asset.id} className="relative group rounded-lg overflow-hidden border border-slate-700 bg-slate-800 aspect-square flex flex-col">
                      <div className="flex-1 bg-black flex items-center justify-center text-slate-600 relative">
                        {asset.type === 'video' ? <Video className="w-6 h-6" /> : <ImageIcon className="w-6 h-6" />}
                      </div>
                      <div className="p-1 bg-slate-900 text-[9px] text-white truncate text-center">{asset.name}</div>
                      
                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                        <button onClick={() => addAssetToTimeline(asset)} className="bg-cyan-500 text-white text-[9px] font-bold px-2 py-1 rounded">Tambah ke Timeline</button>
                        <button onClick={() => deleteAsset(asset.id)} className="bg-red-500 text-white text-[9px] font-bold px-2 py-1 rounded">Hapus Asset</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'text' && (
              <div className="space-y-4">
                <button onClick={addTextOverlay} className="w-full py-2 bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-500 hover:to-pink-400 text-white text-xs font-bold rounded-lg shadow-lg flex items-center justify-center gap-2 transition-all shrink-0">
                  <Type className="w-3.5 h-3.5" /> Tambah Teks TikTok
                </button>
                {selectedText && (
                  <div className="space-y-4 pt-4 border-t border-slate-800">
                    <textarea 
                      value={selectedText.text}
                      onChange={(e) => setTexts(texts.map(t => t.id === selectedText.id ? {...t, text: e.target.value} : t))}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white resize-none h-16 md:h-20 focus:border-cyan-500 focus:outline-none custom-scrollbar"
                    />
                    <div className="grid grid-cols-2 gap-1.5 md:gap-2">
                      {(['tiktok-classic', 'tiktok-bordered', 'tiktok-neon', 'plain'] as const).map(style => (
                        <button key={style} onClick={() => setTexts(texts.map(t => t.id === selectedText.id ? {...t, style} : t))} className={`py-1.5 px-1 md:px-2 text-[9px] font-bold rounded border transition-colors truncate ${selectedText.style === style ? 'bg-cyan-900/40 border-cyan-500 text-cyan-400' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'}`}>
                          {style.replace('tiktok-', '').toUpperCase()}
                        </button>
                      ))}
                    </div>
                    <button 
                      onClick={() => { setTexts(texts.filter(t => t.id !== selectedText.id)); setSelectedTextId(null); }}
                      className="w-full py-2 bg-red-950/30 text-red-400 border border-red-900/50 text-xs font-bold rounded-lg flex justify-center gap-2"
                    ><Trash2 className="w-3.5 h-3.5" /> Hapus Teks</button>
                  </div>
                )}
              </div>
            )}
            
            {activeTab === 'effects' && (
              <div className="text-center py-10 text-slate-500 text-xs">
                <Wand2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>FFmpeg render engine aktif.</p>
              </div>
            )}
          </div>
        </div>

        {/* DESKTOP PREVIEW */}
        <div className="hidden md:flex flex-1 bg-black flex-col items-center justify-center relative overflow-hidden">
          <div className="relative bg-slate-900 shadow-2xl overflow-hidden flex items-center justify-center border border-slate-800" style={{ width: '380px', height: '676px', maxHeight: '90%', aspectRatio: '9/16' }}>
            {activeClip && activeClip.type !== 'audio' ? (
              <img src={activeClip.url} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <div className="text-slate-600 flex flex-col items-center"><Video className="w-12 h-12 mb-2" /><span>Tidak ada media</span></div>
            )}
            {activeTexts.map(text => (
              <div 
                key={text.id} onClick={() => { setSelectedTextId(text.id); setActiveTab('text'); }}
                className={`absolute text-center p-2 cursor-pointer select-none whitespace-pre-wrap ${selectedTextId === text.id ? 'ring-2 ring-cyan-400 bg-white/10 rounded' : ''}`}
                style={{ top: `${text.position.y}%`, left: `${text.position.x}%`, transform: 'translate(-50%, -50%)', color: text.color, fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: '24px', textShadow: text.style === 'tiktok-classic' ? '2px 2px 0px rgba(0,0,0,0.8)' : text.style === 'tiktok-neon' ? `0 0 10px ${text.color}, 0 0 20px ${text.color}` : 'none', backgroundColor: text.style === 'tiktok-bordered' ? 'rgba(0,0,0,0.6)' : 'transparent', padding: text.style === 'tiktok-bordered' ? '8px 16px' : '0', borderRadius: text.style === 'tiktok-bordered' ? '8px' : '0', WebkitTextStroke: text.style === 'tiktok-classic' ? '1px black' : 'none' }}
              >
                {text.text}
              </div>
            ))}
          </div>
          <div className="absolute bottom-4 inset-x-0 flex justify-center">
            <div className="bg-slate-900/80 backdrop-blur border border-slate-700 px-4 py-2 rounded-full flex items-center gap-4 shadow-xl">
              <span className="text-xs font-mono w-14 text-right text-slate-300">{formatTime(currentTime)}</span>
              <div className="flex items-center gap-2">
                <button onClick={() => setCurrentTime(0)} className="text-slate-300 hover:text-white transition-colors"><SkipBack className="w-4 h-4" /></button>
                <button onClick={togglePlay} className="w-10 h-10 bg-white text-slate-900 rounded-full flex items-center justify-center hover:scale-105 transition-transform">{isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-1" />}</button>
                <button onClick={() => setCurrentTime(totalDuration)} className="text-slate-300 hover:text-white transition-colors"><SkipForward className="w-4 h-4" /></button>
              </div>
              <span className="text-xs font-mono w-14 text-left text-slate-500">{formatTime(totalDuration)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* TIMELINE */}
      <div className="h-64 bg-slate-950 border-t border-slate-800 flex flex-col shrink-0 select-none">
        <div className="h-10 border-b border-slate-800 flex items-center px-4 bg-slate-900/50 justify-between">
          <div className="flex items-center gap-4 text-xs font-bold text-slate-400">
            <button onClick={deleteSelectedClip} className="hover:text-white flex items-center gap-1.5"><Trash2 className="w-3.5 h-3.5" /> Hapus Clip Terpilih</button>
          </div>
        </div>

        <div className="flex-1 overflow-x-auto overflow-y-auto relative p-4" style={{scrollbarWidth: 'thin'}}>
          <div className="h-6 relative mb-2 min-w-max" style={{ width: `${Math.max(totalDuration * 50, 1000)}px` }}>
             {Array.from({length: Math.ceil(totalDuration) + 1}).map((_, i) => (
               <div key={i} className="absolute top-0 text-[9px] text-slate-600 border-l border-slate-800 pl-1 h-full" style={{ left: `${(i/Math.max(totalDuration, 1))*100}%` }}>{i}s</div>
             ))}
          </div>

          {/* Text Track */}
          <div className="flex items-center gap-4 mb-2 min-w-max relative" style={{ width: `${Math.max(totalDuration * 50, 1000)}px` }}>
            <div className="w-16 shrink-0 flex items-center gap-2 text-xs font-bold text-slate-500 sticky left-0 bg-slate-950 z-10 p-1"><Type className="w-4 h-4 text-pink-500" /> Teks</div>
            <div className="flex-1 h-10 bg-slate-900 rounded-lg relative border border-slate-800/50">
              {texts.map(text => {
                const left = (text.startTime / Math.max(totalDuration, 1)) * 100;
                const width = ((text.endTime - text.startTime) / Math.max(totalDuration, 1)) * 100;
                return (
                  <div key={text.id} onClick={() => setSelectedTextId(text.id)} className={`absolute top-1 bottom-1 rounded-md px-2 text-[10px] font-bold text-white truncate flex items-center shadow border transition-colors cursor-pointer ${selectedTextId === text.id ? 'bg-pink-600 border-pink-400 z-10' : 'bg-pink-900/60 border-pink-800'}`} style={{ left: `${left}%`, width: `${width}%` }}>{text.text}</div>
                )
              })}
            </div>
          </div>

          {/* Media Track */}
          <div className="flex items-center gap-4 mb-2 min-w-max relative" style={{ width: `${Math.max(totalDuration * 50, 1000)}px` }}>
            <div className="w-16 shrink-0 flex items-center gap-2 text-xs font-bold text-slate-500 sticky left-0 bg-slate-950 z-10 p-1"><Video className="w-4 h-4 text-cyan-500" /> Utama</div>
            <div className="flex-1 h-16 bg-slate-900 rounded-lg relative border border-slate-800/50 flex">
               {clips.map((clip, index) => {
                 const width = (clip.duration / Math.max(totalDuration, 1)) * 100;
                 return (
                   <div key={clip.id} onClick={() => setSelectedClipId(clip.id)} className={`h-full border-r relative overflow-hidden group cursor-pointer ${selectedClipId === clip.id ? 'border-cyan-500 border-2' : 'border-slate-950'}`} style={{ width: `${width}%` }}>
                     <img src={clip.url} alt="" className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                     <span className="absolute bottom-1 left-1 bg-black/60 px-1 rounded text-[8px] text-white font-mono">{clip.duration}s</span>
                   </div>
                 )
               })}
            </div>
          </div>

          {/* PLAYHEAD */}
          <div className="absolute top-0 bottom-0 w-px bg-red-500 z-20 pointer-events-none" style={{ left: `calc(5rem + 1rem + ${(currentTime / Math.max(totalDuration, 1)) * 100}% - 4px)` }}>
            <div className="w-3 h-3 bg-red-500 rounded-sm absolute -top-1 -translate-x-[5px] flex items-center justify-center pointer-events-auto"><div className="w-0.5 h-1.5 bg-white/80 rounded-full" /></div>
          </div>
        </div>
      </div>
    </div>
  );
};
