import React, { useState } from 'react';
import { 
  X, 
  Video, 
  Copy, 
  Check, 
  ExternalLink, 
  ShieldCheck, 
  Sparkles, 
  Download, 
  AlertTriangle,
  Layers,
  Key
} from 'lucide-react';
import { StoryboardSceneItem } from '../types';

interface VideoGenerationModalProps {
  scene: StoryboardSceneItem;
  productName: string;
  onClose: () => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const VideoGenerationModal: React.FC<VideoGenerationModalProps> = ({
  scene,
  productName,
  onClose,
  showToast
}) => {
  const [activePipeline, setActivePipeline] = useState<'openart' | 'highfield' | 'googleflow'>('openart');
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [copiedNegative, setCopiedNegative] = useState(false);
  const [isConnectedOAuth, setIsConnectedOAuth] = useState<{ [key: string]: boolean }>({
    openart: false,
    highfield: false,
  });
  const [oauthLoading, setOauthLoading] = useState(false);

  // Anti-morphing enhanced prompt specifically solving Genova's weakness:
  // Preserves exact packaging typography, rigid geometric structure, and prevents hallucinations
  const cleanProductName = productName || 'Produk Eksklusif';
  
  const antiMorphingPrompt = `(Subject-Consistency:1.4), exact physical product preservation for "${cleanProductName}". First frame image-to-video lock. The person is holding and showcasing the exact ${cleanProductName} from the reference image without any alteration to the label font, packaging geometry, or color. Subtle natural movement: slight head turn, blinking, gentle hand tilt showing the product to the camera. Smooth cinematic 4K camera motion, soft natural lighting, consistent texture, zero geometric distortion of the product.`;

  const negativeVideoPrompt = `morphing product, changing labels, misspelled brand text, dissolving packaging, warping container, mutating objects, multiple products, unstable geometry, fluctuating hands, distorted fingers, flickering logo, jittery frames, blurry details, cartoonish artifacts.`;

  const handleCopy = (text: string, isNegative: boolean = false) => {
    navigator.clipboard.writeText(text);
    if (isNegative) {
      setCopiedNegative(true);
      setTimeout(() => setCopiedNegative(false), 2500);
    } else {
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 2500);
    }
    showToast('Prompt berhasil disalin ke clipboard!', 'success');
  };

  const handleSimulateOAuth = (platform: 'openart' | 'highfield') => {
    setOauthLoading(true);
    setTimeout(() => {
      setIsConnectedOAuth(prev => ({ ...prev, [platform]: true }));
      setOauthLoading(false);
      showToast(`Akun ${platform === 'openart' ? 'OpenArt AI' : 'Highfield A.I'} berhasil terhubung via OAuth!`, 'success');
    }, 1200);
  };

