import React, { useState, useEffect } from 'react';
import { Key, ShieldCheck, Cpu, Database, Save, Loader2, CheckCircle2, UserCheck, Activity, Lock } from 'lucide-react';
import { AstraConfig, AstraUsageLog } from '../../types/creatorAutopilot';

interface AdminAstraSettingsProps {
  getAuthToken: () => Promise<string | null>;
}

export const AdminAstraSettings: React.FC<AdminAstraSettingsProps> = ({ getAuthToken }) => {
  const [config, setConfig] = useState<AstraConfig>({
    enabled: true,
    model: 'gpt-6-astra',
    apiKeyMasked: '',
    maxTokens: 2000,
    monthlyUsageLimit: 1000,
    updatedAt: new Date().toISOString()
  });
  
  const [newApiKey, setNewApiKey] = useState('');
  const [model, setModel] = useState('gpt-6-astra');
  const [enabled, setEnabled] = useState(true);
  const [maxTokens, setMaxTokens] = useState(2000);
  const [monthlyUsageLimit, setMonthlyUsageLimit] = useState(1000);

  const [targetUserId, setTargetUserId] = useState('');
  const [entitlementStatus, setEntitlementStatus] = useState<'ACTIVE' | 'LOCKED' | 'EXPIRED'>('ACTIVE');

  const [usageLogs, setUsageLogs] = useState<AstraUsageLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [granting, setGranting] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    fetchAstraConfig();
    fetchUsageLogs();
  }, []);

  const fetchAstraConfig = async () => {
    try {
      setLoading(true);
      const token = await getAuthToken();
      if (!token) return;

      const res = await fetch('/api/v1/admin/astra-config', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && data.config) {
        setConfig(data.config);
        setEnabled(data.config.enabled);
        setModel(data.config.model);
        setMaxTokens(data.config.maxTokens);
        setMonthlyUsageLimit(data.config.monthlyUsageLimit);
      }
    } catch (err) {
      console.warn('Failed to load Astra config:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsageLogs = async () => {
    try {
      const token = await getAuthToken();
      if (!token) return;

      const res = await fetch('/api/v1/admin/astra-usage', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && data.logs) {
        setUsageLogs(data.logs);
      }
    } catch (err) {
      console.warn('Failed to load Astra usage logs:', err);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const token = await getAuthToken();
      if (!token) throw new Error('Unauthorized');

      const res = await fetch('/api/v1/admin/astra-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          enabled,
          model,
          apiKey: newApiKey || undefined,
          maxTokens,
          monthlyUsageLimit
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal menyimpan konfigurasi Astra');
      }

      setConfig(data.config);
      setNewApiKey('');
      setMessage({ text: 'Konfigurasi Astra & API Key berhasil diperbarui!', type: 'success' });
    } catch (err: any) {
      setMessage({ text: err.message || 'Gagal menyimpan konfigurasi', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleGrantEntitlement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUserId) return;
    setGranting(true);
    setMessage(null);

    try {
      const token = await getAuthToken();
      if (!token) throw new Error('Unauthorized');

      const res = await fetch('/api/v1/admin/creator-autopilot/grant-entitlement', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          targetUserId,
          status: entitlementStatus
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal mengupdate entitlement');
      }

      setMessage({ text: `Entitlement Creator Autopilot untuk User ${targetUserId} diubah ke ${entitlementStatus}!`, type: 'success' });
      setTargetUserId('');
    } catch (err: any) {
      setMessage({ text: err.message || 'Gagal mengupdate entitlement', type: 'error' });
    } finally {
      setGranting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 border border-purple-800/40 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-600/30 border border-purple-500/40 flex items-center justify-center text-purple-300">
            <Key className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Admin Settings: GPT Astra Intelligence Engine</h2>
            <p className="text-xs text-slate-400">Pengaturan API Key OpenAI/Astra, Entitlement Manajemen User, dan Monitoring Usage</p>
          </div>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-xl text-xs font-medium border flex items-center gap-2 ${message.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-rose-500/10 border-rose-500/30 text-rose-300'}`}>
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: API Key & Model Config */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-6 backdrop-blur-xl">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <ShieldCheck className="w-5 h-5 text-purple-400" />
            <h3 className="text-base font-bold text-white">Konfigurasi Astra API & Key Security</h3>
          </div>

          <form onSubmit={handleSaveConfig} className="space-y-4">
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/50">
              <span className="text-xs font-semibold text-slate-200">Astra Engine Status</span>
              <button
                type="button"
                onClick={() => setEnabled(!enabled)}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${enabled ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-slate-700 text-slate-400'}`}
              >
                {enabled ? 'ENABLED' : 'DISABLED'}
              </button>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Astra Model AI</label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-purple-500"
              >
                <option value="gpt-6-astra">GPT Astra Growth Engine (Default)</option>
                <option value="gpt-4o">GPT-4o (High Speed & Reasoning)</option>
                <option value="gpt-4o-mini">GPT-4o-Mini (Cost Efficient)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">OpenAI / Astra API Key</label>
              <p className="text-[11px] text-slate-400 mb-2">Key saat ini: <span className="font-mono text-purple-300">{config.apiKeyMasked || '(Belum diset - Menggunakan fallback Astra Server Key)'}</span></p>
              <input
                type="password"
                value={newApiKey}
                onChange={(e) => setNewApiKey(e.target.value)}
                placeholder="Masukkan API Key baru jika ingin mengganti (sk-proj-...)"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-purple-500 font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Max Output Tokens</label>
                <input
                  type="number"
                  value={maxTokens}
                  onChange={(e) => setMaxTokens(Number(e.target.value))}
                  className="w-full px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Monthly Request Limit</label>
                <input
                  type="number"
                  value={monthlyUsageLimit}
                  onChange={(e) => setMonthlyUsageLimit(Number(e.target.value))}
                  className="w-full px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition-all shadow-md shadow-purple-600/20 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Simpan Konfigurasi Astra
            </button>
          </form>
        </div>

        {/* Right Column: User Entitlement Management */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-6 backdrop-blur-xl">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <UserCheck className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-bold text-white">Grant User Creator Entitlement</h3>
          </div>

          <form onSubmit={handleGrantEntitlement} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Target User ID (Firebase UID)</label>
              <input
                type="text"
                value={targetUserId}
                onChange={(e) => setTargetUserId(e.target.value)}
                placeholder="Masukkan Firebase User UID"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-purple-500 font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Status Entitlement Creator Autopilot</label>
              <select
                value={entitlementStatus}
                onChange={(e) => setEntitlementStatus(e.target.value as any)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-purple-500"
              >
                <option value="ACTIVE">ACTIVE (Akses Penuh Premium)</option>
                <option value="LOCKED">LOCKED (Terkunci / Belum Beli)</option>
                <option value="EXPIRED">EXPIRED (Masa Aktif Habis)</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={granting}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {granting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
              Update User Entitlement
            </button>
          </form>
        </div>
      </div>

      {/* Usage Logs Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-4 backdrop-blur-xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-white">Astra Usage Logs (Latest Requests)</h3>
          </div>
          <span className="text-xs text-slate-400">{usageLogs.length} Records</span>
        </div>

        {usageLogs.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-500">
            Belum ada aktivitas Astra Research / Content Plan tercatat.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-800/80 text-slate-400 uppercase font-bold text-[10px] tracking-wider">
                <tr>
                  <th className="p-3">User ID / Email</th>
                  <th className="p-3">Fitur</th>
                  <th className="p-3">Estimated Tokens</th>
                  <th className="p-3">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {usageLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40">
                    <td className="p-3 font-mono text-purple-300">{log.userEmail || log.userId}</td>
                    <td className="p-3 font-semibold text-white">{log.feature}</td>
                    <td className="p-3 text-emerald-400 font-mono">{log.estimatedTokens} tokens</td>
                    <td className="p-3 text-slate-400">{new Date(log.timestamp).toLocaleString('id-ID')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
