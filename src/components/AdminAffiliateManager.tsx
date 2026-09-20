import React, { useState } from 'react';
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  CreditCard, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Search, 
  Filter, 
  ArrowUpRight, 
  Download, 
  Check, 
  AlertCircle,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Send
} from 'lucide-react';
import { doc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { AffiliateProfile, AffiliateReferral } from '../types';

interface AdminAffiliateManagerProps {
  affiliates: AffiliateProfile[];
  referrals: AffiliateReferral[];
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const AdminAffiliateManager: React.FC<AdminAffiliateManagerProps> = ({
  affiliates,
  referrals,
  showToast
}) => {
  const [activeTab, setActiveTab] = useState<'affiliates' | 'referrals' | 'payouts'>('affiliates');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Calculate Metrics
  const totalAffiliates = affiliates.length;
  const totalSalesCount = referrals.filter(r => r.status === 'approved' || r.status === 'paid').length;
  const totalCommissionApproved = referrals
    .filter(r => r.status === 'approved' || r.status === 'paid')
    .reduce((acc, curr) => acc + (curr.commissionAmount || 39600), 0);
  const totalCommissionPending = referrals
    .filter(r => r.status === 'pending')
    .reduce((acc, curr) => acc + (curr.commissionAmount || 39600), 0);
  const totalCommissionPaid = referrals
    .filter(r => r.status === 'paid')
    .reduce((acc, curr) => acc + (curr.commissionAmount || 39600), 0);

  // Handle Mark Referral as Paid (Payout executed)
  const handleMarkAsPaid = async (referral: AffiliateReferral) => {
    setProcessingId(referral.id);
    try {
      await updateDoc(doc(db, 'affiliate_referrals', referral.id), {
        status: 'paid',
        paidAt: new Date().toISOString()
      });

      // Update Affiliate total withdrawn earnings
      const aff = affiliates.find(a => a.userId === referral.affiliateId);
      if (aff) {
        const newWithdrawn = (aff.withdrawnEarnings || 0) + referral.commissionAmount;
        await updateDoc(doc(db, 'affiliates', referral.affiliateId), {
          withdrawnEarnings: newWithdrawn
        });
      }

      showToast(`Komisi untuk ${referral.buyerName} berhasil ditandai telah dibayarkan!`, 'success');
    } catch (err: any) {
      console.error(err);
      showToast('Gagal memproses status pembayaran: ' + err.message, 'error');
    } finally {
      setProcessingId(null);
    }
  };

  // Handle Approve Referral Manually
  const handleApproveReferral = async (referral: AffiliateReferral) => {
    setProcessingId(referral.id);
    try {
      await updateDoc(doc(db, 'affiliate_referrals', referral.id), {
        status: 'approved',
        approvedAt: new Date().toISOString()
      });

      const aff = affiliates.find(a => a.userId === referral.affiliateId);
      if (aff) {
        await updateDoc(doc(db, 'affiliates', referral.affiliateId), {
          successfulSales: (aff.successfulSales || 0) + 1,
          totalEarnings: (aff.totalEarnings || 0) + referral.commissionAmount,
          pendingEarnings: Math.max(0, (aff.pendingEarnings || 0) - referral.commissionAmount)
        });
      }

      showToast(`Komisi referral berhasil disetujui!`, 'success');
    } catch (err: any) {
      console.error(err);
      showToast('Gagal menyetujui komisi: ' + err.message, 'error');
    } finally {
      setProcessingId(null);
    }
  };

  // Filtered Affiliates
  const filteredAffiliates = affiliates.filter(a => {
    const q = searchQuery.toLowerCase();
    const matchSearch = a.userName.toLowerCase().includes(q) || 
      a.userEmail.toLowerCase().includes(q) || 
      a.referralCode.toLowerCase().includes(q);
    return matchSearch;
  });

  // Filtered Referrals
  const filteredReferrals = referrals.filter(r => {
    const q = searchQuery.toLowerCase();
    const matchSearch = (r.buyerName || '').toLowerCase().includes(q) || 
      (r.buyerEmail || '').toLowerCase().includes(q) || 
      (r.affiliateCode || '').toLowerCase().includes(q);
    const matchStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      {/* Top Header & Overview Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-200 rounded-full text-blue-700 font-bold text-xs mb-2">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Sistem Affiliate Bagi Hasil 40%</span>
          </div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">
            Laporan & Pengawasan Affiliate
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Pantau jaringan affiliate, transaksi referral member baru, dan pencairan komisi bank secara transparan.
          </p>
        </div>
      </div>

      {/* KPI Statistic Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Mitra Affiliate</span>
            <span className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-slate-800 mt-2">
            {totalAffiliates}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Kolektif member aktif</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Penjualan Affiliate</span>
            <span className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-2">
            {totalSalesCount} <span className="text-sm font-semibold text-slate-500">Order</span>
          </div>
          <span className="text-[11px] text-emerald-600 font-medium mt-1 block">
            Omset: Rp {(totalSalesCount * 99000).toLocaleString('id-ID')}
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Komisi Disetujui (40%)</span>
            <span className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-purple-800 mt-2">
            Rp {totalCommissionApproved.toLocaleString('id-ID')}
          </div>
          <span className="text-[11px] text-purple-600 font-medium mt-1 block">
            Hak komisi mitra affiliate
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Komisi Pending</span>
            <span className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-amber-700 mt-2">
            Rp {totalCommissionPending.toLocaleString('id-ID')}
          </div>
          <span className="text-[11px] text-amber-600 font-medium mt-1 block">
            Menunggu konfirmasi bayar user
          </span>
        </div>
      </div>

      {/* Financial Health Calculation Widget */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-950 p-6 rounded-3xl text-white shadow-md">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="max-w-xl space-y-2">
            <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-[10px] font-black uppercase tracking-wider">
              Analisa Kelayakan Bisnis & Profitabilitas
            </span>
            <h3 className="text-lg font-black tracking-tight">
              Apakah Komisi Affiliate 40% Sehat untuk Model Bisnis Neuronan?
            </h3>
            <p className="text-xs text-blue-200 leading-relaxed">
              <strong>Ya, sangat sehat dan terbukti ampuh untuk produk digital!</strong> Produk digital seperti aplikasi/workspace Neuronan memiliki <em>marginal cost of replication</em> (biaya produksi per user baru) mendekati <strong>Rp 0</strong>.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
              <div className="bg-white/10 p-3 rounded-xl border border-white/10">
                <span className="text-[10px] text-blue-200 uppercase tracking-wider block">Bagi Hasil Mitra</span>
                <p className="text-lg font-black text-amber-300 mt-0.5">40% (Rp 39.600)</p>
                <span className="text-[10px] text-blue-200">Mitra sangat termotivasi promosi</span>
              </div>
              <div className="bg-white/10 p-3 rounded-xl border border-white/10">
                <span className="text-[10px] text-blue-200 uppercase tracking-wider block">Margin Bersih Founder</span>
                <p className="text-lg font-black text-emerald-400 mt-0.5">60% (Rp 59.400)</p>
                <span className="text-[10px] text-emerald-200">100% laba operasional bersih</span>
              </div>
              <div className="bg-white/10 p-3 rounded-xl border border-white/10">
                <span className="text-[10px] text-blue-200 uppercase tracking-wider block">Biaya Akuisisi Iklan (CAC)</span>
                <p className="text-lg font-black text-cyan-300 mt-0.5">Rp 0 (Organik)</p>
                <span className="text-[10px] text-cyan-200">Hanya bayar komisi jika terjadi penjualan</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs & Search Filter */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('affiliates')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'affiliates'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Daftar Mitra Affiliate ({affiliates.length})
            </button>
            <button
              onClick={() => setActiveTab('referrals')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'referrals'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Transaksi Penjualan Referral ({referrals.length})
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari nama, email, kode..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Tab 1: Affiliates Directory */}
        {activeTab === 'affiliates' && (
          <div>
            {filteredAffiliates.length === 0 ? (
              <div className="p-10 text-center border border-dashed border-slate-200 rounded-2xl text-slate-400">
                <Users className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p className="text-xs font-bold text-slate-600">Belum Ada Mitra Affiliate Terdaftar</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Member dapat mendaftar menjadi affiliate langsung dari tombol di dashboard mereka.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-100 text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-bold">
                    <tr>
                      <th className="px-4 py-3 text-left">Nama & WhatsApp</th>
                      <th className="px-4 py-3 text-left">Kode Referral</th>
                      <th className="px-4 py-3 text-left">Penjualan Berhasil</th>
                      <th className="px-4 py-3 text-left">Total Komisi</th>
                      <th className="px-4 py-3 text-left">Rekening Bank</th>
                      <th className="px-4 py-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {filteredAffiliates.map((aff) => (
                      <tr key={aff.userId} className="hover:bg-slate-50/50">
                        <td className="px-4 py-3">
                          <div className="font-bold text-slate-800">{aff.userName}</div>
                          <div className="text-[11px] text-slate-400">{aff.userWhatsapp || aff.userEmail}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-md font-mono font-bold text-[11px]">
                            {aff.referralCode}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-bold text-slate-700">
                          {aff.successfulSales || 0} order
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-black text-emerald-700">
                            Rp {(aff.totalEarnings || 0).toLocaleString('id-ID')}
                          </div>
                          {(aff.pendingEarnings || 0) > 0 && (
                            <div className="text-[10px] text-amber-600 font-semibold">
                              Pending: Rp {(aff.pendingEarnings || 0).toLocaleString('id-ID')}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          <div className="font-bold">{aff.bankName} - {aff.accountNumber}</div>
                          <div className="text-[10px] text-slate-400">A/N: {aff.accountHolder}</div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full font-bold text-[10px]">
                            Aktif (40%)
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

        {/* Tab 2: Referrals Transactions */}
        {activeTab === 'referrals' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500">Filter Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-200 text-xs font-medium focus:outline-none"
              >
                <option value="all">Semua Status</option>
                <option value="pending">Pending (Menunggu Pembayaran)</option>
                <option value="approved">Approved (Siap Transfer)</option>
                <option value="paid">Paid (Sudah Ditransfer)</option>
              </select>
            </div>

            {filteredReferrals.length === 0 ? (
              <div className="p-10 text-center border border-dashed border-slate-200 rounded-2xl text-slate-400">
                <p className="text-xs font-bold text-slate-600">Tidak Ada Data Transaksi Referral</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Transaksi baru melalui link referral akan tercatat otomatis di sini.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-100 text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-bold">
                    <tr>
                      <th className="px-4 py-3 text-left">Pembeli (Member Baru)</th>
                      <th className="px-4 py-3 text-left">Mitra Affiliate (Penerima Komisi)</th>
                      <th className="px-4 py-3 text-left">Komisi 40%</th>
                      <th className="px-4 py-3 text-left">Status</th>
                      <th className="px-4 py-3 text-right">Aksi Pencairan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {filteredReferrals.map((ref) => {
                      const affiliate = affiliates.find(a => a.userId === ref.affiliateId);
                      return (
                        <tr key={ref.id} className="hover:bg-slate-50/50">
                          <td className="px-4 py-3">
                            <div className="font-bold text-slate-800">{ref.buyerName}</div>
                            <div className="text-[11px] text-slate-400">{ref.buyerEmail}</div>
                            <div className="text-[10px] text-slate-400">
                              {new Date(ref.createdAt).toLocaleDateString('id-ID', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-bold text-slate-800">{affiliate?.userName || ref.affiliateCode}</div>
                            <div className="text-[11px] text-blue-600 font-mono font-bold">Ref: {ref.affiliateCode}</div>
                            {affiliate && (
                              <div className="text-[10px] text-slate-500">
                                {affiliate.bankName}: {affiliate.accountNumber} ({affiliate.accountHolder})
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-black text-emerald-700 text-sm">
                              Rp {ref.commissionAmount.toLocaleString('id-ID')}
                            </div>
                            <span className="text-[10px] text-slate-400">Dari Rp {ref.productPrice.toLocaleString('id-ID')}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] inline-flex items-center gap-1 ${
                              ref.status === 'paid'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : ref.status === 'approved'
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : ref.status === 'rejected'
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse'
                            }`}>
                              {ref.status === 'paid' ? 'Sudah Ditransfer' : ref.status === 'approved' ? 'Disetujui (Siap Kirim)' : ref.status === 'rejected' ? 'Ditolak' : 'Menunggu Bayar'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {ref.status === 'pending' && (
                                <button
                                  type="button"
                                  disabled={processingId === ref.id}
                                  onClick={() => handleApproveReferral(ref)}
                                  className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold transition-all"
                                >
                                  Setujui Komisi
                                </button>
                              )}

                              {ref.status === 'approved' && (
                                <button
                                  type="button"
                                  disabled={processingId === ref.id}
                                  onClick={() => handleMarkAsPaid(ref)}
                                  className="px-2.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Tandai Sudah Ditransfer</span>
                                </button>
                              )}

                              {ref.status === 'paid' && (
                                <span className="text-[11px] text-slate-400 font-medium">
                                  Pencairan Selesai ✓
                                </span>
                              )}
                            </div>
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
    </div>
  );
};
