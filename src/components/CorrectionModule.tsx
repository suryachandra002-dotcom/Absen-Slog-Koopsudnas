import React, { useState } from 'react';
import { 
  CheckSquare, 
  Plus, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Paperclip, 
  X, 
  ShieldCheck 
} from 'lucide-react';
import { AttendanceCorrection, Personnel, UserAccount } from '../types';

interface CorrectionModuleProps {
  corrections: AttendanceCorrection[];
  allPersonnel: Personnel[];
  currentUser: UserAccount;
  onSubmitCorrection: (data: Partial<AttendanceCorrection>) => Promise<void>;
  onActionCorrection: (id: string, action: 'approve' | 'reject', catatan: string) => Promise<void>;
  userRole: string;
}

export const CorrectionModule: React.FC<CorrectionModuleProps> = ({
  corrections,
  allPersonnel,
  currentUser,
  onSubmitCorrection,
  onActionCorrection,
  userRole
}) => {
  const [showModal, setShowModal] = useState(false);
  const [selectedCorrection, setSelectedCorrection] = useState<AttendanceCorrection | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [catatan, setCatatan] = useState('');

  const [formData, setFormData] = useState({
    personnelId: currentUser.personnelId || (allPersonnel[0]?.id || ''),
    tanggal: new Date().toISOString().split('T')[0],
    jenisKoreksi: 'Masuk & Pulang' as 'Masuk' | 'Pulang' | 'Masuk & Pulang',
    jamMasukKoreksi: '07:00:00',
    jamPulangKoreksi: '15:30:00',
    alasan: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.alasan.trim()) {
      setErrorMsg('Alasan permohonan koreksi wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await onSubmitCorrection(formData);
      setShowModal(false);
      setSuccessMsg('Permohonan koreksi administratif berhasil diajukan.');
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal mengajukan koreksi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExecuteAction = async () => {
    if (!selectedCorrection || !actionType) return;
    setIsSubmitting(true);
    try {
      await onActionCorrection(selectedCorrection.id, actionType, catatan);
      setSelectedCorrection(null);
      setActionType(null);
      setCatatan('');
      setSuccessMsg('Status koreksi absensi berhasil diperbarui.');
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal memproses tindakan koreksi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-purple-50 text-purple-700 border border-purple-200">
              <CheckSquare className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Koreksi Absensi Administratif
              </h2>
              <p className="text-xs text-slate-500">
                Layanan permohonan koreksi bagi personel yang lupa absen, kendala jaringan, atau tugas dinas mendesak
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setErrorMsg(null);
              setShowModal(true);
            }}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-sm self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Ajukan Koreksi Baru</span>
          </button>
        </div>

        {successMsg && (
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
            <button onClick={() => setSuccessMsg(null)} className="text-emerald-700 hover:text-emerald-900">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="text-xs font-bold text-slate-700">
            Daftar Koreksi Absensi ({corrections.length} Riwayat)
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold">
                <th className="py-3 px-3 w-10 text-center">No</th>
                <th className="py-3 px-3">Personel</th>
                <th className="py-3 px-3">Tanggal Absensi</th>
                <th className="py-3 px-3">Jenis Koreksi</th>
                <th className="py-3 px-3">Jam Dimohonkan</th>
                <th className="py-3 px-3">Alasan Koreksi</th>
                <th className="py-3 px-3 text-center">Status</th>
                {(userRole === 'admin' || userRole === 'atasan') && (
                  <th className="py-3 px-3 text-center w-36">Tindakan</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {corrections.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 italic">
                    Belum ada pengajuan koreksi absensi yang tercatat.
                  </td>
                </tr>
              ) : (
                corrections.map((corr, idx) => (
                  <tr key={corr.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-3 text-center text-slate-500 font-medium">
                      {idx + 1}
                    </td>

                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900">{corr.personnelNama}</div>
                      <div className="text-[11px] text-slate-500 font-mono">NRP: {corr.personnelNrp}</div>
                    </td>

                    <td className="py-3 px-3 font-medium text-slate-800">
                      {corr.tanggal}
                    </td>

                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-bold border border-blue-200">
                        {corr.jenisKoreksi}
                      </span>
                    </td>

                    <td className="py-3 px-3 font-mono font-medium text-slate-700">
                      {corr.jamMasukKoreksi && `Masuk: ${corr.jamMasukKoreksi}`}
                      {corr.jamPulangKoreksi && ` • Pulang: ${corr.jamPulangKoreksi}`}
                    </td>

                    <td className="py-3 px-3 max-w-[200px]">
                      <div className="truncate font-medium text-slate-800" title={corr.alasan}>
                        {corr.alasan}
                      </div>
                    </td>

                    <td className="py-3 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                        corr.status === 'Disetujui'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : corr.status === 'Ditolak'
                          ? 'bg-rose-100 text-rose-800 border border-rose-300'
                          : 'bg-blue-100 text-blue-800 border border-blue-300'
                      }`}>
                        {corr.status.toUpperCase()}
                      </span>
                    </td>

                    {(userRole === 'admin' || userRole === 'atasan') && (
                      <td className="py-3 px-3">
                        {corr.status === 'Menunggu Persetujuan' ? (
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => {
                                setSelectedCorrection(corr);
                                setActionType('approve');
                                setCatatan('Disetujui untuk perbaikan log administratif.');
                              }}
                              className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px]"
                            >
                              Setujui
                            </button>
                            <button
                              onClick={() => {
                                setSelectedCorrection(corr);
                                setActionType('reject');
                                setCatatan('Alasan koreksi belum memadai.');
                              }}
                              className="px-2 py-1 rounded bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px]"
                            >
                              Tolak
                            </button>
                          </div>
                        ) : (
                          <div className="text-center text-[10px] text-slate-400">
                            {corr.disetujuiOleh || 'Selesai'}
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: AJUKAN KOREKSI */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 shadow-2xl border border-slate-200 space-y-4 text-xs animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-purple-600" />
                <span>Formulir Koreksi Absensi Administratif</span>
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="font-bold text-slate-700 mb-1 block">Personel *</label>
                <select
                  value={formData.personnelId}
                  onChange={e => setFormData({ ...formData, personnelId: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                >
                  {allPersonnel.map(p => (
                    <option key={p.id} value={p.id}>{p.pangkat} {p.nama} (NRP: {p.nrp})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 mb-1 block">Tanggal Absensi yang Dikoreksi *</label>
                  <input
                    type="date"
                    required
                    value={formData.tanggal}
                    onChange={e => setFormData({ ...formData, tanggal: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 mb-1 block">Jenis Koreksi *</label>
                  <select
                    value={formData.jenisKoreksi}
                    onChange={e => setFormData({ ...formData, jenisKoreksi: e.target.value as any })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  >
                    <option value="Masuk & Pulang">Masuk & Pulang</option>
                    <option value="Masuk">Jam Masuk Saja</option>
                    <option value="Pulang">Jam Pulang Saja</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 mb-1 block">Jam Masuk Koreksi</label>
                  <input
                    type="time"
                    step="1"
                    value={formData.jamMasukKoreksi}
                    onChange={e => setFormData({ ...formData, jamMasukKoreksi: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 mb-1 block">Jam Pulang Koreksi</label>
                  <input
                    type="time"
                    step="1"
                    value={formData.jamPulangKoreksi}
                    onChange={e => setFormData({ ...formData, jamPulangKoreksi: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 mb-1 block">Alasan / Penjelasan Koreksi *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Contoh: Terjadi kendala sinyal seluler saat apel pagi / melaksanakan tugas luar mendesak..."
                  value={formData.alasan}
                  onChange={e => setFormData({ ...formData, alasan: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-[11px] text-blue-900">
                <span className="font-bold">Integritas Audit: </span>
                Koreksi yang disetujui akan ditandai sebagai koreksi administratif dan tidak menghapus catatan mentah sistem sebelumnya.
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition disabled:opacity-50"
                >
                  {isSubmitting ? 'Mengirim...' : 'Kirim Permohonan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL ACTION: APPROVE / REJECT KOREKSI */}
      {selectedCorrection && actionType && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 space-y-4 text-xs animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">
                {actionType === 'approve' ? 'Setujui Koreksi Administratif' : 'Tolak Permohonan Koreksi'}
              </h3>
              <button onClick={() => setSelectedCorrection(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <div className="font-bold text-slate-900">{selectedCorrection.personnelNama}</div>
              <div className="text-slate-600">Tanggal: {selectedCorrection.tanggal} ({selectedCorrection.jenisKoreksi})</div>
              <div className="text-slate-500 text-[11px] italic">"{selectedCorrection.alasan}"</div>
            </div>

            <div>
              <label className="font-bold text-slate-700 mb-1 block">Catatan Keputusan</label>
              <input
                type="text"
                value={catatan}
                onChange={e => setCatatan(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedCorrection(null)}
                className="px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleExecuteAction}
                disabled={isSubmitting}
                className={`px-4 py-1.5 rounded-lg text-white font-bold transition disabled:opacity-50 ${
                  actionType === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {isSubmitting ? 'Memproses...' : 'Konfirmasi Keputusan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
