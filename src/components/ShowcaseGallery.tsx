import React, { useState, useEffect, useRef } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { ShowcaseItem, StoryboardSceneShowcase } from '../types';
import { parseVideoUrl } from '../utils/embedUtils';
import { 
  Play, Pause, X, Layers, ChevronLeft, ChevronRight, ExternalLink, 
  Video, Sparkles, Youtube, Film, Eye, Grid, Smartphone 
} from 'lucide-react';

export const ShowcaseGallery: React.FC = () => {
  const [showcases, setShowcases] = useState<ShowcaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'video' | 'storyboard'>('all');
  
  // Modals
  const [activeVideo, setActiveVideo] = useState<ShowcaseItem | null>(null);
  const [activeStoryboard, setActiveStoryboard] = useState<{ item: ShowcaseItem; selectedSceneIndex: number } | null>(null);

  // Smartphone Carousel State
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(true);
  const [isPausedByUser, setIsPausedByUser] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);
  const resumeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const q = query(
      collection(db, 'showcases'),
      where('published', '==', true)
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const list: ShowcaseItem[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as ShowcaseItem);
      });
      list.sort((a, b) => {
        if ((a.order ?? 0) !== (b.order ?? 0)) return (a.order ?? 0) - (b.order ?? 0);
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      });
      setShowcases(list);
      setLoading(false);
    }, (err) => {
      console.warn("Showcase gallery query error:", err);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const videoItems = showcases.filter(item => item.type !== 'storyboard');
  const storyboardItems = showcases.filter(item => item.type === 'storyboard');

  const filteredItems = showcases.filter(item => {
    if (activeFilter === 'video') return item.type !== 'storyboard';
    if (activeFilter === 'storyboard') return item.type === 'storyboard';
    return true;
  });

  // Carousel Navigation Helpers
  const scrollToIndex = (index: number) => {
    if (!carouselRef.current) return;
    const container = carouselRef.current;
    const cards = container.querySelectorAll<HTMLElement>('[data-carousel-card]');
    if (cards[index]) {
      const card = cards[index];
      const left = card.offsetLeft - (container.clientWidth - card.clientWidth) / 2;
      container.scrollTo({ left, behavior: 'smooth' });
      setCarouselIndex(index);
    }
  };

  const handleNext = () => {
    if (videoItems.length <= 1) return;
    const next = (carouselIndex + 1) % videoItems.length;
    scrollToIndex(next);
  };

  const handlePrev = () => {
    if (videoItems.length <= 1) return;
    const prev = (carouselIndex - 1 + videoItems.length) % videoItems.length;
    scrollToIndex(prev);
  };

  // Sync index on manual scroll / touch swipe
  const handleScroll = () => {
    if (!carouselRef.current) return;
    const container = carouselRef.current;
    const cards = container.querySelectorAll<HTMLElement>('[data-carousel-card]');
    const containerCenter = container.scrollLeft + container.clientWidth / 2;
    
    let closestIndex = 0;
    let minDistance = Infinity;

    cards.forEach((card, index) => {
      const cardCenter = card.offsetLeft + card.clientWidth / 2;
      const dist = Math.abs(cardCenter - containerCenter);
      if (dist < minDistance) {
        minDistance = dist;
        closestIndex = index;
      }
    });

    if (closestIndex !== carouselIndex) {
      setCarouselIndex(closestIndex);
    }
  };

  // Smartphone Carousel Auto-slide Timer (Slides sideways automatically)
  useEffect(() => {
    if (!isAutoPlay || isPausedByUser || activeVideo || videoItems.length <= 1) return;

    const timer = setInterval(() => {
      setCarouselIndex((prev) => {
        const next = (prev + 1) % videoItems.length;
        if (carouselRef.current) {
          const container = carouselRef.current;
          const cards = container.querySelectorAll<HTMLElement>('[data-carousel-card]');
          if (cards[next]) {
            const card = cards[next];
            const left = card.offsetLeft - (container.clientWidth - card.clientWidth) / 2;
            container.scrollTo({ left, behavior: 'smooth' });
          }
        }
        return next;
      });
    }, 3800);

    return () => clearInterval(timer);
  }, [isAutoPlay, isPausedByUser, activeVideo, videoItems.length]);

  const handleTouchStart = () => {
    if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
    setIsPausedByUser(true);
  };

  const handleTouchEnd = () => {
    if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
    resumeTimeoutRef.current = setTimeout(() => {
      setIsPausedByUser(false);
    }, 3500);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24 bg-slate-950">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-slate-800 border-t-cyan-400 rounded-full animate-spin"></div>
          <p className="text-slate-400 font-medium text-sm tracking-wider uppercase">Memuat Galeri Karya...</p>
        </div>
      </div>
    );
  }

  if (showcases.length === 0) {
    return null;
  }

  // --- RENDER FUNCTIONS FOR CARDS ---
  const renderStoryboardCard = (item: ShowcaseItem) => {
    const scenes = item.storyboardScenes || [];
    const coverImage = scenes[0]?.imageUrl || item.thumbnailUrl || '';

    return (
      <div 
        key={item.id}
        className="group relative bg-slate-900/80 rounded-2xl overflow-hidden border border-purple-500/20 hover:border-purple-500/50 transition-all duration-300 shadow-xl hover:shadow-purple-500/10 flex flex-col"
      >
        {/* STORYBOARD COVER & SCENE STRIP */}
        <div 
          className="relative bg-slate-950 aspect-[4/3] overflow-hidden cursor-pointer"
          onClick={() => setActiveStoryboard({ item, selectedSceneIndex: 0 })}
        >
          {coverImage ? (
            <img 
              src={coverImage} 
              alt={item.title} 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                const parent = e.currentTarget.parentElement;
                if (parent && !parent.querySelector('.gallery-broken-fallback')) {
                  const fallback = document.createElement('div');
                  fallback.className = 'gallery-broken-fallback w-full h-full flex flex-col items-center justify-center bg-slate-900 text-purple-400 p-4 text-center';
                  fallback.innerHTML = '<div class="w-12 h-12 rounded-2xl bg-purple-950/80 border border-purple-500/30 flex items-center justify-center mb-2"><span class="text-xl">🎬</span></div><span class="text-xs font-semibold text-slate-300">Galeri Storyboard</span>';
                  parent.appendChild(fallback);
                }
              }}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-600">
              <Layers className="w-12 h-12 mb-2 text-purple-400/50" />
              <span className="text-xs font-semibold">Galeri Storyboard</span>
            </div>
          )}

          {/* Dark gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent"></div>

          {/* STORYBOARD BADGES */}
          <div className="absolute top-3 left-3 flex items-center gap-2">
            <span className="px-2.5 py-1 bg-purple-950/80 backdrop-blur-md text-purple-300 text-[10px] font-black uppercase tracking-wider rounded-full border border-purple-500/30 flex items-center gap-1 shadow-md">
              <Layers className="w-3 h-3 text-purple-400" /> Storyboard • {scenes.length} Scenes
            </span>
          </div>

          <div className="absolute top-3 right-3">
            <span className="px-2.5 py-1 bg-black/60 backdrop-blur-md text-slate-300 text-[10px] font-bold rounded-full border border-white/10">
              {item.category}
            </span>
          </div>

          {/* OVERLAY BUTTON */}
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
            <span className="text-xs font-bold text-white/90 drop-shadow flex items-center gap-1.5 bg-black/60 px-3 py-1.5 rounded-lg backdrop-blur-md border border-white/10">
              <Grid className="w-3.5 h-3.5 text-purple-400" /> Scene 1 s/d {scenes.length}
            </span>
            <button className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-lg shadow-lg flex items-center gap-1 transition-all">
              <Eye className="w-3.5 h-3.5" /> Lihat Gallery
            </button>
          </div>
        </div>

        {/* SCENE THUMBNAIL STRIP */}
        {scenes.length > 0 && (
          <div className="p-3 bg-slate-950/80 border-t border-slate-800/80">
            <p className="text-[11px] font-bold text-slate-400 mb-2 flex items-center justify-between">
              <span>Preview Scene Flow:</span>
              <span className="text-purple-400 text-[10px]">{scenes.length} Visual Scenes</span>
            </p>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              {scenes.map((scene, scIdx) => (
                <div 
                  key={scIdx}
                  onClick={() => setActiveStoryboard({ item, selectedSceneIndex: scIdx })}
                  className="relative w-16 h-12 rounded-lg bg-slate-800 shrink-0 overflow-hidden border border-slate-700/80 hover:border-purple-400 cursor-pointer group/thumb transition-all"
                >
                  {scene.imageUrl ? (
                    <img 
                      src={scene.imageUrl} 
                      alt={`Scene ${scene.sceneNumber}`} 
                      className="w-full h-full object-cover group-hover/thumb:scale-110 transition-transform" 
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        const parent = e.currentTarget.parentElement;
                        if (parent && !parent.querySelector('.strip-fallback')) {
                          const fb = document.createElement('div');
                          fb.className = 'strip-fallback w-full h-full flex items-center justify-center text-[10px] text-purple-400 bg-slate-900';
                          fb.innerHTML = `<span>#${scene.sceneNumber}</span>`;
                          parent.appendChild(fb);
                        }
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-500">#{scene.sceneNumber}</div>
                  )}
                  <div className="absolute bottom-0 inset-x-0 bg-black/70 text-[9px] text-center font-bold text-purple-300 py-0.5">
                    S{scene.sceneNumber}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CARD INFO */}
        <div className="p-5 flex-1 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-white mb-1.5 group-hover:text-purple-300 transition-colors">{item.title}</h3>
            <p className="text-slate-400 text-xs line-clamp-2 leading-relaxed">{item.description}</p>
          </div>

          <button 
            onClick={() => setActiveStoryboard({ item, selectedSceneIndex: 0 })}
            className="mt-4 w-full py-2 bg-slate-800 hover:bg-purple-900/40 text-purple-300 hover:text-white border border-purple-500/20 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5"
          >
            Buka Full Storyboard ({scenes.length} Scenes) &rarr;
          </button>
        </div>
      </div>
    );
  };

  const renderVideoCard = (item: ShowcaseItem, isCarousel = false) => {
    const parsedVideo = item.videoUrl ? parseVideoUrl(item.videoUrl) : null;

    if (isCarousel) {
      // --- SMARTPHONE CAROUSEL CARD ---
      return (
        <div 
          data-carousel-card
          key={item.id} 
          className="w-[82vw] sm:w-[320px] max-w-[340px] shrink-0 snap-center rounded-3xl overflow-hidden bg-slate-900/95 border border-cyan-500/30 hover:border-cyan-400 shadow-2xl transition-all duration-300 flex flex-col group relative select-none"
        >
          {/* VIDEO THUMBNAIL AREA (9:16 vertical smartphone format) */}
          <div 
            className="aspect-[9/16] bg-slate-950 relative overflow-hidden cursor-pointer" 
            onClick={() => setActiveVideo(item)}
          >
            {item.thumbnailUrl ? (
              <img 
                src={item.thumbnailUrl} 
                alt={item.title} 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-90 group-hover:opacity-100" 
              />
            ) : parsedVideo?.type === 'direct' ? (
              <video 
                src={item.videoUrl} 
                className="w-full h-full object-cover opacity-80" 
                muted 
                loop 
                playsInline 
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-b from-slate-900 to-slate-950 flex items-center justify-center">
                <Film className="w-12 h-12 text-slate-700" />
              </div>
            )}

            {/* Gradient Scrim */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-black/20 to-black/40"></div>

            {/* Central Play Overlay Button */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative flex items-center justify-center">
                <div className="absolute w-20 h-20 bg-cyan-500/20 rounded-full animate-ping pointer-events-none"></div>
                <div className="w-16 h-16 bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-full flex items-center justify-center text-white shadow-xl shadow-cyan-500/40 border border-white/30 transform group-hover:scale-110 transition-transform">
                  <Play className="w-7 h-7 text-white ml-1 fill-white" />
                </div>
              </div>
            </div>

            {/* SOURCE BADGE */}
            <div className="absolute top-3 left-3 flex items-center gap-1.5">
              {parsedVideo?.type === 'tiktok' ? (
                <span className="px-2.5 py-1 bg-black/80 backdrop-blur-md text-cyan-300 text-[10px] font-black tracking-wider rounded-full border border-cyan-500/30 flex items-center gap-1 shadow-md">
                  <Video className="w-3 h-3 text-cyan-400" /> TikTok Showcase
                </span>
              ) : parsedVideo?.type === 'youtube' ? (
                <span className="px-2.5 py-1 bg-rose-950/80 backdrop-blur-md text-rose-300 text-[10px] font-black tracking-wider rounded-full border border-rose-500/30 flex items-center gap-1 shadow-md">
                  <Youtube className="w-3 h-3 text-rose-500" /> YouTube Video
                </span>
              ) : (
                <span className="px-2.5 py-1 bg-slate-900/80 backdrop-blur-md text-cyan-300 text-[10px] font-bold rounded-full border border-slate-700">
                  {item.category}
                </span>
              )}
            </div>

            {/* CATEGORY BADGE RIGHT */}
            <div className="absolute top-3 right-3">
              <span className="px-2.5 py-1 bg-black/70 backdrop-blur-md text-slate-200 text-[10px] font-bold rounded-full border border-white/20">
                {item.category}
              </span>
            </div>

            {/* BOTTOM INFO OVERLAY ON CARD */}
            <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-slate-950 via-slate-950/90 to-transparent pt-8 flex flex-col justify-end">
              <h3 className="text-base font-bold text-white mb-1 group-hover:text-cyan-300 transition-colors line-clamp-1">
                {item.title}
              </h3>
              {item.description && (
                <p className="text-slate-300 text-xs line-clamp-2 leading-relaxed mb-3">
                  {item.description}
                </p>
              )}
              <button 
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveVideo(item);
                }}
                className="w-full py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-cyan-500/20 flex items-center justify-center gap-2"
              >
                <Play className="w-3.5 h-3.5 fill-white" /> Putar Video AI
              </button>
            </div>
          </div>
        </div>
      );
    }

    // --- STANDARD DESKTOP GRID CARD ---
    return (
      <div 
        key={item.id} 
        className="group relative bg-slate-900/80 rounded-2xl overflow-hidden border border-slate-800 hover:border-cyan-500/40 transition-all duration-300 shadow-xl hover:shadow-cyan-500/10 flex flex-col"
      >
        {/* VIDEO THUMBNAIL AREA */}
        <div 
          className="aspect-[9/16] bg-slate-950 relative overflow-hidden cursor-pointer" 
          onClick={() => setActiveVideo(item)}
        >
          {item.thumbnailUrl ? (
            <img 
              src={item.thumbnailUrl} 
              alt={item.title} 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-85 group-hover:opacity-100" 
            />
          ) : parsedVideo?.type === 'direct' ? (
            <video 
              src={item.videoUrl} 
              className="w-full h-full object-cover opacity-70 group-hover:opacity-90 transition-opacity" 
              muted 
              loop 
              playsInline 
              onMouseEnter={(e) => e.currentTarget.play()} 
              onMouseLeave={(e) => e.currentTarget.pause()} 
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-b from-slate-900 to-slate-950 flex items-center justify-center">
              <Film className="w-12 h-12 text-slate-700" />
            </div>
          )}

          {/* Play Overlay */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/10 transition-colors">
            <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30 transform group-hover:scale-110 transition-all shadow-2xl shadow-cyan-500/20">
              <Play className="w-7 h-7 text-white ml-1" fill="currentColor" />
            </div>
          </div>

          {/* SOURCE BADGE */}
          <div className="absolute top-3 left-3 flex items-center gap-1.5">
            {parsedVideo?.type === 'tiktok' ? (
              <span className="px-2.5 py-1 bg-black/80 backdrop-blur-md text-cyan-300 text-[10px] font-black tracking-wider rounded-full border border-cyan-500/30 flex items-center gap-1 shadow-md">
                <Video className="w-3 h-3 text-cyan-400" /> TikTok Showcase
              </span>
            ) : parsedVideo?.type === 'youtube' ? (
              <span className="px-2.5 py-1 bg-rose-950/80 backdrop-blur-md text-rose-300 text-[10px] font-black tracking-wider rounded-full border border-rose-500/30 flex items-center gap-1 shadow-md">
                <Youtube className="w-3 h-3 text-rose-500" /> YouTube Video
              </span>
            ) : (
              <span className="px-2.5 py-1 bg-slate-900/80 backdrop-blur-md text-cyan-300 text-[10px] font-bold rounded-full border border-slate-700">
                {item.category}
              </span>
            )}
          </div>

          {/* CATEGORY BADGE RIGHT */}
          <div className="absolute top-3 right-3">
            <span className="px-2.5 py-1 bg-black/60 backdrop-blur-md text-slate-300 text-[10px] font-bold rounded-full border border-white/10">
              {item.category}
            </span>
          </div>
        </div>

        {/* CONTENT INFO */}
        <div className="p-5 flex-1 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-white mb-1.5 group-hover:text-cyan-400 transition-colors">{item.title}</h3>
            <p className="text-slate-400 text-xs line-clamp-2 leading-relaxed">{item.description}</p>
          </div>

          <button 
            onClick={() => setActiveVideo(item)}
            className="mt-4 w-full py-2 bg-slate-800 hover:bg-cyan-950/40 text-cyan-300 hover:text-white border border-cyan-500/20 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5"
          >
            Putar Video <Play className="w-3 h-3" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <section className="py-24 bg-slate-950 relative overflow-hidden text-white" id="showcase">
      {/* Ambient Lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-full max-w-5xl h-[600px] bg-gradient-to-r from-cyan-600/10 via-blue-600/10 to-purple-600/10 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* SECTION HEADER */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-950/60 border border-cyan-500/20 text-cyan-400 text-xs font-bold uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> Hasil Generasi AI Terdepan
          </div>
          <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-4">
            Showcase <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400">Karya & Storyboard</span>
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto text-base md:text-lg">
            Jelajahi video iklan viral dan galeri storyboard AI multi-scene yang dibuat oleh para creator Neurona.
          </p>

          {/* FILTER TABS */}
          <div className="flex justify-center items-center gap-2 mt-8">
            <div className="p-1 bg-slate-900 border border-slate-800 rounded-xl inline-flex gap-1">
              <button
                onClick={() => setActiveFilter('all')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  activeFilter === 'all' 
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Semua Karya ({showcases.length})
              </button>
              <button
                onClick={() => setActiveFilter('video')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeFilter === 'video' 
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Video className="w-3.5 h-3.5" /> Video Showcase ({videoItems.length})
              </button>
              <button
                onClick={() => setActiveFilter('storyboard')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeFilter === 'storyboard' 
                    ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-md shadow-purple-500/20' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" /> Galeri Storyboard ({storyboardItems.length})
              </button>
            </div>
          </div>
        </div>

        {/* ========================================================== */}
        {/* MOBILE SMARTPHONE VIEW (< md screens): AUTOMATIC CAROUSEL */}
        {/* ========================================================== */}
        <div className="block md:hidden">
          {/* 1. When Filter is 'all' or 'video': Show Video Carousel if multiple videos */}
          {activeFilter !== 'storyboard' && videoItems.length > 0 && (
            <div className="mb-10">
              {videoItems.length > 1 ? (
                <>
                  {/* Smartphone Carousel Header & Control Bar */}
                  <div className="flex items-center justify-between mb-3 px-1">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                        <Smartphone className="w-4 h-4" />
                      </div>
                      <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                        Video Showcase AI
                        <span className="px-1.5 py-0.5 bg-cyan-950 text-cyan-300 text-[10px] font-mono font-bold rounded-full border border-cyan-500/30">
                          {videoItems.length}
                        </span>
                      </h3>
                    </div>

                    {/* Auto-play toggle & manual navigation buttons */}
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setIsAutoPlay(!isAutoPlay)}
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-all flex items-center gap-1 ${
                          isAutoPlay && !isPausedByUser
                            ? 'bg-cyan-950/80 text-cyan-300 border-cyan-500/30 shadow-xs'
                            : 'bg-slate-800/80 text-slate-400 border-slate-700'
                        }`}
                        title={isAutoPlay ? 'Jeda otomatis bergerak' : 'Mulai bergerak otomatis'}
                      >
                        {isAutoPlay && !isPausedByUser ? (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>
                            <span>Auto-slide</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-2.5 h-2.5 fill-current" />
                            <span>Jeda</span>
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={handlePrev}
                        className="w-7 h-7 bg-slate-800 hover:bg-slate-700 text-white rounded-lg flex items-center justify-center border border-slate-700 transition-colors"
                        aria-label="Sebelumnya"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={handleNext}
                        className="w-7 h-7 bg-slate-800 hover:bg-slate-700 text-white rounded-lg flex items-center justify-center border border-slate-700 transition-colors"
                        aria-label="Selanjutnya"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Horizontal Auto-moving Carousel Container */}
                  <div 
                    ref={carouselRef}
                    onScroll={handleScroll}
                    onTouchStart={handleTouchStart}
                    onTouchEnd={handleTouchEnd}
                    onMouseEnter={() => setIsPausedByUser(true)}
                    onMouseLeave={() => setIsPausedByUser(false)}
                    className="flex gap-4 overflow-x-auto pb-4 pt-1 px-1 snap-x snap-mandatory scroll-smooth touch-pan-x [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                  >
                    {videoItems.map((item) => renderVideoCard(item, true))}
                  </div>

                  {/* Dot pagination & index indicators */}
                  <div className="flex items-center justify-between px-2 pt-2">
                    <div className="flex items-center gap-1.5">
                      {videoItems.map((_, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => scrollToIndex(idx)}
                          aria-label={`Lihat video ke ${idx + 1}`}
                          className={`h-2 rounded-full transition-all duration-300 ${
                            carouselIndex === idx 
                              ? 'w-6 bg-gradient-to-r from-cyan-400 to-blue-500 shadow-sm shadow-cyan-500/50' 
                              : 'w-2 bg-slate-700 hover:bg-slate-600'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-[10px] text-slate-500 font-medium">
                      {carouselIndex + 1} dari {videoItems.length} • Geser kartu
                    </span>
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  {renderVideoCard(videoItems[0], false)}
                </div>
              )}
            </div>
          )}

          {/* 2. When Filter is 'all' or 'storyboard': Show Storyboard cards */}
          {activeFilter !== 'video' && storyboardItems.length > 0 && (
            <div className="space-y-6">
              {activeFilter === 'all' && (
                <div className="flex items-center gap-2 pt-4 border-t border-slate-800/80 mb-4 px-1">
                  <div className="w-7 h-7 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
                    <Layers className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                    Galeri Storyboard Scenes
                    <span className="px-1.5 py-0.5 bg-purple-950 text-purple-300 text-[10px] font-mono font-bold rounded-full border border-purple-500/30">
                      {storyboardItems.length}
                    </span>
                  </h3>
                </div>
              )}
              {storyboardItems.map(item => renderStoryboardCard(item))}
            </div>
          )}
        </div>

        {/* ========================================================== */}
        {/* DESKTOP VIEW (>= md screens): CLEAN MULTI-COLUMN GRID      */}
        {/* ========================================================== */}
        <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredItems.map((item) => {
            if (item.type === 'storyboard') {
              return renderStoryboardCard(item);
            }
            return renderVideoCard(item, false);
          })}
        </div>
      </div>

      {/* --- MODAL 1: FULLSCREEN VIDEO PLAYER MODAL --- */}
      {activeVideo && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 sm:p-6 animate-fade-in">
          <button 
            onClick={() => setActiveVideo(null)}
            className="absolute top-6 right-6 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors border border-white/20 z-50 shadow-xl"
          >
            <X className="w-6 h-6" />
          </button>
          
          <div className="w-full max-w-2xl mx-auto bg-black rounded-2xl overflow-hidden shadow-2xl relative border border-slate-800 flex flex-col max-h-[90vh]">
            <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">{activeVideo.title}</h3>
                <p className="text-xs text-cyan-400 font-medium">{activeVideo.category}</p>
              </div>
              {activeVideo.videoUrl && (
                <a 
                  href={activeVideo.videoUrl} 
                  target="_blank" 
                  rel="noreferrer"
                  className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-lg flex items-center gap-1 border border-slate-700"
                >
                  Buka Link <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>

            <div className="flex-1 bg-black flex flex-col items-center justify-center p-2 min-h-[360px] max-h-[75vh] relative">
              {(() => {
                const parsed = activeVideo.videoUrl ? parseVideoUrl(activeVideo.videoUrl) : null;
                
                if (parsed?.type === 'youtube' && parsed.embedUrl) {
                  return (
                    <iframe
                      src={parsed.embedUrl}
                      title={activeVideo.title}
                      className="w-full aspect-video max-h-[70vh] rounded-xl border border-slate-800 shadow-2xl"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  );
                }

                if (parsed?.type === 'tiktok') {
                  if (parsed.videoId) {
                    return (
                      <iframe
                        src={`https://www.tiktok.com/embed/v2/${parsed.videoId}`}
                        title={activeVideo.title}
                        className="w-full sm:w-[325px] aspect-[9/16] max-h-[70vh] rounded-xl border border-slate-800 shadow-2xl"
                        allowFullScreen
                      />
                    );
                  }
                  
                  // Shortlink fallback option
                  return (
                    <div className="flex flex-col items-center justify-center text-center p-8 bg-slate-900 rounded-2xl border border-slate-800 max-w-md">
                      <div className="w-16 h-16 rounded-2xl bg-cyan-950/80 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-4 shadow-lg">
                        <Video className="w-8 h-8" />
                      </div>
                      <h4 className="text-base font-bold text-white mb-2">{activeVideo.title}</h4>
                      <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                        Video TikTok ini menggunakan tautan pendek. Silakan klik tombol di bawah untuk menyaksikan video secara langsung di aplikasi/web TikTok.
                      </p>
                      <a
                        href={activeVideo.videoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-cyan-500/25 flex items-center gap-2 transition-all"
                      >
                        <span>Putar di TikTok</span>
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  );
                }

                if (activeVideo.videoUrl) {
                  return (
                    <video 
                      src={activeVideo.videoUrl} 
                      controls 
                      autoPlay 
                      className="w-full h-auto max-h-[70vh] object-contain rounded-xl"
                      playsInline
                    />
                  );
                }

                return (
                  <div className="text-center text-slate-400 p-8">
                    <Film className="w-12 h-12 mx-auto mb-2 text-slate-600" />
                    <p className="text-sm font-semibold">Tautan video tidak tersedia</p>
                  </div>
                );
              })()}
            </div>

            {activeVideo.description && (
              <div className="p-4 bg-slate-900 border-t border-slate-800 text-xs text-slate-300">
                {activeVideo.description}
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- MODAL 2: STORYBOARD GALLERY LIGHTBOX MODAL --- */}
      {activeStoryboard && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 sm:p-6 animate-fade-in">
          <button 
            onClick={() => setActiveStoryboard(null)}
            className="absolute top-6 right-6 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors border border-white/20 z-50"
          >
            <X className="w-6 h-6" />
          </button>

          {(() => {
            const { item, selectedSceneIndex } = activeStoryboard;
            const scenes = item.storyboardScenes || [];
            const currentScene = scenes[selectedSceneIndex] || scenes[0];

            return (
              <div className="w-full max-w-4xl mx-auto bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-purple-500/30 flex flex-col max-h-[92vh]">
                {/* MODAL HEADER */}
                <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-purple-600/30 border border-purple-500/50 flex items-center justify-center text-purple-300">
                      <Layers className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">{item.title}</h3>
                      <p className="text-xs text-purple-400 font-semibold">{item.category} • Storyboard Galeri</p>
                    </div>
                  </div>
                  <div className="px-3 py-1 bg-purple-950 text-purple-300 font-mono text-xs font-bold rounded-full border border-purple-500/30">
                    Scene {selectedSceneIndex + 1} dari {scenes.length}
                  </div>
                </div>

                {/* MAIN SCENE DISPLAY */}
                <div className="relative flex-1 bg-slate-950 flex items-center justify-center p-4 min-h-[350px] overflow-hidden">
                  {currentScene?.imageUrl ? (
                    <img 
                      src={currentScene.imageUrl} 
                      alt={`Scene ${currentScene.sceneNumber}`}
                      className="max-h-[60vh] w-auto max-w-full object-contain rounded-xl shadow-2xl border border-slate-800" 
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        const parent = e.currentTarget.parentElement;
                        if (parent && !parent.querySelector('.lightbox-broken-msg')) {
                          const msg = document.createElement('div');
                          msg.className = 'lightbox-broken-msg text-center text-slate-400 py-12 flex flex-col items-center';
                          msg.innerHTML = '<div class="w-12 h-12 rounded-2xl bg-purple-950/60 border border-purple-500/30 flex items-center justify-center mb-3 text-xl">🖼️</div><p class="text-sm font-semibold text-slate-300">Gambar Scene Tidak Tersedia</p><p class="text-xs text-slate-500 mt-1">Admin dapat mengunggah ulang gambar adegan ini di Dashboard Admin Showcase.</p>';
                          parent.appendChild(msg);
                        }
                      }}
                    />
                  ) : (
                    <div className="text-center text-slate-500 py-12">
                      <Layers className="w-12 h-12 mx-auto mb-2 text-slate-600" />
                      <p className="text-sm">Scene belum memiliki gambar</p>
                    </div>
                  )}

                  {/* Scene Navigation Arrows */}
                  {scenes.length > 1 && (
                    <>
                      <button 
                        onClick={() => setActiveStoryboard({
                          item,
                          selectedSceneIndex: (selectedSceneIndex - 1 + scenes.length) % scenes.length
                        })}
                        className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/60 hover:bg-black/90 text-white rounded-full flex items-center justify-center border border-white/20 transition-colors shadow-lg"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => setActiveStoryboard({
                          item,
                          selectedSceneIndex: (selectedSceneIndex + 1) % scenes.length
                        })}
                        className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/60 hover:bg-black/90 text-white rounded-full flex items-center justify-center border border-white/20 transition-colors shadow-lg"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </>
                  )}
                </div>

                {/* SCENE DETAILS & PROMPT */}
                <div className="p-4 bg-slate-900 border-t border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-white">
                        Scene {currentScene?.sceneNumber}: {currentScene?.title || 'Visual Scene'}
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">{currentScene?.description}</p>
                    </div>
                  </div>

                  {currentScene?.prompt && (
                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs">
                      <span className="text-[10px] font-bold text-purple-400 block mb-1 uppercase tracking-wider">A.I Visual Prompt:</span>
                      <p className="text-slate-300 font-mono text-[11px] leading-relaxed select-all">
                        {currentScene.prompt}
                      </p>
                    </div>
                  )}

                  {/* SCENE SELECTOR THUMBNAIL BAR */}
                  <div className="flex gap-2 overflow-x-auto pb-1 pt-1 scrollbar-none">
                    {scenes.map((sc, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveStoryboard({ item, selectedSceneIndex: idx })}
                        className={`relative w-14 h-14 rounded-lg overflow-hidden shrink-0 border-2 transition-all ${
                          idx === selectedSceneIndex ? 'border-purple-500 scale-105 shadow-md shadow-purple-500/30' : 'border-slate-800 opacity-60 hover:opacity-100'
                        }`}
                      >
                        {sc.imageUrl ? (
                          <img src={sc.imageUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-slate-800 flex items-center justify-center text-[10px] text-slate-400">#{sc.sceneNumber}</div>
                        )}
                        <span className="absolute bottom-0 inset-x-0 bg-black/70 text-[9px] text-center font-bold text-white">
                          #{sc.sceneNumber}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </section>
  );
};