  const handleDownloadScene = () => {
    const link = document.createElement('a');
    link.href = scene.imageUrl;
    link.download = `neurona-${productName.toLowerCase().replace(/\s+/g, '-')}-scene-${scene.sceneNumber}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Gambar Scene berhasil diunduh sebagai Keyframe!', 'success');
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl max-w-2xl w-full p-5 sm:p-7 relative my-6 max-h-[92vh] overflow-y-auto">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors p-1.5 hover:bg-slate-100 rounded-full"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-start gap-3.5 mb-5">
          <div className="w-11 h-11 bg-gradient-to-tr from-indigo-600 to-violet-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20 shrink-0">
            <Video className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg sm:text-xl font-black text-slate-800 tracking-tight">
                Generate Video AI: Scene {scene.sceneNumber}
              </h3>
              <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded-md border border-indigo-200/60">
                Anti-Morphing Engine
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Ubah storyboard menjadi video dinamis dengan jaminan produk tidak akan berubah bentuk
            </p>
          </div>
        </div>

        {/* Keyframe Preview & Anti-Morphing Badge */}
        <div className="flex flex-col sm:flex-row gap-4 p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl mb-5 items-center">
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden shrink-0 border border-slate-200 shadow-sm bg-slate-200">
            <img 
              src={scene.imageUrl} 
              alt={`Scene ${scene.sceneNumber}`}
              className="w-full h-full object-cover"
              crossOrigin="anonymous"
            />
            <div className="absolute top-1.5 left-1.5 bg-black/70 text-white font-black text-[9px] px-1.5 py-0.5 rounded">
              KEYFRAME
            </div>
          </div>

          <div className="flex-1 space-y-1 text-xs">
            <div className="flex items-center gap-1.5 text-emerald-700 font-bold">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Proteksi Anti-Morphing Neurona Aktif</span>
            </div>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              <strong>Solusi keluhan Genova:</strong> Produk tidak akan berubah menjadi botol/barang lain karena prompt kami mengunci struktur geometris & teks label, didukung penggunaan gambar ini sebagai <em>First Frame (Start Image)</em>.
            </p>
            <div className="pt-1 flex gap-2">
              <button
                type="button"
                onClick={handleDownloadScene}
                className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-colors"
              >
                <Download className="w-3 h-3 text-slate-500" />
                <span>Unduh Start Image</span>
              </button>
            </div>
          </div>
        </div>

        {/* Pipeline Selection Tabs */}
        <div className="mb-4">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
            Pilih Jalur Rendering Video:
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setActivePipeline('openart')}
              className={`p-3 rounded-xl border text-left transition-all ${
                activePipeline === 'openart'
                  ? 'border-indigo-600 bg-indigo-50/50 shadow-sm ring-2 ring-indigo-500/20'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-slate-800">MCP OpenArt AI</span>
                {isConnectedOAuth.openart && (
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                )}
              </div>
              <p className="text-[10px] text-slate-500">OAuth Akun Pengguna</p>
            </button>

            <button
              type="button"
              onClick={() => setActivePipeline('highfield')}
              className={`p-3 rounded-xl border text-left transition-all ${
                activePipeline === 'highfield'
                  ? 'border-indigo-600 bg-indigo-50/50 shadow-sm ring-2 ring-indigo-500/20'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-slate-800">MCP Highfield AI</span>
                {isConnectedOAuth.highfield && (
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                )}
              </div>
              <p className="text-[10px] text-slate-500">Kling / Hiegfield Video</p>
            </button>

            <button
              type="button"
              onClick={() => setActivePipeline('googleflow')}
              className={`p-3 rounded-xl border text-left transition-all ${
                activePipeline === 'googleflow'
                  ? 'border-indigo-600 bg-indigo-50/50 shadow-sm ring-2 ring-indigo-500/20'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-slate-800">Google Flow</span>
                <Sparkles className="w-3 h-3 text-amber-500" />
              </div>
              <p className="text-[10px] text-slate-500">Arahkan Link Langsung</p>
            </button>
          </div>
        </div>

        {/* Pipeline Details */}
        <div className="space-y-4">
          {/* TAB 1: MCP OpenArt AI */}
          {activePipeline === 'openart' && (
            <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/60 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Jalur MCP OpenArt AI</h4>
                  <p className="text-[11px] text-slate-500">Koneksikan akun OpenArt Anda untuk render video langsung dari storyboard</p>
                </div>
                {isConnectedOAuth.openart ? (
                  <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-lg text-[10px] font-bold flex items-center gap-1">
                    <Check className="w-3 h-3" /> Terhubung
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSimulateOAuth('openart')}
                    disabled={oauthLoading}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm"
                  >
                    <Key className="w-3.5 h-3.5" />
                    <span>{oauthLoading ? 'Menghubungkan...' : 'Login OAuth OpenArt'}</span>
                  </button>
                )}
              </div>

              <div className="pt-2 border-t border-slate-200/80">
                <p className="text-[11px] font-semibold text-slate-700 mb-1.5">Prompt Video Anti-Morphing OpenArt:</p>
                <div className="relative">
                  <textarea
                    readOnly
                    rows={3}
                    value={antiMorphingPrompt}
                    className="w-full text-xs font-mono bg-white border border-slate-200 rounded-xl p-3 pr-20 text-slate-700 resize-none focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleCopy(antiMorphingPrompt)}
                    className="absolute top-2 right-2 px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-[11px] font-bold flex items-center gap-1 border border-indigo-200 transition-colors"
                  >
                    {copiedPrompt ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedPrompt ? 'Tersalin' : 'Salin'}</span>
                  </button>
                </div>
              </div>

              <a
                href="https://openart.ai/create"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-md shadow-indigo-500/10"
              >
                <span>Buka OpenArt AI Video Generator</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}

          {/* TAB 2: MCP Highfield AI */}
          {activePipeline === 'highfield' && (
            <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/60 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Jalur MCP Highfield A.I</h4>
                  <p className="text-[11px] text-slate-500">Pipeline video sinematik dengan model Kling / Highfield via akun pengguna</p>
                </div>
                {isConnectedOAuth.highfield ? (
                  <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-lg text-[10px] font-bold flex items-center gap-1">
                    <Check className="w-3 h-3" /> Terhubung
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSimulateOAuth('highfield')}
                    disabled={oauthLoading}
                    className="px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm"
                  >
                    <Key className="w-3.5 h-3.5" />
                    <span>{oauthLoading ? 'Menghubungkan...' : 'Login OAuth Highfield'}</span>
                  </button>
                )}
              </div>

              <div className="pt-2 border-t border-slate-200/80">
                <p className="text-[11px] font-semibold text-slate-700 mb-1.5">Prompt Video Anti-Morphing Highfield:</p>
                <div className="relative">
                  <textarea
                    readOnly
                    rows={3}
                    value={antiMorphingPrompt}
                    className="w-full text-xs font-mono bg-white border border-slate-200 rounded-xl p-3 pr-20 text-slate-700 resize-none focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleCopy(antiMorphingPrompt)}
                    className="absolute top-2 right-2 px-2.5 py-1 bg-violet-50 hover:bg-violet-100 text-violet-700 rounded-lg text-[11px] font-bold flex items-center gap-1 border border-violet-200 transition-colors"
                  >
                    {copiedPrompt ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedPrompt ? 'Tersalin' : 'Salin'}</span>
                  </button>
                </div>
              </div>

              <a
                href="https://klingai.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-md shadow-violet-500/10"
              >
                <span>Buka Highfield / Kling Video Studio</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}

          {/* TAB 3: Google Flow */}
          {activePipeline === 'googleflow' && (
            <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/60 space-y-3">
              <div>
                <h4 className="text-xs font-bold text-slate-800">Jalur Google Flow</h4>
                <p className="text-[11px] text-slate-500">Salin prompt video konsisten dan luncurkan Google Flow langsung</p>
              </div>

              <div className="bg-amber-50 border border-amber-200/70 rounded-xl p-3 text-[11px] text-amber-800 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p>
                  <strong>Petunjuk Google Flow:</strong> Buka Google Flow melalui tombol di bawah, unggah gambar scene ini sebagai referensi, lalu tempelkan prompt yang telah disalin.
                </p>
              </div>

              <div className="space-y-2">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[11px] font-semibold text-slate-700">Prompt Utama (Positif):</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(antiMorphingPrompt)}
                      className="text-[10px] text-indigo-600 hover:text-indigo-700 font-bold flex items-center gap-1"
                    >
                      {copiedPrompt ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedPrompt ? 'Tersalin' : 'Salin Prompt Positif'}</span>
                    </button>
                  </div>
                  <textarea
                    readOnly
                    rows={2}
                    value={antiMorphingPrompt}
                    className="w-full text-xs font-mono bg-white border border-slate-200 rounded-xl p-2.5 text-slate-700 resize-none focus:outline-none"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[11px] font-semibold text-slate-700">Prompt Negatif (Wajib Cegah Morf Produk):</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(negativeVideoPrompt, true)}
                      className="text-[10px] text-indigo-600 hover:text-indigo-700 font-bold flex items-center gap-1"
                    >
                      {copiedNegative ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedNegative ? 'Tersalin' : 'Salin Prompt Negatif'}</span>
                    </button>
                  </div>
                  <textarea
                    readOnly
                    rows={2}
                    value={negativeVideoPrompt}
                    className="w-full text-xs font-mono bg-white border border-slate-200 rounded-xl p-2.5 text-slate-700 resize-none focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={() => {
                    handleCopy(antiMorphingPrompt);
                    window.open('https://labs.google/flow', '_blank', 'noopener,noreferrer');
                  }}
                  className="flex-1 py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/10"
                >
                  <span>Salin Prompt & Arahkan ke Google Flow</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleDownloadScene}
                  className="py-2.5 px-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                  <span>Unduh Gambar</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="mt-5 pt-3 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs rounded-xl transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
