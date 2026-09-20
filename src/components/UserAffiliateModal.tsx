import React, { useState } from 'react';
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  Link as LinkIcon, 
  Copy, 
  Check, 
  Share2, 
  CreditCard, 
  CheckCircle, 
  Clock, 
  Sparkles, 
  AlertCircle,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  ArrowUpRight
} from 'lucide-react';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { AffiliateProfile, AffiliateReferral, UserProfile } from '../types';

interface UserAffiliateModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserProfile: UserProfile | null;
  currentUserId: string;
  affiliateProfile: AffiliateProfile | null;
  referrals: AffiliateReferral[];
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const UserAffiliateModal: React.FC<UserAffiliateModalProps> = ({
  isOpen,
  onClose,
  currentUserProfile,
  currentUserId,
  affiliateProfile,
  referrals,
  showToast
}) => {
  const [bankName, setBankName] = useState(affiliateProfile?.bankName || '');
  const [accountNumber, setAccountNumber] = useState(affiliateProfile?.accountNumber || '');
  const [accountHolder, setAccountHolder] = useState(affiliateProfile?.accountHolder || (currentUserProfile?.namaLengkap || ''));
  const [customRefCode, setCustomRefCode] = useState(affiliateProfile?.referralCode || '');
  const [saving, setSaving] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'referrals' | 'bank'>('overview');

  if (!isOpen) return null;

  // Generate unique code if not created yet
  const defaultCode = (currentUserProfile?.namaLengkap || 'VIP')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toUpperCase()
    .slice(0, 6) + Math.floor(100 + Math.random() * 900);

  const activeRefCode = affiliateProfile?.referralCode || (customRefCode.trim() ? customRefCode.trim().toUpperCase() : defaultCode);
  
  // Construct referral URL
  const origin = window.location.origin;
  const referralUrl = `${origin}/?ref=${encodeURIComponent(activeRefCode)}`;

  // Handle register as affiliate
  const handleRegisterAffiliate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankName.trim() || !accountNumber.trim() || !accountHolder.trim()) {
      showToast('Harap lengkapi informasi rekening untuk pencairan komisi', 'error');
      return;
    }

    const codeToUse = (customRefCode || defaultCode).replace(/[^a-zA-Z0-9_-]/g, '').toUpperCase();
    if (!codeToUse || codeToUse.length < 3) {
      showToast('Kode referral minimal 3 karakter alfanumerik', 'error');
      return;
    }

    setSaving(true);
    try {
      const newAffiliate: AffiliateProfile = {
        userId: currentUserId,
        userName: currentUserProfile?.namaLengkap || 'Member Affiliate',
        userEmail: currentUserProfile?.email || '',
        userWhatsapp: currentUserProfile?.whatsapp || '',
        referralCode: codeToUse,
        commissionRate: 40,
        productPrice: 99000,
        totalClicks: affiliateProfile?.totalClicks || 0,
        totalReferrals: affiliateProfile?.totalReferrals || 0,
        successfulSales: affiliateProfile?.successfulSales || 0,
        totalEarnings: affiliateProfile?.totalEarnings || 0,
        pendingEarnings: affiliateProfile?.pendingEarnings || 0,
        withdrawnEarnings: affiliateProfile?.withdrawnEarnings || 0,
        bankName: bankName.trim(),
        accountNumber: accountNumber.trim(),
        accountHolder: accountHolder.trim(),
        status: 'active',
        createdAt: affiliateProfile?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'affiliates', currentUserId), newAffiliate, { merge: true });
      showToast('Pendaftaran Affiliate Berhasil! Anda sekarang siap membagikan link.', 'success');
      setActiveTab('overview');
    } catch (err: any) {
      console.error(err);
      showToast('Gagal mendaftar affiliate: ' + (err.message || 'Terjadi kesalahan'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralUrl);
    setCopiedLink(true);
    showToast('Link affiliate berhasil disalin!', 'success');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(activeRefCode);
    setCopiedCode(true);
    showToast('Kode referral berhasil disalin!', 'success');
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const isRegistered = !!affiliateProfile;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-2xl border border-slate-200/90 shadow-2xl overflow-hidden my-6">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-cyan-600 p-6 text-white relative">
          <button 
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors text-sm font-bold"
          >
            ✕
          </button>
          
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/15 backdrop-blur-md rounded-full text-xs font-black uppercase tracking-wider mb-2 border border-white/20">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Program Kemitraan Resmi • Komisi 40%</span>
          </div>

          <h2 className="text-2xl font-black tracking-tight">
            Sistem Affiliate Neuronan
          </h2>
          <p className="text-xs text-blue-100 mt-1 max-w-md">
            Dapatkan komisi bersih <strong>40% (Rp 39.600 per penjualan)</strong> setiap kali ada member baru yang mendaftar melalui link referral khusus Anda.
          </p>
        </div>

        {/* Tab Navigation if already registered */}
        {isRegistered && (
          <div className="flex border-b border-slate-200 px-6 bg-slate-50/70 text-xs font-bold">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-3.5 px-4 border-b-2 transition-all flex items-center gap-2 ${
                activeTab === 'overview'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>Link & Performa</span>
            </button>
            <button
              onClick={() => setActiveTab('referrals')}
              className={`py-3.5 px-4 border-b-2 transition-all flex items-center gap-2 ${
                activeTab === 'referrals'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Riwayat Komisi ({referrals.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('bank')}
              className={`py-3.5 px-4 border-b-2 transition-all flex items-center gap-2 ${
                activeTab === 'bank'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span>Rekening Pencairan</span>
            </button>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6">
          {!isRegistered ? (
            /* Registration Form */
            <form onSubmit={handleRegisterAffiliate} className="space-y-5">
              <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-4 text-xs text-amber-900 flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-black mb-0.5">Komisi 40% Otomatis:</strong>
                  Harga produk adalah Rp 99.000. Untuk setiap member aktif yang menggunakan link Anda, Anda mendapatkan komisi <strong>Rp 39.600</strong> yang langsung tercatat di sistem admin untuk ditransfer ke rekening Anda.
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Pilih Kode Referral Anda</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customRefCode}
                    placeholder={defaultCode}
                    onChange={(e) => setCustomRefCode(e.target.value.toUpperCase().replace(/[^a-zA-Z0-9_-]/g, ''))}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 font-mono text-xs uppercase font-bold focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                  />
                </div>
                <p className="text-[11px] text-slate-400">
                  Kode ini akan menjadi identitas link promosi Anda (contoh: ?ref={customRefCode || defaultCode})
                </p>
              </div>

              <div className="border-t border-slate-100 pt-3">
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-3">
                  Informasi Rekening Bank / E-Wallet Pencairan
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600">Nama Bank / E-Wallet</label>
                    <input
                      type="text"
                      placeholder="BCA, Mandiri, BRI, GoPay, OVO"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      required
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600">Nomor Rekening / Akun</label>
                    <input
                      type="text"
                      placeholder="8291028391"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      required
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-[11px] font-bold text-slate-600">Atas Nama Pemilik Rekening</label>
                    <input
                      type="text"
                      placeholder="Sesuai buku tabungan / KTP"
                      value={accountHolder}
                      onChange={(e) => setAccountHolder(e.target.value)}
                      required
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <span>Mendaftarkan Akun Affiliate...</span>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      <span>Aktifkan Akun Affiliate Saya Sekarang</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            /* Active Affiliate Dashboard */
            <div>
              {activeTab === 'overview' && (
                <div className="space-y-5">
                  {/* Summary Metric Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Penjualan</span>
                      <div className="text-xl font-black text-slate-800 mt-1">
                        {affiliateProfile.successfulSales || 0}
                      </div>
                      <span className="text-[10px] text-emerald-600 font-bold">Penjualan Aktif</span>
                    </div>

                    <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-3.5">
                      <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">Komisi Masuk</span>
                      <div className="text-xl font-black text-emerald-800 mt-1">
                        Rp {((affiliateProfile.totalEarnings || 0)).toLocaleString('id-ID')}
                      </div>
                      <span className="text-[10px] text-emerald-600 font-bold">Disetujui Admin</span>
                    </div>

                    <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-3.5">
                      <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider block">Komisi Pending</span>
                      <div className="text-xl font-black text-amber-800 mt-1">
                        Rp {((affiliateProfile.pendingEarnings || 0)).toLocaleString('id-ID')}
                      </div>
                      <span className="text-[10px] text-amber-600 font-bold">Menunggu Validasi</span>
                    </div>

                    <div className="bg-blue-50/70 border border-blue-200/80 rounded-2xl p-3.5">
                      <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">Bagi Hasil</span>
                      <div className="text-xl font-black text-blue-800 mt-1">
                        40%
                      </div>
                      <span className="text-[10px] text-blue-600 font-bold">Rp 39.600 / Order</span>
                    </div>
                  </div>

                  {/* Referral Link Copy Area */}
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4.5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                        <LinkIcon className="w-3.5 h-3.5 text-blue-600" />
                        <span>Link Promosi Affiliate Anda:</span>
                      </span>
                      <span className="text-[11px] font-mono font-bold text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded-md">
                        KODE: {activeRefCode}
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        readOnly
                        value={referralUrl}
                        className="flex-1 px-3.5 py-2.5 bg-white rounded-xl border border-slate-200 text-xs font-mono text-slate-700 select-all"
                      />
                      <button
                        type="button"
                        onClick={handleCopyLink}
                        className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 shrink-0"
                      >
                        {copiedLink ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Tersalin!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Salin Link</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-slate-500">
                      <span>Bagikan ke:</span>
                      <a
                        href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Halo! Mau bikin video animasi dan promosi AI dalam hitungan detik tanpa ribet? Cek disini yuk: ${referralUrl}`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg border border-emerald-200 font-bold transition-colors inline-flex items-center gap-1"
                      >
                        WhatsApp
                      </a>
                      <a
                        href={`https://t.me/share/url?url=${encodeURIComponent(referralUrl)}&text=${encodeURIComponent('Produksi video iklan AI viral auto konversi')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1 bg-sky-50 text-sky-700 hover:bg-sky-100 rounded-lg border border-sky-200 font-bold transition-colors inline-flex items-center gap-1"
                      >
                        Telegram
                      </a>
                      <button
                        onClick={handleCopyCode}
                        className="px-2.5 py-1 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg border border-slate-200 font-bold transition-colors inline-flex items-center gap-1"
                      >
                        {copiedCode ? 'Kode Tersalin!' : 'Salin Hanya Kode'}
                      </button>
                    </div>
                  </div>

                  {/* Promotion Tips */}
                  <div className="bg-indigo-50/60 border border-indigo-100 rounded-2xl p-4 text-xs text-indigo-950 space-y-1.5">
                    <p className="font-bold flex items-center gap-1.5 text-indigo-900">
                      <Sparkles className="w-4 h-4 text-indigo-600" />
                      <span>Cara Kerja Sistem Affiliate:</span>
                    </p>
                    <ul className="text-indigo-800/90 list-disc list-inside space-y-1 pl-1 leading-relaxed">
                      <li>Pengunjung yang mengklik link Anda akan otomatis tersimpan cookies referral-nya di sistem.</li>
                      <li>Ketika calon pembeli mendaftar dan membayar Rp 99.000, komisi Anda <strong>Rp 39.600</strong> masuk ke status <em>Pending</em>.</li>
                      <li>Saat Admin memvalidasi pembayaran di panel kontrol, status komisi langsung berubah menjadi <strong>Approved (Disetujui)</strong> dan siap dicairkan ke rekening Anda.</li>
                    </ul>
                  </div>
                </div>
              )}

              {activeTab === 'referrals' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                      Daftar Pembeli dari Link Anda ({referrals.length})
                    </h4>
                    <span className="text-xs text-slate-400">Pembaruan Real-Time</span>
                  </div>

                  {referrals.length === 0 ? (
                    <div className="p-8 text-center border border-dashed border-slate-200 rounded-2xl text-slate-400 space-y-2">
                      <Users className="w-8 h-8 text-slate-300 mx-auto" />
                      <p className="text-xs font-bold text-slate-600">Belum Ada Pembelian dari Link Anda</p>
                      <p className="text-[11px] max-w-sm mx-auto">
                        Mulai bagikan link promosi Anda ke teman, komunitas kreator konten, atau media sosial untuk mendapatkan komisi pertama Anda!
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-2xl border border-slate-200">
                      <table className="min-w-full divide-y divide-slate-200 text-xs">
                        <thead className="bg-slate-50 font-bold text-slate-600">
                          <tr>
                            <th className="px-4 py-3 text-left">Nama Pembeli</th>
                            <th className="px-4 py-3 text-left">Tanggal</th>
                            <th className="px-4 py-3 text-left">Nilai Komisi</th>
                            <th className="px-4 py-3 text-right">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          {referrals.map((ref) => (
                            <tr key={ref.id} className="hover:bg-slate-50/50">
                              <td className="px-4 py-3 font-bold text-slate-800">
                                {ref.buyerName}
                              </td>
                              <td className="px-4 py-3 text-slate-500">
                                {new Date(ref.createdAt).toLocaleDateString('id-ID', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric'
                                })}
                              </td>
                              <td className="px-4 py-3 font-bold text-emerald-700">
                                Rp {ref.commissionAmount.toLocaleString('id-ID')}
                              </td>
                              <td className="px-4 py-3 text-right">
                                <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                                  ref.status === 'approved' || ref.status === 'paid'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : ref.status === 'rejected'
                                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                    : 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse'
                                }`}>
                                  {ref.status === 'paid' ? 'Sudah Ditransfer' : ref.status === 'approved' ? 'Disetujui' : ref.status === 'rejected' ? 'Batal' : 'Menunggu Bayar'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'bank' && (
                <form onSubmit={handleRegisterAffiliate} className="space-y-4">
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs space-y-3">
                    <h4 className="font-bold text-slate-800">Rekening Tujuan Transfer Komisi:</h4>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600">Nama Bank / E-Wallet</label>
                      <input
                        type="text"
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        required
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600">Nomor Rekening</label>
                      <input
                        type="text"
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value)}
                        required
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600">Atas Nama Pemilik</label>
                      <input
                        type="text"
                        value={accountHolder}
                        onChange={(e) => setAccountHolder(e.target.value)}
                        required
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
                  >
                    {saving ? 'Menyimpan Rekening...' : 'Perbarui Rekening Pencairan'}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 border-t border-slate-100 px-6 py-3 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            Sistem Komisi Affiliate Otomatis 40%
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
