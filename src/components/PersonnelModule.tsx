import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  UserPlus, 
  Edit3, 
  Eye, 
  Archive, 
  RotateCcw, 
  Trash2, 
  Upload, 
  Check, 
  X, 
  AlertTriangle, 
  Home, 
  Phone, 
  Briefcase, 
  FileSpreadsheet, 
  ShieldAlert,
  UserCheck
} from 'lucide-react';
import { Personnel } from '../types';
import { PANGKAT_OPTIONS, UNIT_OPTIONS } from '../data/initialPersonnel';
import { exportService } from '../utils/exporter';

interface PersonnelModuleProps {
  personnelList: Personnel[];
  onAddPersonnel: (data: Partial<Personnel>) => Promise<void>;
  onUpdatePersonnel: (id: string, data: Partial<Personnel>) => Promise<void>;
  onArchivePersonnel: (id: string, alasan: string) => Promise<void>;
  onRestorePersonnel: (id: string) => Promise<void>;
  onToggleStatus: (id: string) => Promise<void>;
  onDeletePersonnel: (id: string, confirmationName: string, alasan: string) => Promise<void>;
  userRole: string;
}

export const PersonnelModule: React.FC<PersonnelModuleProps> = ({
  personnelList,
  onAddPersonnel,
  onUpdatePersonnel,
  onArchivePersonnel,
  onRestorePersonnel,
  onToggleStatus,
  onDeletePersonnel,
  userRole
}) => {
  const [activeTab, setActiveTab] = useState<'aktif' | 'arsip'>('aktif');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUnit, setSelectedUnit] = useState('ALL');

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPerson, setEditingPerson] = useState<Personnel | null>(null);
  const [viewingPerson, setViewingPerson] = useState<Personnel | null>(null);
  const [archivingPerson, setArchivingPerson] = useState<Personnel | null>(null);
  const [deletingPerson, setDeletingPerson] = useState<Personnel | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    nama: '',
    pangkat: PANGKAT_OPTIONS[0],
    nrp: '',
    jabatan: '',
    unit: UNIT_OPTIONS[0],
    telepon: '',
    alamatRumah: '',
    tinggalDiMes: false,
    alamatMes: '',
    keteranganTambahan: '',
    foto: ''
  });

  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Archive & Delete reasons
  const [archiveReason, setArchiveReason] = useState('');
  const [deleteReason, setDeleteReason] = useState('');
  const [deleteConfirmName, setDeleteConfirmName] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);

  // Filtering
  const filteredList = personnelList.filter(p => {
    const matchesTab = activeTab === 'aktif' ? p.status !== 'diarsipkan' : p.status === 'diarsipkan';
    const matchesUnit = selectedUnit === 'ALL' || p.unit === selectedUnit;
    const q = searchQuery.toLowerCase();
    const matchesSearch = 
      p.nama.toLowerCase().includes(q) ||
      p.nrp.toLowerCase().includes(q) ||
      p.jabatan.toLowerCase().includes(q) ||
      p.pangkat.toLowerCase().includes(q);

    return matchesTab && matchesUnit && matchesSearch;
  });

  // Photo Upload Handler (max 5MB, format check, square crop simulation)
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
      setFormError('Format foto tidak valid. Gunakan file JPG, JPEG, atau PNG.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setFormError('Ukuran file foto melebihi batas maksimal 5 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setFormData(prev => ({ ...prev, foto: reader.result as string }));
      setFormError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleOpenAdd = () => {
    setFormData({
      nama: '',
      pangkat: 'Kolonel Tek',
      nrp: '',
      jabatan: '',
      unit: 'Paban I/Ren',
      telepon: '',
      alamatRumah: '',
      tinggalDiMes: false,
      alamatMes: '',
      keteranganTambahan: '',
      foto: ''
    });
    setFormError(null);
    setShowAddModal(true);
  };

  const handleOpenEdit = (person: Personnel) => {
    setFormData({
      nama: person.nama,
      pangkat: person.pangkat,
      nrp: person.nrp,
      jabatan: person.jabatan,
      unit: person.unit,
      telepon: person.telepon || '',
      alamatRumah: person.alamatRumah || '',
      tinggalDiMes: Boolean(person.tinggalDiMes),
      alamatMes: person.alamatMes || '',
      keteranganTambahan: person.keteranganTambahan || '',
      foto: person.foto || ''
    });
    setFormError(null);
    setEditingPerson(person);
  };

  const handleSaveAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama.trim() || !formData.nrp.trim() || !formData.jabatan.trim()) {
      setFormError('Nama Lengkap, NRP/NIP, dan Jabatan wajib diisi.');
      return;
    }
    if (formData.tinggalDiMes && !formData.alamatMes.trim()) {
      setFormError('Alamat mes wajib diisi apabila memilih Tinggal di Mes.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);
    try {
      await onAddPersonnel(formData);
      setShowAddModal(false);
    } catch (err: any) {
      setFormError(err.message || 'Gagal menambahkan personel.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPerson) return;
    if (!formData.nama.trim() || !formData.nrp.trim() || !formData.jabatan.trim()) {
      setFormError('Nama Lengkap, NRP/NIP, dan Jabatan wajib diisi.');
      return;
    }
    if (formData.tinggalDiMes && !formData.alamatMes.trim()) {
      setFormError('Alamat mes wajib diisi apabila memilih Tinggal di Mes.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);
    try {
      await onUpdatePersonnel(editingPerson.id, formData);
      setEditingPerson(null);
    } catch (err: any) {
      setFormError(err.message || 'Gagal memperbarui data personel.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmArchive = async () => {
    if (!archivingPerson) return;
    try {
      await onArchivePersonnel(archivingPerson.id, archiveReason || 'Diarsipkan atas perintah administrasi');
      setArchivingPerson(null);
      setArchiveReason('');
    } catch (err: any) {
      setActionError(err.message);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingPerson) return;
    if (deleteConfirmName.trim() !== deletingPerson.nama.trim()) {
      setActionError('Konfirmasi nama tidak sesuai.');
      return;
    }

    try {
      await onDeletePersonnel(deletingPerson.id, deleteConfirmName, deleteReason);
      setDeletingPerson(null);
      setDeleteConfirmName('');
      setDeleteReason('');
      setActionError(null);
    } catch (err: any) {
      setActionError(err.message);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header and Controls */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-blue-50 text-blue-700">
                <Users className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Manajemen Data Personel Staf Logistik Koopsudnas
                </h2>
                <p className="text-xs text-slate-500">
                  Data master 26 personel resmi, profil lengkap, status dinas, dan pengarsipan
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => exportService.exportPersonnelToExcel(filteredList)}
              className="px-3 py-2 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Ekspor Excel (.xlsx)</span>
            </button>

            <button
              onClick={handleOpenAdd}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
            >
              <UserPlus className="w-4 h-4" />
              <span>Tambah Personel Baru</span>
            </button>
          </div>
        </div>

        {/* Tabs: Personel Aktif vs Arsip */}
        <div className="flex border-b border-slate-200 mb-4">
          <button
            onClick={() => setActiveTab('aktif')}
            className={`pb-2.5 px-4 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'aktif'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Personel Aktif & Nonaktif ({personnelList.filter(p => p.status !== 'diarsipkan').length})</span>
          </button>

          <button
            onClick={() => setActiveTab('arsip')}
            className={`pb-2.5 px-4 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'arsip'
                ? 'border-amber-600 text-amber-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Archive className="w-4 h-4" />
            <span>Arsip Personel ({personnelList.filter(p => p.status === 'diarsipkan').length})</span>
          </button>
        </div>

        {/* Search & Unit Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Cari berdasarkan Nama, NRP/NIP, Pangkat, atau Jabatan..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={selectedUnit}
              onChange={e => setSelectedUnit(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">Semua Unit Kerja</option>
              {UNIT_OPTIONS.map(u => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Personnel Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold">
                <th className="py-3 px-3 w-12 text-center">No</th>
                <th className="py-3 px-3">Personel</th>
                <th className="py-3 px-3">NRP / NIP</th>
                <th className="py-3 px-3">Pangkat & Jabatan</th>
                <th className="py-3 px-3">Unit Kerja</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-center w-36">Aksi Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400 italic">
                    Tidak ditemukan data personel yang sesuai kriteria pencarian.
                  </td>
                </tr>
              ) : (
                filteredList.map((person, index) => (
                  <tr key={person.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-3 text-center font-medium text-slate-500">
                      {index + 1}
                    </td>

                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center font-bold text-slate-600 text-xs shrink-0 shadow-2xs">
                          {person.foto ? (
                            <img src={person.foto} alt={person.nama} className="w-full h-full object-cover" />
                          ) : (
                            person.nama.charAt(0)
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 leading-snug">
                            {person.nama}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {person.telepon || 'No. telp belum diisi'}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3 font-mono text-slate-800 font-semibold">
                      {person.nrp}
                    </td>

                    <td className="py-3 px-3">
                      <div className="font-semibold text-blue-900">{person.pangkat}</div>
                      <div className="text-[11px] text-slate-600 truncate max-w-[220px]" title={person.jabatan}>
                        {person.jabatan}
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium text-[11px]">
                        {person.unit}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        person.status === 'aktif'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : person.status === 'nonaktif'
                          ? 'bg-slate-200 text-slate-700 border border-slate-300'
                          : 'bg-amber-100 text-amber-800 border border-amber-300'
                      }`}>
                        {person.status.toUpperCase()}
                      </span>
                    </td>

                    <td className="py-3 px-3">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => setViewingPerson(person)}
                          className="p-1.5 rounded-lg text-slate-600 hover:text-blue-700 hover:bg-blue-50 transition"
                          title="Lihat Detail Profil"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleOpenEdit(person)}
                          className="p-1.5 rounded-lg text-slate-600 hover:text-amber-700 hover:bg-amber-50 transition"
                          title="Ubah Data Personel"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        {person.status !== 'diarsipkan' ? (
                          <>
                            <button
                              onClick={() => onToggleStatus(person.id)}
                              className={`p-1.5 rounded-lg transition ${
                                person.status === 'aktif'
                                  ? 'text-slate-500 hover:text-amber-600 hover:bg-amber-50'
                                  : 'text-emerald-600 hover:bg-emerald-50'
                              }`}
                              title={person.status === 'aktif' ? 'Nonaktifkan Personel' : 'Aktifkan Kembali'}
                            >
                              <UserCheck className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => {
                                setArchivingPerson(person);
                                setArchiveReason('');
                              }}
                              className="p-1.5 rounded-lg text-slate-600 hover:text-purple-700 hover:bg-purple-50 transition"
                              title="Arsipkan Personel"
                            >
                              <Archive className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => onRestorePersonnel(person.id)}
                            className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition"
                            title="Pulihkan dari Arsip"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        )}

                        <button
                          onClick={() => {
                            setDeletingPerson(person);
                            setDeleteConfirmName('');
                            setDeleteReason('');
                            setActionError(null);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                          title="Hapus Permanen (Ketat)"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: TAMBAH / UBAH PERSONEL */}
      {(showAddModal || editingPerson) && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 rounded-t-2xl">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                <span>{showAddModal ? 'Tambah Personel Staf Logistik' : 'Ubah Data Personel'}</span>
              </h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingPerson(null);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={showAddModal ? handleSaveAdd : handleSaveEdit} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Photo Upload Area */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-white border border-slate-300 overflow-hidden flex items-center justify-center shrink-0">
                  {formData.foto ? (
                    <img src={formData.foto} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <Users className="w-8 h-8 text-slate-300" />
                  )}
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-800 block">Foto Personel (Maks 5 MB)</label>
                  <p className="text-[11px] text-slate-500">Format: JPG, JPEG, PNG (Rasio 1:1 direkomendasikan)</p>
                  <div className="flex items-center gap-2 pt-1">
                    <label className="cursor-pointer px-2.5 py-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold border border-blue-200 text-[11px] inline-flex items-center gap-1">
                      <Upload className="w-3 h-3" />
                      Pilih Foto
                      <input type="file" accept="image/jpeg,image/png,image/jpg" onChange={handlePhotoUpload} className="hidden" />
                    </label>
                    {formData.foto && (
                      <button
                        type="button"
                        onClick={() => setFormData(p => ({ ...p, foto: '' }))}
                        className="px-2 py-1 rounded text-rose-700 hover:bg-rose-50 font-semibold text-[11px]"
                      >
                        Hapus Foto
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Identity Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 mb-1 block">Nama Lengkap & Gelar *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Fiyono, S.T., M.M."
                    value={formData.nama}
                    onChange={e => setFormData({ ...formData, nama: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 mb-1 block">NRP / NIP (Teks Unik) *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: 520336"
                    value={formData.nrp}
                    onChange={e => setFormData({ ...formData, nrp: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white font-mono"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 mb-1 block">Pangkat / Golongan *</label>
                  <select
                    value={formData.pangkat}
                    onChange={e => setFormData({ ...formData, pangkat: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  >
                    {PANGKAT_OPTIONS.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 mb-1 block">Unit / Bagian Kerja *</label>
                  <select
                    value={formData.unit}
                    onChange={e => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  >
                    {UNIT_OPTIONS.map(u => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="font-bold text-slate-700 mb-1 block">Jabatan *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Waaslog Kaskoopsudnas"
                    value={formData.jabatan}
                    onChange={e => setFormData({ ...formData, jabatan: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              {/* Contact & Residential Details */}
              <div className="pt-3 border-t border-slate-100 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 mb-1 block">Nomor Telepon / WhatsApp</label>
                    <input
                      type="text"
                      placeholder="0812xxxxxxxx"
                      value={formData.telepon}
                      onChange={e => setFormData({ ...formData, telepon: e.target.value })}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 mb-1 block">Tinggal di Mes?</label>
                    <select
                      value={formData.tinggalDiMes ? 'YA' : 'TIDAK'}
                      onChange={e => setFormData({ ...formData, tinggalDiMes: e.target.value === 'YA' })}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                    >
                      <option value="TIDAK">Tidak (Rumah Sendiri / Kontrak)</option>
                      <option value="YA">Ya (Tinggal di Mes Dinas)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 mb-1 block">Alamat Rumah Tinggal</label>
                  <textarea
                    rows={2}
                    placeholder="Alamat domisili lengkap..."
                    value={formData.alamatRumah}
                    onChange={e => setFormData({ ...formData, alamatRumah: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>

                {formData.tinggalDiMes && (
                  <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl space-y-1">
                    <label className="font-bold text-amber-900 block">Alamat Mes Dinas (Wajib diisi jika tinggal di Mes) *</label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Mes Bintara Garuda Blok B Kamar 12, Koopsudnas"
                      value={formData.alamatMes}
                      onChange={e => setFormData({ ...formData, alamatMes: e.target.value })}
                      className="w-full p-2 bg-white border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                )}

                <div>
                  <label className="font-bold text-slate-700 mb-1 block">Keterangan Tambahan (Opsional)</label>
                  <input
                    type="text"
                    placeholder="Catatan administrasi tambahan..."
                    value={formData.keteranganTambahan}
                    onChange={e => setFormData({ ...formData, keteranganTambahan: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingPerson(null);
                  }}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Data Personel'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DETAIL PERSONEL */}
      {viewingPerson && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 bg-gradient-to-r from-blue-900 to-slate-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">Profil Lengkap Personel</h3>
              <button onClick={() => setViewingPerson(null)} className="text-white/80 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="w-16 h-16 rounded-xl bg-blue-100 text-blue-900 flex items-center justify-center font-bold text-lg overflow-hidden shrink-0 border border-blue-200">
                  {viewingPerson.foto ? (
                    <img src={viewingPerson.foto} alt={viewingPerson.nama} className="w-full h-full object-cover" />
                  ) : (
                    viewingPerson.nama.charAt(0)
                  )}
                </div>
                <div>
                  <div className="font-black text-slate-900 text-sm">{viewingPerson.nama}</div>
                  <div className="text-blue-700 font-bold">{viewingPerson.pangkat}</div>
                  <div className="text-slate-500 font-mono">NRP/NIP: {viewingPerson.nrp}</div>
                  <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                    viewingPerson.status === 'aktif' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                  }`}>
                    STATUS: {viewingPerson.status.toUpperCase()}
                  </span>
                </div>
              </div>

              <div className="space-y-2 border-t border-slate-100 pt-3">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-400">Jabatan:</span>
                  <span className="font-semibold text-slate-800 text-right">{viewingPerson.jabatan}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-400">Unit / Paban:</span>
                  <span className="font-semibold text-slate-800">{viewingPerson.unit}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-400">Telepon / Kontak:</span>
                  <span className="font-semibold text-slate-800">{viewingPerson.telepon || '-'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-400">Tinggal di Mes:</span>
                  <span className="font-semibold text-slate-800">{viewingPerson.tinggalDiMes ? 'Ya (Mes Dinas)' : 'Tidak'}</span>
                </div>
                {viewingPerson.tinggalDiMes && (
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-400">Alamat Mes:</span>
                    <span className="font-semibold text-slate-800 text-right">{viewingPerson.alamatMes || '-'}</span>
                  </div>
                )}
                <div className="py-1">
                  <span className="text-slate-400 block mb-1">Alamat Rumah:</span>
                  <span className="font-medium text-slate-800 block">{viewingPerson.alamatRumah || '-'}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => setViewingPerson(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-white font-semibold hover:bg-slate-900"
                >
                  Tutup Profil
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ARSIPKAN PERSONEL */}
      {archivingPerson && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 space-y-4 text-xs">
            <div className="flex items-center gap-2 text-purple-700">
              <Archive className="w-5 h-5" />
              <h3 className="font-bold text-sm text-slate-900">Arsipkan Data Personel</h3>
            </div>
            <p className="text-slate-600">
              Personel <span className="font-bold text-slate-900">{archivingPerson.pangkat} {archivingPerson.nama}</span> akan dipindahkan ke daftar arsip. Riwayat absensi dan audit tetap aman tersimpan.
            </p>

            <div>
              <label className="font-bold text-slate-700 mb-1 block">Alasan Pengarsipan:</label>
              <textarea
                rows={2}
                placeholder="Contoh: Mutasi penugasan ke satuan lain / Purna tugas..."
                value={archiveReason}
                onChange={e => setArchiveReason(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setArchivingPerson(null)} className="px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold">
                Batal
              </button>
              <button onClick={handleConfirmArchive} className="px-4 py-1.5 rounded-lg bg-purple-700 hover:bg-purple-800 text-white font-bold">
                Konfirmasi Arsipkan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: HAPUS PERMANEN (STRICT CHECK) */}
      {deletingPerson && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-rose-200 space-y-4 text-xs">
            <div className="flex items-center gap-2 text-rose-700">
              <ShieldAlert className="w-5 h-5" />
              <h3 className="font-bold text-sm text-slate-900">Peringatan: Hapus Permanen Personel</h3>
            </div>

            {actionError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>{actionError}</div>
              </div>
            )}

            <p className="text-slate-600">
              Sesuai ketentuan integritas data, penghapusan permanen hanya diizinkan untuk data yang <span className="font-bold text-rose-700">TIDAK memiliki riwayat absensi atau keterangan</span>. Jika ada riwayat, sistem akan menolak dan mewajibkan pengarsipan.
            </p>

            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-[11px]">
              <div>Target: {deletingPerson.pangkat} {deletingPerson.nama}</div>
              <div>NRP/NIP: {deletingPerson.nrp}</div>
            </div>

            <div>
              <label className="font-bold text-slate-700 mb-1 block">Ketik Nama Lengkap Persis untuk Konfirmasi:</label>
              <input
                type="text"
                placeholder={deletingPerson.nama}
                value={deleteConfirmName}
                onChange={e => setDeleteConfirmName(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 mb-1 block">Alasan Penghapusan Permanen:</label>
              <input
                type="text"
                placeholder="Alasan administratif..."
                value={deleteReason}
                onChange={e => setDeleteReason(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button onClick={() => setDeletingPerson(null)} className="px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold">
                Batal
              </button>
              <button onClick={handleConfirmDelete} className="px-4 py-1.5 rounded-lg bg-rose-700 hover:bg-rose-800 text-white font-bold">
                Hapus Permanen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
