import React, { useState, useEffect } from 'react';
import { 
  Users, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  MapPin, 
  Play, 
  Pause, 
  ChevronLeft, 
  ChevronRight, 
  Megaphone, 
  ArrowRight, 
  FileText, 
  CheckSquare, 
  Info, 
  Calendar,
  X,
  Compass,
  Building2,
  ShieldAlert
} from 'lucide-react';
import { 
  Announcement, 
  SystemStats, 
  UserAccount, 
  AttendanceRecord, 
  AbsenceCategory, 
  Personnel 
} from '../types';
import { NavTab } from './Sidebar';

interface DashboardProps {
  stats: SystemStats;
  announcements: Announcement[];
  currentUser: UserAccount;
  todayRecord?: AttendanceRecord;
  onNavigate: (tab: NavTab) => void;
  onQuickAttendance: (type: 'masuk' | 'pulang', targetPersonnelId?: string, forceOfficeCoords?: boolean) => void;
  isRecordingAttendance: boolean;
  attendanceFeedback: { type: 'success' | 'error'; message: string } | null;
  allPersonnel: Personnel[];
  todayAttendanceList: AttendanceRecord[];
}

export const Dashboard: React.FC<DashboardProps> = ({
  stats,
  announcements,
  currentUser,
  todayRecord,
  onNavigate,
  onQuickAttendance,
  isRecordingAttendance,
  attendanceFeedback,
  allPersonnel,
  todayAttendanceList
}) => {
  // Target personnel for quick check-in (defaults to current user's personnelId or first personnel)
  const [targetPersonnelId, setTargetPersonnelId] = useState<string>(
    currentUser.personnelId || (allPersonnel[0]?.id || '')
  );

  useEffect(() => {
    if (currentUser.personnelId) {
      setTargetPersonnelId(currentUser.personnelId);
    }
  }, [currentUser.personnelId]);

  // Selected personnel details
  const activePersonnel = allPersonnel.find(p => p.id === targetPersonnelId) || allPersonnel[0] || {
    id: currentUser.personnelId || 'PERS-001',
    nama: currentUser.nama,
    pangkat: currentUser.pangkat,
    nrp: currentUser.username,
    jabatan: currentUser.jabatan,
    unit: 'Slog'
  };

  // Find attendance record for selected personnel today
  const activeTodayRecord = todayAttendanceList.find(
    a => (a.personnelId === activePersonnel.id || a.personnelNrp === activePersonnel.nrp)
  ) || (activePersonnel.id === currentUser.personnelId ? todayRecord : undefined);

  // Announcement Carousel State
  const [currentAnnIndex, setCurrentAnnIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Drilldown Modal for Absence Breakdown
  const [selectedCategory, setSelectedCategory] = useState<AbsenceCategory | null>(null);

  // Carousel timer: 6 seconds interval
  useEffect(() => {
    if (announcements.length <= 1 || isPaused) return;

    const timer = setInterval(() => {
      setCurrentAnnIndex(prev => (prev + 1) % announcements.length);
    }, 6000);

    return () => clearInterval(timer);
  }, [announcements.length, isPaused]);

  const handleNextAnn = () => {
    if (announcements.length === 0) return;
    setCurrentAnnIndex(prev => (prev + 1) % announcements.length);
  };

  const handlePrevAnn = () => {
    if (announcements.length === 0) return;
    setCurrentAnnIndex(prev => (prev - 1 + announcements.length) % announcements.length);
  };

  const currentAnn = announcements[currentAnnIndex];

  // Category labels and descriptions
  const CATEGORY_MAP: Record<AbsenceCategory, { label: string; full: string; color: string; badgeBg: string }> = {
    DD: { label: 'DD', full: 'Dinas Dalam', color: 'text-blue-700', badgeBg: 'bg-blue-50 border-blue-200' },
    DL: { label: 'DL', full: 'Dinas Luar', color: 'text-sky-700', badgeBg: 'bg-sky-50 border-sky-200' },
    DK: { label: 'DK', full: 'Dinas Khusus', color: 'text-indigo-700', badgeBg: 'bg-indigo-50 border-indigo-200' },
    DIK: { label: 'DIK', full: 'Pendidikan', color: 'text-purple-700', badgeBg: 'bg-purple-50 border-purple-200' },
    CT: { label: 'CT', full: 'Cuti', color: 'text-amber-700', badgeBg: 'bg-amber-50 border-amber-200' },
    S: { label: 'S', full: 'Sakit', color: 'text-rose-700', badgeBg: 'bg-rose-50 border-rose-200' },
    I: { label: 'I', full: 'Izin', color: 'text-teal-700', badgeBg: 'bg-teal-50 border-teal-200' },
    TP: { label: 'TP', full: 'Tanpa Pemberitahuan (Belum Hadir)', color: 'text-red-700', badgeBg: 'bg-red-50 border-red-200' },
    BP: { label: 'BP', full: 'Berhalangan Pasif / Lainnya', color: 'text-slate-700', badgeBg: 'bg-slate-100 border-slate-300' }
  };

  // Get personnel list for selected category drilldown
  const getPersonnelForCategory = (cat: AbsenceCategory) => {
    if (cat === 'TP') {
      // Find active personnel who have NOT clocked in today
      const recordedIds = new Set(todayAttendanceList.map(a => a.personnelId));
      return allPersonnel.filter(p => p.status === 'aktif' && !recordedIds.has(p.id));
    }
    // Find personnel in today's attendance records with matching category
    const matchingRecords = todayAttendanceList.filter(a => a.keteranganKode === cat);
    return matchingRecords.map(r => {
      const found = allPersonnel.find(p => p.id === r.personnelId);
      return {
        nama: r.personnelNama,
        pangkat: r.personnelPangkat,
        nrp: r.personnelNrp,
        jabatan: r.personnelJabatan,
        unit: r.unit,
        catatan: r.catatanKoreksi || '-'
      };
    });
  };

  return (
    <div className="space-y-6">
      {/* 1. ANIMATED ANNOUNCEMENT BANNER (MAKSIMAL 5 DENGAN ANIMASI) */}
      <section className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl text-white p-4 md:p-5 shadow-lg border border-blue-800/60 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-56 h-56 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-blue-800/80">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-blue-500/20 text-cyan-400 border border-blue-400/30">
              <Megaphone className="w-4 h-4 animate-bounce" />
            </span>
            <span className="text-xs uppercase font-extrabold tracking-widest text-cyan-300">
              Pengumuman Resmi Staf Logistik Koopsudnas
            </span>
          </div>

          {/* Carousel Controls & Indicator */}
          {announcements.length > 0 && (
            <div className="flex items-center gap-2 text-xs">
              <span className="bg-blue-950/80 px-2.5 py-1 rounded-full text-slate-300 font-mono text-[11px] border border-blue-700/50">
                {currentAnnIndex + 1} dari {announcements.length} (Maks 5)
              </span>

              {announcements.length > 1 && (
                <div className="flex items-center gap-1 bg-blue-950/80 p-0.5 rounded-lg border border-blue-700/50">
                  <button
                    onClick={handlePrevAnn}
                    className="p-1 hover:bg-blue-800/80 rounded text-slate-300 hover:text-white transition"
                    title="Sebelumnya"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setIsPaused(!isPaused)}
                    className="p-1 hover:bg-blue-800/80 rounded text-slate-300 hover:text-white transition"
                    title={isPaused ? 'Lanjutkan Putar Otomatis' : 'Jeda Animasi'}
                  >
                    {isPaused ? <Play className="w-3.5 h-3.5 text-emerald-400" /> : <Pause className="w-3.5 h-3.5 text-amber-400" />}
                  </button>

                  <button
                    onClick={handleNextAnn}
                    className="p-1 hover:bg-blue-800/80 rounded text-slate-300 hover:text-white transition"
                    title="Berikutnya"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Announcement Content Display with Smooth Fade Transition */}
        <div className="pt-3 min-h-[95px] flex flex-col justify-center">
          {announcements.length > 0 && currentAnn ? (
            <div 
              key={currentAnn.id} 
              className="animate-in fade-in slide-in-from-right-3 duration-500 ease-out"
            >
              <h2 className="text-sm md:text-base font-bold text-white mb-1.5 flex items-center gap-2">
                <span>{currentAnn.judul}</span>
              </h2>
              <p className="text-xs md:text-sm text-slate-200 line-clamp-2 md:line-clamp-3 leading-relaxed">
                {currentAnn.isi}
              </p>
              <div className="mt-2 flex items-center gap-3 text-[10px] text-cyan-300/80">
                <span>Diterbitkan: {new Date(currentAnn.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                <span>•</span>
                <span>Oleh: {currentAnn.adminNama}</span>
              </div>
            </div>
          ) : (
            <div className="py-4 text-center text-slate-400 text-xs italic">
              Belum ada pengumuman aktif saat ini.
            </div>
          )}
        </div>
      </section>

      {/* 2. REKAP KEHADIRAN HARIAN & DRILLDOWN CATEGORY COUNTERS */}
      <section className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              <span>Rekapitulasi Kehadiran Hari Ini (WIB)</span>
            </h2>
            <p className="text-xs text-slate-500">
              Status real-time personel Staf Logistik Koopsudnas berdasarkan waktu server Asia/Jakarta
            </p>
          </div>

          <button
            onClick={() => onNavigate('recap')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 self-start sm:self-auto"
          >
            Lihat Rekap Lengkap
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Big 3 Key Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
          {/* Total Personel */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-center justify-between">
            <div>
              <div className="text-xs font-medium text-slate-500">Total Personel Slog</div>
              <div className="text-2xl font-black text-slate-900">{stats.totalPersonnel}</div>
              <div className="text-[11px] text-slate-500">Kekuatan Resmi Terdaftar</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
          </div>

          {/* Hadir */}
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3.5 flex items-center justify-between">
            <div>
              <div className="text-xs font-medium text-emerald-800">Personel Hadir</div>
              <div className="text-2xl font-black text-emerald-700">{stats.todayPresent}</div>
              <div className="text-[11px] text-emerald-700 font-medium">
                {stats.totalPersonnel > 0 ? `${((stats.todayPresent / stats.totalPersonnel) * 100).toFixed(0)}% Presensi GPS` : '0%'}
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>

          {/* Kurang / Tidak Masuk */}
          <div className="bg-rose-50/70 border border-rose-200 rounded-xl p-3.5 flex items-center justify-between">
            <div>
              <div className="text-xs font-medium text-rose-800">Jumlah Kurang (Tidak Hadir)</div>
              <div className="text-2xl font-black text-rose-700">{stats.todayAbsent}</div>
              <div className="text-[11px] text-rose-700">Termasuk Cuti, Sakit & Izin</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* 9 Absence Categories Breakdown Chips with Click-to-Drilldown */}
        <div>
          <div className="text-xs font-bold text-slate-700 mb-2.5 flex items-center justify-between">
            <span>Rincian Keterangan Personel Tidak Masuk Kantor:</span>
            <span className="text-[11px] font-normal text-slate-500 italic">
              (Klik pada kartu untuk melihat daftar nama personel)
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-9 gap-2">
            {(Object.keys(CATEGORY_MAP) as AbsenceCategory[]).map(catKey => {
              const meta = CATEGORY_MAP[catKey];
              const count = stats.categoryBreakdown[catKey] || 0;
              return (
                <button
                  key={catKey}
                  onClick={() => setSelectedCategory(catKey)}
                  className={`p-2.5 rounded-xl border text-left transition hover:shadow-sm hover:scale-[1.02] flex flex-col justify-between ${meta.badgeBg}`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`font-black text-xs ${meta.color}`}>{meta.label}</span>
                    <span className={`text-base font-black ${meta.color}`}>{count}</span>
                  </div>
                  <div className="text-[10px] text-slate-600 line-clamp-1 mt-1 font-medium">
                    {meta.full}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3. QUICK ATTENDANCE CARD & CURRENT USER STATUS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left (2 cols): Quick Attendance Action */}
        <section className="lg:col-span-2 bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <Compass className="w-5 h-5 text-blue-600" />
                <h2 className="text-base font-bold text-slate-900">
                  Pelaksanaan Absensi Kehadiran Online
                </h2>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-300">
                  Akses Terbuka
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Perekaman otomatis waktu server WIB dan validasi koordinat GPS radius 3.000 meter
              </p>
            </div>

            <button
              onClick={() => onNavigate('gps-attendance')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 self-start sm:self-auto bg-blue-50 px-2.5 py-1.5 rounded-lg border border-blue-200"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Buka Peta GPS Radar</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Quick Personnel Selector for Attendance */}
          <div className="mb-4 p-3 bg-blue-50/70 border border-blue-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-700 shrink-0" />
              <div>
                <div className="text-[11px] font-bold text-blue-950">
                  Personel yang Melakukan Presensi:
                </div>
                <div className="text-[10px] text-slate-500">
                  Pilih nama di bawah jika menggunakan gawai bersama / ingin presensi cepat
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={targetPersonnelId}
                onChange={e => setTargetPersonnelId(e.target.value)}
                className="p-1.5 bg-white border border-blue-300 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 max-w-xs shadow-2xs"
              >
                {allPersonnel.map(p => {
                  const rec = todayAttendanceList.find(a => a.personnelId === p.id || a.personnelNrp === p.nrp);
                  const statusNote = rec?.jamPulang 
                    ? '✓ Pulang' 
                    : rec?.jamMasuk 
                    ? '✓ Masuk' 
                    : 'Belum';
                  return (
                    <option key={p.id} value={p.id}>
                      [{statusNote}] {p.pangkat} {p.nama}
                    </option>
                  );
                })}
              </select>

              {currentUser.personnelId && targetPersonnelId !== currentUser.personnelId && (
                <button
                  type="button"
                  onClick={() => setTargetPersonnelId(currentUser.personnelId!)}
                  className="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg text-[10px] font-semibold text-slate-700 whitespace-nowrap"
                  title="Kembali ke akun yang sedang login"
                >
                  Akun Saya
                </button>
              )}
            </div>
          </div>

          {/* Selected Personnel Identity Bar */}
          <div className="mb-4 p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
            <div>
              <span className="font-bold text-slate-900">{activePersonnel.pangkat} {activePersonnel.nama}</span>
              <span className="text-slate-500 text-[11px] ml-2">NRP: {activePersonnel.nrp} • {activePersonnel.jabatan}</span>
            </div>
            <div className="text-right">
              {activeTodayRecord?.jamPulang ? (
                <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full border border-blue-200">
                  Dinas Selesai (Pulang {activeTodayRecord.jamPulang} WIB)
                </span>
              ) : activeTodayRecord?.jamMasuk ? (
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                  Tercatat Masuk ({activeTodayRecord.jamMasuk} WIB)
                </span>
              ) : (
                <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full border border-amber-200">
                  Belum Absen Hari Ini
                </span>
              )}
            </div>
          </div>

          {attendanceFeedback && (
            <div className={`mb-4 p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
              attendanceFeedback.type === 'success' 
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900' 
                : 'bg-rose-50 border-rose-300 text-rose-900'
            }`}>
              {attendanceFeedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              )}
              <div>{attendanceFeedback.message}</div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            {/* Absen Masuk Button */}
            <button
              onClick={() => onQuickAttendance('masuk', targetPersonnelId, false)}
              disabled={isRecordingAttendance || Boolean(activeTodayRecord?.jamMasuk)}
              className={`p-4 rounded-xl border-2 text-left transition flex flex-col justify-between ${
                activeTodayRecord?.jamMasuk
                  ? 'bg-slate-50 border-slate-200 cursor-not-allowed opacity-80'
                  : 'bg-emerald-500/10 border-emerald-500 hover:bg-emerald-500/20 active:scale-98'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                  Presensi Pagi (Masuk)
                </span>
                <Clock className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="my-2">
                <div className="text-lg font-black text-emerald-950">
                  {activeTodayRecord?.jamMasuk ? `Masuk: ${activeTodayRecord.jamMasuk} WIB` : 'Absen Masuk'}
                </div>
                <div className="text-[11px] text-emerald-800">
                  {activeTodayRecord?.jamMasuk 
                    ? `Tercatat pada pukul ${activeTodayRecord.jamMasuk} WIB` 
                    : '1-Klik untuk merekam kehadiran & koordinat GPS'}
                </div>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded self-start ${
                activeTodayRecord?.jamMasuk ? 'bg-emerald-200 text-emerald-900' : 'bg-emerald-600 text-white'
              }`}>
                {activeTodayRecord?.jamMasuk ? 'SUDAH ABSEN MASUK' : 'KLIK ABSEN MASUK SEKARANG'}
              </span>
            </button>

            {/* Absen Pulang Button */}
            <button
              onClick={() => onQuickAttendance('pulang', targetPersonnelId, false)}
              disabled={isRecordingAttendance || !activeTodayRecord?.jamMasuk || Boolean(activeTodayRecord?.jamPulang)}
              className={`p-4 rounded-xl border-2 text-left transition flex flex-col justify-between ${
                !activeTodayRecord?.jamMasuk
                  ? 'bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed'
                  : activeTodayRecord?.jamPulang
                  ? 'bg-slate-50 border-slate-200 cursor-not-allowed opacity-80'
                  : 'bg-blue-500/10 border-blue-600 hover:bg-blue-500/20 active:scale-98'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-800">
                  Presensi Sore (Pulang)
                </span>
                <Clock className="w-4 h-4 text-blue-600" />
              </div>
              <div className="my-2">
                <div className="text-lg font-black text-blue-950">
                  {activeTodayRecord?.jamPulang ? `Pulang: ${activeTodayRecord.jamPulang} WIB` : 'Absen Pulang'}
                </div>
                <div className="text-[11px] text-blue-800">
                  {activeTodayRecord?.jamPulang 
                    ? 'Status: Selesai Dinas Hari Ini' 
                    : activeTodayRecord?.jamMasuk 
                    ? 'Tekan saat jam dinas berakhir' 
                    : 'Wajib absen masuk terlebih dahulu'}
                </div>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded self-start ${
                activeTodayRecord?.jamPulang 
                  ? 'bg-blue-200 text-blue-900' 
                  : activeTodayRecord?.jamMasuk 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-slate-200 text-slate-600'
              }`}>
                {activeTodayRecord?.jamPulang ? 'SUDAH ABSEN PULANG' : 'KLIK ABSEN PULANG SEKARANG'}
              </span>
            </button>
          </div>

          {/* Quick Fallback: Instant verified office coordinates */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-slate-600">
              <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Sinyal GPS lemah di dalam gedung? Gunakan presensi instan koordinat kantor Halim:</span>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => onQuickAttendance('masuk', targetPersonnelId, true)}
                disabled={isRecordingAttendance || Boolean(activeTodayRecord?.jamMasuk)}
                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] transition disabled:opacity-40"
              >
                Presensi Masuk Cepat
              </button>
              <button
                type="button"
                onClick={() => onQuickAttendance('pulang', targetPersonnelId, true)}
                disabled={isRecordingAttendance || !activeTodayRecord?.jamMasuk || Boolean(activeTodayRecord?.jamPulang)}
                className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-[11px] transition disabled:opacity-40"
              >
                Presensi Pulang Cepat
              </button>
            </div>
          </div>

          {/* Other Quick Actions: Ajukan Keterangan / Koreksi */}
          <div className="pt-3 border-t border-slate-100 flex flex-wrap gap-2 text-xs">
            <button
              onClick={() => onNavigate('leave-request')}
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 font-medium transition flex items-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5 text-blue-600" />
              <span>Ajukan Keterangan Tidak Masuk Kantor</span>
            </button>

            <button
              onClick={() => onNavigate('correction')}
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-amber-50 hover:text-amber-700 text-slate-700 font-medium transition flex items-center gap-1.5"
            >
              <CheckSquare className="w-3.5 h-3.5 text-amber-600" />
              <span>Koreksi Absensi Lupa Presensi</span>
            </button>
          </div>
        </section>

        {/* Right (1 col): Current User Identity & Office Summary */}
        <section className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Building2 className="w-4 h-4 text-blue-700" />
              <h2 className="text-xs uppercase font-extrabold tracking-wider text-slate-600">
                Identitas Akun Login
              </h2>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 mb-3">
              <div className="font-bold text-slate-900 text-sm truncate">
                {currentUser.nama}
              </div>
              <div className="text-xs text-slate-600 font-medium mt-0.5">
                {currentUser.pangkat}
              </div>
              <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                NRP/NIP: {currentUser.username}
              </div>
              <div className="text-[11px] text-blue-700 font-semibold mt-1">
                {currentUser.jabatan}
              </div>
            </div>

            <div className="space-y-1.5 text-xs text-slate-600">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-400">Titik Acuan GPS:</span>
                <span className="font-semibold text-slate-800 text-right">Halim Perdanakusuma</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-400">Batas Toleransi:</span>
                <span className="font-semibold text-emerald-700">Maks. 3.000 Meter</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-400">Database Utama:</span>
                <span className="font-semibold text-blue-800">Google Spreadsheet</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100">
            <button
              onClick={() => onNavigate('gps-settings')}
              className="w-full py-1.5 px-2.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
            >
              <MapPin className="w-3.5 h-3.5" />
              Lihat Detail Konfigurasi GPS Kantor
            </button>
          </div>
        </section>
      </div>

      {/* 4. DETAIL PERSONEL DRILLDOWN MODAL */}
      {selectedCategory && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 rounded-t-2xl">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-black ${CATEGORY_MAP[selectedCategory].badgeBg} ${CATEGORY_MAP[selectedCategory].color}`}>
                    {selectedCategory}
                  </span>
                  <h3 className="font-bold text-slate-800 text-sm">
                    Daftar Personel: {CATEGORY_MAP[selectedCategory].full}
                  </h3>
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Rincian personel dengan keterangan ini pada tanggal hari ini (WIB)
                </div>
              </div>
              <button
                onClick={() => setSelectedCategory(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1">
              {(() => {
                const list = getPersonnelForCategory(selectedCategory);
                if (list.length === 0) {
                  return (
                    <div className="text-center py-8 text-slate-400 text-xs italic">
                      Tidak ada personel dalam kategori ini untuk hari ini.
                    </div>
                  );
                }
                return (
                  <div className="space-y-2">
                    {list.map((p, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl border border-slate-200 hover:border-blue-300 bg-white flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-bold text-slate-900">
                            {p.nama}
                          </div>
                          <div className="text-slate-600 text-[11px]">
                            {p.pangkat} • NRP: {p.nrp}
                          </div>
                          <div className="text-slate-500 text-[10px] mt-0.5">
                            {p.jabatan} ({p.unit})
                          </div>
                        </div>

                        <div className="text-right">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${CATEGORY_MAP[selectedCategory].badgeBg} ${CATEGORY_MAP[selectedCategory].color}`}>
                            {selectedCategory}
                          </span>
                          {'catatan' in p && p.catatan && p.catatan !== '-' && (
                            <div className="text-[10px] text-slate-500 mt-1 max-w-[150px] truncate">
                              {p.catatan}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>

            <div className="p-3 border-t border-slate-100 flex justify-end bg-slate-50 rounded-b-2xl">
              <button
                onClick={() => setSelectedCategory(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-800 text-white hover:bg-slate-900 text-xs font-semibold"
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
