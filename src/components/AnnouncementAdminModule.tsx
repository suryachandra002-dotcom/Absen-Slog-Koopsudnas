import React, { useState } from 'react';
import { 
  Bell, 
  Plus, 
  Edit3, 
  Trash2, 
  Eye, 
  AlertCircle, 
  CheckCircle2, 
  Info, 
  Clock, 
  X, 
  Megaphone,
  ShieldAlert,
  CheckCheck
} from 'lucide-react';
import { Announcement, UserAccount } from '../types';

interface AnnouncementAdminModuleProps {
  announcements: Announcement[];
  currentUser: UserAccount;
  onAddAnnouncement: (judul: string, isi: string) => Promise<{ purgedOldest: string | null }>;
  onUpdateAnnouncement: (id: string, judul: string, isi: string) => Promise<void>;
  onDeleteAnnouncement: (id: string) => Promise<void>;
  readAnnouncementIds: Set<string>;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
}

export const AnnouncementAdminModule: React.FC<AnnouncementAdminModuleProps> = ({
  announcements,
  currentUser,
  onAddAnnouncement,
  onUpdateAnnouncement,
  onDeleteAnnouncement,
  readAnnouncementIds,
  onMarkAsRead,
  onMarkAllAsRead
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAnn, setEditingAnn] = useState<Announcement | null>(null);
  const [previewAnn, setPreviewAnn] = useState<Announcement | null>(null);
  const [deletingAnn, setDeletingAnn] = useState<Announcement | null>(null);

  const [formData, setFormData] = useState({ judul: '', isi: '' });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const unreadCount = announcements.filter(a => !readAnnouncementIds.has(a.id)).length;

  const handleOpenAdd = () => {
    setFormData({ judul: '', isi: '' });
    setErrorMsg(null);
    setShowAddModal(true);
  };

  const handleOpenEdit = (ann: Announcement) => {
    setFormData({ judul: ann.judul, isi: ann.isi });
    setErrorMsg(null);
    setEditingAnn(ann);
  };

  const handleOpenPreview = (ann: Announcement) => {
    onMarkAsRead(ann.id);
    setPreviewAnn(ann);
  };

  const handleSaveAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.judul.trim() || !formData.isi.trim()) {
      setErrorMsg('Judul dan isi pengumuman wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await onAddAnnouncement(formData.judul, formData.isi);
      setShowAddModal(false);
      if (res.purgedOldest) {
        setSuccessNotice(
          `Pengumuman baru berhasil disimpan. Karena batas maksimal 5 data tercapai, pengumuman tertua "${res.purgedOldest}" telah otomatis dihapus oleh sistem.`
        );
      } else {
        setSuccessNotice('Pengumuman baru berhasil ditambahkan dan tampil di Dashboard.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menambahkan pengumuman.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAnn) return;
    if (!formData.judul.trim() || !formData.isi.trim()) {
      setErrorMsg('Judul dan isi pengumuman wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await onUpdateAnnouncement(editingAnn.id, formData.judul, formData.isi);
      setEditingAnn(null);
      setSuccessNotice('Pengumuman berhasil diperbarui. Waktu pembuatan awal tetap dipertahankan.');
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal mengubah pengumuman.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingAnn) return;
    try {
      await onDeleteAnnouncement(deletingAnn.id);
      setDeletingAnn(null);
      setSuccessNotice('Pengumuman berhasil dihapus secara permanen.');
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menghapus pengumuman.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-blue-50 text-blue-700 border border-blue-200">
              <Megaphone className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">
                  {currentUser.role === 'admin'
                    ? 'Manajemen Pengumuman Dashboard (Maks. 5 Data FIFO)'
                    : 'Papan Pengumuman Resmi Staf Logistik Koopsudnas'}
                </h2>
                {unreadCount > 0 ? (
                  <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full animate-bounce shadow-2xs">
                    {unreadCount} BELUM DIBACA
                  </span>
                ) : (
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-300">
                    SEMUA SUDAH DIBACA
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                Informasi penting kedinasan, apel khusus, dan instruksi pimpinan Staf Logistik
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={onMarkAllAsRead}
                className="px-3.5 py-2 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-800 text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <CheckCheck className="w-4 h-4 text-blue-600" />
                <span>Tandai Semua Telah Dibaca</span>
              </button>
            )}

            {currentUser.role === 'admin' && (
              <button
                onClick={handleOpenAdd}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-sm self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Pengumuman</span>
              </button>
            )}
          </div>
        </div>

        {/* Success Notice / Notification Banner */}
        {successNotice && (
          <div className="mt-4 p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-900 flex items-start justify-between gap-2">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>{successNotice}</div>
            </div>
            <button onClick={() => setSuccessNotice(null)} className="text-emerald-700 hover:text-emerald-900">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Info Box Regarding Max 5 FIFO Engine */}
        {currentUser.role === 'admin' && (
          <div className="mt-4 p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-bold">Ketentuan Kapasitas Maksimal 5 Pengumuman:</div>
              <p className="text-[11px] text-blue-800">
                Sistem membatasi maksimal 5 pengumuman aktif. Apabila database sudah terisi 5 pengumuman dan Admin memasukkan pengumuman ke-6, sistem otomatis menghapus pengumuman paling lama berdasarkan tanggal & waktu server (FIFO) dan mencatat tindakannya pada Audit Log.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Announcements Table & Status */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="text-xs font-bold text-slate-700 flex items-center gap-2">
            <span>Daftar Pengumuman Aktif ({announcements.length} dari 5 Slot)</span>
            {unreadCount > 0 && (
              <span className="text-[10px] bg-red-100 text-red-800 font-extrabold px-2 py-0.5 rounded-full border border-red-300">
                {unreadCount} Baru
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map(slot => (
              <div
                key={slot}
                className={`w-3.5 h-3.5 rounded-full border ${
                  slot <= announcements.length
                    ? 'bg-blue-600 border-blue-700'
                    : 'bg-slate-200 border-slate-300'
                }`}
                title={`Slot ${slot} ${slot <= announcements.length ? 'Terisi' : 'Kosong'}`}
              />
            ))}
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {announcements.length === 0 ? (
            <div className="p-10 text-center text-slate-400 text-xs italic">
              Belum ada pengumuman yang tersimpan saat ini.
            </div>
          ) : (
            announcements.map((ann, idx) => {
              const isUnread = !readAnnouncementIds.has(ann.id);

              return (
                <div 
                  key={ann.id} 
                  className={`p-4 transition flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs ${
                    isUnread ? 'bg-blue-50/50 hover:bg-blue-50/80 border-l-4 border-l-red-500' : 'hover:bg-slate-50/70'
                  }`}
                >
                  <div className="space-y-1.5 max-w-2xl">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-[10px] shrink-0">
                        {idx + 1}
                      </span>
                      <h3 className="font-bold text-slate-900 text-sm">
                        {ann.judul}
                      </h3>
                      {isUnread && (
                        <span className="bg-red-600 text-white font-black text-[9px] px-2 py-0.5 rounded-full tracking-wider animate-pulse shadow-xs">
                          BARU
                        </span>
                      )}
                    </div>
                    <p className="text-slate-600 line-clamp-2 pl-7 leading-relaxed text-xs">
                      {ann.isi}
                    </p>
                    <div className="pl-7 text-[10px] text-slate-400 flex flex-wrap items-center gap-3 pt-0.5">
                      <span>ID: <code className="text-slate-600">{ann.id}</code></span>
                      <span>•</span>
                      <span>Dibuat: {new Date(ann.createdAt).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB</span>
                      {ann.updatedAt !== ann.createdAt && (
                        <>
                          <span>•</span>
                          <span className="text-amber-700 font-medium">
                            Diperbarui: {new Date(ann.updatedAt).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB
                          </span>
                        </>
                      )}
                      <span>•</span>
                      <span>Admin: {ann.adminNama}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 self-end md:self-center shrink-0">
                    {isUnread && (
                      <button
                        onClick={() => onMarkAsRead(ann.id)}
                        className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:text-blue-700 hover:bg-slate-50 text-[11px] font-semibold transition shadow-2xs"
                        title="Tandai sudah dibaca"
                      >
                        Tandai Dibaca
                      </button>
                    )}

                    <button
                      onClick={() => handleOpenPreview(ann)}
                      className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 hover:bg-blue-100 transition flex items-center gap-1 font-semibold text-[11px]"
                      title="Baca Rinci Pengumuman"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Buka</span>
                    </button>

                    {currentUser.role === 'admin' && (
                      <>
                        <button
                          onClick={() => handleOpenEdit(ann)}
                          className="p-1.5 rounded-lg text-slate-600 hover:text-amber-700 hover:bg-amber-50 transition"
                          title="Ubah Pengumuman"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => setDeletingAnn(ann)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                          title="Hapus Pengumuman"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* MODAL: TAMBAH / UBAH PENGUMUMAN */}
      {(showAddModal || editingAnn) && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 shadow-2xl border border-slate-200 space-y-4 text-xs animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-sm">
                  {showAddModal ? 'Tambah Pengumuman Baru' : 'Ubah Pengumuman'}
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingAnn(null);
                }}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>{errorMsg}</div>
              </div>
            )}

            <form onSubmit={showAddModal ? handleSaveAdd : handleSaveEdit} className="space-y-3">
              <div>
                <label className="font-bold text-slate-700 mb-1 block">Judul Pengumuman *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Apel Gabungan Khusus Staf Logistik"
                  value={formData.judul}
                  onChange={e => setFormData({ ...formData, judul: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-xs font-semibold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 mb-1 block">Isi Pengumuman *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Tuliskan isi pengumuman secara rinci, jelas, dan lugas..."
                  value={formData.isi}
                  onChange={e => setFormData({ ...formData, isi: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-xs leading-relaxed"
                />
              </div>

              {showAddModal && announcements.length >= 5 && (
                <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 text-[11px] flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Perhatian FIFO: </span>
                    Sistem saat ini telah berisi 5 pengumuman. Menyimpan pengumuman ini akan otomatis menghapus pengumuman paling lama dari database.
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingAnn(null);
                  }}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition disabled:opacity-50"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Pengumuman'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: PRATINJAU PENGUMUMAN */}
      {previewAnn && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 shadow-2xl border border-slate-200 space-y-4 text-xs animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">Detail Pengumuman Resmi</h3>
              <button onClick={() => setPreviewAnn(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white shadow-md space-y-2">
              <div className="flex items-center gap-2 text-cyan-300 text-[11px] font-bold">
                <Megaphone className="w-3.5 h-3.5" />
                <span>PENGUMUMAN RESMI STAF LOGISTIK KOOPSUDNAS</span>
              </div>
              <h4 className="font-bold text-base">{previewAnn.judul}</h4>
              <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-line">{previewAnn.isi}</p>
              <div className="mt-3 text-[10px] text-cyan-300/80 pt-2 border-t border-blue-800">
                Diterbitkan oleh: {previewAnn.adminNama} • {new Date(previewAnn.createdAt).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setPreviewAnn(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-white font-semibold hover:bg-slate-900"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: KONFIRMASI HAPUS MANUAL */}
      {deletingAnn && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-rose-200 space-y-4 text-xs">
            <div className="flex items-center gap-2 text-rose-700">
              <ShieldAlert className="w-5 h-5" />
              <h3 className="font-bold text-sm text-slate-900">Konfirmasi Hapus Pengumuman</h3>
            </div>
            <p className="text-slate-600">
              Apakah Anda yakin ingin menghapus pengumuman: <br />
              <span className="font-bold text-slate-900">"{deletingAnn.judul}"</span>?
            </p>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-500 text-[11px]">
              Tindakan ini akan menghapus pengumuman secara permanen dari Google Spreadsheet dan Dashboard.
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button onClick={() => setDeletingAnn(null)} className="px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold">
                Batal
              </button>
              <button onClick={handleConfirmDelete} className="px-4 py-1.5 rounded-lg bg-rose-700 hover:bg-rose-800 text-white font-bold">
                Hapus Sekarang
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
