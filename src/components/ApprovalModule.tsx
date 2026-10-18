import React, { useState } from 'react';
import { 
  UserCheck, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Clock, 
  Eye, 
  FileText, 
  Paperclip, 
  X,
  MessageSquare
} from 'lucide-react';
import { LeaveRequest, UserAccount } from '../types';

interface ApprovalModuleProps {
  leaveRequests: LeaveRequest[];
  currentUser: UserAccount;
  onActionRequest: (id: string, action: 'approve' | 'reject' | 'revision', catatanAtasan: string) => Promise<void>;
  showHistoryOnly?: boolean;
}

export const ApprovalModule: React.FC<ApprovalModuleProps> = ({
  leaveRequests,
  currentUser,
  onActionRequest,
  showHistoryOnly = false
}) => {
  const [selectedReq, setSelectedReq] = useState<LeaveRequest | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'revision' | null>(null);
  const [catatan, setCatatan] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const pendingList = leaveRequests.filter(l => l.status === 'Menunggu Persetujuan');
  const historyList = leaveRequests.filter(l => l.status !== 'Menunggu Persetujuan');

  const activeList = showHistoryOnly ? historyList : pendingList;

  const handleOpenAction = (req: LeaveRequest, action: 'approve' | 'reject' | 'revision') => {
    setSelectedReq(req);
    setActionType(action);
    setCatatan(action === 'approve' ? 'Disetujui untuk dilaksanakan.' : '');
    setErrorMsg(null);
  };

  const handleExecuteAction = async () => {
    if (!selectedReq || !actionType) return;

    if (actionType !== 'approve' && !catatan.trim()) {
      setErrorMsg('Catatan/alasan wajib diisi untuk penolakan atau permintaan perbaikan.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await onActionRequest(selectedReq.id, actionType, catatan);
      setSelectedReq(null);
      setActionType(null);
      setCatatan('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal memproses persetujuan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Disetujui':
        return <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 px-2.5 py-0.5 rounded-full font-bold text-[10px]">DISETUJUI</span>;
      case 'Ditolak':
        return <span className="bg-rose-100 text-rose-800 border border-rose-300 px-2.5 py-0.5 rounded-full font-bold text-[10px]">DITOLAK</span>;
      case 'Perlu Perbaikan':
        return <span className="bg-amber-100 text-amber-800 border border-amber-300 px-2.5 py-0.5 rounded-full font-bold text-[10px]">PERLU PERBAIKAN</span>;
      default:
        return <span className="bg-blue-100 text-blue-800 border border-blue-300 px-2.5 py-0.5 rounded-full font-bold text-[10px]">MENUNGGU</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <span className="p-2.5 rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
            <UserCheck className="w-5 h-5" />
          </span>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              {showHistoryOnly ? 'Riwayat Keputusan Persetujuan' : 'Persetujuan Keterangan Personel (Verifikasi Atasan)'}
            </h2>
            <p className="text-xs text-slate-500">
              {showHistoryOnly
                ? 'Arsip digital seluruh permohonan yang telah diverifikasi dan disetujui/ditolak'
                : 'Permohonan Cuti, Dinas Luar, Sakit, dan Izin yang menunggu verifikasi pejabat berwenang'}
            </p>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="text-xs font-bold text-slate-700">
            {showHistoryOnly 
              ? `Riwayat Keputusan (${historyList.length})` 
              : `Daftar Menunggu Persetujuan (${pendingList.length})`}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold">
                <th className="py-3 px-3 w-10 text-center">No</th>
                <th className="py-3 px-3">Personel Pemohon</th>
                <th className="py-3 px-3">Jenis Keterangan</th>
                <th className="py-3 px-3">Periode Tanggal</th>
                <th className="py-3 px-3">Alasan & Nomor Surat</th>
                <th className="py-3 px-3 text-center">Status</th>
                {!showHistoryOnly && <th className="py-3 px-3 text-center w-48">Keputusan Atasan</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {activeList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 italic">
                    {showHistoryOnly 
                      ? 'Belum ada riwayat keputusan persetujuan.' 
                      : 'Semua permohonan telah selesai diverifikasi. Tidak ada pengajuan tertunda.'}
                  </td>
                </tr>
              ) : (
                activeList.map((req, idx) => (
                  <tr key={req.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-3 text-center text-slate-500 font-medium">
                      {idx + 1}
                    </td>

                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900">{req.personnelNama}</div>
                      <div className="text-[11px] text-slate-500">{req.personnelPangkat} • NRP: {req.personnelNrp}</div>
                    </td>

                    <td className="py-3 px-3">
                      <span className="font-semibold text-blue-900">{req.jenis}</span>
                      <span className="ml-1.5 px-1.5 py-0.2 rounded bg-slate-100 font-mono text-[10px] text-slate-600 font-bold">
                        {req.kode}
                      </span>
                    </td>

                    <td className="py-3 px-3">
                      <div className="font-medium text-slate-800">
                        {req.tanggalMulai} s.d {req.tanggalSelesai}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {req.jumlahHari} Hari
                      </div>
                    </td>

                    <td className="py-3 px-3 max-w-[220px]">
                      <div className="truncate font-medium text-slate-800" title={req.alasan}>
                        {req.alasan}
                      </div>
                      {req.nomorSurat && (
                        <div className="text-[10px] text-slate-400 truncate">
                          Dasar: {req.nomorSurat}
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-3 text-center">
                      {getStatusBadge(req.status)}
                    </td>

                    {!showHistoryOnly && (
                      <td className="py-3 px-3">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenAction(req, 'approve')}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center gap-1 shadow-2xs"
                            title="Setujui Permohonan"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Setujui</span>
                          </button>

                          <button
                            onClick={() => handleOpenAction(req, 'revision')}
                            className="px-2 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-[11px]"
                            title="Minta Perbaikan"
                          >
                            <span>Perbaiki</span>
                          </button>

                          <button
                            onClick={() => handleOpenAction(req, 'reject')}
                            className="px-2 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px]"
                            title="Tolak Permohonan"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Tolak</span>
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL ACTION: SETUJUI / TOLAK / PERBAIKI */}
      {selectedReq && actionType && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 space-y-4 text-xs animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-blue-600" />
                <span>
                  {actionType === 'approve' 
                    ? 'Persetujuan Keterangan Personel' 
                    : actionType === 'reject' 
                    ? 'Penolakan Permohonan' 
                    : 'Permintaan Perbaikan Berkas'}
                </span>
              </h3>
              <button onClick={() => setSelectedReq(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800">
                {errorMsg}
              </div>
            )}

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <div className="font-bold text-slate-900">{selectedReq.personnelNama}</div>
              <div className="text-slate-600">{selectedReq.personnelPangkat} • NRP: {selectedReq.personnelNrp}</div>
              <div className="text-blue-700 font-semibold">{selectedReq.jenis} ({selectedReq.jumlahHari} Hari: {selectedReq.tanggalMulai} s.d {selectedReq.tanggalSelesai})</div>
              <div className="text-slate-500 text-[11px] mt-1 italic">"{selectedReq.alasan}"</div>
            </div>

            <div>
              <label className="font-bold text-slate-700 mb-1 block">Catatan Pemeriksa / Pejabat Berwenang *</label>
              <textarea
                rows={3}
                placeholder="Tuliskan catatan arahan atau alasan keputusan..."
                value={catatan}
                onChange={e => setCatatan(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedReq(null)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={handleExecuteAction}
                disabled={isSubmitting}
                className={`px-5 py-2 rounded-xl text-white font-bold transition disabled:opacity-50 ${
                  actionType === 'approve'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : actionType === 'reject'
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-amber-600 hover:bg-amber-700'
                }`}
              >
                {isSubmitting ? 'Memproses...' : 'Simpan Keputusan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
