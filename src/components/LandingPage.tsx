import React, { useState } from 'react';
import { 
  Sparkles, 
  Film, 
  BrainCircuit, 
  CheckCircle2, 
  ArrowRight, 
  ShieldCheck, 
  Zap, 
  Flame, 
  Clock, 
  MessageCircle, 
  Star, 
  ChevronDown, 
  Layers, 
  Check, 
  X, 
  HelpCircle,
  Play,
  Share2,
  Video,
  Award,
  Tag,
  Download,
  Copy,
  ExternalLink,
  Cpu,
  MonitorPlay,
  Wand2,
  ArrowUpRight,
  SplitSquareVertical,
  ShoppingBag,
  BookOpen,
  Mic,
  Clapperboard
} from 'lucide-react';
import { ShowcaseGallery } from './ShowcaseGallery';
import { PromoCountdown } from './PromoCountdown';

interface LandingPageProps {
  onRegisterClick: () => void;
  onLoginClick: () => void;
  whatsappNumber: string;
  priceSetting?: {
    normalPrice?: number;
    promoPrice?: number;
    flashSaleHours?: number;
    flashSaleMinutes?: number;
  };
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onRegisterClick,
  onLoginClick,
  whatsappNumber,
  priceSetting
}) => {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [copiedDemo, setCopiedDemo] = useState(false);
  const [activeWorkflowTab, setActiveWorkflowTab] = useState<'storyboard' | 'export' | 'generate'>('export');
  const [isExpiredLocally, setIsExpiredLocally] = useState(false);

  // Check if flash sale is active and valid
  const isFlashSaleActive = priceSetting?.flashSaleEnabled !== false && !isExpiredLocally && (
    !priceSetting?.endTime || new Date(priceSetting.endTime).getTime() > Date.now()
  );

  const displayPrice = isFlashSaleActive 
    ? (priceSetting?.promoPrice ?? 99000) 
    : (priceSetting?.normalPrice ?? 499000);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSimulateExport = () => {
    navigator.clipboard.writeText(
      "Scene 1: Cinematic cinematic wide angle of a glowing futuristic bottle surrounded by golden light flare, 4k photorealistic --ar 9:16\nScene 2: Macro dynamic zoom-in on liquid dropper dripping luminous golden serum, slow-motion 60fps cinematic studio lighting"
    );
    setCopiedDemo(true);
    setTimeout(() => setCopiedDemo(false), 3000);
  };

  const faqs = [
    {
      q: 'Bagaimana cara kerja dari Storyboard sampai menjadi video?',
      a: 'Cara kerjanya sangat gampang: (1) Masuk ke salah satu dari 5 Studio AI Spesialis kami (Studio Affiliate, Animasi, Edukasi, Podcast, atau Film). Masukkan ide atau nama produk Anda, dan AI langsung menyusun storyboard adegan per adegan (scene 1 sampai selesai). (2) Setelah storyboard muncul, klik tombol "Export Prompt" — semua prompt visual tiap adegan otomatis tersusun rapi. (3) Buka platform generate video favorit Anda seperti Google Flow, Google Chat Gemini, Kling AI, Runway Gen-3, atau Luma, lalu paste prompt tersebut. Video sinematik Anda langsung siap!'
    },
    {
      q: 'Apa saja 5 Studio AI yang disediakan dan perbedaannya?',
      a: 'Kami menyediakan 5 studio spesialis siap pakai: (1) Studio Affiliate untuk video iklan TikTok Shop & Shopee dengan hook konversi tinggi, (2) Studio Animasi untuk kartun 3D/2D, anime, dan konsistensi karakter fabel, (3) Studio Edukasi untuk tutorial sains, fakta sejarah, dan infografis, (4) Studio Podcast untuk wawancara multi-angle & klip inspiratif, serta (5) Studio Film untuk naskah layar lebar 8K dan trailer sinematik. Semua studio ini langsung aktif untuk Anda!'
    },
    {
      q: 'Platform generate video apa saja yang kompatibel dengan hasil Export Prompt?',
      a: 'Sangat luas dan universal! Format prompt yang diexport kompatibel langsung dengan Google Flow, Google Chat Gemini, Kling AI, Runway Gen-3/Gen-2, Luma Dream Machine, Hailuo / Minimax, Pika, hingga image generator seperti Midjourney dan Flux.'
    },
    {
      q: 'Apakah benar-benar sekali bayar seumur hidup (Lifetime Access)?',
      a: 'Benar sekali! Anda hanya perlu membayar 1 kali sebesar Rp 99.000 pada periode promo ini. Anda mendapatkan akses ke seluruh studio AI selamanya tanpa biaya bulanan atau biaya tahunan berulang.'
    },
    {
      q: 'Aplikasi ini cocok digunakan untuk apa saja?',
      a: 'Sangat cocok untuk membuat video iklan TikTok Affiliate, Shopee Video, Instagram Reels, YouTube Shorts, promosi produk UMKM, company profile, hingga skrip film pendek berpenghasilan tinggi.'
    },
    {
      q: 'Bagaimana proses aktivasi setelah saya melakukan transfer Rp 99.000?',
      a: 'Setelah mendaftar dan melakukan transfer Rp 99.000, Anda bisa konfirmasi via WhatsApp admin atau menunggu verifikasi otomatis maksimal 1x24 jam (biasanya aktif cepat dalam 5 - 15 menit). Setelah aktif, tombol direct studio langsung terbuka di dashboard Anda.'
    }
  ];

  return (
    <div className="flex-1 flex flex-col bg-slate-950 text-slate-100 overflow-hidden">
      
      {/* 1. TOP STICKY PROMO ANNOUNCEMENT BAR */}
      <div className={`bg-gradient-to-r ${isFlashSaleActive ? 'from-blue-900 via-indigo-900 to-cyan-900' : 'from-slate-900 to-slate-950'} border-b border-cyan-500/30 px-3 py-2.5 text-center text-xs sm:text-sm text-white sticky top-16 z-20 shadow-md`}>
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-center gap-2 sm:gap-4 font-medium">
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${isFlashSaleActive ? 'bg-rose-400 animate-ping' : 'bg-slate-400'}`}></span>
            <span className="font-bold text-amber-300 flex items-center gap-1">
              <Flame className={`w-4 h-4 ${isFlashSaleActive ? 'text-rose-400 fill-rose-400' : 'text-slate-400'}`} /> {isFlashSaleActive ? 'FLASH SALE PROMO:' : 'HARGA NORMAL:'}
            </span>
            <span className="hidden sm:inline text-slate-200">Aplikasi Storyboard AI 5 Studio (Affiliate, Animasi, Edukasi, Podcast, Film) Seumur Hidup Hanya</span>
            <strong className="bg-rose-500 text-white px-2 py-0.5 rounded font-black text-xs">
              Rp {displayPrice.toLocaleString('id-ID')}
            </strong>
          </div>

          <div className="flex items-center gap-2">
            {isFlashSaleActive && (
              <PromoCountdown 
                variant="compact" 
                priceSetting={priceSetting} 
                onExpire={() => setIsExpiredLocally(true)}
              />
            )}
            <button 
              onClick={onRegisterClick}
              className="px-3 py-1 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs rounded-lg shadow transition-all hover:scale-105 whitespace-nowrap"
            >
              {isFlashSaleActive ? 'Klaim Promo →' : 'Beli Sekarang →'}
            </button>
          </div>
        </div>
      </div>

      {/* 2. HERO SECTION */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-32 bg-slate-950 border-b border-slate-900">
        {/* Background Gradients & Grid Pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-40"></div>
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[500px] bg-gradient-to-tr from-cyan-600/20 via-blue-600/20 to-indigo-600/20 rounded-full blur-[140px] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            
            {/* Tagline Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-900/40 border border-cyan-500/40 rounded-full text-cyan-300 font-bold text-xs mb-6 uppercase tracking-widest backdrop-blur-md shadow-lg shadow-cyan-500/10">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>Aplikasi AI Storyboard 5-in-1 & Export Prompt Video #1</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.15] mb-6">
              Bikin Storyboard & Export Prompt Video <br className="hidden sm:block"/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-amber-300">
                Sekali Bayar Seumur Hidup
              </span>
            </h1>

            {/* Subheadline / Value Proposition */}
            <p className="max-w-3xl mx-auto text-base sm:text-lg md:text-xl text-slate-300 font-normal leading-relaxed mb-8">
              Hasilkan alur storyboard iklan, kartun animasi, konten edukasi, podcast, hingga naskah film pendek multi-scene otomatis dalam hitungan detik. Dilengkapi <strong className="text-cyan-300">5 Studio AI Spesialis (Affiliate, Animasi, Edukasi, Podcast, & Film)</strong> dengan fitur <strong className="text-amber-300">1-Click Export Prompt</strong> yang siap di-generate jadi video sinematik di Google Flow, Google Chat Gemini, Kling AI, dan Runway tanpa biaya langganan!
            </p>

            {/* Key Value Badges */}
            <div className="flex flex-wrap items-center justify-center gap-3 mb-10 text-xs sm:text-sm font-semibold">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-cyan-500/40 text-cyan-200">
                <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                Tersedia 5 Studio AI Spesialis
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-amber-500/40 text-amber-200">
                <Zap className="w-4 h-4 text-amber-400 shrink-0" />
                Fitur 1-Klik Export Prompt
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-700 text-slate-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                Siap Google Flow, Gemini, Kling AI
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-700 text-slate-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                Sekali Bayar Rp {(priceSetting?.promoPrice ?? 99000).toLocaleString('id-ID')} Seumur Hidup
              </span>
            </div>

            {/* Flash Sale Hero Box with Countdown */}
            <div className="max-w-2xl mx-auto mb-10">
              <div className="bg-slate-900/90 border-2 border-cyan-500/50 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-cyan-500/10 backdrop-blur-xl relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none"></div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-800">
                  <div className="text-center sm:text-left">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Harga Promo Peluncuran Khusus Hari Ini
                    </span>
                    <div className="flex items-baseline justify-center sm:justify-start gap-3">
                      <span className="text-slate-500 line-through text-lg sm:text-xl font-bold">
                        Rp {(priceSetting?.normalPrice ?? 499000).toLocaleString('id-ID')}
                      </span>
                      <span className="text-3xl sm:text-5xl font-black bg-gradient-to-r from-amber-300 via-amber-400 to-yellow-200 bg-clip-text text-transparent">
                        Rp {(priceSetting?.promoPrice ?? 99000).toLocaleString('id-ID')}
                      </span>
                    </div>
                    <span className="inline-block mt-1 text-[11px] font-bold text-emerald-400 bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                      ⚡ Sekali Bayar • Akses Seumur Hidup ke Semua 5 Studio
                    </span>
                  </div>

                  {/* Countdown Timer */}
                  <div className="w-full sm:w-auto">
                    <PromoCountdown variant="card" priceSetting={priceSetting} />
                  </div>
                </div>

                {/* Hero CTA Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <button 
                    onClick={onRegisterClick}
                    className="w-full sm:flex-1 py-4 px-6 bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-400 hover:from-blue-500 hover:to-cyan-300 text-slate-950 font-black text-base rounded-2xl shadow-xl shadow-cyan-500/25 transition-all hover:scale-[1.02] flex items-center justify-center gap-2 group"
                  >
                    <span>Dapatkan Akses 5 Studio (Rp {(priceSetting?.promoPrice ?? 99000).toLocaleString('id-ID')})</span>
                    <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                  </button>

                  <button 
                    onClick={() => scrollToSection('studios-section')}
                    className="w-full sm:w-auto py-4 px-6 bg-slate-800/80 hover:bg-slate-700/80 text-white font-bold text-sm rounded-2xl border border-slate-700 transition-all hover:border-slate-600 whitespace-nowrap flex items-center justify-center gap-2"
                  >
                    <SplitSquareVertical className="w-4 h-4 text-cyan-400" />
                    <span>Lihat 5 Studio</span>
                  </button>
                </div>

                <div className="mt-4 pt-3 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="w-4 h-4 text-cyan-400" /> 5 Studio AI Spesialis
                  </span>
                  <span className="flex items-center gap-1">
                    <Zap className="w-4 h-4 text-amber-400" /> 1-Click Export Prompt
                  </span>
                  <span className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" /> Rating 4.9/5 dari 1.200+ Kreator
                  </span>
                </div>
              </div>
            </div>

            {/* Contact WhatsApp link */}
            <div className="flex justify-center">
              <a 
                href={`https://wa.me/${whatsappNumber}?text=Halo%20Admin%20Neurona,%20saya%20tertarik%20dengan%20Promo%20Aplikasi%20Storyboard%20AI%20Rp%2099.000%20Sekali%20Bayar%20Seumur%20Hidup`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-slate-400 hover:text-emerald-400 transition-colors text-xs sm:text-sm font-semibold py-1 px-3 rounded-full hover:bg-slate-900 border border-transparent hover:border-slate-800"
              >
                <MessageCircle className="w-4 h-4 text-emerald-400" />
                <span>Ada Pertanyaan? Tanya Admin via WhatsApp</span>
              </a>
            </div>

          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. NEW HIGHLIGHT SECTION: CARA KERJA GAMPANG (3 LANGKAH DARI STORYBOARD JADI VIDEO) */}
      {/* ========================================================================= */}
      <section id="cara-kerja-section" className="py-20 lg:py-28 bg-slate-900/90 border-b border-slate-800 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-bold rounded-full mb-3 uppercase tracking-wider">
              <Zap className="w-4 h-4 text-amber-400" /> Alur Produksi Super Praktis
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
              Cara Kerjanya Sangat Gampang!
            </h2>
            <p className="text-slate-300 mt-4 text-base sm:text-lg leading-relaxed">
              Setelah alur storyboard muncul, cukup <strong className="text-cyan-300">klik tombol Export Prompt</strong>, lalu gunakan di platform video AI favorit Anda seperti Google Flow, Google Chat Gemini, Kling, dan sejenisnya.
            </p>
          </div>

          {/* 3 Interactive Step Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-14">
            
            {/* Step 1 */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-3xl p-6 sm:p-8 relative flex flex-col hover:border-cyan-500/40 transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/40 text-blue-400 font-black text-xl flex items-center justify-center mb-6 group-hover:scale-105 transition-transform">
                1
              </div>
              <div className="inline-block px-2.5 py-0.5 bg-blue-950/80 text-blue-300 text-xs font-bold rounded-md border border-blue-500/30 w-fit mb-3">
                Langkah 1: Storyboard Otomatis
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Pilih Studio & Masukkan Ide</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-4 flex-1">
                Pilih salah satu dari <strong>5 Studio AI Spesialis</strong> (Studio Affiliate, Animasi, Edukasi, Podcast, atau Film). Masukkan nama produk atau ide video Anda. AI langsung menyusun visual adegan demi adegan lengkap dengan prompt sinematik siap render.
              </p>
              <div className="bg-slate-900/90 rounded-xl p-3 border border-slate-800 text-xs text-slate-300 font-mono">
                💡 <span className="text-cyan-400 font-semibold">Ide:</span> "Serum wajah anti-kusam untuk konten affiliate TikTok"
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-gradient-to-b from-slate-950 to-blue-950/40 border-2 border-amber-500/50 rounded-3xl p-6 sm:p-8 relative flex flex-col shadow-xl shadow-amber-500/5 hover:border-amber-400 transition-all group">
              <div className="absolute -top-3.5 right-6 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full shadow">
                ★ FITUR UTAMA
              </div>
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 font-black text-xl flex items-center justify-center mb-6 group-hover:scale-105 transition-transform">
                2
              </div>
              <div className="inline-block px-2.5 py-0.5 bg-amber-950/80 text-amber-300 text-xs font-bold rounded-md border border-amber-500/30 w-fit mb-3">
                Langkah 2: One-Click Export
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Klik Tombol "Export Prompt"</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-4 flex-1">
                Begitu susunan storyboard muncul di studio, cukup <strong>klik tombol "Export Prompt"</strong>. Semua deskripsi prompt video per adegan langsung diexport dan dirapikan otomatis tanpa perlu repot copy-paste satu per satu.
              </p>
              <div className="bg-slate-900/90 rounded-xl p-3 border border-amber-500/30 text-xs text-amber-300 flex items-center justify-between">
                <span className="font-bold flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5" /> [⚡ Export Prompt]
                </span>
                <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded">1-Klik Siap Render</span>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-3xl p-6 sm:p-8 relative flex flex-col hover:border-cyan-500/40 transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-cyan-600/20 border border-cyan-500/40 text-cyan-400 font-black text-xl flex items-center justify-center mb-6 group-hover:scale-105 transition-transform">
                3
              </div>
              <div className="inline-block px-2.5 py-0.5 bg-cyan-950/80 text-cyan-300 text-xs font-bold rounded-md border border-cyan-500/30 w-fit mb-3">
                Langkah 3: Render Video
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Generate di Platform Favorit</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-4 flex-1">
                Gunakan prompt yang telah diexport ke platform video AI pilihan Anda seperti <strong>Google Flow, Google Chat Gemini, Kling AI, Runway Gen, Luma Dream Machine</strong>, atau <strong>Pika</strong>. Video selesai dan siap dipublikasikan!
              </p>
              <div className="bg-slate-900/90 rounded-xl p-3 border border-slate-800 text-xs text-slate-300 flex flex-wrap gap-1.5">
                <span className="px-2 py-0.5 bg-blue-950 text-blue-300 rounded text-[11px] font-bold">Google Flow</span>
                <span className="px-2 py-0.5 bg-indigo-950 text-indigo-300 rounded text-[11px] font-bold">Gemini Chat</span>
                <span className="px-2 py-0.5 bg-emerald-950 text-emerald-300 rounded text-[11px] font-bold">Kling AI</span>
                <span className="px-2 py-0.5 bg-purple-950 text-purple-300 rounded text-[11px] font-bold">Runway</span>
              </div>
            </div>

          </div>

          {/* Interactive Simulation / Mockup Box of Export Prompt */}
          <div className="max-w-4xl mx-auto bg-slate-950 border border-cyan-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Simulasi Alur Studio AI</span>
                </div>
                <h4 className="text-lg font-bold text-white mt-1">Lihat Betapa Mudahnya Menggunakan Fitur Export Prompt</h4>
              </div>

              {/* Workflow Toggle Buttons */}
              <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setActiveWorkflowTab('storyboard')}
                  className={`px-3 py-1.5 rounded-lg transition-colors ${activeWorkflowTab === 'storyboard' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                >
                  1. Storyboard
                </button>
                <button
                  type="button"
                  onClick={() => setActiveWorkflowTab('export')}
                  className={`px-3 py-1.5 rounded-lg transition-colors ${activeWorkflowTab === 'export' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'}`}
                >
                  2. Export Prompt
                </button>
                <button
                  type="button"
                  onClick={() => setActiveWorkflowTab('generate')}
                  className={`px-3 py-1.5 rounded-lg transition-colors ${activeWorkflowTab === 'generate' ? 'bg-cyan-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'}`}
                >
                  3. Video Ready
                </button>
              </div>
            </div>

            {/* Simulated Content Area */}
            <div className="pt-6">
              {activeWorkflowTab === 'storyboard' && (
                <div className="space-y-3">
                  <div className="p-4 bg-slate-900/90 rounded-2xl border border-slate-800 text-xs">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-cyan-300">Scene 1 • Hook 3 Detik Pertama</span>
                      <span className="text-slate-500 font-mono">Angle: Macro Close-up</span>
                    </div>
                    <p className="text-slate-300 leading-relaxed">
                      "Visual: Wajah model wanita memegang botol serum dengan ekspresi terkejut melihat perubahan kulit kusam menjadi bercahaya di bawah sinar matahari pagi."
                    </p>
                  </div>
                  <div className="p-4 bg-slate-900/90 rounded-2xl border border-slate-800 text-xs">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-cyan-300">Scene 2 • Problem & Solution Demo</span>
                      <span className="text-slate-500 font-mono">Angle: Cinematic Pan</span>
                    </div>
                    <p className="text-slate-300 leading-relaxed">
                      "Visual: Tetesan serum jatuh dengan efek slow-motion dramatis ke permukaan kulit, menyerap instan dengan partikel keemasan bercahaya."
                    </p>
                  </div>
                </div>
              )}

              {activeWorkflowTab === 'export' && (
                <div className="space-y-4">
                  <div className="p-4 sm:p-5 bg-gradient-to-r from-amber-950/40 to-slate-900 rounded-2xl border border-amber-500/40">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
                      <div>
                        <span className="text-xs font-extrabold text-amber-300 block">HASIL PROMPT VIDEO SIAP GENERATE</span>
                        <p className="text-xs text-slate-400">Seluruh prompt adegan sudah terformat otomatis dengan parameter pencahayaan sinematik.</p>
                      </div>
                      
                      <button
                        type="button"
                        onClick={handleSimulateExport}
                        className="px-4 py-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-lg transition-transform hover:scale-105 flex items-center gap-1.5 whitespace-nowrap"
                      >
                        {copiedDemo ? (
                          <>
                            <Check className="w-4 h-4 text-emerald-950" />
                            <span>Tersalin ke Clipboard!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            <span>Klik: Export All Prompts</span>
                          </>
                        )}
                      </button>
                    </div>

                    <pre className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-slate-300 font-mono text-xs overflow-x-auto whitespace-pre-wrap leading-relaxed">
                      {`[Scene 1] A cinematic photorealistic macro close-up of a luxury serum bottle, morning sunlight rays flare, shallow depth of field, 8k --ar 9:16\n[Scene 2] High speed slow-motion 60fps golden droplet falling onto hydrated skin surface, soft bokeh, cinematic commercial studio lighting`}
                    </pre>
                  </div>
                  <p className="text-xs text-slate-400 text-center">
                    Tinggal tempel (paste) ke Google Flow, Google Gemini Chat, Kling AI, Runway, atau Luma Dream Machine!
                  </p>
                </div>
              )}

              {activeWorkflowTab === 'generate' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="p-3.5 bg-slate-900 rounded-2xl border border-slate-800 flex flex-col items-center text-center">
                    <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center font-black text-xs mb-2">GF</div>
                    <span className="font-bold text-white text-xs">Google Flow</span>
                    <span className="text-[11px] text-slate-400 mt-1">Generate video sinematik dengan AI tercanggih Google.</span>
                  </div>
                  <div className="p-3.5 bg-slate-900 rounded-2xl border border-slate-800 flex flex-col items-center text-center">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-black text-xs mb-2">GC</div>
                    <span className="font-bold text-white text-xs">Google Chat Gemini</span>
                    <span className="text-[11px] text-slate-400 mt-1">Rendering langsung dari prompt terstruktur di Gemini.</span>
                  </div>
                  <div className="p-3.5 bg-slate-900 rounded-2xl border border-slate-800 flex flex-col items-center text-center">
                    <div className="w-10 h-10 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center font-black text-xs mb-2">KL</div>
                    <span className="font-bold text-white text-xs">Kling AI</span>
                    <span className="text-[11px] text-slate-400 mt-1">Pergerakan objek realistis untuk iklan affiliate.</span>
                  </div>
                  <div className="p-3.5 bg-slate-900 rounded-2xl border border-slate-800 flex flex-col items-center text-center">
                    <div className="w-10 h-10 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center font-black text-xs mb-2">RW</div>
                    <span className="font-bold text-white text-xs">Runway Gen-3</span>
                    <span className="text-[11px] text-slate-400 mt-1">Pilihan sinematik film & video komersial brand.</span>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. SECTION: 5 STUDIO AI SPESIALIS (MULTI-STUDIO SUITE) */}
      {/* ========================================================================= */}
      <section id="studios-section" className="py-20 lg:py-24 bg-slate-950 border-b border-slate-900 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest block mb-2">
              Multi-Studio AI Suite (5-in-1)
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              5 Pilihan Studio AI Spesialis
            </h2>
            <p className="text-slate-400 mt-3 text-base sm:text-lg">
              Setiap kategori konten membutuhkan formula prompt dan visual storytelling yang berbeda. Kami sediakan 5 studio khusus dalam satu akun seumur hidup:
            </p>
          </div>

          {/* 5 Studio Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            
            {/* 1. Studio Affiliate */}
            <div className="bg-slate-900/80 border border-amber-500/30 rounded-3xl p-6 sm:p-7 hover:border-amber-400 transition-all hover:-translate-y-1 relative group flex flex-col shadow-lg shadow-amber-500/5">
              <div className="flex items-center justify-between mb-5">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <ShoppingBag className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-950/80 text-amber-300 border border-amber-500/30">
                  Affiliate & TikTok Shop
                </span>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Studio Affiliate</h3>
              <p className="text-slate-300 text-sm leading-relaxed mb-4 flex-1">
                Didesain khusus untuk kreator TikTok Shop, Shopee Affiliate, dan IG Reels. Menghasilkan hook 3 detik penahan scroll, visual unboxing dramatis, macro detail produk, dan Call-to-Action konversi tinggi.
              </p>
              <div className="space-y-1.5 pt-3 border-t border-slate-800 text-xs text-slate-400">
                <div className="flex items-center gap-1.5 text-amber-300 font-medium">
                  <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" /> Hook Formula AIDA & Problem-Solution
                </div>
                <div className="flex items-center gap-1.5 text-slate-300">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Angle Macro Detail & Tekstur Kemasan
                </div>
                <div className="flex items-center gap-1.5 text-slate-300">
                  <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" /> 1-Click Export Prompt Siap Render Video
                </div>
              </div>
            </div>

            {/* 2. Studio Animasi */}
            <div className="bg-slate-900/80 border border-purple-500/30 rounded-3xl p-6 sm:p-7 hover:border-purple-400 transition-all hover:-translate-y-1 relative group flex flex-col shadow-lg shadow-purple-500/5">
              <div className="flex items-center justify-between mb-5">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-500/40 text-purple-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Sparkles className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-purple-950/80 text-purple-300 border border-purple-500/30">
                  Kartun & 3D/2D
                </span>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Studio Animasi</h3>
              <p className="text-slate-300 text-sm leading-relaxed mb-4 flex-1">
                Rancang serial kartun bersambung, anime Jepang, fabel dongeng anak, visual komik, dan karakter storytelling unik. Menjaga konsistensi karakter dari adegan pertama hingga tamat.
              </p>
              <div className="space-y-1.5 pt-3 border-t border-slate-800 text-xs text-slate-400">
                <div className="flex items-center gap-1.5 text-purple-300 font-medium">
                  <Check className="w-3.5 h-3.5 text-purple-400 shrink-0" /> Konsistensi Karakter & Gaya Visual
                </div>
                <div className="flex items-center gap-1.5 text-slate-300">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Ekspresi Wajah & Gerakan Karakter Hidup
                </div>
                <div className="flex items-center gap-1.5 text-slate-300">
                  <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" /> Cocok YouTube Kids & Reels Animasi
                </div>
              </div>
            </div>

            {/* 3. Studio Edukasi */}
            <div className="bg-slate-900/80 border border-emerald-500/30 rounded-3xl p-6 sm:p-7 hover:border-emerald-400 transition-all hover:-translate-y-1 relative group flex flex-col shadow-lg shadow-emerald-500/5">
              <div className="flex items-center justify-between mb-5">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <BookOpen className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-500/30">
                  Tutorial & Pembelajaran
                </span>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Studio Edukasi</h3>
              <p className="text-slate-300 text-sm leading-relaxed mb-4 flex-1">
                Ubah materi rumit, sains, sejarah dunia, tips teknologi, dan keuangan menjadi video infografis interaktif berdaya sebar tinggi yang sangat mudah dipahami dan dinikmati penonton.
              </p>
              <div className="space-y-1.5 pt-3 border-t border-slate-800 text-xs text-slate-400">
                <div className="flex items-center gap-1.5 text-emerald-300 font-medium">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Struktur Logis Hook - Fakta - Solusi
                </div>
                <div className="flex items-center gap-1.5 text-slate-300">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Infografis Visual & Diagram Penjelas
                </div>
                <div className="flex items-center gap-1.5 text-slate-300">
                  <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" /> Prompt Voiceover Runtut & Menarik
                </div>
              </div>
            </div>

            {/* 4. Studio Podcast */}
            <div className="bg-slate-900/80 border border-cyan-500/30 rounded-3xl p-6 sm:p-7 hover:border-cyan-400 transition-all hover:-translate-y-1 relative group flex flex-col shadow-lg shadow-cyan-500/5">
              <div className="flex items-center justify-between mb-5">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Mic className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-500/30">
                  Talkshow & Wawancara
                </span>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Studio Podcast</h3>
              <p className="text-slate-300 text-sm leading-relaxed mb-4 flex-1">
                Storyboard wawancara mendalam, percakapan 2 orang/tamu inspiratif, tata kamera multi-angle (Host, Guest, Wide Studio), dan klip cuplikan kutipan bijak yang siap viral di feed medsos.
              </p>
              <div className="space-y-1.5 pt-3 border-t border-slate-800 text-xs text-slate-400">
                <div className="flex items-center gap-1.5 text-cyan-300 font-medium">
                  <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" /> Tata Sudut Kamera Dinamis (Multi-Angle)
                </div>
                <div className="flex items-center gap-1.5 text-slate-300">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Nuansa Pencahayaan Hangat Warm Studio
                </div>
                <div className="flex items-center gap-1.5 text-slate-300">
                  <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" /> Ekstraksi Cuplikan Punchline Dialog
                </div>
              </div>
            </div>

            {/* 5. Studio Film */}
            <div className="bg-slate-900/80 border border-rose-500/30 rounded-3xl p-6 sm:p-7 hover:border-rose-400 transition-all hover:-translate-y-1 relative group flex flex-col shadow-lg shadow-rose-500/5 md:col-span-2 lg:col-span-2">
              <div className="flex items-center justify-between mb-5">
                <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Clapperboard className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-rose-950/80 text-rose-300 border border-rose-500/30">
                  Sinematik Layar Lebar 8K
                </span>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Studio Film</h3>
              <p className="text-slate-300 text-sm leading-relaxed mb-4 flex-1">
                Bikin naskah narasinya hidup dengan adegan aksi laga dramatis, pencahayaan layar lebar Hollywood 8K, framing anamorphic, dan shot sequencing profesional untuk film pendek, trailer, atau video musik sinematik.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-3 border-t border-slate-800 text-xs text-slate-400">
                <div className="flex items-center gap-1.5 text-rose-300 font-medium">
                  <Check className="w-3.5 h-3.5 text-rose-400 shrink-0" /> Lighting Sinematik 8K & Moody Anamorphic
                </div>
                <div className="flex items-center gap-1.5 text-slate-300">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Shot Sequencing Dramatis (Wide to Macro)
                </div>
                <div className="flex items-center gap-1.5 text-slate-300">
                  <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" /> Naskah Skenario & Prompt Kling / Runway Gen-3
                </div>
                <div className="flex items-center gap-1.5 text-slate-300">
                  <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" /> Kompatibel Format Layar 16:9 & 21:9 Sinema
                </div>
              </div>
            </div>

          </div>

          {/* All Studios Included Banner */}
          <div className="mt-10 max-w-4xl mx-auto bg-gradient-to-r from-blue-950/60 via-slate-900 to-indigo-950/60 border border-cyan-500/40 rounded-2xl p-5 text-center flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-left">
              <span className="text-xs font-bold text-amber-300 uppercase tracking-wider block mb-1">
                Akses Komplit Seluruh 5 Studio Sekaligus
              </span>
              <p className="text-sm text-slate-200">
                Anda tidak perlu membeli lisensi terpisah. Cukup 1 kali bayar Rp 99.000 seumur hidup untuk menikmati kelima studio di atas!
              </p>
            </div>
            <button
              onClick={onRegisterClick}
              className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-cyan-500/20 whitespace-nowrap transition-all hover:scale-105"
            >
              Klaim Semua 5 Studio (Rp 99.000) &rarr;
            </button>
          </div>

        </div>
      </section>

      {/* 5. SHOWCASE STORYBOARD & VIDEO GALLERY */}
      <section id="showcase-section" className="relative bg-slate-950">
        <ShowcaseGallery />
      </section>

      {/* 6. PROBLEM VS SOLUTION */}
      <section className="py-20 lg:py-28 bg-slate-900/60 border-y border-slate-800 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest block mb-2">
              Transformasi Produksi Konten
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Masih Bikin Storyboard & Prompt Video Manual?
            </h2>
            <p className="text-slate-400 mt-4 text-base sm:text-lg">
              Bandingkan cara lama yang membuang waktu dengan efisiensi generator Storyboard AI Multi-Studio kami.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            
            {/* The Old Way */}
            <div className="bg-slate-950/80 border border-rose-500/20 rounded-3xl p-6 sm:p-8 shadow-xl relative">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-rose-950/80 text-rose-400 text-xs font-bold rounded-full border border-rose-500/30 mb-6">
                <X className="w-3.5 h-3.5" /> Cara Lama yang Menghambat
              </div>
              <ul className="space-y-4 text-slate-300 text-sm">
                <li className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center shrink-0 mt-0.5">✕</span>
                  <span><strong>Habis Berjam-jam:</strong> Bingung memikirkan alur adegan, sudut kamera, dan alur cerita iklan dari nol.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center shrink-0 mt-0.5">✕</span>
                  <span><strong>Prompt Tercecer & Ribet:</strong> Harus menulis prompt satu per satu ke video generator tanpa format yang jelas.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center shrink-0 mt-0.5">✕</span>
                  <span><strong>Terjebak Server Down:</strong> Hanya punya 1 link workspace, begitu antrean padat proses kerja terhenti total.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center shrink-0 mt-0.5">✕</span>
                  <span><strong>Biaya Langganan Mahal:</strong> Software AI video lain mematok biaya langganan bulanan Rp 300.000 – Rp 800.000/bulan yang membebani dompet.</span>
                </li>
              </ul>
            </div>

            {/* The New AI Storyboard Way */}
            <div className="bg-gradient-to-br from-slate-950 to-blue-950/50 border-2 border-cyan-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl relative">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-cyan-950/80 text-cyan-300 text-xs font-bold rounded-full border border-cyan-500/40 mb-6">
                <Check className="w-3.5 h-3.5 text-cyan-400" /> Solusi Storyboard AI Kami
              </div>
              <ul className="space-y-4 text-slate-200 text-sm">
                <li className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0 mt-0.5">✓</span>
                  <span><strong>Storyboard Jadi dalam 30 Detik:</strong> Cukup ketik ide atau nama produk, alur multi-scene visual langsung tersusun otomatis.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0 mt-0.5">✓</span>
                  <span><strong>1-Click Export Prompt:</strong> Tombol sekali klik mengekspor semua prompt siap pakai untuk Google Flow, Gemini, Kling AI.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0 mt-0.5">✓</span>
                  <span><strong>Tersedia Pilihan Multi-Studio:</strong> Bebas beralih studio kapan pun jika server sedang padat. Bebas antre 24/7!</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0 mt-0.5">✓</span>
                  <span><strong>Cukup 1x Bayar Rp 99.000 Seumur Hidup:</strong> Bebas biaya bulanan selamanya. Akses seluruh studio seumur hidup!</span>
                </li>
              </ul>
            </div>

          </div>
        </div>
      </section>

      {/* 7. FITUR LENGKAP */}
      <section className="py-20 lg:py-28 bg-slate-950 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest block mb-2">
              Fitur Lengkap
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Semua Fitur yang Anda Butuhkan untuk <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                Membuat Storyboard & Video AI Viral
              </span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            
            {/* Feature 1 */}
            <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-6 sm:p-7 hover:border-cyan-500/40 transition-all hover:-translate-y-1">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center mb-5 shadow-lg shadow-cyan-500/20">
                <SplitSquareVertical className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Akses 5 Studio AI Spesialis</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Tersedia 5 studio AI aktif (Studio Affiliate, Animasi, Edukasi, Podcast, dan Film) sehingga Anda memiliki generator storyboard dan formula prompt khusus untuk niche konten Anda.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-6 sm:p-7 hover:border-amber-500/40 transition-all hover:-translate-y-1">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-500 flex items-center justify-center mb-5 shadow-lg shadow-amber-500/20">
                <Zap className="w-6 h-6 text-slate-950" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">1-Click Export Prompt</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Setelah alur storyboard muncul, satu klik tombol langsung menyalin seluruh prompt visual berurutan dengan parameter kamera dan pencahayaan presisi.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-6 sm:p-7 hover:border-cyan-500/40 transition-all hover:-translate-y-1">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center mb-5 shadow-lg shadow-purple-500/20">
                <Film className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Kompatibel Universal</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Prompt hasil export siap digunakan di Google Flow, Google Chat Gemini, Kling AI, Runway Gen-3, Luma Dream Machine, Sora, maupun CapCut.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-6 sm:p-7 hover:border-cyan-500/40 transition-all hover:-translate-y-1">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center mb-5 shadow-lg shadow-blue-500/20">
                <BrainCircuit className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Otak Google Gemini AI</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Didukung arsitektur Google Gemini AI mutakhir untuk merancang sudut pandang unik, alur emosi penonton, dan riset pasar produk affiliate Anda.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-6 sm:p-7 hover:border-cyan-500/40 transition-all hover:-translate-y-1">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center mb-5 shadow-lg shadow-emerald-500/20">
                <Tag className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Tanpa Biaya Bulanan</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Cukup satu kali bayar Rp 99.000 saat masa promo ini, Anda mendapatkan akses seumur hidup ke semua studio tanpa tagihan per bulan yang berulang.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-6 sm:p-7 hover:border-cyan-500/40 transition-all hover:-translate-y-1">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-blue-600 flex items-center justify-center mb-5 shadow-lg shadow-indigo-500/20">
                <Award className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Update & Cabang Baru Gratis</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Sebagai pemilik akses seumur hidup, Anda berhak menikmati pembaruan fitur, cabang studio baru, dan template prompt mendatang secara gratis.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* 8. DEDICATED PRICING & SPECIAL OFFER SECTION */}
      <section id="pricing-section" className="py-20 lg:py-28 bg-slate-900/70 border-y border-slate-800 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold rounded-full mb-3 uppercase tracking-wider">
              <Flame className="w-4 h-4 text-amber-400 fill-amber-400" /> Penawaran Terbatas Flash Sale
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
              Investasi Sekali, Nikmati Akses Seumur Hidup
            </h2>
            <p className="text-slate-400 mt-4 text-base sm:text-lg">
              Hemat jutaan rupiah dibandingkan software berbasis langganan bulanan. Amankan harga promo sebelum timer berakhir!
            </p>
          </div>

          {/* Featured Pricing Card */}
          <div className="max-w-xl mx-auto">
            <div className="bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-cyan-500 rounded-3xl p-6 sm:p-10 shadow-2xl shadow-cyan-500/20 relative">
              
              {/* Top Badge */}
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-400 text-slate-950 text-xs font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg">
                ★ LIFETIME ACCESS PASS ★
              </div>

              {/* Pricing details */}
              <div className="text-center mt-2 mb-6">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">
                  Aplikasi Generator Storyboard & Export Prompt AI
                </span>
                
                <div className="flex items-baseline justify-center gap-3 my-2">
                  {isFlashSaleActive && (
                    <span className="text-slate-500 line-through text-xl font-bold">
                      Rp {(priceSetting?.normalPrice ?? 499000).toLocaleString('id-ID')}
                    </span>
                  )}
                  <span className="text-4xl sm:text-6xl font-black bg-gradient-to-r from-amber-300 via-amber-400 to-yellow-200 bg-clip-text text-transparent">
                    Rp {displayPrice.toLocaleString('id-ID')}
                  </span>
                </div>

                <p className="text-xs sm:text-sm font-bold text-cyan-300">
                  Bayar Sekali Seumur Hidup • Tidak Ada Biaya Berlangganan
                </p>
              </div>

              {/* Countdown Timer Inside Pricing */}
              {isFlashSaleActive ? (
                <div className="mb-8">
                  <PromoCountdown 
                    variant="card" 
                    priceSetting={priceSetting} 
                    onExpire={() => setIsExpiredLocally(true)}
                  />
                </div>
              ) : (
                <div className="mb-8 p-4 bg-slate-900/80 border border-slate-800 rounded-2xl text-center">
                  <span className="text-xs font-bold text-slate-400">Status Promo: Normal Price / Flash Sale Nonaktif</span>
                </div>
              )}

              {/* What You Get Checklist */}
              <div className="space-y-3.5 mb-8 text-sm">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-slate-200 font-medium">Akses Penuh ke 5 Studio AI (Affiliate, Animasi, Edukasi, Podcast, Film)</span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-slate-200 font-medium">Fitur 1-Click Export Prompt Siap Generate Video</span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-slate-200 font-medium">Kompatibel Google Flow, Gemini, Kling AI, Runway, Luma</span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-slate-200 font-medium">Sekali Bayar Seumur Hidup (Bebas Biaya Bulanan/Tahunan)</span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-slate-200 font-medium">Generate Storyboard Multi-Scene Tanpa Batas (Unlimited)</span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-slate-200 font-medium">Formula Hook, Problem, Solution & CTA Iklan Viral</span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-slate-200 font-medium">Akses Gratis Semua Update & Pembaruan Sistem Mendatang</span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-slate-200 font-medium">Dukungan Konfirmasi Cepat & Konsultasi WhatsApp Admin</span>
                </div>
              </div>

              {/* Big CTA Button */}
              <button
                onClick={onRegisterClick}
                className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-400 hover:from-blue-500 hover:to-cyan-300 text-slate-950 font-black text-base sm:text-lg rounded-2xl shadow-xl shadow-cyan-500/25 transition-all hover:scale-[1.02] flex items-center justify-center gap-2 group"
              >
                <span>Daftar & Amankan Promo Rp 99.000 Sekarang</span>
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </button>

              <div className="mt-4 text-center">
                <p className="text-xs text-slate-400">
                  🔒 Pembayaran Transfer Bank / E-Wallet Aman & Aktivasi Cepat oleh Admin
                </p>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* 9. CARA BERGABUNG (4 LANGKAH MUDAH) */}
      <section className="py-20 bg-slate-950 border-b border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 max-w-2xl mx-auto">
            <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest block mb-2">
              Langkah Sederhana
            </span>
            <h2 className="text-3xl font-black text-white tracking-tight">Bagaimana Cara Bergabung?</h2>
            <p className="text-slate-400 mt-2 text-sm sm:text-base">
              Hanya 4 langkah mudah untuk memiliki aplikasi generator storyboard AI seumur hidup Anda:
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 relative max-w-5xl mx-auto">
            
            {/* Step 1 */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 text-center flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-cyan-950 border-2 border-cyan-500 text-cyan-400 font-black text-lg flex items-center justify-center mb-4 shadow-lg shadow-cyan-500/10">
                1
              </div>
              <h3 className="font-bold text-white text-base mb-2">Daftar Akun</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Isi formulir pendaftaran singkat dengan nama, email, dan nomor WhatsApp aktif Anda.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-slate-900/60 border border-cyan-500/40 rounded-2xl p-6 text-center flex flex-col items-center relative shadow-lg shadow-cyan-500/5">
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-400 to-amber-500 text-slate-950 font-black text-lg flex items-center justify-center mb-4 shadow-md">
                2
              </div>
              <h3 className="font-bold text-amber-300 text-base mb-2">Transfer Rp 99.000</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Lakukan transfer promo Rp 99.000 ke rekening bank resmi yang tertera di halaman instruksi.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 text-center flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-cyan-950 border-2 border-cyan-500 text-cyan-400 font-black text-lg flex items-center justify-center mb-4 shadow-lg shadow-cyan-500/10">
                3
              </div>
              <h3 className="font-bold text-white text-base mb-2">Aktivasi Kilat Admin</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Admin akan memvalidasi pembayaran dan mengaktifkan akun Anda dalam waktu 5 - 15 menit.
              </p>
            </div>

            {/* Step 4 */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 text-center flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-blue-600 to-cyan-500 text-white font-black text-lg flex items-center justify-center mb-4 shadow-lg shadow-blue-500/20">
                4
              </div>
              <h3 className="font-bold text-white text-base mb-2">Akses Multi-Studio</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Masuk ke dashboard member, buka studio pilihan Anda, dan mulai export prompt video viral selamanya!
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* 10. FAQ SECTION */}
      <section className="py-20 bg-slate-900/40 border-b border-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest block mb-2">
              Pertanyaan Umum
            </span>
            <h2 className="text-3xl font-black text-white tracking-tight">
              Tanya Jawab Seputar Storyboard AI & Export Prompt
            </h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div 
                  key={idx}
                  className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden transition-all"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="w-full p-5 text-left font-bold text-sm sm:text-base text-white flex items-center justify-between gap-4 hover:text-cyan-300 transition-colors"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown className={`w-5 h-5 shrink-0 text-slate-400 transition-transform ${isOpen ? 'rotate-180 text-cyan-400' : ''}`} />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 text-sm text-slate-300 leading-relaxed border-t border-slate-800/80 pt-4">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 11. BOTTOM FINAL CTA BANNER */}
      <section className="py-16 bg-gradient-to-r from-blue-950 via-slate-950 to-indigo-950 relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/20 text-amber-300 text-xs font-bold rounded-full border border-amber-500/30 mb-4">
            <Clock className="w-3.5 h-3.5" /> Promo Terbatas Hanya Rp 99.000
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-4 tracking-tight">
            Mulai Bikin Storyboard & Export Prompt Video AI Anda Sekarang
          </h2>
          <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto mb-8">
            Dapatkan akses seumur hidup ke seluruh Studio AI dengan fitur Export Prompt otomatis ke Google Flow, Gemini, Kling, dan lainnya.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={onRegisterClick}
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-sm rounded-xl shadow-xl shadow-amber-500/20 transition-all hover:scale-105"
            >
              Amankan Promo Rp 99.000 Sekarang &rarr;
            </button>
            <button
              onClick={onLoginClick}
              className="w-full sm:w-auto px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm rounded-xl border border-slate-700 transition-colors"
            >
              Sudah Punya Akun? Masuk
            </button>
          </div>
        </div>
      </section>

    </div>
  );
};
