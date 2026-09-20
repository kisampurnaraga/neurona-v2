import React, { useState } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  Sparkles, 
  ExternalLink, 
  Film, 
  Bot, 
  Zap, 
  Layers, 
  Download,
  Share2,
  CheckCircle2
} from 'lucide-react';
import { StoryboardSceneItem } from '../types';

interface ExportPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  productName: string;
  scenes: StoryboardSceneItem[];
  aspectRatio?: string;
  cameraType?: string;
  onCopySuccess?: (msg: string) => void;
}

export const ExportPromptModal: React.FC<ExportPromptModalProps> = ({
  isOpen,
  onClose,
  productName,
  scenes,
  aspectRatio = '9:16',
  cameraType = 'Smartphone (iPhone)',
  onCopySuccess
}) => {
  const [targetPlatform, setTargetPlatform] = useState<'flow_gemini' | 'kling' | 'runway' | 'luma'>('flow_gemini');
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedSceneIndex, setCopiedSceneIndex] = useState<number | null>(null);

  if (!isOpen) return null;

  // Generate platform-specific prompt text for a scene
  const formatScenePrompt = (scene: StoryboardSceneItem, idx: number, platform: string) => {
    const sceneNum = scene.sceneNumber || idx + 1;
    const baseDesc = scene.description || scene.prompt || `Adegan promosi visual produk ${productName}`;
    const shot = scene.shotType || 'Medium Shot';

    if (platform === 'flow_gemini') {
      return `[SCENE ${sceneNum} - GOOGLE FLOW / GEMINI PROMPT]
Tipe Shot: ${shot}
Kamera: ${cameraType}, Rasio: ${aspectRatio}
Prompt Visual: Ultra-photorealistic cinematic scene of ${baseDesc}. High-end commercial video production, 8k resolution, volumetric studio lighting, smooth continuous motion, 60fps.
Pergerakan Kamera: Slow cinematic push-in toward ${productName}, hyper-realistic texture detail.`;
    }

    if (platform === 'kling') {
      return `Scene ${sceneNum} (${shot}): Cinematic commercial video, ${baseDesc}. Shot on ${cameraType}, dynamic camera movement, studio lighting, hyper-realistic, 4k ultra-detailed, professional color grading, seamless motion, --ar ${aspectRatio}`;
    }

    if (platform === 'runway') {
      return `${baseDesc}, ${shot}, cinematic studio illumination, shot with ${cameraType}, ultra HD quality, commercial product video, smooth camera glide forward, photorealistic --ar ${aspectRatio}`;
    }

    // Default / Luma
    return `Cinematic shot ${sceneNum}: ${baseDesc}. Camera: ${cameraType}, Shot: ${shot}. Photorealistic, natural lighting, realistic physics, smooth motion, high fidelity product reveal.`;
  };

  // Compile all prompts
  const getAllPromptsText = () => {
    const header = `=== EXPORT PROMPT STORYBOARD AI ===\nProduk: ${productName || 'Produk'}\nPlatform Target: ${
      targetPlatform === 'flow_gemini' ? 'Google Flow & Google Chat Gemini' :
      targetPlatform === 'kling' ? 'Kling AI' :
      targetPlatform === 'runway' ? 'Runway Gen-3' : 'Luma Dream Machine'
    }\nRasio: ${aspectRatio} | Kamera: ${cameraType}\nTotal Scene: ${scenes.length}\n=====================================\n\n`;

    const body = scenes.map((scene, idx) => {
      return formatScenePrompt(scene, idx, targetPlatform);
    }).join('\n\n-------------------------------------\n\n');

    const footer = `\n\n=====================================\nInstruksi: Tempel (Paste) prompt di atas ke platform AI video pilihan Anda untuk mulai generate video per adegan.`;

    return header + body + footer;
  };

  const handleCopyAll = () => {
    const text = getAllPromptsText();
    navigator.clipboard.writeText(text);
    setCopiedAll(true);
    if (onCopySuccess) onCopySuccess('Semua prompt berhasil disalin ke clipboard!');
    setTimeout(() => setCopiedAll(false), 2500);
  };

  const handleCopySingle = (scene: StoryboardSceneItem, idx: number) => {
    const text = formatScenePrompt(scene, idx, targetPlatform);
    navigator.clipboard.writeText(text);
    setCopiedSceneIndex(idx);
    if (onCopySuccess) onCopySuccess(`Prompt Scene ${idx + 1} berhasil disalin!`);
    setTimeout(() => setCopiedSceneIndex(null), 2000);
  };

  const handleDownloadTxt = () => {
    const text = getAllPromptsText();
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `prompts-${(productName || 'storyboard').toLowerCase().replace(/\s+/g, '-')}-${targetPlatform}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    if (onCopySuccess) onCopySuccess('File .txt berhasil diunduh!');
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-6 animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden text-slate-100">
        
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
              <Zap className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white">1-Click Export Prompt Video AI</h3>
                <span className="px-2 py-0.5 bg-cyan-950 text-cyan-400 border border-cyan-500/30 text-[10px] font-bold rounded-full">
                  Siap Generate
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Salin prompt yang telah dioptimasi dan gunakan di platform AI video pilihan Anda.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Platform Selector Tabs */}
        <div className="px-5 sm:px-6 pt-4 pb-3 bg-slate-950/40 border-b border-slate-800/80">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
            Pilih Format Platform AI Video:
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              type="button"
              onClick={() => setTargetPlatform('flow_gemini')}
              className={`p-2.5 rounded-xl text-xs font-bold transition-all border text-left flex flex-col gap-1 ${
                targetPlatform === 'flow_gemini'
                  ? 'bg-blue-600/20 border-blue-500 text-blue-300 shadow-md'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Bot className="w-3.5 h-3.5 text-cyan-400" />
                <span>Google Flow / Gemini</span>
              </span>
              <span className="text-[10px] text-slate-400 font-normal">Optimal untuk Google Studio</span>
            </button>

            <button
              type="button"
              onClick={() => setTargetPlatform('kling')}
              className={`p-2.5 rounded-xl text-xs font-bold transition-all border text-left flex flex-col gap-1 ${
                targetPlatform === 'kling'
                  ? 'bg-amber-600/20 border-amber-500 text-amber-300 shadow-md'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Kling AI</span>
              </span>
              <span className="text-[10px] text-slate-400 font-normal">Format Parameter --ar</span>
            </button>

            <button
              type="button"
              onClick={() => setTargetPlatform('runway')}
              className={`p-2.5 rounded-xl text-xs font-bold transition-all border text-left flex flex-col gap-1 ${
                targetPlatform === 'runway'
                  ? 'bg-purple-600/20 border-purple-500 text-purple-300 shadow-md'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Film className="w-3.5 h-3.5 text-purple-400" />
                <span>Runway Gen-3</span>
              </span>
              <span className="text-[10px] text-slate-400 font-normal">Camera Glide Prompts</span>
            </button>

            <button
              type="button"
              onClick={() => setTargetPlatform('luma')}
              className={`p-2.5 rounded-xl text-xs font-bold transition-all border text-left flex flex-col gap-1 ${
                targetPlatform === 'luma'
                  ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300 shadow-md'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>Luma / Lainnya</span>
              </span>
              <span className="text-[10px] text-slate-400 font-normal">Dream Machine & Universal</span>
            </button>
          </div>
        </div>

        {/* Modal Body: Prompt List */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4">
          
          {/* Quick Platform Launchers */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
            <span className="text-slate-400 font-medium">Buka Platform Video AI Langsung:</span>
            <div className="flex flex-wrap items-center gap-2">
              <a
                href="https://gemini.google.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-lg border border-slate-700 font-bold transition-colors inline-flex items-center gap-1"
              >
                <span>Google Gemini</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <a
                href="https://klingai.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-lg border border-slate-700 font-bold transition-colors inline-flex items-center gap-1"
              >
                <span>Kling AI</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <a
                href="https://runwayml.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-purple-300 rounded-lg border border-slate-700 font-bold transition-colors inline-flex items-center gap-1"
              >
                <span>Runway</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <a
                href="https://lumalabs.ai/dream-machine"
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-emerald-300 rounded-lg border border-slate-700 font-bold transition-colors inline-flex items-center gap-1"
              >
                <span>Luma</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Scenes breakdown */}
          {scenes.length === 0 ? (
            <div className="text-center py-10 text-slate-500">
              <p>Belum ada scene storyboard yang dihasilkan.</p>
            </div>
          ) : (
            scenes.map((scene, idx) => {
              const formatted = formatScenePrompt(scene, idx, targetPlatform);
              const isCopied = copiedSceneIndex === idx;

              return (
                <div 
                  key={scene.id || idx}
                  className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 transition-all hover:border-slate-700"
                >
                  <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-900">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-cyan-950 text-cyan-400 font-black text-xs flex items-center justify-center border border-cyan-500/30">
                        {scene.sceneNumber || idx + 1}
                      </span>
                      <span className="text-xs font-bold text-white">Scene {scene.sceneNumber || idx + 1}</span>
                      <span className="text-[11px] text-slate-400">({scene.shotType || 'Medium Shot'})</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopySingle(scene, idx)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                        isCopied 
                          ? 'bg-emerald-500 text-slate-950 font-black' 
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                      }`}
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Tersalin!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Salin Scene {scene.sceneNumber || idx + 1}</span>
                        </>
                      )}
                    </button>
                  </div>

                  <pre className="text-xs text-slate-300 font-mono whitespace-pre-wrap bg-slate-900/90 p-3 rounded-xl border border-slate-800/80 leading-relaxed overflow-x-auto">
                    {formatted}
                  </pre>
                </div>
              );
            })
          )}

        </div>

        {/* Modal Footer with Actions */}
        <div className="p-4 sm:p-6 border-t border-slate-800 bg-slate-950/90 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleDownloadTxt}
            className="w-full sm:w-auto px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl border border-slate-700 transition-colors flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>Unduh Semua (.txt)</span>
          </button>

          <div className="w-full sm:w-auto flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-400 font-bold text-xs rounded-xl transition-colors"
            >
              Tutup
            </button>

            <button
              type="button"
              onClick={handleCopyAll}
              className={`w-full sm:w-auto px-6 py-2.5 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 shadow-lg ${
                copiedAll
                  ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/20'
                  : 'bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-400 hover:from-blue-500 hover:to-cyan-400 text-slate-950 shadow-cyan-500/25'
              }`}
            >
              {copiedAll ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Semua Prompt Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Salin Semua Prompt ({scenes.length} Scene)</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
