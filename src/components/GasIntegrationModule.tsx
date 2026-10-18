import React, { useState, useEffect } from 'react';
import { 
  FileCode2, 
  Copy, 
  Check, 
  Download, 
  FileSpreadsheet, 
  ExternalLink, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  Database,
  ArrowRight,
  Play,
  Globe,
  Key,
  Layers,
  HelpCircle,
  Link,
  ChevronRight,
  Info,
  RefreshCw,
  LogOut,
  FolderPlus,
  CheckCheck
} from 'lucide-react';
import { GOOGLE_APPS_SCRIPT_CODE } from '../data/gasCodeTemplate';
import { INITIAL_PERSONNEL } from '../data/initialPersonnel';
import { 
  Personnel, 
  AttendanceRecord, 
  Announcement, 
  LeaveRequest, 
  AttendanceCorrection, 
  AuditLog 
} from '../types';
import { 
  googleSignIn, 
  getAccessToken, 
  googleLogout, 
  initAuth, 
  SCOPES 
} from '../services/googleAuth';
import { 
  googleSheetsApi, 
  SpreadsheetInfo 
} from '../services/googleSheets';
import { User } from 'firebase/auth';
import * as XLSX from 'xlsx';

interface GasIntegrationModuleProps {
  webhookUrl: string;
  onSaveWebhook: (url: string) => Promise<void>;
  personnelList?: Personnel[];
  attendanceList?: AttendanceRecord[];
  announcements?: Announcement[];
  leaveRequests?: LeaveRequest[];
  corrections?: AttendanceCorrection[];
  auditLogs?: AuditLog[];
}

