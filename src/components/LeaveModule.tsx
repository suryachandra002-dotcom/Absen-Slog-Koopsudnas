import React, { useState } from 'react';
import { 
  FileText, 
  Plus, 
  Calendar, 
  Upload, 
  CheckCircle2, 
  Clock, 
  X, 
  FileCheck, 
  AlertCircle, 
  Paperclip,
  Eye,
  Building
} from 'lucide-react';
import { LeaveRequest, AbsenceCategory, Personnel, UserAccount } from '../types';

interface LeaveModuleProps {
  leaveRequests: LeaveRequest[];
  allPersonnel: Personnel[];
  currentUser: UserAccount;
  onSubmitLeave: (data: Partial<LeaveRequest>) => Promise<void>;
}

export const LeaveModule: React.FC<LeaveModuleProps> = ({
  leaveRequests,
  allPersonnel,
  currentUser,
  onSubmitLeave
}) => {
  const [showModal, setShowModal] = useState(false);
  const [viewingRequest, setViewingRequest] = useState<LeaveRequest | null>(null);

  const [formData, setFormData] = useState({
    personnelId: currentUser.personnelId || (allPersonnel[0]?.id || ''),
    jenis: 'Cuti' as 'Cuti' | 'Dinas Luar' | 'Izin' | 'Pendidikan' | 'Sakit' | 'Dinas Khusus' | 'Lainnya',
    kode: 'CT' as AbsenceCategory,
    tanggalMulai: new Date().toISOString().split('T')[0],
    tanggalSelesai: new Date().toISOString().split('T')[0],
    alasan: '',
    nomorSurat: '',
    tanggalSurat: new Date().toISOString().split('T')[0],
    pejabatPenerbit: 'Waaslog Kaskoopsudnas',
    dokumenNama: '',
    dokumenData: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const calculateDays = (start: string, end: string) => {
    if (!start || !end) return 1;
    const s = new Date(start).getTime();
    const e = new Date(end).getTime();
    if (e < s) return 1;
    return Math.round((e - s) / (1000 * 60 * 60 * 24)) + 1;
  };

  const handleJenisChange = (val: string) => {
    let kode: AbsenceCategory = 'CT';
    if (val === 'Cuti') kode = 'CT';
    else if (val === 'Dinas Luar') kode = 'DL';
    else if (val === 'Izin') kode = 'I';
    else if (val === 'Pendidikan') kode = 'DIK';
    else if (val === 'Sakit') kode = 'S';
    else if (val === 'Dinas Khusus') kode = 'DK';
    else kode = 'BP';

    setFormData(prev => ({ ...prev, jenis: val as any, kode }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('Ukuran file dokumen melebihi 5 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setFormData(prev => ({
        ...prev,
        dokumenNama: file.name,
        dokumenData: reader.result as string
      }));
      setErrorMsg(null);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.alasan.trim()) {
      setErrorMsg('Alasan pengajuan wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    const jumlahHari = calculateDays(formData.tanggalMulai, formData.tanggalSelesai);

    try {
      await onSubmitLeave({
        ...formData,
        jumlahHari
      });
      setShowModal(false);
      setSuccessMsg('Pengajuan keterangan kehadiran berhasil dikirim ke Pejabat Berwenang.');
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal mengirim pengajuan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Disetujui':
        return <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-full font-bold text-[10px]">DISETUJUI</span>;
      case 'Ditolak':
        return <span className="bg-rose-100 text-rose-800 border border-rose-300 px-2 py-0.5 rounded-full font-bold text-[10px]">DITOLAK</span>;
      case 'Perlu Perbaikan':
        return <span className="bg-amber-100 text-amber-800 border border-amber-300 px-2 py-0.5 rounded-full font-bold text-[10px]">PERLU PERBAIKAN</span>;
      default:
        return <span className="bg-blue-100 text-blue-800 border border-blue-300 px-2 py-0.5 rounded-full font-bold text-[10px]">MENUNGGU PERSETUJUAN</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-blue-50 text-blue-700 border border-blue-200">
              <FileText className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Pengajuan Keterangan Kehadiran Personel
              </h2>
              <p className="text-xs text-slate-500">
                Layanan pengajuan Cuti, Dinas Luar, Dinas Khusus, Pendidikan, Izin, dan Surat Sakit
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
            <span>Ajukan Keterangan Baru</span>
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

      {/* Requests Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="text-xs font-bold text-slate-700">
            Daftar Pengajuan Keterangan ({leaveRequests.length} Pengajuan)
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold">
                <th className="py-3 px-3 w-10 text-center">No</th>
                <th className="py-3 px-3">Personel Pemohon</th>
                <th className="py-3 px-3">Jenis & Kode</th>
                <th className="py-3 px-3">Periode Tanggal</th>
                <th className="py-3 px-3">Durasi</th>
                <th className="py-3 px-3">Alasan / No. Surat</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-center w-24">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {leaveRequests.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400 italic">
                    Belum ada riwayat permohonan keterangan kehadiran.
                  </td>
                </tr>
              ) : (
                leaveRequests.map((req, idx) => (
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

                    <td className="py-3 px-3 font-medium text-slate-700">
                      {req.tanggalMulai === req.tanggalSelesai ? (
                        req.tanggalMulai
                      ) : (
                        `${req.tanggalMulai} s.d ${req.tanggalSelesai}`
                      )}
                    </td>

                    <td className="py-3 px-3 font-semibold text-slate-800">
                      {req.jumlahHari} Hari
                    </td>

                    <td className="py-3 px-3 max-w-[200px]">
                      <div className="truncate font-medium text-slate-800" title={req.alasan}>
                        {req.alasan}
                      </div>
                      {req.nomorSurat && (
                        <div className="text-[10px] text-slate-400 truncate">
                          No: {req.nomorSurat}
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-3 text-center">
                      {getStatusBadge(req.status)}
                    </td>

                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => setViewingRequest(req)}
                        className="px-2 py-1 rounded bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 font-semibold inline-flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Detail</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: PENGAJUAN KETERANGAN BARU */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-5 shadow-2xl border border-slate-200 space-y-4 text-xs animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                <span>Formulir Permohonan Keterangan Kehadiran</span>
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>{errorMsg}</div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="font-bold text-slate-700 mb-1 block">Personel Pemohon *</label>
                <select
                  value={formData.personnelId}
                  onChange={e => setFormData({ ...formData, personnelId: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-xs"
                >
                  {allPersonnel.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.pangkat} {p.nama} (NRP: {p.nrp}) - {p.jabatan}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 mb-1 block">Jenis Keterangan *</label>
                  <select
                    value={formData.jenis}
                    onChange={e => handleJenisChange(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs"
                  >
                    <option value="Cuti">Cuti (CT)</option>
                    <option value="Dinas Luar">Dinas Luar (DL)</option>
                    <option value="Dinas Khusus">Dinas Khusus (DK)</option>
                    <option value="Pendidikan">Pendidikan (DIK)</option>
                    <option value="Izin">Izin (I)</option>
                    <option value="Sakit">Sakit (S)</option>
                    <option value="Lainnya">Lainnya / Berhalangan Pasif (BP)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 mb-1 block">Jumlah Hari</label>
                  <div className="p-2 bg-slate-100 rounded-xl font-black text-blue-900 text-xs">
                    {calculateDays(formData.tanggalMulai, formData.tanggalSelesai)} Hari Kerja
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 mb-1 block">Tanggal Mulai *</label>
                  <input
                    type="date"
                    required
                    value={formData.tanggalMulai}
                    onChange={e => setFormData({ ...formData, tanggalMulai: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 mb-1 block">Tanggal Selesai *</label>
                  <input
                    type="date"
                    required
                    value={formData.tanggalSelesai}
                    onChange={e => setFormData({ ...formData, tanggalSelesai: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 mb-1 block">Alasan / Keperluan Dinas / Keterangan *</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Jelaskan alasan atau penugasan resmi..."
                  value={formData.alasan}
                  onChange={e => setFormData({ ...formData, alasan: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 mb-1 block">Nomor Surat Perintah / Dokumen</label>
                  <input
                    type="text"
                    placeholder="Sprin/xxx/xx/xxxx"
                    value={formData.nomorSurat}
                    onChange={e => setFormData({ ...formData, nomorSurat: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 mb-1 block">Pejabat / Instansi Penerbit</label>
                  <input
                    type="text"
                    value={formData.pejabatPenerbit}
                    onChange={e => setFormData({ ...formData, pejabatPenerbit: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              {/* Document upload */}
              <div>
                <label className="font-bold text-slate-700 mb-1 block">Unggah Dokumen Pendukung (PDF, JPG, PNG)</label>
                <div className="flex items-center gap-2">
                  <label className="cursor-pointer px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 font-semibold flex items-center gap-1.5 text-xs text-slate-700">
                    <Paperclip className="w-3.5 h-3.5 text-blue-600" />
                    <span>{formData.dokumenNama ? 'Ganti File' : 'Pilih Berkas Bukti'}</span>
                    <input type="file" accept="image/*,.pdf" onChange={handleFileUpload} className="hidden" />
                  </label>
                  {formData.dokumenNama && (
                    <span className="text-[11px] text-slate-600 font-medium truncate max-w-[200px]">
                      {formData.dokumenNama}
                    </span>
                  )}
                </div>
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
                  {isSubmitting ? 'Mengirim...' : 'Kirim Pengajuan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DETAIL PENGAJUAN */}
      {viewingRequest && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 shadow-2xl border border-slate-200 space-y-4 text-xs animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">Rincian Pengajuan Keterangan</h3>
              <button onClick={() => setViewingRequest(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-400">Pemohon:</span>
                <span className="font-bold text-slate-900">{viewingRequest.personnelNama} ({viewingRequest.personnelPangkat})</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-400">NRP/NIP:</span>
                <span className="font-mono text-slate-800">{viewingRequest.personnelNrp}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-400">Jenis Keterangan:</span>
                <span className="font-bold text-blue-700">{viewingRequest.jenis} ({viewingRequest.kode})</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-400">Periode & Durasi:</span>
                <span className="font-semibold text-slate-800">
                  {viewingRequest.tanggalMulai} s.d {viewingRequest.tanggalSelesai} ({viewingRequest.jumlahHari} Hari)
                </span>
              </div>
              <div className="py-1 border-b border-slate-100">
                <span className="text-slate-400 block mb-0.5">Alasan:</span>
                <span className="font-medium text-slate-800">{viewingRequest.alasan}</span>
              </div>
              {viewingRequest.nomorSurat && (
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-400">Dasar Surat:</span>
                  <span className="font-semibold text-slate-800">{viewingRequest.nomorSurat}</span>
                </div>
              )}
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-400">Status Persetujuan:</span>
                <div>{getStatusBadge(viewingRequest.status)}</div>
              </div>
              {viewingRequest.disetujuiOleh && (
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-400">Diverifikasi Oleh:</span>
                  <span className="font-bold text-slate-800">{viewingRequest.disetujuiOleh}</span>
                </div>
              )}
              {viewingRequest.catatanAtasan && (
                <div className="py-1">
                  <span className="text-slate-400 block mb-0.5">Catatan Pemeriksa:</span>
                  <span className="italic text-slate-700">{viewingRequest.catatanAtasan}</span>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                onClick={() => setViewingRequest(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-white font-semibold hover:bg-slate-900"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
