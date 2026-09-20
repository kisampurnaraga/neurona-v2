import React, { useState, useEffect } from 'react';
import { 
  Upload, 
  User, 
  RotateCcw, 
  Sparkles, 
  Eye, 
  RefreshCw, 
  Edit3, 
  Download, 
  Video, 
  Trash2, 
  Check, 
  Copy, 
  Sliders, 
  Camera, 
  Image as ImageIcon,
  Layers,
  ChevronDown,
  X,
  Share2,
  Maximize2,
  BrainCircuit,
  Smartphone,
  Zap,
  ShoppingBag,
  Mic,
  BookOpen,
  Clapperboard
} from 'lucide-react';
import { 
  AspectRatio, 
  CameraType, 
  PhotoLayout, 
  ShotType, 
  StoryboardProject, 
  StoryboardSceneItem,
  StudioCategory
} from '../types';
import { VideoGenerationModal } from './VideoGenerationModal';
import { ExportPromptModal } from './ExportPromptModal';

export interface StudioConfigItem {
  id: StudioCategory;
  label: string;
  name: string;
  subtitle: string;
  tag: string;
  defaultTitle: string;
  defaultPose: string;
  defaultCamera: CameraType;
  defaultAspectRatio: AspectRatio;
  subjectLabel: string;
  subjectHint: string;
  placeholderSubject: string;
  captionLabel: string;
  icon: any;
}

export const STUDIO_CONFIGS: Record<StudioCategory, StudioConfigItem> = {
  affiliate: {
    id: 'affiliate',
    label: 'Studio Affiliate',
    name: 'Studio Affiliate AI',
    subtitle: 'Generator Video Promosi TikTok Shop, Shopee Affiliate & Reels',
    tag: 'Affiliate & E-Commerce',
    defaultTitle: 'Parfum Black Oud Lonkoom',
    defaultPose: 'Pria tersenyum sedang unboxing dan menyemprotkan botol parfum Black Oud di depan jendela pencahayaan softbox',
    defaultCamera: 'Smartphone',
    defaultAspectRatio: '9:16',
    subjectLabel: 'Foto Produk (Wajib)',
    subjectHint: 'Unggah foto produk e-commerce',
    placeholderSubject: 'Contoh: Parfum Black Oud Lonkoom / Serum Wajah',
    captionLabel: 'CAPTION TIKTOK SHOP / AFFILIATE AI',
    icon: ShoppingBag
  },
  animasi: {
    id: 'animasi',
    label: 'Studio Animasi',
    name: 'Studio Animasi & Kartun AI',
    subtitle: 'Generator Karakter Konsisten 3D/2D, Anime & Cerita Fabel Fantasi',
    tag: 'Animasi & Kartun',
    defaultTitle: 'Petualangan Kancil & Rubah Ajaib',
    defaultPose: 'Karakter rubah oranye 3D berbulu halus sedang menunjuk ke arah peta kuno berpendar di tengah hutan magis',
    defaultCamera: 'Cinematic',
    defaultAspectRatio: '9:16',
    subjectLabel: 'Referensi Karakter / Aktor (Wajib)',
    subjectHint: 'Unggah referensi gaya kartun / karakter',
    placeholderSubject: 'Contoh: Petualangan Kancil & Rubah Ajaib / Karakter Anime',
    captionLabel: 'SINOPSIS & DIALOG ANIMASI AI',
    icon: Sparkles
  },
  edukasi: {
    id: 'edukasi',
    label: 'Studio Edukasi',
    name: 'Studio Edukasi & Tutorial AI',
    subtitle: 'Generator Konten Edukasi, Sains, Infografis & Fakta Menarik',
    tag: 'Edukasi & Tutorial',
    defaultTitle: '5 Pola Pikir Finansial Sebelum Usia 30',
    defaultPose: 'Host muda rapi sedang menjelaskan grafik pertumbuhan tabungan dengan ilustrasi koin emas mengambang di layar',
    defaultCamera: 'DSLR',
    defaultAspectRatio: '9:16',
    subjectLabel: 'Visual Materi / Presenter (Wajib)',
    subjectHint: 'Unggah foto presenter atau visual diagram',
    placeholderSubject: 'Contoh: 5 Pola Pikir Finansial / Tutorial Coding React',
    captionLabel: 'HOOK & RANGKUMAN EDUKASI AI',
    icon: BookOpen
  },
  podcast: {
    id: 'podcast',
    label: 'Studio Podcast',
    name: 'Studio Podcast & Talkshow AI',
    subtitle: 'Generator Percakapan 2 Orang, Multi-Angle Camera & Kutipan Viral',
    tag: 'Podcast & Talkshow',
    defaultTitle: 'Bincang Bisnis: Membangun Startup dari Nol',
    defaultPose: 'Dua pembicara duduk di sofa studio warm lighting menghadap mic Shure SM7B dengan ekspresi diskusi seru',
    defaultCamera: 'Cinematic',
    defaultAspectRatio: '16:9',
    subjectLabel: 'Foto Setup Studio / Host (Wajib)',
    subjectHint: 'Unggah referensi foto host atau ruang podcast',
    placeholderSubject: 'Contoh: Obrolan Founder Sukses / Wawancara Inspiratif',
    captionLabel: 'PUNCHLINE & KUTIPAN PODCAST AI',
    icon: Mic
  },
  film: {
    id: 'film',
    label: 'Studio Film',
    name: 'Studio Film Sinematik 8K AI',
    subtitle: 'Generator Skenario Sinema Layar Lebar Hollywood & Short Movie',
    tag: 'Sinematik & Short Movie',
    defaultTitle: 'Cyberpunk 2099: Pelarian di Bawah Hujan Neon',
    defaultPose: 'Detektif bertubuh tegap dalam mantel basah menatap gedung pencakar langit kota masa depan dengan pantulan neon ungu dan cyan',
    defaultCamera: 'Cinematic',
    defaultAspectRatio: '21:9',
    subjectLabel: 'Pemeran Utama / Moodboard (Wajib)',
    subjectHint: 'Unggah foto karakter aktor atau palet warna film',
    placeholderSubject: 'Contoh: Film Action Cyberpunk / Thriller Sinematik',
    captionLabel: 'SINOPSIS TRAILER BIOSKOP AI',
    icon: Clapperboard
  }
};