export const GasIntegrationModule: React.FC<GasIntegrationModuleProps> = ({
  webhookUrl,
  onSaveWebhook,
  personnelList = [],
  attendanceList = [],
  announcements = [],
  leaveRequests = [],
  corrections = [],
  auditLogs = []
}) => {
  // Google Workspace Direct Auth & Sheets State
  const [googleUser, setGoogleUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [activeSpreadsheet, setActiveSpreadsheet] = useState<SpreadsheetInfo | null>(() => {
    const saved = localStorage.getItem('slog_active_spreadsheet');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return null; }
    }
    return null;
  });
  const [isCreatingSpreadsheet, setIsCreatingSpreadsheet] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [spreadsheetIdInput, setSpreadsheetIdInput] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState('');
  const [pendingAction, setPendingAction] = useState<(() => Promise<void>) | null>(null);

  // Webhook & Script state
  const [copied, setCopied] = useState(false);
  const [urlInput, setUrlInput] = useState(webhookUrl);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [activeStepTab, setActiveStepTab] = useState<'all' | '1' | '2' | '3' | '4' | '5' | '6' | '7'>('all');
  const [activeMode, setActiveMode] = useState<'direct' | 'webhook'>('direct');

  // Initialize Auth listener on mount
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setGoogleUser(user);
        setAccessToken(token);
      },
      () => {
        setGoogleUser(null);
        setAccessToken(null);
      }
    );
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  const handleGoogleLogin = async () => {
    setIsLoggingIn(true);
    setSyncStatus(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setGoogleUser(result.user);
        setAccessToken(result.accessToken);
        setSyncStatus('Berhasil terhubung dengan Akun Google!');
      }
    } catch (err: any) {
      setSyncStatus(`Gagal menghubungkan Google: ${err.message}`);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleGoogleLogout = async () => {
    await googleLogout();
    setGoogleUser(null);
    setAccessToken(null);
    setSyncStatus('Sesi Google telah terputus.');
  };

  const handleCreateNewSpreadsheet = async () => {
    if (!accessToken) {
      setSyncStatus('Silakan hubungkan akun Google terlebih dahulu.');
      return;
    }

    setIsCreatingSpreadsheet(true);
    setSyncStatus(null);
    try {
      const newSheet = await googleSheetsApi.createAttendanceSpreadsheet(
        accessToken,
        `DATABASE KEHADIRAN SLOG KOOPSUDNAS (${new Date().toLocaleDateString('id-ID')})`
      );
      setActiveSpreadsheet(newSheet);
      localStorage.setItem('slog_active_spreadsheet', JSON.stringify(newSheet));
      setSyncStatus(`Berhasil membuat Spreadsheet: "${newSheet.title}"`);
    } catch (err: any) {
      setSyncStatus(`Gagal membuat spreadsheet: ${err.message}`);
    } finally {
      setIsCreatingSpreadsheet(false);
    }
  };

  const handleConnectExistingSpreadsheet = async () => {
    if (!accessToken) {
      setSyncStatus('Silakan hubungkan akun Google terlebih dahulu.');
      return;
    }

    let id = spreadsheetIdInput.trim();
    if (!id) return;

    // Extract ID if full URL was pasted
    const match = id.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (match && match[1]) {
      id = match[1];
    }

    setIsCreatingSpreadsheet(true);
    setSyncStatus(null);
    try {
      const info = await googleSheetsApi.getSpreadsheetInfo(accessToken, id);
      setActiveSpreadsheet(info);
      localStorage.setItem('slog_active_spreadsheet', JSON.stringify(info));
      setSpreadsheetIdInput('');
      setSyncStatus(`Berhasil menghubungkan ke spreadsheet: "${info.title}"`);
    } catch (err: any) {
      setSyncStatus(`Gagal menghubungkan spreadsheet: ${err.message}`);
    } finally {
      setIsCreatingSpreadsheet(false);
    }
  };

  const promptSyncData = () => {
    if (!accessToken || !activeSpreadsheet) {
      setSyncStatus('Harap hubungkan akun Google dan tentukan Spreadsheet terlebih dahulu.');
      return;
    }

    setConfirmMessage(
      `Apakah Anda yakin ingin menyinkronkan seluruh data ke Google Spreadsheet "${activeSpreadsheet.title}"? Operasi ini akan memperbarui 26 data personel, catatan absensi, pengumuman, pengajuan izin, dan audit log.`
    );
    setPendingAction(() => executeSyncData);
    setShowConfirmModal(true);
  };

  const executeSyncData = async () => {
    if (!accessToken || !activeSpreadsheet) return;

    setIsSyncing(true);
    setSyncStatus(null);
    try {
      const result = await googleSheetsApi.syncAllData(accessToken, activeSpreadsheet.spreadsheetId, {
        personnel: personnelList,
        attendance: attendanceList,
        announcements: announcements,
        leaves: leaveRequests,
        corrections: corrections,
        logs: auditLogs
      });
      setSyncStatus(`Sinkronisasi sukses! ${result.updatedSheetsCount} sheet berhasil diperbarui pada ${new Date().toLocaleTimeString('id-ID')} WIB.`);
    } catch (err: any) {
      setSyncStatus(`Gagal sinkronisasi data: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadGsFile = () => {
    const element = document.createElement('a');
    const file = new Blob([GOOGLE_APPS_SCRIPT_CODE], { type: 'text/javascript' });
    element.href = URL.createObjectURL(file);
    element.download = 'Code.gs';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleDownloadSpreadsheetTemplate = () => {
    const wb = XLSX.utils.book_new();

    const personelRows = [
      ["ID", "Nama", "Pangkat_Golongan", "NRP_NIP", "Jabatan", "Unit", "Telepon", "Alamat_Rumah", "Tinggal_Di_Mes", "Alamat_Mes", "Foto_URL", "Status", "Alasan_Arsip", "Dibuat_Pada", "Diperbarui_Pada"],
      ...INITIAL_PERSONNEL.map((p, i) => [
        `PERS-${String(i + 1).padStart(3, '0')}`,
        p.nama,
        p.pangkat,
        `'${p.nrp}`,
        p.jabatan,
        p.unit,
        p.telepon || '',
        p.alamatRumah || '',
        p.tinggalDiMes ? 'Ya' : 'Tidak',
        p.alamatMes || '',
        '',
        'aktif',
        '',
        new Date().toISOString(),
        new Date().toISOString()
      ])
    ];
    const wsPersonel = XLSX.utils.aoa_to_sheet(personelRows);
    XLSX.utils.book_append_sheet(wb, wsPersonel, 'Personel');

    const wsAbsensi = XLSX.utils.aoa_to_sheet([
      ["ID", "Personnel_ID", "NRP_NIP", "Nama", "Pangkat", "Jabatan", "Unit", "Tanggal", "Jam_Masuk", "Jam_Pulang", "Lat_Masuk", "Lng_Masuk", "Jarak_Masuk_M", "Status_GPS_Masuk", "Lat_Pulang", "Lng_Pulang", "Jarak_Pulang_M", "Status_GPS_Pulang", "Status_Kehadiran", "Kode_Keterangan", "Is_Koreksi", "Catatan", "Server_Timestamp"]
    ]);
    XLSX.utils.book_append_sheet(wb, wsAbsensi, 'Absensi');

    const wsPengumuman = XLSX.utils.aoa_to_sheet([
      ["ID", "Judul", "Isi", "Admin_ID", "Admin_Nama", "Dibuat_Pada", "Diperbarui_Pada"]
    ]);
    XLSX.utils.book_append_sheet(wb, wsPengumuman, 'Pengumuman');

    const wsIzin = XLSX.utils.aoa_to_sheet([
      ["ID", "Personnel_ID", "NRP_NIP", "Nama", "Pangkat", "Jabatan", "Jenis", "Kode", "Tanggal_Mulai", "Tanggal_Selesai", "Jumlah_Hari", "Alasan", "Nomor_Surat", "Tanggal_Surat", "Pejabat_Penerbit", "Dokumen_URL", "Status", "Catatan_Atasan", "Disetujui_Oleh", "Disetujui_Pada", "Dibuat_Pada"]
    ]);
    XLSX.utils.book_append_sheet(wb, wsIzin, 'Pengajuan_Izin');

    const wsKoreksi = XLSX.utils.aoa_to_sheet([
      ["ID", "Attendance_ID", "Personnel_ID", "NRP_NIP", "Nama", "Tanggal", "Jenis_Koreksi", "Jam_Masuk_Awal", "Jam_Masuk_Koreksi", "Jam_Pulang_Awal", "Jam_Pulang_Koreksi", "Alasan", "Dokumen_Bukti_URL", "Status", "Catatan_Pemeriksa", "Disetujui_Oleh", "Disetujui_Pada", "Dibuat_Pada"]
    ]);
    XLSX.utils.book_append_sheet(wb, wsKoreksi, 'Koreksi_Absensi');

    const wsAkses = XLSX.utils.aoa_to_sheet([
      ["ID", "Username", "Nama", "Role", "Personnel_ID", "Pangkat", "Jabatan", "Status_Akun"],
      ["USR-01", "admin", "Administrator Slog", "admin", "", "PNS", "Admin Sistem", "aktif"],
      ["USR-02", "520336", "Fiyono, S.T., M.M.", "atasan", "PERS-001", "Kolonel Kal", "Waaslog Kaskoopsudnas", "aktif"]
    ]);
    XLSX.utils.book_append_sheet(wb, wsAkses, 'Pengguna_Akses');

    const wsAudit = XLSX.utils.aoa_to_sheet([
      ["ID", "Timestamp", "Actor_ID", "Actor_Nama", "Actor_Role", "Tindakan", "Target", "Detail", "Status"]
    ]);
    XLSX.utils.book_append_sheet(wb, wsAudit, 'Audit_Log');

    XLSX.writeFile(wb, 'Database_Slog_Koopsudnas_Template.xlsx');
  };

  const handleSaveWebhook = async () => {
    setIsSaving(true);
    setSaveStatus(null);
    try {
      await onSaveWebhook(urlInput.trim());
      setSaveStatus('Webhook Google Apps Script berhasil disimpan!');
    } catch (err: any) {
      setSaveStatus(`Gagal: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const steps = [
    {
      num: 1,
      title: 'Buat Google Spreadsheet Baru',
      desc: 'Buka Google Drive atau Google Sheets, lalu buat Spreadsheet kosong baru.',
      details: [
        'Buka browser dan akses sheets.new atau buka Google Drive organisasi.',
        'Beri nama spreadsheet, contoh: "DATABASE KEHADIRAN SLOG KOOPSUDNAS".',
        'Alternatif cepat: Anda juga dapat klik tombol "Unduh Template Spreadsheet (.xlsx)" di atas lalu mengunggahnya ke Google Drive dan membukanya sebagai Google Spreadsheet.'
      ],
      tip: 'Pastikan zona waktu Spreadsheet diatur ke (GMT+07:00) Jakarta di menu File > Setelan Spreadsheet.'
    },
    {
      num: 2,
      title: 'Buka Editor Google Apps Script',
      desc: 'Buka lingkungan pemrograman Apps Script yang terhubung langsung dengan Spreadsheet.',
      details: [
        'Pada bilah menu atas Google Spreadsheet, klik menu "Ekstensi" (atau "Extensions").',
        'Pilih opsi "Apps Script".',
        'Tab browser baru akan terbuka menampilkan editor kode Google Apps Script.'
      ],
      tip: 'Beri nama project Apps Script di pojok kiri atas, misalnya "Backend Slog Koopsudnas".'
    },
    {
      num: 3,
      title: 'Salin & Tempel Kode Backend (Code.gs)',
      desc: 'Ganti isi default file Code.gs dengan kode lengkap yang telah disediakan sistem.',
      details: [
        'Klik tombol "Salin Kode GAS" warna biru di bagian bawah halaman ini, atau unduh berkas Code.gs.',
        'Di editor Apps Script, hapus semua kode bawaan (function myFunction() { ... }).',
        'Tempel (Paste) kode yang disalin ke dalam berkas Code.gs.',
        'Tekan kombinasi tombol Ctrl + S (atau Cmd + S di Mac) atau klik ikon Disket (Simpan) untuk menyimpan berkas.'
      ],
      tip: 'Kode ini sudah mencakup konfigurasi koordinat Halim Perdanakusuma (-6.2625, 106.8912), radius 3 KM, dan struktur lengkap 7 sheet.'
    },
    {
      num: 4,
      title: 'Jalankan Inisialisasi Otomatis (setupSpreadsheetDatabase)',
      desc: 'Fungsi ini otomatis membuat 7 sheet, mengatur header biru, dan mengisi data 26 personel awal.',
      details: [
        'Pada toolbar atas editor Apps Script, cari kotak dropdown fungsi di samping tombol "Jalankan" (Run).',
        'Pilih fungsi bernama "setupSpreadsheetDatabase".',
        'Klik tombol "Jalankan" (Run).',
        'Google akan meminta izin akses ("Otorisasi Diperlukan"): Tinjau Izin > Pilih Akun > Lanjutan > Buka (tidak aman) > Izinkan.'
      ],
      tip: 'Setelah eksekusi selesai, kembali ke Google Spreadsheet Anda. 7 sheet lengkap dengan 26 personel sudah terbentuk!'
    },
    {
      num: 5,
      title: 'Deploy sebagai Aplikasi Web (Web App)',
      desc: 'Publikasikan Apps Script agar dapat menerima request absensi dan sinkronisasi data dari aplikasi ini.',
      details: [
        'Di pojok kanan atas editor Apps Script, klik tombol biru "Terapkan" (Deploy) > pilih "Penerapan baru" (New deployment).',
        'Pada jendela popup, klik ikon Roda Gigi > pilih "Aplikasi Web" (Web app).',
        'Jalankan sebagai: "Saya (email Anda)" | Yang memiliki akses: "Siapa saja" (Anyone).',
        'Klik tombol "Terapkan" (Deploy).'
      ],
      tip: 'Pilihan "Who has access: Anyone" wajib dipilih agar aplikasi dapat mencatat absensi GPS personel tanpa error izin.'
    },
    {
      num: 6,
      title: 'Salin URL Aplikasi Web (Webhook URL)',
      desc: 'Dapatkan link endpoint webhook yang berakhiran /exec.',
      details: [
        'Setelah proses deploy selesai, Google akan menampilkan "URL Aplikasi Web" (Web app URL).',
        'Format URL adalah: https://script.google.com/macros/s/AKfycb.../exec',
        'Klik tombol "Salin" (Copy) di samping URL tersebut.'
      ],
      tip: 'Pastikan URL berakhiran "/exec", bukan "/dev".'
    },
    {
      num: 7,
      title: 'Tempel URL ke Form Koneksi di Aplikasi',
      desc: 'Hubungkan endpoint Google Apps Script ke aplikasi Kehadiran SLOG Koopsudnas ini.',
      details: [
        'Pilih tab "Koneksi Webhook GAS" di atas.',
        'Tempelkan URL tadi ke dalam kolom "Koneksi Webhook Deployment Google Apps Script".',
        'Klik tombol "Simpan Webhook URL".'
      ],
      tip: 'Data absensi akan langsung tersinkron secara realtime ke Google Spreadsheet Anda.'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Mode Switcher Banner */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-blue-50 text-blue-700 border border-blue-200">
              <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">
                  Integrasi Google Spreadsheet & Google Drive
                </h2>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full border border-emerald-300">
                  TERSEDIA 2 METODE
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Pilih integrasi langsung dengan Akun Google Workspace atau via Webhook Google Apps Script
              </p>
            </div>
          </div>

          {/* Toggle Tab */}
          <div className="flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs font-semibold shrink-0">
            <button
              onClick={() => setActiveMode('direct')}
              className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                activeMode === 'direct'
                  ? 'bg-white text-blue-700 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Globe className="w-3.5 h-3.5 text-blue-600" />
              <span>Koneksi Langsung Google API</span>
            </button>

            <button
              onClick={() => setActiveMode('webhook')}
              className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                activeMode === 'webhook'
                  ? 'bg-white text-blue-700 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Link className="w-3.5 h-3.5 text-emerald-600" />
              <span>Webhook GAS & Panduan</span>
            </button>
          </div>
        </div>
      </div>

      {/* MODE 1: DIRECT GOOGLE WORKSPACE API INTEGRATION */}
      {activeMode === 'direct' && (
        <div className="space-y-6">
          {/* Connection Card */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
                  <span>Koneksi Akun Google & Otorisasi Spreadsheet</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Hubungkan akun Google Anda untuk membuat dan menyinkronkan data presensi ke Google Sheets
                </p>
              </div>

              {googleUser ? (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-medium">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Terhubung: <strong>{googleUser.email || googleUser.displayName}</strong></span>
                  </div>
                  <button
                    onClick={handleGoogleLogout}
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition border border-slate-200"
                    title="Putuskan sambungan akun Google"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                /* Official Google Sign-In Styled Button */
                <button 
                  onClick={handleGoogleLogin}
                  disabled={isLoggingIn}
                  className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl shadow-xs transition flex items-center gap-2 text-xs font-bold text-slate-700 disabled:opacity-50"
                >
                  <svg className="w-4 h-4" viewBox="0 0 48 48">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                    <path fill="none" d="M0 0h48v48H0z"></path>
                  </svg>
                  <span>{isLoggingIn ? 'Menghubungkan...' : 'Sign in with Google'}</span>
                </button>
              )}
            </div>

            {/* Status Message */}
            {syncStatus && (
              <div className={`p-3 rounded-xl text-xs font-medium border flex items-center gap-2 ${
                syncStatus.includes('Gagal') 
                  ? 'bg-rose-50 border-rose-200 text-rose-800' 
                  : 'bg-emerald-50 border-emerald-200 text-emerald-800'
              }`}>
                {syncStatus.includes('Gagal') ? (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                )}
                <span>{syncStatus}</span>
              </div>
            )}

            {/* Active Spreadsheet Details */}
            {activeSpreadsheet ? (
              <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded">
                      Spreadsheet Terhubung
                    </span>
                    <h4 className="font-bold text-slate-900 text-sm mt-1">
                      {activeSpreadsheet.title}
                    </h4>
                    <p className="text-[11px] font-mono text-slate-500">
                      ID: {activeSpreadsheet.spreadsheetId}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <a
                      href={activeSpreadsheet.spreadsheetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-bold transition flex items-center gap-1.5 shadow-2xs"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
                      <span>Buka di Google Sheets</span>
                    </a>

                    <button
                      onClick={promptSyncData}
                      disabled={isSyncing || !accessToken}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                      <span>{isSyncing ? 'Menyinkronkan...' : 'Sinkronkan Data Sekarang'}</span>
                    </button>
                  </div>
                </div>

                {/* Sheets Tabs list */}
                <div className="pt-2 border-t border-blue-200/60 flex flex-wrap items-center gap-1.5 text-[10px]">
                  <span className="text-slate-500 font-semibold">Sheet Tersedia:</span>
                  {activeSpreadsheet.sheets.map(sheet => (
                    <span key={sheet} className="px-2 py-0.5 rounded bg-white text-blue-900 border border-blue-200 font-medium">
                      {sheet}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-3">
                <FileSpreadsheet className="w-8 h-8 text-slate-400 mx-auto" />
                <div>
                  <h4 className="font-bold text-slate-800 text-xs">
                    Belum Ada Spreadsheet yang Terhubung
                  </h4>
                  <p className="text-[11px] text-slate-500 max-w-md mx-auto mt-0.5">
                    Buat spreadsheet baru secara otomatis dengan 7 sheet terstruktur, atau hubungkan dengan spreadsheet yang sudah ada.
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                  <button
                    onClick={handleCreateNewSpreadsheet}
                    disabled={isCreatingSpreadsheet || !accessToken}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                  >
                    <FolderPlus className="w-4 h-4" />
                    <span>{isCreatingSpreadsheet ? 'Sedang Membuat...' : 'Buat Spreadsheet Baru di Google Drive'}</span>
                  </button>
                </div>

                {!accessToken && (
                  <p className="text-[10px] text-amber-700 italic">
                    *Harap klik "Sign in with Google" di kanan atas terlebih dahulu untuk membuat spreadsheet.
                  </p>
                )}
              </div>
            )}

            {/* Option to Connect by ID */}
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Link className="w-3.5 h-3.5 text-slate-500" />
                <span>Atau Sambungkan dengan ID / URL Google Spreadsheet yang Sudah Ada:</span>
              </label>

              <div className="flex flex-col sm:flex-row items-center gap-2">
                <input
                  type="text"
                  placeholder="Contoh: 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms atau paste URL lengkap"
                  value={spreadsheetIdInput}
                  onChange={e => setSpreadsheetIdInput(e.target.value)}
                  className="w-full sm:flex-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleConnectExistingSpreadsheet}
                  disabled={isCreatingSpreadsheet || !accessToken || !spreadsheetIdInput.trim()}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition disabled:opacity-50 shrink-0"
                >
                  Hubungkan ID
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODE 2: WEBHOOK GAS & DOCUMENTATION */}
      {activeMode === 'webhook' && (
        <div className="space-y-6">
          {/* Webhook Connector */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="p-2.5 rounded-xl bg-blue-50 text-blue-700 border border-blue-200">
                  <FileCode2 className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Webhook Deployment Google Apps Script Web App
                  </h3>
                  <p className="text-xs text-slate-500">
                    Masukkan URL Deployment Web App Google Apps Script Anda (berakhiran /exec)
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleDownloadGsFile}
                  className="px-3 py-2 rounded-xl border border-blue-300 bg-blue-50 text-blue-800 hover:bg-blue-100 text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Unduh Code.gs</span>
                </button>

                <button
                  onClick={handleDownloadSpreadsheetTemplate}
                  className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Unduh Template .xlsx</span>
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2 pt-2">
              <input
                type="url"
                placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                value={urlInput}
                onChange={e => setUrlInput(e.target.value)}
                className="w-full sm:flex-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleSaveWebhook}
                disabled={isSaving}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition disabled:opacity-50 shrink-0 shadow-xs"
              >
                {isSaving ? 'Menyimpan...' : 'Simpan Webhook URL'}
              </button>
            </div>

            {saveStatus && (
              <div className={`p-2.5 rounded-lg text-xs font-medium border ${
                saveStatus.startsWith('Gagal') 
                  ? 'bg-rose-50 border-rose-200 text-rose-800' 
                  : 'bg-emerald-50 border-emerald-200 text-emerald-800'
              }`}>
                {saveStatus}
              </div>
            )}
          </div>

          {/* Step by Step Visual Installation Guide */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                    ✓
                  </span>
                  <span>Panduan Lengkap Cara Instalasi ke Google Spreadsheet (7 Tahap)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Ikuti urutan langkah di bawah ini untuk menghubungkan database Google Spreadsheet dengan aplikasi kehadiran
                </p>
              </div>

              {/* Quick Step Filters */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
                <button
                  onClick={() => setActiveStepTab('all')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition shrink-0 ${
                    activeStepTab === 'all'
                      ? 'bg-blue-600 text-white font-bold'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Semua Tahap
                </button>
                {steps.map(s => (
                  <button
                    key={s.num}
                    onClick={() => setActiveStepTab(String(s.num) as any)}
                    className={`w-7 h-7 rounded-lg text-xs font-bold transition shrink-0 flex items-center justify-center ${
                      activeStepTab === String(s.num)
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                    title={`Tahap ${s.num}: ${s.title}`}
                  >
                    {s.num}
                  </button>
                ))}
              </div>
            </div>

            {/* Steps List */}
            <div className="space-y-4">
              {steps
                .filter(s => activeStepTab === 'all' || activeStepTab === String(s.num))
                .map(step => (
                  <div 
                    key={step.num} 
                    className="p-4 rounded-xl border border-slate-200/90 bg-slate-50/60 hover:bg-white hover:border-blue-300 transition-all space-y-3"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-700 to-cyan-500 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-xs">
                        {step.num}
                      </div>
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-1">
                          <h4 className="font-bold text-slate-900 text-sm">
                            Tahap {step.num}: {step.title}
                          </h4>
                          <span className="text-[10px] text-blue-700 bg-blue-50 border border-blue-200 font-semibold px-2 py-0.5 rounded-full">
                            Langkah {step.num} dari 7
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-0.5">
                          {step.desc}
                        </p>
                      </div>
                    </div>

                    <div className="ml-11 bg-white p-3 rounded-xl border border-slate-200 space-y-1.5 text-xs text-slate-700">
                      {step.details.map((detail, idx) => (
                        <div key={idx} className="flex items-start gap-2 leading-relaxed">
                          <ChevronRight className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                          <span>{detail}</span>
                        </div>
                      ))}
                    </div>

                    <div className="ml-11 p-2.5 rounded-lg bg-amber-50/80 border border-amber-200/80 text-[11px] text-amber-900 flex items-center gap-2">
                      <Info className="w-4 h-4 text-amber-600 shrink-0" />
                      <span><strong>Tips Penting:</strong> {step.tip}</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Code.gs Viewer Panel */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-lg overflow-hidden text-white">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500" />
                <span className="w-3 h-3 rounded-full bg-amber-500" />
                <span className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="ml-2 font-mono text-xs text-slate-300 font-bold">
                  Google Apps Script Source Code: Code.gs (Siap Dipasang)
                </span>
              </div>

              <button
                onClick={handleCopyCode}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition border border-slate-700"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Tersalin ke Clipboard!' : 'Salin Kode GAS'}</span>
              </button>
            </div>

            <div className="p-4 max-h-[480px] overflow-y-auto font-mono text-xs leading-relaxed text-slate-200 bg-slate-900/90 scrollbar-thin scrollbar-thumb-slate-700">
              <pre>{GOOGLE_APPS_SCRIPT_CODE}</pre>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Workspace Data Updates (MANDATORY REQUIREMENT) */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-amber-100 text-amber-800 shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Konfirmasi Sinkronisasi Data Google Sheets
                </h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  {confirmMessage}
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-500 space-y-1">
              <div>• Jumlah Personel: <strong>{personnelList.length}</strong></div>
              <div>• Catatan Absensi: <strong>{attendanceList.length}</strong></div>
              <div>• Pengumuman Aktif: <strong>{announcements.length}</strong></div>
              <div>• Pengajuan Izin: <strong>{leaveRequests.length}</strong></div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  setPendingAction(null);
                }}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                Batal
              </button>

              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  if (pendingAction) {
                    pendingAction();
                  }
                }}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-sm"
              >
                Konfirmasi & Sinkronkan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
