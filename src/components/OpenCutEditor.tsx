import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft, Download, FileJson, Film, ImagePlus, Layers3, Pause, Play,
  Plus, Scissors, Trash2, Type, Volume2, VolumeX, ZoomIn, ZoomOut
} from 'lucide-react';

export type EditorTrack = 'video' | 'audio' | 'text';

export interface EditorClip {
  id: string;
  track: EditorTrack;
  name: string;
  src?: string;
  start: number;
  duration: number;
  sourceDuration?: number;
  offset: number;
  muted?: boolean;
  text?: string;
}

interface OpenCutEditorProps {
  onBack: () => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export const OpenCutEditor: React.FC<OpenCutEditorProps> = ({ onBack, showToast }) => {
  const [clips, setClips] = useState<EditorClip[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [zoom, setZoom] = useState(70);
  const [activeTool, setActiveTool] = useState<'media' | 'text' | 'layers'>('media');
  const [projectName, setProjectName] = useState('Neurona Project');
  const [exporting, setExporting] = useState(false);
  const [previewSrc, setPreviewSrc] = useState<string | undefined>();
  const [previewKind, setPreviewKind] = useState<'video' | 'image' | 'text'>('image');
  const [previewText, setPreviewText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const rafRef = useRef<number | null>(null);

  const duration = useMemo(() => {
    return Math.max(5, clips.reduce((end, clip) => Math.max(end, clip.start + clip.duration), 0));
  }, [clips]);

  const selected = clips.find((clip) => clip.id === selectedId) ?? null;

  useEffect(() => {
    if (currentTime > duration) setCurrentTime(duration);
  }, [currentTime, duration]);

  useEffect(() => {
    if (!playing) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      return;
    }
    let last = performance.now();
    const tick = (now: number) => {
      const delta = (now - last) / 1000;
      last = now;
      setCurrentTime((time) => {
        const next = time + delta;
        if (next >= duration) {
          setPlaying(false);
          return 0;
        }
        return next;
      });
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [playing, duration]);

  const activeClip = useMemo(() => {
    return [...clips]
      .filter((clip) => clip.track !== 'audio')
      .reverse()
      .find((clip) => currentTime >= clip.start && currentTime < clip.start + clip.duration);
  }, [clips, currentTime]);

  useEffect(() => {
    if (!activeClip) {
      setPreviewSrc(undefined);
      setPreviewText('');
      return;
    }
    setPreviewSrc(activeClip.src);
    setPreviewKind(activeClip.track === 'text' ? 'text' : activeClip.src?.match(/\.(mp4|webm|mov|m4v)(\?|$)/i) ? 'video' : 'image');
    setPreviewText(activeClip.text ?? '');
  }, [activeClip]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || previewKind !== 'video' || !playing) return;
    const offset = Math.max(0, currentTime - (activeClip?.start ?? 0) + (activeClip?.offset ?? 0));
    if (Math.abs(video.currentTime - offset) > 0.25) video.currentTime = offset;
    video.play().catch(() => undefined);
  }, [currentTime, playing, previewKind, activeClip]);

  const importFiles = (files: FileList | null) => {
    if (!files) return;
    let cursor = duration === 5 && clips.length === 0 ? 0 : duration;
    const next: EditorClip[] = [];
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('video/') && !file.type.startsWith('image/') && !file.type.startsWith('audio/')) return;
      const src = URL.createObjectURL(file);
      const isAudio = file.type.startsWith('audio/');
      const clip: EditorClip = {
        id: uid(),
        track: isAudio ? 'audio' : 'video',
        name: file.name,
        src,
        start: cursor,
        duration: isAudio ? 10 : 5,
        offset: 0,
        muted: false
      };
      next.push(clip);
      cursor += clip.duration;
    });
    if (!next.length) {
      showToast('File harus berupa video, gambar, atau audio.', 'error');
      return;
    }
    setClips((prev) => [...prev, ...next]);
    setSelectedId(next[0].id);
    showToast(`${next.length} media ditambahkan ke timeline.`, 'success');
  };

  const addText = () => {
    const clip: EditorClip = {
      id: uid(), track: 'text', name: 'Text Overlay', start: currentTime,
      duration: 3, offset: 0, text: 'Tulis narasi di sini'
    };
    setClips((prev) => [...prev, clip]);
    setSelectedId(clip.id);
    setActiveTool('text');
  };

  const updateSelected = (patch: Partial<EditorClip>) => {
    if (!selectedId) return;
    setClips((prev) => prev.map((clip) => clip.id === selectedId ? { ...clip, ...patch } : clip));
  };

  const splitSelected = () => {
    if (!selected) return;
    if (currentTime <= selected.start + 0.05 || currentTime >= selected.start + selected.duration - 0.05) {
      showToast('Playhead harus berada di dalam clip untuk melakukan split.', 'info');
      return;
    }
    const firstDuration = currentTime - selected.start;
    const second: EditorClip = {
      ...selected,
      id: uid(),
      name: `${selected.name} (2)`,
      start: currentTime,
      duration: selected.duration - firstDuration,
      offset: selected.offset + firstDuration
    };
    setClips((prev) => prev.flatMap((clip) => clip.id === selected.id
      ? [{ ...clip, duration: firstDuration }, second]
      : [clip]));
    setSelectedId(second.id);
  };

  const deleteSelected = () => {
    if (!selectedId) return;
    setClips((prev) => prev.filter((clip) => clip.id !== selectedId));
    setSelectedId(null);
  };

  const toggleMute = () => updateSelected({ muted: !selected?.muted });

  const exportProject = () => {
    const payload = { version: 1, engine: 'neurona-opencut', projectName, duration, clips: clips.map(({ src, ...clip }) => clip) };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectName.replace(/[^a-z0-9-_]+/gi, '-').toLowerCase()}.opencut.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Project OpenCut berhasil diekspor.', 'success');
  };

  const exportPreview = async () => {
    if (!activeClip?.src || previewKind === 'text') {
      showToast('Tambahkan media dan pilih clip terlebih dahulu.', 'info');
      return;
    }
    setExporting(true);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 720;
      canvas.height = 1280;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas tidak tersedia');
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      if (previewKind === 'image') {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = activeClip.src;
        await new Promise<void>((resolve, reject) => { img.onload = () => resolve(); img.onerror = () => reject(new Error('Gagal memuat gambar')); });
        const scale = Math.max(canvas.width / img.width, canvas.height / img.height);
        const w = img.width * scale, h = img.height * scale;
        ctx.drawImage(img, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
      } else {
        showToast('Export preview video langsung memerlukan renderer media. Gunakan Export Project untuk pipeline render.', 'info');
        return;
      }
      const stream = canvas.captureStream(30);
      const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
      const chunks: Blob[] = [];
      recorder.ondataavailable = (event) => event.data.size && chunks.push(event.data);
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${projectName.replace(/[^a-z0-9-_]+/gi, '-').toLowerCase()}-preview.webm`;
        a.click();
        URL.revokeObjectURL(url);
        showToast('Preview WebM berhasil diekspor.', 'success');
      };
      recorder.start();
      setTimeout(() => recorder.stop(), Math.max(1000, Math.min(activeClip.duration * 1000, 5000)));
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Export gagal.', 'error');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="flex h-full w-full flex-col bg-[#0b0d10] text-slate-200">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-white/10 bg-[#101318] px-3 md:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <button onClick={onBack} className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white"><ArrowLeft className="h-5 w-5" /></button>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-pink-500"><Scissors className="h-4 w-4 text-white" /></div>
          <div className="min-w-0"><input value={projectName} onChange={(e) => setProjectName(e.target.value)} className="w-44 bg-transparent text-sm font-bold outline-none md:w-64" /><div className="text-[9px] uppercase tracking-widest text-cyan-400">OpenCut-style local timeline engine</div></div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportProject} className="hidden rounded-lg border border-white/10 px-3 py-2 text-xs font-bold hover:bg-white/5 md:flex items-center gap-2"><FileJson className="h-4 w-4" /> Project</button>
          <button onClick={exportPreview} disabled={exporting} className="rounded-lg bg-gradient-to-r from-purple-600 to-pink-500 px-3 py-2 text-xs font-bold text-white hover:opacity-90 disabled:opacity-50"><Download className="mr-1 inline h-4 w-4" /> Preview</button>
        </div>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-[72px_260px_minmax(0,1fr)]">
        <aside className="hidden border-r border-white/10 bg-[#0f1217] md:flex md:flex-col md:items-center md:gap-2 md:py-3">
          {([['media', ImagePlus, 'Media'], ['text', Type, 'Text'], ['layers', Layers3, 'Layers']] as const).map(([tool, Icon, label]) => (
            <button key={tool} onClick={() => setActiveTool(tool)} className={`w-14 rounded-xl px-1 py-2 text-[10px] ${activeTool === tool ? 'bg-white/10 text-cyan-300' : 'text-slate-500 hover:text-white'}`}><Icon className="mx-auto mb-1 h-5 w-5" />{label}</button>
          ))}
        </aside>

        <aside className="hidden min-h-0 overflow-y-auto border-r border-white/10 bg-[#101318] p-4 md:block">
          {activeTool === 'media' && <>
            <h3 className="mb-3 text-xs font-black uppercase tracking-widest text-slate-400">Media</h3>
            <button onClick={() => fileInputRef.current?.click()} className="mb-4 flex w-full items-center justify-center gap-2 rounded-lg bg-white/5 py-3 text-xs font-bold hover:bg-white/10"><Plus className="h-4 w-4" /> Import Media</button>
            <input ref={fileInputRef} type="file" accept="video/*,image/*,audio/*" multiple className="hidden" onChange={(e) => importFiles(e.target.files)} />
            <p className="text-[10px] leading-relaxed text-slate-500">Media tetap lokal di browser. Tidak dikirim ke server hanya untuk proses editing.</p>
          </>}
          {activeTool === 'text' && <>
            <h3 className="mb-3 text-xs font-black uppercase tracking-widest text-slate-400">Text & Captions</h3>
            <button onClick={addText} className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-500 py-3 text-xs font-bold"><Type className="h-4 w-4" /> Tambah Text</button>
          </>}
          {activeTool === 'layers' && <>
            <h3 className="mb-3 text-xs font-black uppercase tracking-widest text-slate-400">Inspector</h3>
            {selected ? <div className="space-y-3 text-xs">
              <label className="block text-slate-400">Nama<input value={selected.name} onChange={(e) => updateSelected({ name: e.target.value })} className="mt-1 w-full rounded border border-white/10 bg-black/20 p-2 text-white" /></label>
              <label className="block text-slate-400">Start<input type="number" min="0" step="0.1" value={selected.start} onChange={(e) => updateSelected({ start: Math.max(0, Number(e.target.value)) })} className="mt-1 w-full rounded border border-white/10 bg-black/20 p-2 text-white" /></label>
              <label className="block text-slate-400">Duration<input type="number" min="0.1" step="0.1" value={selected.duration} onChange={(e) => updateSelected({ duration: Math.max(0.1, Number(e.target.value)) })} className="mt-1 w-full rounded border border-white/10 bg-black/20 p-2 text-white" /></label>
              {selected.track === 'text' && <label className="block text-slate-400">Teks<textarea value={selected.text ?? ''} onChange={(e) => updateSelected({ text: e.target.value })} className="mt-1 h-24 w-full rounded border border-white/10 bg-black/20 p-2 text-white" /></label>}
            </div> : <p className="text-[11px] text-slate-500">Pilih clip pada timeline.</p>}
          </>}
        </aside>

        <main className="flex min-h-0 flex-col bg-[#080a0d]">
          <section className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden p-4 md:p-8">
            <div className="relative flex h-full max-h-[65vh] aspect-[9/16] items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-black shadow-2xl">
              {previewKind === 'video' && previewSrc && <video ref={videoRef} src={previewSrc} className="h-full w-full object-contain" muted={activeClip?.muted} playsInline />}
              {previewKind === 'image' && previewSrc && <img src={previewSrc} alt="Preview" className="h-full w-full object-contain" />}
              {previewKind === 'text' && <div className="px-8 text-center text-3xl font-black text-white drop-shadow-lg">{previewText}</div>}
              {!previewSrc && previewKind !== 'text' && <div className="text-center text-slate-600"><Film className="mx-auto mb-2 h-12 w-12" /><p className="text-xs">Import media untuk mulai</p></div>}
              {activeClip?.track === 'text' && activeClip.text && <div className="absolute inset-x-5 bottom-20 rounded-lg bg-black/60 p-3 text-center text-xl font-black text-white">{activeClip.text}</div>}
            </div>
          </section>

          <div className="flex h-12 shrink-0 items-center gap-3 border-y border-white/10 bg-[#111419] px-3">
            <button onClick={() => setCurrentTime(0)} className="text-slate-400 hover:text-white">|◀</button>
            <button onClick={() => setPlaying((value) => !value)} className="rounded-full bg-white p-2 text-black hover:scale-105">{playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}</button>
            <button onClick={() => setCurrentTime(duration)} className="text-slate-400 hover:text-white">▶|</button>
            <span className="w-24 font-mono text-[11px] text-slate-400">{currentTime.toFixed(1)} / {duration.toFixed(1)}s</span>
            <input aria-label="Timeline seek" type="range" min="0" max={duration} step="0.01" value={currentTime} onChange={(e) => setCurrentTime(Number(e.target.value))} className="flex-1 accent-cyan-400" />
          </div>

          <section className="h-56 shrink-0 overflow-hidden border-t border-white/10 bg-[#0e1115]">
            <div className="flex h-9 items-center justify-between border-b border-white/10 px-3">
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500"><span>TIMELINE</span><span className="text-cyan-400">{clips.length} clips</span></div>
              <div className="flex items-center gap-1"><button onClick={() => setZoom((z) => clamp(z - 10, 30, 160))} className="rounded p-1 hover:bg-white/5"><ZoomOut className="h-3.5 w-3.5" /></button><span className="w-10 text-center text-[10px] text-slate-500">{zoom}%</span><button onClick={() => setZoom((z) => clamp(z + 10, 30, 160))} className="rounded p-1 hover:bg-white/5"><ZoomIn className="h-3.5 w-3.5" /></button></div>
            </div>
            <div className="relative h-[calc(100%-36px)] overflow-x-auto overflow-y-auto p-3">
              <div className="relative min-w-[900px]" style={{ width: `${duration * zoom}px` }}>
                <div className="mb-2 flex h-5 text-[9px] text-slate-600">{Array.from({ length: Math.ceil(duration) + 1 }, (_, i) => <span key={i} style={{ width: `${zoom}px` }}>{i}s</span>)}</div>
                {(['video', 'audio', 'text'] as const).map((track) => (
                  <div key={track} className="relative mb-2 h-12 rounded bg-white/[0.025]">
                    <span className="absolute left-2 top-1 z-10 text-[8px] font-bold uppercase text-slate-600">{track}</span>
                    {clips.filter((clip) => clip.track === track).map((clip) => (
                      <button key={clip.id} onClick={() => { setSelectedId(clip.id); setActiveTool('layers'); }} className={`absolute top-1 h-10 overflow-hidden rounded border px-2 text-left text-[9px] font-bold transition ${selectedId === clip.id ? 'border-cyan-400 bg-cyan-400/20 text-cyan-100' : 'border-white/10 bg-white/10 text-slate-300 hover:bg-white/15'}`} style={{ left: `${clip.start * zoom}px`, width: `${Math.max(36, clip.duration * zoom)}px` }}>
                        <span className="block truncate">{clip.name}</span><span className="text-[8px] text-slate-500">{clip.duration.toFixed(1)}s</span>
                      </button>
                    ))}
                  </div>
                ))}
                <div className="pointer-events-none absolute bottom-0 top-0 w-px bg-red-400" style={{ left: `${currentTime * zoom}px` }} />
              </div>
            </div>
          </section>

          <div className="flex h-12 shrink-0 items-center justify-between border-t border-white/10 bg-[#101318] px-3">
            <div className="flex items-center gap-2">
              <button onClick={splitSelected} disabled={!selected} className="rounded-lg border border-white/10 px-3 py-2 text-[10px] font-bold hover:bg-white/5 disabled:opacity-30"><Scissors className="mr-1 inline h-3.5 w-3.5" />Split</button>
              <button onClick={toggleMute} disabled={!selected} className="rounded-lg border border-white/10 p-2 hover:bg-white/5 disabled:opacity-30">{selected?.muted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}</button>
              <button onClick={deleteSelected} disabled={!selected} className="rounded-lg border border-rose-500/20 p-2 text-rose-400 hover:bg-rose-500/10 disabled:opacity-30"><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
            <span className="hidden text-[9px] text-slate-600 md:block">Non-destructive timeline • local-first media • project JSON</span>
          </div>
        </main>
      </div>
    </div>
  );
};