const STUDIO_ORDER: StudioCategory[] = ['affiliate', 'animasi', 'edukasi', 'podcast', 'film'];

interface AffiliateStudioProps {
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  studioType?: StudioCategory;
  onSelectStudioType?: (type: StudioCategory) => void;
}

const SHOT_OPTIONS: ShotType[] = [
  'Mix (Variasi Shot)',
  'Extreme Wide Shot (EWS)',
  'Wide Shot (WS) / Long Shot',
  'Full Shot (FS)',
  'Medium Wide (MWS) / Cowboy',
  'Medium Shot (MS)',
  'Medium Close Up (MCU)',
  'Close Up (CU)',
  'Extreme Close Up (ECU)',
  'Macro Shot',
];

export const AffiliateStudio: React.FC<AffiliateStudioProps> = ({ 
  showToast, 
  studioType = 'affiliate',
  onSelectStudioType 
}) => {
  // Active Studio selection
  const [currentStudio, setCurrentStudio] = useState<StudioCategory>(studioType);
  const activeStudioConfig = STUDIO_CONFIGS[currentStudio] || STUDIO_CONFIGS.affiliate;

  // Mode tabs
  const [activeTab, setActiveTab] = useState<'studio' | 'ugc'>('studio');

  // Form states
  const [productName, setProductName] = useState(activeStudioConfig.defaultTitle);
  const [productImages, setProductImages] = useState<string[]>([]);
  const [modelImage, setModelImage] = useState<string>('');

  const [aspectRatio, setAspectRatio] = useState<AspectRatio>(activeStudioConfig.defaultAspectRatio);
  const [shotType, setShotType] = useState<ShotType>('Mix (Variasi Shot)');
  const [showShotModal, setShowShotModal] = useState(false);
  const [cameraType, setCameraType] = useState<CameraType>(activeStudioConfig.defaultCamera);
  const [clothingType, setClothingType] = useState<'default' | 'custom'>('default');
  const [customClothing, setCustomClothing] = useState('Kaos kasual warna hitam');
  const [layout, setLayout] = useState<PhotoLayout>('grid');
  const [imageCount, setImageCount] = useState<number>(4);
  const [interactionPose, setInteractionPose] = useState(activeStudioConfig.defaultPose);

  // Sync prop changes
  useEffect(() => {
    if (studioType && studioType !== currentStudio) {
      handleSwitchStudio(studioType as StudioCategory);
    }
  }, [studioType]);

  const handleSwitchStudio = (newStudio: StudioCategory) => {
    setCurrentStudio(newStudio);
    const cfg = STUDIO_CONFIGS[newStudio] || STUDIO_CONFIGS.affiliate;
    setProductName(cfg.defaultTitle);
    setInteractionPose(cfg.defaultPose);
    setCameraType(cfg.defaultCamera);
    setAspectRatio(cfg.defaultAspectRatio);
    if (onSelectStudioType) {
      onSelectStudioType(newStudio);
    }
    showToast(`Beralih ke ${cfg.label}`, 'info');
  };

  // Generation & Results
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState('');
  const [projectResult, setProjectResult] = useState<StoryboardProject | null>(null);

  // Modals
  const [activeVideoScene, setActiveVideoScene] = useState<StoryboardSceneItem | null>(null);
  const [previewImageModal, setPreviewImageModal] = useState<string | null>(null);
  const [showExportPromptModal, setShowExportPromptModal] = useState(false);
  const [tiktokCaption, setTiktokCaption] = useState<string>('');
  const [isGeneratingCaption, setIsGeneratingCaption] = useState(false);
  const [copiedCaption, setCopiedCaption] = useState(false);

  // Handle Reset / Mulai Baru
  const handleReset = () => {
    setProductName('');
    setProductImages([]);
    setModelImage('');
    setInteractionPose('');
    setShotType('Mix (Variasi Shot)');
    setCameraType('Smartphone');
    setLayout('grid');
    setImageCount(4);
    setProjectResult(null);
    showToast('Formulir direset. Silakan mulai proyek baru!', 'info');
  };

  // Handle Image Upload
  const handleProductUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setProductImages(prev => [...prev, event.target!.result as string]);
          showToast('Foto produk berhasil diunggah!', 'success');
        }
      };
      reader.readAsDataURL(files[0]);
    }
  };

  const handleModelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setModelImage(event.target!.result as string);
          showToast('Foto wajah model berhasil diunggah!', 'success');
        }
      };
      reader.readAsDataURL(files[0]);
    }
  };

  // Generate TikTok Caption
  const handleGenerateCaption = async () => {
    setIsGeneratingCaption(true);
    try {
      const pName = productName || 'Produk Favorit';
      const response = await fetch('/api/generate-caption', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productName: pName, mode: activeTab, studioType: currentStudio })
      });
      
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Gagal memuat caption');
      }
      
      const data = await response.json();
      setTiktokCaption(data.caption);
      showToast('Caption TikTok AI berhasil dibuat!', 'success');
    } catch (error: any) {
      console.error(error);
      const errMsg = error.message || 'Gagal memuat caption AI. Coba lagi.';
      showToast(errMsg, 'error');
    } finally {
      setIsGeneratingCaption(false);
    }
  };

  const handleCopyCaption = () => {
    navigator.clipboard.writeText(tiktokCaption);
    setCopiedCaption(true);
    setTimeout(() => setCopiedCaption(false), 2000);
    showToast('Caption berhasil disalin ke clipboard!', 'success');
  };

  // Generate Storyboard AI
  const handleGenerateStoryboard = async () => {
    if (!productName.trim() && productImages.length === 0) {
      showToast('Harap masukkan nama produk atau unggah foto produk terlebih dahulu.', 'error');
      return;
    }

    setIsGenerating(true);
    setGenerationStep('Menganalisis karakteristik produk & wajah model...');

    try {
      const count = layout === 'single' ? 1 : (imageCount || 4);
      const safeName = productName || 'Produk Eksklusif';

      setGenerationStep('Memproses instruksi ke server AI...');
      
      const response = await fetch('/api/generate-storyboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: safeName,
          productImages,
          modelImage,
          shotType,
          cameraType,
          clothesType: clothingType === 'custom' ? customClothing : clothingType,
          interaction: interactionPose,
          count,
          mode: activeTab,
          studioType: currentStudio
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Gagal memuat storyboard AI');
      }

      setGenerationStep('Menerima hasil render gambar dari AI...');
      const data = await response.json();

      const newProject: StoryboardProject = {
        id: 'proj-' + Date.now(),
        productName: safeName,
        aspectRatio,
        shotType,
        cameraType,
        clothingType,
        customClothing,
        layout,
        imageCount: count,
        interactionPose,
        productImages,
        modelImage,
        scenes: data.scenes || [],
        createdAt: new Date().toISOString(),
        tiktokCaption
      };

      setProjectResult(newProject);
      showToast('Storyboard AI berhasil digenerate murni dari AI!', 'success');
    } catch (error: any) {
      console.error(error);
      const errMsg = error.message || 'Terjadi kesalahan saat render AI. Coba lagi.';
      showToast(errMsg, 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadFullGrid = () => {
    if (!projectResult || projectResult.scenes.length === 0) return;
    const link = document.createElement('a');
    link.href = projectResult.scenes[0].imageUrl;
    link.download = `neurona-storyboard-${projectResult.productName.toLowerCase().replace(/\s+/g, '-')}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Storyboard berhasil diunduh!', 'success');
  };

  return (
    <div className="space-y-6">
      {/* Studio Header (matching Genova style) */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-cyan-500 rounded-2xl flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-black text-slate-800 tracking-tight">{activeStudioConfig.name}</span>
                <span className="px-2 py-0.5 bg-amber-500 text-white font-black text-[10px] rounded-md tracking-wider">
                  V2.9.1 LITE
                </span>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-md border border-emerald-200">
                  Akses Gratis Member
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">{activeStudioConfig.subtitle}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-2 px-3.5 py-2 bg-cyan-50 hover:bg-cyan-100 text-cyan-800 font-bold text-xs rounded-xl border border-cyan-200/80 transition-colors shadow-sm self-stretch sm:self-auto justify-center"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>MULAI BARU</span>
          </button>
        </div>

        {/* 5-Studio Suite Selector Tabs */}
        <div className="pt-4 border-b border-slate-100 pb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
              Pilih Studio Spesialis (5-Studio AI Suite)
            </span>
            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
              {activeStudioConfig.tag}
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {STUDIO_ORDER.map((sKey) => {
              const cfg = STUDIO_CONFIGS[sKey];
              const IconComp = cfg.icon;
              const isSelected = currentStudio === sKey;
              return (
                <button
                  key={sKey}
                  type="button"
                  onClick={() => handleSwitchStudio(sKey)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl font-bold text-xs transition-all text-left ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25 ring-2 ring-blue-500/20'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/60'
                  }`}
                >
                  <IconComp className={`w-4 h-4 shrink-0 ${isSelected ? 'text-white' : 'text-blue-600'}`} />
                  <span className="truncate">{cfg.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Switcher: AI Studio / Bypass UGC */}
        <div className="flex flex-col gap-3 pt-4">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('studio')}
              className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 ${
                activeTab === 'studio'
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-md shadow-blue-500/20'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              <BrainCircuit className="w-4 h-4" />
              <span>AI Studio PRO</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('ugc');
                showToast('Mode Bypass UGC aktif: Meniru nuansa video amatir organik TikTok!', 'info');
              }}
              className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 ${
                activeTab === 'ugc'
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-md shadow-blue-500/20'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <span>Bypass UGC</span>
            </button>
          </div>
          
          <div className={`p-3 rounded-xl border text-xs leading-relaxed ${activeTab === 'studio' ? 'bg-blue-50 border-blue-100 text-blue-800' : 'bg-emerald-50 border-emerald-100 text-emerald-800'}`}>
            {activeTab === 'studio' 
              ? <strong>Mode AI Studio PRO:</strong> 
              : <strong>Mode Bypass UGC:</strong>}
            {' '}
            {activeTab === 'studio' 
              ? 'Generator akan berfokus pada hasil sinematik, pencahayaan studio resolusi tinggi, dan estetika iklan komersial yang dipoles.' 
              : 'Generator akan meniru gaya video amatir (User Generated Content), pencahayaan kasual/kamera HP, untuk menciptakan hook natural (tidak terlihat seperti iklan).'}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form Settings (matching Genova inputs) */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-5 sm:p-6 space-y-5">
            {/* 1. Upload Boxes: Foto Produk (Wajib) & Wajah Model (Opsi) */}
            <div className="grid grid-cols-2 gap-3">
              {/* Foto Produk / Subjek */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                  <ImageIcon className="w-3 h-3 text-blue-600" />
                  <span>{activeStudioConfig.subjectLabel}</span>
                </label>
                <label className="border-2 border-dashed border-slate-200 hover:border-blue-400 bg-slate-50 hover:bg-blue-50/40 rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer transition-all h-36 relative overflow-hidden group">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleProductUpload}
                    className="hidden"
                  />
                  {productImages.length > 0 ? (
                    <>
                      <img
                        src={productImages[0]}
                        alt="Produk"
                        className="w-full h-full object-cover rounded-xl"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold">
                        Ganti Foto
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-2">
                        <Upload className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-slate-700">Upload</span>
                      <span className="text-[10px] text-slate-400 text-center px-1 truncate max-w-full">
                        {activeStudioConfig.subjectHint}
                      </span>
                    </>
                  )}
                </label>
              </div>

              {/* Wajah Model */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                  <User className="w-3 h-3 text-cyan-600" />
                  <span>Wajah Model (Opsi)</span>
                </label>
                <label className="border-2 border-dashed border-slate-200 hover:border-cyan-400 bg-slate-50 hover:bg-cyan-50/40 rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer transition-all h-36 relative overflow-hidden group">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleModelUpload}
                    className="hidden"
                  />
                  {modelImage ? (
                    <>
                      <img
                        src={modelImage}
                        alt="Model"
                        className="w-full h-full object-cover rounded-xl"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold">
                        Ganti Wajah
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-9 h-9 rounded-full bg-cyan-100 text-cyan-600 flex items-center justify-center mb-2">
                        <User className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-slate-700">Upload</span>
                      <span className="text-[10px] text-slate-400">Wajah</span>
                    </>
                  )}
                </label>
              </div>
            </div>

            {/* Nama / Jenis Produk */}
            <div className="space-y-1.5">
              <input
                type="text"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder={activeStudioConfig.placeholderSubject}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
              />
            </div>

            {/* Caption AI */}
            <div className="bg-gradient-to-r from-cyan-50 to-blue-50 border border-cyan-100 rounded-2xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-cyan-900 flex items-center gap-1.5 uppercase">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-600" />
                  <span>{activeStudioConfig.captionLabel}</span>
                </span>
                <button
                  type="button"
                  onClick={handleGenerateCaption}
                  disabled={isGeneratingCaption}
                  className="px-3 py-1 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 text-white font-bold text-[10px] rounded-lg shadow-sm transition-all flex items-center gap-1 uppercase"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>{isGeneratingCaption ? 'Membuat...' : 'GENERATE (AI)'}</span>
                </button>
              </div>

              {tiktokCaption && (
                <div className="relative pt-1">
                  <p className="text-[11px] text-slate-700 bg-white/80 p-2.5 rounded-xl border border-cyan-100/80 leading-relaxed max-h-20 overflow-y-auto font-sans">
                    {tiktokCaption}
                  </p>
                  <button
                    type="button"
                    onClick={handleCopyCaption}
                    className="mt-1.5 text-[10px] font-bold text-cyan-700 hover:text-cyan-900 flex items-center gap-1 ml-auto"
                  >
                    {copiedCaption ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedCaption ? 'Tersalin!' : 'Salin Text'}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Camera Parameters Grid: Rasio & Tipe Shot Kamera */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Rasio</label>
                <div className="relative">
                  <select
                    value={aspectRatio}
                    onChange={(e) => setAspectRatio(e.target.value as AspectRatio)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 appearance-none focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="9:16">9:16 (Portrait)</option>
                    <option value="1:1">1:1 (Square)</option>
                    <option value="16:9">16:9 (Landscape)</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tipe Shot Kamera</label>
                <button
                  type="button"
                  onClick={() => setShowShotModal(true)}
                  className="w-full px-3 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 text-left flex items-center justify-between transition-colors"
                >
                  <span className="truncate">{shotType}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                </button>
              </div>
            </div>

            {/* Jenis Kamera & Pakaian Karakter */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Jenis Kamera</label>
                <div className="relative">
                  <select
                    value={cameraType}
                    onChange={(e) => setCameraType(e.target.value as CameraType)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 appearance-none focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="Smartphone (iPhone)">Smartphone (iPhone)</option>
                    <option value="Mirrorless">Mirrorless (Sony A7)</option>
                    <option value="DSLR Film">DSLR Film 35mm</option>
                    <option value="Cinematic 8K">Cinematic 8K</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Pakaian Karakter</label>
                <div className="flex bg-slate-50 border border-slate-200 rounded-xl p-0.5">
                  <button
                    type="button"
                    onClick={() => setClothingType('default')}
                    className={`flex-1 py-2 text-[11px] font-bold rounded-lg transition-all ${
                      clothingType === 'default'
                        ? 'bg-white text-slate-800 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    Default
                  </button>
                  <button
                    type="button"
                    onClick={() => setClothingType('custom')}
                    className={`flex-1 py-2 text-[11px] font-bold rounded-lg transition-all ${
                      clothingType === 'custom'
                        ? 'bg-white text-slate-800 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    Custom
                  </button>
                </div>
              </div>
            </div>

            {clothingType === 'custom' && (
              <input
                type="text"
                value={customClothing}
                onChange={(e) => setCustomClothing(e.target.value)}
                placeholder="Deskripsi pakaian (misal: Kemeja flanel merah kasual)"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700"
              />
            )}

            {/* Layout Foto (Hasil) */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Layout Foto (Hasil)</label>
              <div className="flex bg-slate-50 border border-slate-200 rounded-xl p-1 gap-1">
                <button
                  type="button"
                  onClick={() => setLayout('single')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                    layout === 'single'
                      ? 'bg-white text-blue-600 shadow-sm border border-slate-100'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Single Photo (Standar)
                </button>
                <button
                  type="button"
                  onClick={() => setLayout('grid')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                    layout === 'grid'
                      ? 'bg-white text-blue-600 shadow-sm border border-slate-100'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Multiple Photo (Kolase/Grid)
                </button>
              </div>
            </div>

            {/* Jumlah Gambar Slider */}
            {layout === 'grid' && (
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Jumlah Gambar</span>
                  <span className="font-bold text-cyan-600">{imageCount} Gambar</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="4"
                  step="1"
                  value={imageCount}
                  onChange={(e) => setImageCount(parseInt(e.target.value))}
                  className="w-full accent-cyan-500 cursor-pointer"
                />
              </div>
            )}

            {/* Interaksi / Pose */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Interaksi / Pose</label>
              <textarea
                rows={2}
                value={interactionPose}
                onChange={(e) => setInteractionPose(e.target.value)}
                placeholder="Contoh: Sedang memegang produk di cafe..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all resize-none"
              />
            </div>

            {/* Generate Button */}
            <button
              type="button"
              onClick={handleGenerateStoryboard}
              disabled={isGenerating}
              className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white font-black text-sm rounded-2xl shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>{generationStep || 'Memproses AI...'}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>GENERATE STORYBOARD AI (GRATIS)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Storyboard Collage Output (matching Genova screenshot output) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-4 sm:p-6 flex flex-col items-center">
            {projectResult ? (
              <div className="w-full max-w-md space-y-4">
                {/* Header label in card */}
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-slate-800">GENOVA+</span>
                    <span className="px-1.5 py-0.2 bg-amber-500 text-white text-[9px] font-bold rounded">
                      V2.9.1 LITE
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-semibold">
                    {projectResult.layout === 'grid' ? 'Grid 4 Kolase' : 'Single Photo'} • {projectResult.aspectRatio}
                  </span>
                </div>

                {/* 2x2 Grid or Single View matching screenshot */}
                {projectResult.layout === 'grid' ? (
                  <div className="grid grid-cols-2 gap-1.5 bg-slate-900 p-1.5 rounded-2xl shadow-xl overflow-hidden border border-slate-800">
                    {projectResult.scenes.slice(0, 4).map((scene, idx) => (
                      <div 
                        key={idx} 
                        className="relative aspect-[9/16] bg-slate-800 overflow-hidden group cursor-pointer"
                        onClick={() => setPreviewImageModal(scene.imageUrl)}
                      >
                        <img
                          src={scene.imageUrl}
                          alt={scene.label}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          crossOrigin="anonymous"
                        />
                        {/* Overlay Scene Tag like Genova screenshot */}
                        <div className="absolute top-4 inset-x-0 flex justify-center pointer-events-none">
                          <span className="text-white font-black text-xs sm:text-sm drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] tracking-wider">
                            {scene.label}
                          </span>
                        </div>
                        {/* Quick action on hover */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveVideoScene(scene);
                            }}
                            className="px-2.5 py-1 bg-white text-slate-900 font-bold text-[10px] rounded-lg shadow-md flex items-center gap-1 hover:bg-slate-100"
                          >
                            <Video className="w-3 h-3 text-indigo-600" />
                            <span>Video</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div 
                    className="relative aspect-[9/16] bg-slate-900 rounded-2xl shadow-xl overflow-hidden group cursor-pointer border border-slate-800 max-h-[500px]"
                    onClick={() => setPreviewImageModal(projectResult.scenes[0]?.imageUrl || '')}
                  >
                    <img
                      src={projectResult.scenes[0]?.imageUrl}
                      alt="Single Scene"
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      crossOrigin="anonymous"
                    />
                    <div className="absolute top-4 inset-x-0 flex justify-center pointer-events-none">
                      <span className="text-white font-black text-sm drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] tracking-wider">
                        SCENE 1
                      </span>
                    </div>
                  </div>
                )}

                {/* Bottom Action Bar (matching Genova screenshot: Eye, Refresh, Edit, Download, Video, Trash) */}
                <div className="flex items-center justify-around py-3 px-4 bg-slate-50 border border-slate-200/80 rounded-2xl text-slate-500">
                  <button
                    type="button"
                    title="Lihat Penuh"
                    onClick={() => setPreviewImageModal(projectResult.scenes[0]?.imageUrl || '')}
                    className="p-2 hover:text-blue-600 hover:bg-white rounded-xl transition-colors"
                  >
                    <Eye className="w-5 h-5" />
                  </button>

                  <button
                    type="button"
                    title="Regenerate Storyboard"
                    onClick={handleGenerateStoryboard}
                    className="p-2 hover:text-blue-600 hover:bg-white rounded-xl transition-colors"
                  >
                    <RefreshCw className="w-5 h-5" />
                  </button>

                  <button
                    type="button"
                    title="Edit Pengaturan"
                    onClick={() => showToast('Silakan ubah pose atau pengaturan kamera di formulir sebelah kiri.', 'info')}
                    className="p-2 hover:text-blue-600 hover:bg-white rounded-xl transition-colors"
                  >
                    <Edit3 className="w-5 h-5" />
                  </button>

                  <button
                    type="button"
                    title="Unduh Gambar Storyboard"
                    onClick={handleDownloadFullGrid}
                    className="p-2 hover:text-blue-600 hover:bg-white rounded-xl transition-colors"
                  >
                    <Download className="w-5 h-5" />
                  </button>

                  {/* Video Generator Pipeline Launcher */}
                  <button
                    type="button"
                    title="Generate Video AI (OpenArt, Highfield, Google Flow)"
                    onClick={() => setActiveVideoScene(projectResult.scenes[0])}
                    className="p-2 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-xl transition-colors relative"
                  >
                    <Video className="w-5 h-5" />
                    <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-600"></span>
                    </span>
                  </button>

                  <button
                    type="button"
                    title="Hapus Storyboard"
                    onClick={() => {
                      setProjectResult(null);
                      showToast('Storyboard berhasil dihapus.', 'info');
                    }}
                    className="p-2 hover:text-rose-600 hover:bg-white rounded-xl transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>

                {/* 1-Click Export Prompt Button (Prominent Feature) */}
                <div className="bg-gradient-to-r from-blue-900/90 via-slate-900 to-indigo-950 p-4 rounded-2xl border border-cyan-500/40 shadow-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300">
                        <Zap className="w-4 h-4 text-amber-400" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-white tracking-wide">1-CLICK EXPORT PROMPT</h4>
                        <p className="text-[10px] text-cyan-300">Google Flow, Gemini Chat, Kling AI & Runway</p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 bg-cyan-950 text-cyan-400 text-[10px] font-bold rounded-full border border-cyan-500/30">
                      Instan
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowExportPromptModal(true)}
                    className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-400 hover:from-blue-500 hover:to-cyan-300 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center gap-2 hover:scale-[1.01]"
                  >
                    <Copy className="w-4 h-4" />
                    <span>Ekspor Prompt Video Siap Pakai ({projectResult.scenes.length} Scene)</span>
                  </button>
                </div>

                {/* Video Generation Quick Buttons per Scene */}
                <div className="p-3.5 bg-indigo-50/70 border border-indigo-100 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-indigo-950 flex items-center gap-1.5">
                      <Video className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Ekspor ke Video AI (Bebas Morf Produk)</span>
                    </span>
                    <span className="text-[10px] text-indigo-700 font-bold">Pilih Scene:</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {projectResult.scenes.map((sc) => (
                      <button
                        key={sc.sceneNumber}
                        type="button"
                        onClick={() => setActiveVideoScene(sc)}
                        className="py-1.5 px-2 bg-white hover:bg-indigo-600 hover:text-white text-slate-700 border border-indigo-200/80 rounded-xl text-[11px] font-bold transition-all shadow-sm flex items-center justify-center gap-1"
                      >
                        <span>Scene {sc.sceneNumber}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* Empty state */
              <div className="w-full h-96 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center p-8 text-center text-slate-400">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                  <ImageIcon className="w-7 h-7" />
                </div>
                <h4 className="text-sm font-bold text-slate-700 mb-1">Storyboard Belum Digenerate</h4>
                <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
                  Isi pengaturan scene dan klik <strong>Generate Storyboard AI</strong> untuk melihat hasil visual grid atau single photo.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Camera Shot Modal Selector (matching Genova screenshot popup) */}
      {showShotModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl max-w-md w-full p-6 relative max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">
                Pilih Tipe Shot Kamera
              </h3>
              <button
                type="button"
                onClick={() => setShowShotModal(false)}
                className="p-1 hover:bg-slate-100 rounded-full text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1.5">
              {SHOT_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => {
                    setShotType(opt);
                    setShowShotModal(false);
                    showToast(`Tipe shot diatur ke: ${opt}`, 'info');
                  }}
                  className={`w-full py-3 px-4 rounded-xl text-xs font-bold text-left flex items-center justify-between transition-all ${
                    shotType === opt
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <span>{opt}</span>
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                    shotType === opt ? 'border-blue-600 bg-blue-600' : 'border-slate-300'
                  }`}>
                    {shotType === opt && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Preview Image Modal */}
      {previewImageModal && (
        <div 
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setPreviewImageModal(null)}
        >
          <button
            type="button"
            onClick={() => setPreviewImageModal(null)}
            className="absolute top-5 right-5 text-white/80 hover:text-white p-2 rounded-full bg-white/10"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={previewImageModal}
            alt="Preview"
            className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl"
          />
        </div>
      )}

      {/* Video Generation Pipeline Modal (OpenArt AI, Highfield AI, Google Flow with Anti-Morphing) */}
      {activeVideoScene && (
        <VideoGenerationModal
          scene={activeVideoScene}
          productName={projectResult?.productName || productName}
          onClose={() => setActiveVideoScene(null)}
          showToast={showToast}
        />
      )}

      {/* 1-Click Export Prompt Modal */}
      {projectResult && (
        <ExportPromptModal
          isOpen={showExportPromptModal}
          onClose={() => setShowExportPromptModal(false)}
          productName={projectResult.productName || productName}
          scenes={projectResult.scenes}
          aspectRatio={projectResult.aspectRatio || aspectRatio}
          cameraType={projectResult.cameraType || cameraType}
          onCopySuccess={(msg) => showToast(msg, 'success')}
        />
      )}
    </div>
  );
};
