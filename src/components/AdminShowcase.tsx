import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage, handleFirestoreError, OperationType } from '../firebase';
import { ShowcaseItem, StoryboardSceneShowcase } from '../types';
import { parseVideoUrl } from '../utils/embedUtils';
import { compressImageFile } from '../utils/imageCompressor';
import { 
  Loader2, Plus, Edit2, Trash2, Video, Image as ImageIcon, Save, X, Eye, EyeOff, 
  Link as LinkIcon, Upload, Layers, ArrowUp, ArrowDown, Youtube, Sparkles, Film,
  AlertCircle, CheckCircle2, RefreshCw
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface AdminShowcaseProps {
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const AdminShowcase: React.FC<AdminShowcaseProps> = ({ showToast }) => {
  const [showcases, setShowcases] = useState<ShowcaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<Partial<ShowcaseItem>>({
    type: 'video',
    title: '',
    category: '',
    description: '',
    videoUrl: '',
    thumbnailUrl: '',
    storyboardScenes: [],
    published: true,
    order: 0
  });

  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [sceneFiles, setSceneFiles] = useState<{ [index: number]: File }>({});
  
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string>('');

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'showcases'), (snapshot) => {
      const list: ShowcaseItem[] = [];
      snapshot.forEach((docSnap) => list.push({ id: docSnap.id, ...docSnap.data() } as ShowcaseItem));
      list.sort((a, b) => {
        if ((a.order ?? 0) !== (b.order ?? 0)) return (a.order ?? 0) - (b.order ?? 0);
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      });
      setShowcases(list);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'showcases');
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleEdit = (item: ShowcaseItem) => {
    setForm({
      ...item,
      type: item.type || (item.storyboardScenes && item.storyboardScenes.length > 0 ? 'storyboard' : 'video'),
      storyboardScenes: item.storyboardScenes || []
    });
    setVideoFile(null);
    setThumbnailFile(null);
    setSceneFiles({});
    setIsEditing(true);
  };

  const handleAddNew = () => {
    setForm({
      type: 'video',
      title: '',
      category: '',
      description: '',
      videoUrl: '',
      thumbnailUrl: '',
      storyboardScenes: [
        { sceneNumber: 1, imageUrl: '', prompt: 'Scene 1: Opening / Hook' },
        { sceneNumber: 2, imageUrl: '', prompt: 'Scene 2: Problem & Solution' }
      ],
      published: true,
      order: showcases.length
    });
    setVideoFile(null);
    setThumbnailFile(null);
    setSceneFiles({});
    setIsEditing(true);
  };

  const handleDelete = async (item: ShowcaseItem) => {
    if (!window.confirm(`Yakin ingin menghapus showcase "${item.title}"?`)) return;
    try {
      await deleteDoc(doc(db, 'showcases', item.id));
      showToast('Showcase berhasil dihapus', 'success');
    } catch (err: any) {
      showToast('Gagal menghapus: ' + err.message, 'error');
    }
  };

  const togglePublish = async (item: ShowcaseItem) => {
    try {
      await updateDoc(doc(db, 'showcases', item.id), { published: !item.published });
      showToast(`Status showcase diperbarui`, 'success');
    } catch (err: any) {
      showToast('Gagal update status: ' + err.message, 'error');
    }
  };

  // Upload helpers
  const uploadToServer = async (file: File): Promise<string> => {
    const { auth } = await import('../firebase');
    const idToken = auth.currentUser ? await auth.currentUser.getIdToken() : '';
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64Data = reader.result as string;
          const res = await fetch('/api/upload-showcase', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${idToken}`
            },
            body: JSON.stringify({
              filename: file.name,
              base64Data,
              contentType: file.type
            })
          });
          if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || `Upload gagal dengan status ${res.status}`);
          }
          const data = await res.json();
          resolve(data.url);
        } catch (e) {
          reject(e);
        }
      };
      reader.onerror = (e) => reject(e);
      reader.readAsDataURL(file);
    });
  };

  const uploadFile = async (file: File, type: 'video' | 'thumbnail' | 'scene'): Promise<string> => {
    setUploadStatus(`Mengompresi & menyiapkan ${type}...`);
    
    // For images (thumbnail and scenes): compress directly to WebP Data URL for 100% durable Cloud Firestore persistence
    if (type === 'thumbnail' || type === 'scene') {
      try {
        const compressedDataUrl = await compressImageFile(file, 1080, 1080, 0.78);
        return compressedDataUrl;
      } catch (err: any) {
        console.warn('Kompresi gambar gagal, mencoba storage upload:', err);
      }
    }

    try {
      const ext = file.name.split('.').pop() || (type === 'video' ? 'mp4' : 'jpg');
      const fileRef = ref(storage, `showcase/${type}_${uuidv4()}.${ext}`);
      await uploadBytes(fileRef, file);
      return await getDownloadURL(fileRef);
    } catch (storageErr: any) {
      console.warn(`Firebase Storage fallback to server upload...`);
      return await uploadToServer(file);
    }
  };

  // Helper to capture a frame from an uploaded video file for automatic thumbnail
  const captureVideoFrame = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      try {
        const url = URL.createObjectURL(file);
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.muted = true;
        video.playsInline = true;
        video.src = url;

        const cleanup = () => {
          URL.revokeObjectURL(url);
        };

        video.onloadeddata = () => {
          video.currentTime = Math.min(1, video.duration > 0 ? video.duration / 2 : 0.5);
        };

        video.onseeked = () => {
          try {
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth || 640;
            canvas.height = video.videoHeight || 360;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
              const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
              cleanup();
              resolve(dataUrl);
              return;
            }
          } catch (e) {
            // ignore
          }
          cleanup();
          resolve('');
        };

        video.onerror = () => {
          cleanup();
          resolve('');
        };

        setTimeout(() => {
          cleanup();
          resolve('');
        }, 4000);
      } catch {
        resolve('');
      }
    });
  };

  // Clean Firestore payload so NO fields contain undefined
  const sanitizeForFirestore = (obj: any): any => {
    if (obj === null || obj === undefined) return null;
    if (Array.isArray(obj)) {
      return obj.map(sanitizeForFirestore).filter((v) => v !== undefined);
    }
    if (typeof obj === 'object') {
      const res: Record<string, any> = {};
      for (const [k, v] of Object.entries(obj)) {
        if (v !== undefined) {
          res[k] = sanitizeForFirestore(v);
        }
      }
      return res;
    }
    return obj;
  };

  // Scene management
  const addScene = () => {
    const scenes = form.storyboardScenes || [];
    const nextNum = scenes.length + 1;
    setForm({
      ...form,
      storyboardScenes: [
        ...scenes,
        { sceneNumber: nextNum, imageUrl: '', prompt: `Scene ${nextNum}: Deskripsi visual...` }
      ]
    });
  };

  const updateScene = (index: number, field: keyof StoryboardSceneShowcase, value: any) => {
    const scenes = [...(form.storyboardScenes || [])];
    scenes[index] = { ...scenes[index], [field]: value };
    setForm({ ...form, storyboardScenes: scenes });
  };

  const removeScene = (index: number) => {
    const scenes = (form.storyboardScenes || []).filter((_, i) => i !== index);
    const renumbered = scenes.map((sc, i) => ({ ...sc, sceneNumber: i + 1 }));
    setForm({ ...form, storyboardScenes: renumbered });
    
    const newFiles = { ...sceneFiles };
    delete newFiles[index];
    setSceneFiles(newFiles);
  };

  const moveScene = (index: number, direction: 'up' | 'down') => {
    const scenes = [...(form.storyboardScenes || [])];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= scenes.length) return;
    
    const temp = scenes[index];
    scenes[index] = scenes[targetIdx];
    scenes[targetIdx] = temp;

    const renumbered = scenes.map((sc, i) => ({ ...sc, sceneNumber: i + 1 }));
    setForm({ ...form, storyboardScenes: renumbered });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title?.trim() || !form.category?.trim()) {
      showToast('Harap isi Judul dan Kategori', 'error');
      return;
    }

    const itemType = form.type || 'video';

    if (itemType === 'video') {
      if (!videoFile && !form.videoUrl?.trim()) {
        showToast('Harap masukkan URL video TikTok/YouTube atau upload file video', 'error');
        return;
      }
    } else {
      if (!form.storyboardScenes || form.storyboardScenes.length === 0) {
        showToast('Minimal tambahkan 1 scene storyboard', 'error');
        return;
      }
    }

    setUploading(true);
    setUploadStatus('Memproses data showcase...');

    try {
      let finalVideoUrl = form.videoUrl || '';
      let finalThumbnailUrl = form.thumbnailUrl || '';
      let finalScenes: StoryboardSceneShowcase[] = [...(form.storyboardScenes || [])];

      // 1. Upload main video if file chosen
      if (itemType === 'video' && videoFile) {
        finalVideoUrl = await uploadFile(videoFile, 'video');
      }

      // 2. Upload main thumbnail if file chosen
      if (thumbnailFile) {
        finalThumbnailUrl = await uploadFile(thumbnailFile, 'thumbnail');
      }

      // 3. Upload scene images if files chosen
      if (itemType === 'storyboard') {
        for (let i = 0; i < finalScenes.length; i++) {
          if (sceneFiles[i]) {
            setUploadStatus(`Mengunggah gambar Scene ${i + 1}...`);
            const uploadedUrl = await uploadFile(sceneFiles[i], 'scene');
            finalScenes[i].imageUrl = uploadedUrl;
          }
        }
        // Automatic thumbnail for Storyboard if empty: use Scene 1 or first available scene
        if (!finalThumbnailUrl) {
          const firstWithImage = finalScenes.find(sc => sc.imageUrl);
          if (firstWithImage?.imageUrl) {
            finalThumbnailUrl = firstWithImage.imageUrl;
          }
        }
      }

      // 4. Automatic thumbnail for Video if empty
      if (itemType === 'video' && !finalThumbnailUrl) {
        // A. Check YouTube
        if (finalVideoUrl) {
          const parsed = parseVideoUrl(finalVideoUrl);
          if (parsed.type === 'youtube' && parsed.thumbnailUrl) {
            finalThumbnailUrl = parsed.thumbnailUrl;
          } else if (finalVideoUrl.includes('tiktok.com')) {
            // B. Check TikTok via oembed API
            setUploadStatus('Mengambil cover thumbnail resmi TikTok...');
            try {
              const metaRes = await fetch(`/api/video-metadata?url=${encodeURIComponent(finalVideoUrl)}`);
              if (metaRes.ok) {
                const metaData = await metaRes.json();
                if (metaData.thumbnailUrl) {
                  finalThumbnailUrl = metaData.thumbnailUrl;
                }
              }
            } catch (e) {
              console.warn('Gagal ambil cover TikTok otomatis:', e);
            }
          }
        }

        // C. If still empty and an MP4 video file was uploaded, capture a frame
        if (!finalThumbnailUrl && videoFile) {
          setUploadStatus('Mengambil frame video untuk cover otomatis...');
          try {
            const frameBase64 = await captureVideoFrame(videoFile);
            if (frameBase64) {
              const uploadRes = await fetch('/api/upload-showcase', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  filename: `thumb_${Date.now()}.jpg`,
                  base64Data: frameBase64,
                  contentType: 'image/jpeg'
                })
              });
              if (uploadRes.ok) {
                const uploadData = await uploadRes.json();
                finalThumbnailUrl = uploadData.url;
              }
            }
          } catch (frameErr) {
            console.warn('Auto frame capture failed:', frameErr);
          }
        }
      }

      setUploadStatus('Menyimpan ke Firestore...');
      const id = form.id || uuidv4();

      // Build payload strictly ensuring NO undefined fields are present
      const rawPayload: Record<string, any> = {
        id,
        type: itemType,
        title: form.title.trim(),
        category: form.category.trim(),
        description: form.description?.trim() || '',
        thumbnailUrl: finalThumbnailUrl || '',
        published: form.published ?? true,
        order: typeof form.order === 'number' ? form.order : 0,
        createdAt: form.createdAt || new Date().toISOString()
      };

      if (itemType === 'video') {
        rawPayload.videoUrl = finalVideoUrl || '';
      } else {
        rawPayload.storyboardScenes = finalScenes.map((sc, i) => ({
          sceneNumber: i + 1,
          imageUrl: sc.imageUrl || '',
          prompt: sc.prompt || ''
        }));
      }

      const safePayload = sanitizeForFirestore(rawPayload);
      await setDoc(doc(db, 'showcases', id), safePayload);
      showToast('Showcase berhasil disimpan!', 'success');
      setIsEditing(false);
    } catch (err: any) {
      console.error('Submit error:', err);
      showToast('Gagal menyimpan: ' + (err.message || 'Terjadi kesalahan'), 'error');
    } finally {
      setUploading(false);
      setUploadStatus('');
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">Manajemen Showcase</h2>
          <p className="text-xs text-slate-500 mt-1">
            Atur video TikTok/YouTube dan Galeri Storyboard AI yang tampil di Landing Page
          </p>
        </div>
        {!isEditing && (
          <button onClick={handleAddNew} className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold text-xs rounded-xl shadow flex items-center gap-2">
            <Plus className="w-4 h-4" /> Tambah Showcase
          </button>
        )}
      </div>

      {/* Cloud Persistence Notice Banner */}
      <div className="mb-5 p-3.5 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 rounded-2xl flex items-start gap-3 shadow-xs">
        <div className="p-1.5 bg-blue-600 text-white rounded-xl shrink-0 mt-0.5 shadow-sm">
          <CheckCircle2 className="w-4 h-4" />
        </div>
        <div className="space-y-1 text-xs">
          <div className="font-bold text-slate-800 flex items-center gap-2">
            <span>Penyimpanan Gambar Cloud Permanen</span>
            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-full border border-emerald-200">Aktif</span>
          </div>
          <p className="text-slate-600 leading-relaxed">
            Semua gambar storyboard dan cover yang diupload sekarang dikompresi otomatis (WebP) dan <strong>disimpan permanen langsung di database Cloud Firestore</strong>. Gambar tidak akan hilang saat server restart.
          </p>
          <p className="text-slate-500 text-[11px]">
            💡 <em>Catatan untuk karya sebelumnya yang gambarnya belum tampil:</em> File tersebut sebelumnya tersimpan di disk temporer server. Cukup klik tombol <strong>Edit</strong> (ikon pensil), pilih file gambar adegan Anda lagi, lalu klik <strong>Simpan</strong>.
          </p>
        </div>
      </div>

      {isEditing ? (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative animate-fade-in">
          <button onClick={() => setIsEditing(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
          <h3 className="text-lg font-bold mb-4">{form.id ? 'Edit Showcase' : 'Tambah Showcase Baru'}</h3>
          
          <form onSubmit={handleSubmit} className="space-y-5 max-w-3xl">
            {/* TYPE TOGGLE */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Tipe Showcase</label>
              <div className="grid grid-cols-2 gap-3 p-1.5 bg-slate-100 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, type: 'video' })}
                  className={`py-2.5 px-4 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                    form.type !== 'storyboard' 
                      ? 'bg-white text-slate-900 shadow-sm border border-slate-200' 
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Video className="w-4 h-4 text-cyan-600" /> Video (TikTok / YouTube / MP4)
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, type: 'storyboard' })}
                  className={`py-2.5 px-4 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                    form.type === 'storyboard' 
                      ? 'bg-white text-slate-900 shadow-sm border border-slate-200' 
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Layers className="w-4 h-4 text-purple-600" /> Galeri Storyboard (Scene 1 s/d Selesai)
                </button>
              </div>
            </div>

            {/* BASIC INFO */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Judul Karya</label>
                <input required type="text" placeholder="Contoh: Iklan Skincare Viral TikTok" value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full p-2.5 rounded-xl border border-slate-200 text-sm focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Kategori</label>
                <input required type="text" placeholder="Contoh: TikTok Affiliate, Beauty, E-Commerce" value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="w-full p-2.5 rounded-xl border border-slate-200 text-sm focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Deskripsi Singkat</label>
              <textarea placeholder="Jelaskan secara singkat mengenai karya ini..." value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full p-2.5 rounded-xl border border-slate-200 text-sm focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 h-20 resize-none" />
            </div>

            {/* SECTION 1: VIDEO SHOWCASE INPUTS */}
            {form.type !== 'storyboard' && (
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <LinkIcon className="w-3.5 h-3.5 text-cyan-600" /> Input Link Video TikTok atau YouTube
                    </span>
                    <span className="text-[10px] text-cyan-600 font-semibold bg-cyan-50 px-2 py-0.5 rounded-full border border-cyan-100">
                      Otomatis Embed Player
                    </span>
                  </label>
                  <input 
                    type="text" 
                    placeholder="Tempelkan link: https://www.tiktok.com/@user/video/12345... atau https://youtu.be/..." 
                    value={form.videoUrl || ''} 
                    onChange={e => setForm({...form, videoUrl: e.target.value})} 
                    className="w-full p-2.5 text-xs bg-white rounded-xl border border-slate-300 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 font-mono" 
                  />
                  <p className="text-[11px] text-slate-500 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-500 shrink-0" />
                    Cukup masukkan URL TikTok atau YouTube. Landing page akan otomatis menampilkan embedded player secara profesional.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-200/60">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Atau Upload File MP4 langsung</label>
                    <input 
                      type="file" 
                      accept="video/mp4,video/webm" 
                      onChange={e => setVideoFile(e.target.files?.[0] || null)} 
                      className="w-full p-2 text-xs bg-white border border-slate-200 rounded-lg file:mr-3 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-bold file:bg-cyan-50 file:text-cyan-700 hover:file:bg-cyan-100 cursor-pointer" 
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                      <span>Thumbnail Cover (Opsional)</span>
                      <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                        Otomatis jika kosong
                      </span>
                    </label>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setThumbnailFile(file);
                          try {
                            const compressed = await compressImageFile(file, 1080, 1080, 0.8);
                            setForm(prev => ({ ...prev, thumbnailUrl: compressed }));
                            showToast('Cover gambar berhasil diproses & disimpan!', 'success');
                          } catch (err: any) {
                            showToast('Gagal memproses cover: ' + err.message, 'error');
                          }
                        }
                      }} 
                      className="w-full p-2 text-xs bg-white border border-slate-200 rounded-lg file:mr-3 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer" 
                    />
                    <p className="text-[11px] text-slate-400">
                      Format WebP terkompresi otomatis & disimpan permanen di Cloud Firestore database.
                    </p>
                    {form.thumbnailUrl && (
                      <div className="flex items-center gap-2 mt-1 p-2 bg-slate-100 rounded-xl border border-slate-200 relative overflow-hidden">
                        <div className="w-12 h-12 rounded-lg bg-slate-200 overflow-hidden shrink-0 border border-slate-300 relative flex items-center justify-center">
                          <img 
                            src={form.thumbnailUrl} 
                            alt="Preview" 
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              const parent = e.currentTarget.parentElement;
                              if (parent && !parent.querySelector('.thumb-broken')) {
                                const div = document.createElement('div');
                                div.className = 'thumb-broken w-full h-full flex flex-col items-center justify-center bg-rose-50 text-rose-600 text-[9px] font-bold text-center leading-tight p-0.5';
                                div.innerHTML = '<span>⚠️ Rusak</span>';
                                parent.appendChild(div);
                              }
                            }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-xs font-bold text-slate-700 block truncate">Cover tersimpan</span>
                          <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Siap digunakan
                          </span>
                        </div>
                        <button 
                          type="button" 
                          onClick={() => setForm({...form, thumbnailUrl: ''})}
                          className="text-xs text-rose-600 hover:bg-rose-50 p-1.5 rounded-lg transition-colors font-bold"
                        >
                          Hapus
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* SECTION 2: STORYBOARD GALERI INPUTS */}
            {form.type === 'storyboard' && (
              <div className="bg-purple-50/50 p-5 rounded-2xl border border-purple-100 space-y-4">
                <div className="flex items-center justify-between border-b border-purple-200/60 pb-3">
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                      <Layers className="w-4 h-4 text-purple-600" /> Scene Storyboard (Scene 1 s/d Selesai)
                    </h4>
                    <p className="text-xs text-slate-500">Semua gambar scene tersimpan permanen di Cloud Database & tampil berurutan</p>
                  </div>
                  <button
                    type="button"
                    onClick={addScene}
                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-lg transition shadow-sm flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" /> Tambah Scene
                  </button>
                </div>

                <div className="space-y-3 max-h-[440px] overflow-y-auto pr-2">
                  {(form.storyboardScenes || []).map((scene, idx) => (
                    <div key={idx} className="bg-white p-3.5 rounded-xl border border-purple-100 shadow-sm flex flex-col md:flex-row gap-3 items-start md:items-center">
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 font-black text-xs flex items-center justify-center border border-purple-200">
                          #{scene.sceneNumber}
                        </span>
                        <div className="flex flex-col gap-0.5">
                          <button type="button" onClick={() => moveScene(idx, 'up')} disabled={idx === 0} className="p-0.5 text-slate-400 hover:text-purple-600 disabled:opacity-30">
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button type="button" onClick={() => moveScene(idx, 'down')} disabled={idx === (form.storyboardScenes?.length || 0) - 1} className="p-0.5 text-slate-400 hover:text-purple-600 disabled:opacity-30">
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Image Preview / Input */}
                      <div className="w-full md:w-52 space-y-1.5 shrink-0">
                        {scene.imageUrl ? (
                          <div className="w-full h-24 rounded-lg bg-slate-100 overflow-hidden border border-slate-200 mb-1 relative flex items-center justify-center">
                            <img 
                              src={scene.imageUrl} 
                              alt={`Scene ${scene.sceneNumber}`} 
                              className="w-full h-full object-cover" 
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                const parent = e.currentTarget.parentElement;
                                if (parent && !parent.querySelector('.scene-broken')) {
                                  const div = document.createElement('div');
                                  div.className = 'scene-broken w-full h-full flex flex-col items-center justify-center bg-rose-50 text-rose-600 p-2 text-[10px] font-bold text-center leading-tight';
                                  div.innerHTML = '<span>⚠️ Gambar lama hilang</span><span class="text-[9px] text-slate-500 font-normal mt-0.5">Pilih file baru di bawah</span>';
                                  parent.appendChild(div);
                                }
                              }}
                            />
                          </div>
                        ) : (
                          <div className="w-full h-16 rounded-lg bg-slate-50 border border-dashed border-slate-300 flex items-center justify-center text-[10px] text-slate-400 font-medium">
                            Belum ada gambar
                          </div>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setSceneFiles(prev => ({ ...prev, [idx]: file }));
                              try {
                                const compressed = await compressImageFile(file, 1080, 1080, 0.78);
                                updateScene(idx, 'imageUrl', compressed);
                                showToast(`Scene ${scene.sceneNumber} berhasil diproses!`, 'success');
                              } catch (err: any) {
                                showToast('Gagal memproses gambar scene: ' + err.message, 'error');
                              }
                            }
                          }}
                          className="w-full text-[11px] bg-slate-50 border border-slate-200 rounded-lg p-1 file:py-0.5 file:px-2 file:text-[10px] file:bg-purple-100 file:text-purple-700 file:border-0 file:rounded cursor-pointer"
                        />
                        <input
                          type="text"
                          placeholder="Atau tempel URL Gambar (https://...)"
                          value={scene.imageUrl}
                          onChange={e => updateScene(idx, 'imageUrl', e.target.value)}
                          className="w-full p-1.5 text-xs bg-slate-50 rounded-lg border border-slate-200 focus:border-purple-500 font-mono text-[11px]"
                        />
                      </div>

                      {/* Prompt / Description */}
                      <div className="flex-1 w-full space-y-1">
                        <label className="text-[11px] font-bold text-slate-600">Prompt / Deskripsi Scene {scene.sceneNumber}</label>
                        <input
                          type="text"
                          placeholder="Misal: Close-up botol serum dengan efek pencahayaan studio"
                          value={scene.prompt || ''}
                          onChange={e => updateScene(idx, 'prompt', e.target.value)}
                          className="w-full p-2 text-xs rounded-lg border border-slate-200 focus:border-purple-500"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => removeScene(idx)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors self-end md:self-center shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-4">
              <div className="space-y-1.5 flex-1">
                <label className="text-xs font-bold text-slate-700">Urutan Tampil (Angka Kecil Di Depan)</label>
                <input type="number" value={form.order} onChange={e => setForm({...form, order: Number(e.target.value)})} className="w-full p-2.5 rounded-xl border border-slate-200 text-sm" />
              </div>
              <div className="space-y-1.5 flex-1 flex items-center pt-5">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input type="checkbox" checked={form.published} onChange={e => setForm({...form, published: e.target.checked})} className="w-4 h-4 text-cyan-600 rounded" />
                  <span className="text-sm font-bold text-slate-700">Published di Landing Page</span>
                </label>
              </div>
            </div>

            <button type="submit" disabled={uploading} className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-slate-900/10">
              {uploading ? <Loader2 className="w-4 h-4 animate-spin text-cyan-400" /> : <Save className="w-4 h-4" />}
              <span>{uploading ? (uploadStatus || 'Memproses...') : 'Simpan Showcase'}</span>
            </button>
          </form>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
             <div className="p-12 flex justify-center"><Loader2 className="w-8 h-8 text-cyan-600 animate-spin" /></div>
          ) : showcases.length === 0 ? (
             <div className="p-12 text-center text-slate-500 text-sm font-medium">Belum ada karya showcase.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Tipe</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Preview</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Info</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Urutan</th>
                    <th className="px-6 py-3 text-center text-xs font-bold text-slate-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {showcases.map(item => {
                    const isStoryboard = item.type === 'storyboard';
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          {isStoryboard ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-100 text-purple-700 text-[10px] font-bold rounded-full border border-purple-200">
                              <Layers className="w-3 h-3" /> Storyboard ({item.storyboardScenes?.length || 0})
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-cyan-100 text-cyan-800 text-[10px] font-bold rounded-full border border-cyan-200">
                              <Video className="w-3 h-3" /> Video
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="w-16 h-20 bg-slate-100 rounded-md overflow-hidden relative border border-slate-200 shadow-sm flex items-center justify-center">
                            {item.thumbnailUrl || (isStoryboard && item.storyboardScenes?.[0]?.imageUrl) ? (
                              <img 
                                src={item.thumbnailUrl || item.storyboardScenes?.[0]?.imageUrl} 
                                alt={item.title}
                                className="w-full h-full object-cover" 
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                  const parent = e.currentTarget.parentElement;
                                  if (parent && !parent.querySelector('.broken-cell')) {
                                    const div = document.createElement('div');
                                    div.className = 'broken-cell w-full h-full flex flex-col items-center justify-center bg-rose-50 text-rose-600 p-1 text-[9px] font-bold text-center leading-tight';
                                    div.innerHTML = '<span class="text-xs">⚠️</span><span>Perlu Re-upload</span>';
                                    parent.appendChild(div);
                                  }
                                }}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-slate-900 text-slate-400">
                                <Film className="w-6 h-6" />
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-800">{item.title}</div>
                          <div className="text-xs text-blue-600 font-bold mb-1">{item.category}</div>
                          <div className="text-xs text-slate-500 line-clamp-1 max-w-[200px]">{item.description}</div>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-slate-600">{item.order}</td>
                        <td className="px-6 py-4 text-center">
                          <button onClick={() => togglePublish(item)} className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase transition-colors ${item.published ? 'bg-emerald-100 text-emerald-700 border border-emerald-200 hover:bg-emerald-200' : 'bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200'}`}>
                            {item.published ? 'Published' : 'Draft'}
                          </button>
                        </td>
                        <td className="px-6 py-4 text-right space-x-2">
                          <button onClick={() => handleEdit(item)} className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors inline-block"><Edit2 className="w-4 h-4" /></button>
                          <button onClick={() => handleDelete(item)} className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-rose-50 hover:text-rose-600 transition-colors inline-block"><Trash2 className="w-4 h-4" /></button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
