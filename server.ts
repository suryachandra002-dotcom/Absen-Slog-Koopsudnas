import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { fileURLToPath } from 'url';
import { INITIAL_PERSONNEL } from './src/data/initialPersonnel';
import { 
  Personnel, 
  AttendanceRecord, 
  Announcement, 
  LeaveRequest, 
  AttendanceCorrection, 
  OfficeConfig, 
  AuditLog, 
  UserAccount,
  AbsenceCategory
} from './src/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

// Default Office Coordinates (Staf Logistik Koopsudnas, Halim Perdanakusuma)
const DEFAULT_OFFICE: OfficeConfig = {
  namaKantor: 'Kantor Staf Logistik Koopsudnas',
  lat: -6.262500,
  lng: 106.891200,
  radiusMaksimalMeter: 3000,
  akurasiThresholdMeter: 100,
  alamat: 'Jl. Komodor Halim Perdanakusuma, Halim Perdanakusuma, Kec. Makasar, Jakarta Timur 13610',
  isConfirmed: true
};

interface DatabaseSchema {
  office: OfficeConfig;
  personnel: Personnel[];
  attendance: AttendanceRecord[];
  announcements: Announcement[];
  leaveRequests: LeaveRequest[];
  corrections: AttendanceCorrection[];
  auditLogs: AuditLog[];
  users: UserAccount[];
  gasWebhookUrl?: string;
}

// Helpers for WIB Time (Asia/Jakarta, UTC+7)
function getWIBDate(): { dateStr: string; timeStr: string; isoWIB: string } {
  const now = new Date();
  // Format into Asia/Jakarta
  const formatterDate = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  const formatterTime = new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });

  const dateStr = formatterDate.format(now); // YYYY-MM-DD
  const timeStr = formatterTime.format(now).replace(/\./g, ':'); // HH:mm:ss
  const isoWIB = `${dateStr}T${timeStr}+07:00`;
  return { dateStr, timeStr, isoWIB };
}

// Haversine Distance Formula
function calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // metres
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

// Database Manager
function loadDatabase(): DatabaseSchema {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  let db: Partial<DatabaseSchema> = {};
  if (fs.existsSync(DB_FILE)) {
    try {
      db = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
    } catch {
      db = {};
    }
  }

  const { isoWIB, dateStr } = getWIBDate();

  // Initialize or Seed Personnel
  let personnel: Personnel[] = db.personnel || [];
  const existingNRPs = new Set(personnel.map(p => String(p.nrp).trim()));

  INITIAL_PERSONNEL.forEach((raw, idx) => {
    const rawNrp = String(raw.nrp).trim();
    if (!existingNRPs.has(rawNrp)) {
      personnel.push({
        id: `PERS-${String(idx + 1).padStart(3, '0')}`,
        nama: raw.nama,
        pangkat: raw.pangkat,
        nrp: rawNrp,
        jabatan: raw.jabatan,
        unit: raw.unit,
        telepon: raw.telepon,
        alamatRumah: raw.alamatRumah,
        tinggalDiMes: raw.tinggalDiMes,
        alamatMes: raw.alamatMes,
        keteranganTambahan: raw.keteranganTambahan,
        status: raw.status,
        createdAt: isoWIB,
        updatedAt: isoWIB
      });
      existingNRPs.add(rawNrp);
    }
  });

  // Default Announcements (up to 5)
  let announcements: Announcement[] = db.announcements || [
    {
      id: 'ANN-001',
      judul: 'Apel Khusus Personel Staf Logistik Koopsudnas',
      isi: 'Diberitahukan kepada seluruh perwira, bintara, tamtama, dan PNS Staf Logistik Koopsudnas untuk mengikuti apel pagi pada hari Senin pukul 07.00 WIB berseragam PDH di Lapangan Upacara Koopsudnas.',
      adminId: 'ADMIN-01',
      adminNama: 'Admin Slog',
      createdAt: isoWIB,
      updatedAt: isoWIB
    },
    {
      id: 'ANN-002',
      judul: 'Penerapan Sistem Kehadiran GPS Radius 3 KM',
      isi: 'Mulai berlaku efektif sistem absensi GPS online dengan batas toleransi radius 3.000 meter dari titik koordinat kantor Slog Koopsudnas. Pastikan izin lokasi aktif pada smartphone Anda.',
      adminId: 'ADMIN-01',
      adminNama: 'Admin Slog',
      createdAt: isoWIB,
      updatedAt: isoWIB
    },
    {
      id: 'ANN-003',
      judul: 'Pemeriksaan Inventaris BMN Triwulan',
      isi: 'Paban V/BMN akan melaksanakan sinkronisasi dan opname fisik materiil BMN pada masing-masing sub-bidang mulai tanggal 25 bulan berjalan. Mohon berkas pendukung dipersiapkan.',
      adminId: 'ADMIN-01',
      adminNama: 'Admin Slog',
      createdAt: isoWIB,
      updatedAt: isoWIB
    }
  ];

  // Default Users
  let users: UserAccount[] = db.users || [
    {
      id: 'USR-01',
      username: 'admin',
      nama: 'Administrator Slog',
      role: 'admin',
      pangkat: 'PNS / Penata',
      jabatan: 'Admin Sistem Slog'
    },
    {
      id: 'USR-02',
      username: '520336',
      nama: 'Fiyono, S.T., M.M.',
      role: 'atasan',
      personnelId: 'PERS-001',
      pangkat: 'Kolonel Kal',
      jabatan: 'Waaslog Kaskoopsudnas'
    },
    {
      id: 'USR-03',
      username: '523371',
      nama: 'Agus Sutopo',
      role: 'atasan',
      personnelId: 'PERS-002',
      pangkat: 'Kolonel Tek',
      jabatan: 'Paban I/Ren Slog Kaskoopsudnas'
    },
    {
      id: 'USR-04',
      username: '543331',
      nama: 'Saifudin Toyo S',
      role: 'personel',
      personnelId: 'PERS-018',
      pangkat: 'Serka',
      jabatan: 'Ba Adminu Paban III/Sista'
    }
  ];

  // Seed sample attendance for today if empty
  let attendance: AttendanceRecord[] = db.attendance || [];
  if (attendance.length === 0) {
    attendance = [
      {
        id: `ATT-${dateStr.replace(/-/g, '')}-520336`,
        personnelId: 'PERS-001',
        personnelNrp: '520336',
        personnelNama: 'Fiyono, S.T., M.M.',
        personnelPangkat: 'Kolonel Kal',
        personnelJabatan: 'Waaslog Kaskoopsudnas',
        unit: 'Pimpinan Slog',
        tanggal: dateStr,
        jamMasuk: '06:45:12',
        latMasuk: -6.262450,
        lngMasuk: 106.891150,
        jarakMasukMeter: 8,
        statusValidasiMasuk: 'valid',
        statusKehadiran: 'Hadir',
        keteranganKode: 'DD',
        serverTimestamp: isoWIB
      },
      {
        id: `ATT-${dateStr.replace(/-/g, '')}-523371`,
        personnelId: 'PERS-002',
        personnelNrp: '523371',
        personnelNama: 'Agus Sutopo',
        personnelPangkat: 'Kolonel Tek',
        personnelJabatan: 'Paban I/Ren Slog Kaskoopsudnas',
        unit: 'Paban I/Ren',
        tanggal: dateStr,
        jamMasuk: '06:52:40',
        latMasuk: -6.262520,
        lngMasuk: 106.891220,
        jarakMasukMeter: 12,
        statusValidasiMasuk: 'valid',
        statusKehadiran: 'Hadir',
        keteranganKode: 'DD',
        serverTimestamp: isoWIB
      },
      {
        id: `ATT-${dateStr.replace(/-/g, '')}-525881`,
        personnelId: 'PERS-005',
        personnelNrp: '525881',
        personnelNama: 'Andi Wijaya',
        personnelPangkat: 'Kolonel Tum',
        personnelJabatan: 'Paban IV/Kons Slog Kaskoopsudnas',
        unit: 'Paban IV/Kons',
        tanggal: dateStr,
        statusKehadiran: 'Dinas Luar',
        keteranganKode: 'DL',
        catatanKoreksi: 'Supervisi Faskon Lanud Atang Sendjaja',
        serverTimestamp: isoWIB
      }
    ];
  }

  const finalDb: DatabaseSchema = {
    office: db.office || DEFAULT_OFFICE,
    personnel,
    attendance,
    announcements: announcements.slice(0, 5),
    leaveRequests: db.leaveRequests || [],
    corrections: db.corrections || [],
    auditLogs: db.auditLogs || [
      {
        id: 'AUD-INIT',
        timestamp: isoWIB,
        actorId: 'SYSTEM',
        actorNama: 'System Inisialisasi',
        actorRole: 'admin',
        tindakan: 'DATABASE_SEED',
        target: 'Database Personel',
        detail: 'Inisialisasi 26 personel Staf Logistik Koopsudnas selesai dengan idempoten.',
        status: 'SUCCESS'
      }
    ],
    users,
    gasWebhookUrl: db.gasWebhookUrl || ''
  };

  saveDatabase(finalDb);
  return finalDb;
}

function saveDatabase(db: DatabaseSchema) {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
}

function appendAuditLog(db: DatabaseSchema, log: Omit<AuditLog, 'id' | 'timestamp'>) {
  const { isoWIB } = getWIBDate();
  const newLog: AuditLog = {
    id: `AUD-${Date.now()}`,
    timestamp: isoWIB,
    ...log
  };
  db.auditLogs.unshift(newLog); // latest first
  if (db.auditLogs.length > 500) {
    db.auditLogs = db.auditLogs.slice(0, 500);
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '20mb' }));
  app.use(express.urlencoded({ extended: true, limit: '20mb' }));

  // Ensure DB is loaded and initial data ready
  let db = loadDatabase();

  // -------------------------------------------------------------
  // API ROUTES
  // -------------------------------------------------------------

  // Health & Server Time (Asia/Jakarta WIB)
  app.get('/api/health', (req: Request, res: Response) => {
    const { dateStr, timeStr, isoWIB } = getWIBDate();
    res.json({
      status: 'online',
      system: 'DATA KEHADIRAN STAF LOGISTIK KOOPSUDNAS',
      serverTimeWIB: `${dateStr} ${timeStr} WIB`,
      isoWIB,
      timezone: 'Asia/Jakarta'
    });
  });

  // Get System Stats & Today Summary
  app.get('/api/stats', (req: Request, res: Response) => {
    db = loadDatabase();
    const { dateStr } = getWIBDate();
    const active = db.personnel.filter(p => p.status === 'aktif');
    const total = active.length;

    const todayRecords = db.attendance.filter(a => a.tanggal === dateStr);
    const presentCount = todayRecords.filter(a => a.statusKehadiran === 'Hadir').length;
    
    // Count reasons: DD, DL, DK, DIK, CT, S, I, TP, BP
    const breakdown: Record<AbsenceCategory, number> = {
      DD: 0,
      DL: 0,
      DK: 0,
      DIK: 0,
      CT: 0,
      S: 0,
      I: 0,
      TP: 0,
      BP: 0
    };

    todayRecords.forEach(r => {
      if (r.keteranganKode && breakdown[r.keteranganKode] !== undefined) {
        breakdown[r.keteranganKode]++;
      }
    });

    const recordedPersonnelIds = new Set(todayRecords.map(r => r.personnelId));
    // Those not recorded yet count as Belum Absen / Tanpa Pemberitahuan
    const unrecordedCount = active.filter(p => !recordedPersonnelIds.has(p.id)).length;
    breakdown['TP'] += unrecordedCount;

    const pendingLeaves = db.leaveRequests.filter(l => l.status === 'Menunggu Persetujuan').length;
    const pendingCorrections = db.corrections.filter(c => c.status === 'Menunggu Persetujuan').length;

    res.json({
      totalPersonnel: total,
      activePersonnel: total,
      archivedPersonnel: db.personnel.filter(p => p.status === 'diarsipkan').length,
      todayPresent: presentCount,
      todayAbsent: total - presentCount,
      categoryBreakdown: breakdown,
      pendingLeaveApprovals: pendingLeaves,
      pendingCorrectionApprovals: pendingCorrections
    });
  });

  // ---------------- PERSONNEL ROUTES ----------------
  app.get('/api/personnel', (req: Request, res: Response) => {
    db = loadDatabase();
    const { status, unit, search } = req.query;
    let list = [...db.personnel];

    if (status && typeof status === 'string') {
      list = list.filter(p => p.status === status);
    }
    if (unit && typeof unit === 'string' && unit !== 'ALL') {
      list = list.filter(p => p.unit === unit);
    }
    if (search && typeof search === 'string') {
      const q = search.toLowerCase();
      list = list.filter(p => 
        p.nama.toLowerCase().includes(q) ||
        p.nrp.toLowerCase().includes(q) ||
        p.jabatan.toLowerCase().includes(q) ||
        p.pangkat.toLowerCase().includes(q)
      );
    }

    res.json(list);
  });

  // Add Personnel
  app.post('/api/personnel', (req: Request, res: Response) => {
    db = loadDatabase();
    const { nama, pangkat, nrp, jabatan, unit, telepon, alamatRumah, tinggalDiMes, alamatMes, keteranganTambahan, foto, actorNama } = req.body;

    if (!nama || !pangkat || !nrp || !jabatan || !unit) {
      return res.status(400).json({ error: 'Nama, Pangkat, NRP/NIP, Jabatan, dan Unit wajib diisi.' });
    }

    const cleanNrp = String(nrp).trim();
    const exists = db.personnel.some(p => String(p.nrp).trim() === cleanNrp);
    if (exists) {
      return res.status(409).json({ error: `NRP/NIP ${cleanNrp} sudah terdaftar di sistem. Periksa kembali data personel.` });
    }

    const { isoWIB } = getWIBDate();
    const newPerson: Personnel = {
      id: `PERS-${Date.now()}`,
      nama,
      pangkat,
      nrp: cleanNrp,
      jabatan,
      unit,
      telepon: telepon || '',
      alamatRumah: alamatRumah || '',
      tinggalDiMes: Boolean(tinggalDiMes),
      alamatMes: tinggalDiMes ? (alamatMes || '') : '',
      keteranganTambahan: keteranganTambahan || '',
      foto: foto || '',
      status: 'aktif',
      createdAt: isoWIB,
      updatedAt: isoWIB
    };

    db.personnel.push(newPerson);
    appendAuditLog(db, {
      actorId: req.body.actorId || 'ADMIN',
      actorNama: actorNama || 'Administrator',
      actorRole: 'admin',
      tindakan: 'TAMBAH_PERSONEL',
      target: `${pangkat} ${nama} (NRP: ${cleanNrp})`,
      detail: `Menambahkan personel baru ke unit ${unit}`,
      status: 'SUCCESS'
    });

    saveDatabase(db);
    res.status(201).json(newPerson);
  });

  // Update Personnel
  app.put('/api/personnel/:id', (req: Request, res: Response) => {
    db = loadDatabase();
    const { id } = req.params;
    const index = db.personnel.findIndex(p => p.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Personel tidak ditemukan.' });
    }

    const current = db.personnel[index];
    const { nama, pangkat, nrp, jabatan, unit, telepon, alamatRumah, tinggalDiMes, alamatMes, keteranganTambahan, foto, actorNama } = req.body;

    const cleanNrp = nrp ? String(nrp).trim() : current.nrp;
    if (cleanNrp !== current.nrp) {
      const duplicate = db.personnel.some(p => p.id !== id && String(p.nrp).trim() === cleanNrp);
      if (duplicate) {
        return res.status(409).json({ error: `NRP/NIP ${cleanNrp} sudah digunakan personel lain.` });
      }
    }

    const { isoWIB } = getWIBDate();
    const updated: Personnel = {
      ...current,
      nama: nama ?? current.nama,
      pangkat: pangkat ?? current.pangkat,
      nrp: cleanNrp,
      jabatan: jabatan ?? current.jabatan,
      unit: unit ?? current.unit,
      telepon: telepon ?? current.telepon,
      alamatRumah: alamatRumah ?? current.alamatRumah,
      tinggalDiMes: tinggalDiMes !== undefined ? Boolean(tinggalDiMes) : current.tinggalDiMes,
      alamatMes: tinggalDiMes ? (alamatMes ?? current.alamatMes) : '',
      keteranganTambahan: keteranganTambahan ?? current.keteranganTambahan,
      foto: foto !== undefined ? foto : current.foto,
      updatedAt: isoWIB
    };

    db.personnel[index] = updated;
    appendAuditLog(db, {
      actorId: req.body.actorId || 'ADMIN',
      actorNama: actorNama || 'Administrator',
      actorRole: 'admin',
      tindakan: 'UBAH_PERSONEL',
      target: `${updated.pangkat} ${updated.nama} (NRP: ${updated.nrp})`,
      detail: `Pembaruan data personel`,
      status: 'SUCCESS'
    });

    saveDatabase(db);
    res.json(updated);
  });

  // Archive Personnel
  app.post('/api/personnel/:id/archive', (req: Request, res: Response) => {
    db = loadDatabase();
    const { id } = req.params;
    const { alasan, actorNama, actorId } = req.body;
    const person = db.personnel.find(p => p.id === id);
    if (!person) {
      return res.status(404).json({ error: 'Personel tidak ditemukan.' });
    }

    const { isoWIB } = getWIBDate();
    person.status = 'diarsipkan';
    person.alasanArsip = alasan || 'Diarsipkan oleh administrator';
    person.diarsipkanOleh = actorNama || 'Administrator';
    person.diarsipkanPada = isoWIB;
    person.updatedAt = isoWIB;

    appendAuditLog(db, {
      actorId: actorId || 'ADMIN',
      actorNama: actorNama || 'Administrator',
      actorRole: 'admin',
      tindakan: 'ARSIPKAN_PERSONEL',
      target: `${person.pangkat} ${person.nama} (NRP: ${person.nrp})`,
      detail: `Alasan: ${person.alasanArsip}`,
      status: 'SUCCESS'
    });

    saveDatabase(db);
    res.json({ message: 'Personel berhasil diarsipkan.', person });
  });

  // Restore Personnel from Archive
  app.post('/api/personnel/:id/restore', (req: Request, res: Response) => {
    db = loadDatabase();
    const { id } = req.params;
    const { actorNama, actorId } = req.body;
    const person = db.personnel.find(p => p.id === id);
    if (!person) {
      return res.status(404).json({ error: 'Personel tidak ditemukan.' });
    }

    const { isoWIB } = getWIBDate();
    person.status = 'aktif';
    person.alasanArsip = undefined;
    person.diarsipkanOleh = undefined;
    person.diarsipkanPada = undefined;
    person.updatedAt = isoWIB;

    appendAuditLog(db, {
      actorId: actorId || 'ADMIN',
      actorNama: actorNama || 'Administrator',
      actorRole: 'admin',
      tindakan: 'PULIHKAN_PERSONEL',
      target: `${person.pangkat} ${person.nama} (NRP: ${person.nrp})`,
      detail: `Personel dipulihkan ke status aktif`,
      status: 'SUCCESS'
    });

    saveDatabase(db);
    res.json({ message: 'Personel berhasil dipulihkan.', person });
  });

  // Deactivate / Reactivate
  app.post('/api/personnel/:id/toggle-status', (req: Request, res: Response) => {
    db = loadDatabase();
    const { id } = req.params;
    const { actorNama, actorId } = req.body;
    const person = db.personnel.find(p => p.id === id);
    if (!person) {
      return res.status(404).json({ error: 'Personel tidak ditemukan.' });
    }

    const { isoWIB } = getWIBDate();
    const newStatus = person.status === 'aktif' ? 'nonaktif' : 'aktif';
    person.status = newStatus;
    person.updatedAt = isoWIB;

    appendAuditLog(db, {
      actorId: actorId || 'ADMIN',
      actorNama: actorNama || 'Administrator',
      actorRole: 'admin',
      tindakan: newStatus === 'aktif' ? 'AKTIFKAN_PERSONEL' : 'NONAKTIFKAN_PERSONEL',
      target: `${person.pangkat} ${person.nama} (NRP: ${person.nrp})`,
      detail: `Status diubah menjadi ${newStatus}`,
      status: 'SUCCESS'
    });

    saveDatabase(db);
    res.json({ message: `Status personel berhasil diubah menjadi ${newStatus}`, person });
  });

  // Permanent Delete Personnel (STRICT CHECK: disallow if attendance/leave records exist)
  app.delete('/api/personnel/:id', (req: Request, res: Response) => {
    db = loadDatabase();
    const { id } = req.params;
    const { alasan, confirmationName, actorNama, actorId } = req.body;

    const person = db.personnel.find(p => p.id === id);
    if (!person) {
      return res.status(404).json({ error: 'Personel tidak ditemukan.' });
    }

    if (!confirmationName || confirmationName.trim() !== person.nama.trim()) {
      return res.status(400).json({ error: 'Konfirmasi nama lengkap tidak sesuai. Penghapusan dibatalkan demi keamanan data.' });
    }

    // Integrity Check: Has attendance or leave history?
    const hasAttendance = db.attendance.some(a => a.personnelId === id || a.personnelNrp === person.nrp);
    const hasLeaves = db.leaveRequests.some(l => l.personnelId === id || l.personnelNrp === person.nrp);
    const hasCorrections = db.corrections.some(c => c.personnelId === id || c.personnelNrp === person.nrp);

    if (hasAttendance || hasLeaves || hasCorrections) {
      return res.status(400).json({
        error: `Personel ${person.pangkat} ${person.nama} memiliki riwayat transaksi/kehadiran aktif. Sesuai ketentuan, penghapusan permanen dilarang. Silakan gunakan fitur 'Arsipkan' atau 'Nonaktifkan'.`
      });
    }

    db.personnel = db.personnel.filter(p => p.id !== id);
    appendAuditLog(db, {
      actorId: actorId || 'ADMIN',
      actorNama: actorNama || 'Administrator',
      actorRole: 'admin',
      tindakan: 'HAPUS_PERMANEN_PERSONEL',
      target: `${person.pangkat} ${person.nama} (NRP: ${person.nrp})`,
      detail: `Alasan: ${alasan || 'Penghapusan permanen data tanpa riwayat'}`,
      status: 'WARNING'
    });

    saveDatabase(db);
    res.json({ message: `Personel ${person.nama} berhasil dihapus permanen.` });
  });

  // ---------------- ATTENDANCE GPS & RECORDS ----------------
  app.get('/api/attendance', (req: Request, res: Response) => {
    db = loadDatabase();
    const { date, month, personnelId, unit } = req.query;
    let list = [...db.attendance];

    if (date && typeof date === 'string') {
      list = list.filter(a => a.tanggal === date);
    }
    if (month && typeof month === 'string') {
      list = list.filter(a => a.tanggal.startsWith(month));
    }
    if (personnelId && typeof personnelId === 'string') {
      list = list.filter(a => a.personnelId === personnelId || a.personnelNrp === personnelId);
    }
    if (unit && typeof unit === 'string' && unit !== 'ALL') {
      list = list.filter(a => a.unit === unit);
    }

    res.json(list);
  });

  // Record Attendance (Masuk / Pulang)
  app.post('/api/attendance/record', (req: Request, res: Response) => {
    db = loadDatabase();
    const { personnelId, type, lat, lng, isSimulated } = req.body;

    if (!personnelId || !type || lat === undefined || lng === undefined) {
      return res.status(400).json({ error: 'Parameter kehadiran tidak lengkap (personnelId, type, lat, lng dibutuhkan).' });
    }

    const person = db.personnel.find(p => p.id === personnelId || p.nrp === personnelId);
    if (!person) {
      return res.status(404).json({ error: 'Data personel tidak ditemukan di sistem.' });
    }

    if (person.status !== 'aktif') {
      return res.status(403).json({ error: `Personel berstatus ${person.status}. Tidak diperkenankan melakukan absensi.` });
    }

    const { dateStr, timeStr, isoWIB } = getWIBDate();
    const office = db.office;

    // Haversine Distance Check on Server
    const distanceMeters = calculateHaversineDistance(lat, lng, office.lat, office.lng);

    if (distanceMeters > office.radiusMaksimalMeter) {
      appendAuditLog(db, {
        actorId: person.nrp,
        actorNama: person.nama,
        actorRole: 'personel',
        tindakan: type === 'masuk' ? 'ABSEN_MASUK_GAGAL' : 'ABSEN_PULANG_GAGAL',
        target: 'Absensi GPS',
        detail: `Ditolak: Jarak ${distanceMeters}m melebihi radius maksimal ${office.radiusMaksimalMeter}m.`,
        status: 'FAILED'
      });
      saveDatabase(db);
      return res.status(400).json({
        error: `Absensi ditolak. Lokasi Anda berada di luar radius 3 km dari kantor Staf Logistik Koopsudnas. Jarak Anda saat ini: ${(distanceMeters / 1000).toFixed(2)} km.`,
        distanceMeters,
        allowedRadius: office.radiusMaksimalMeter
      });
    }

    // Find today's record
    let recordIndex = db.attendance.findIndex(a => (a.personnelId === person.id || a.personnelNrp === person.nrp) && a.tanggal === dateStr);

    if (type === 'masuk') {
      if (recordIndex !== -1 && db.attendance[recordIndex].jamMasuk) {
        return res.status(409).json({
          error: `Anda sudah tercatat melakukan Absen Masuk hari ini pada pukul ${db.attendance[recordIndex].jamMasuk} WIB.`
        });
      }

      if (recordIndex === -1) {
        const newRecord: AttendanceRecord = {
          id: `ATT-${dateStr.replace(/-/g, '')}-${person.nrp}`,
          personnelId: person.id,
          personnelNrp: person.nrp,
          personnelNama: person.nama,
          personnelPangkat: person.pangkat,
          personnelJabatan: person.jabatan,
          unit: person.unit,
          tanggal: dateStr,
          jamMasuk: timeStr,
          latMasuk: lat,
          lngMasuk: lng,
          jarakMasukMeter: distanceMeters,
          statusValidasiMasuk: 'valid',
          statusKehadiran: 'Hadir',
          keteranganKode: 'DD',
          serverTimestamp: isoWIB
        };
        db.attendance.push(newRecord);
      } else {
        db.attendance[recordIndex].jamMasuk = timeStr;
        db.attendance[recordIndex].latMasuk = lat;
        db.attendance[recordIndex].lngMasuk = lng;
        db.attendance[recordIndex].jarakMasukMeter = distanceMeters;
        db.attendance[recordIndex].statusValidasiMasuk = 'valid';
        db.attendance[recordIndex].statusKehadiran = 'Hadir';
        db.attendance[recordIndex].keteranganKode = 'DD';
      }

      appendAuditLog(db, {
        actorId: person.nrp,
        actorNama: person.nama,
        actorRole: 'personel',
        tindakan: 'ABSEN_MASUK',
        target: `Absensi GPS (${dateStr})`,
        detail: `Absen Masuk sukses pukul ${timeStr} WIB. Jarak kantor: ${distanceMeters}m. ${isSimulated ? '[Simulasi Lokasi]' : ''}`,
        status: 'SUCCESS'
      });

      saveDatabase(db);
      return res.json({
        success: true,
        message: 'Absensi Masuk berhasil dicatat. Lokasi Anda berada dalam radius yang diizinkan.',
        time: timeStr,
        distanceMeters
      });
    } else if (type === 'pulang') {
      if (recordIndex === -1 || !db.attendance[recordIndex].jamMasuk) {
        return res.status(400).json({
          error: 'Anda belum melakukan Absen Masuk hari ini. Absen Pulang hanya dapat dilakukan setelah Absen Masuk tercatat.'
        });
      }

      db.attendance[recordIndex].jamPulang = timeStr;
      db.attendance[recordIndex].latPulang = lat;
      db.attendance[recordIndex].lngPulang = lng;
      db.attendance[recordIndex].jarakPulangMeter = distanceMeters;
      db.attendance[recordIndex].statusValidasiPulang = 'valid';

      appendAuditLog(db, {
        actorId: person.nrp,
        actorNama: person.nama,
        actorRole: 'personel',
        tindakan: 'ABSEN_PULANG',
        target: `Absensi GPS (${dateStr})`,
        detail: `Absen Pulang sukses pukul ${timeStr} WIB. Jarak kantor: ${distanceMeters}m. ${isSimulated ? '[Simulasi Lokasi]' : ''}`,
        status: 'SUCCESS'
      });

      saveDatabase(db);
      return res.json({
        success: true,
        message: 'Absensi Pulang berhasil dicatat. Terima kasih atas dedikasi pengabdian hari ini.',
        time: timeStr,
        distanceMeters
      });
    }

    res.status(400).json({ error: 'Tipe absensi tidak valid' });
  });

  // ---------------- ANNOUNCEMENTS (MAX 5 FIFO ENGINE) ----------------
  app.get('/api/announcements', (req: Request, res: Response) => {
    db = loadDatabase();
    // Sort newest first
    const list = [...db.announcements].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    res.json(list);
  });

  // Add Announcement with Strict 5-Item Atomic FIFO
  app.post('/api/announcements', (req: Request, res: Response) => {
    db = loadDatabase();
    const { judul, isi, adminId, adminNama } = req.body;

    if (!judul || !isi) {
      return res.status(400).json({ error: 'Judul dan isi pengumuman wajib diisi.' });
    }

    const { isoWIB } = getWIBDate();
    let purgedNotice: string | null = null;

    // Check if system already has 5 announcements. If so, purge the oldest by server createdAt!
    if (db.announcements.length >= 5) {
      // Find oldest
      let oldestIdx = 0;
      let oldestTime = new Date(db.announcements[0].createdAt).getTime();

      for (let i = 1; i < db.announcements.length; i++) {
        const t = new Date(db.announcements[i].createdAt).getTime();
        if (t < oldestTime) {
          oldestTime = t;
          oldestIdx = i;
        }
      }

      const purged = db.announcements.splice(oldestIdx, 1)[0];
      purgedNotice = purged.judul;

      appendAuditLog(db, {
        actorId: adminId || 'ADMIN',
        actorNama: adminNama || 'Administrator',
        actorRole: 'admin',
        tindakan: 'PURGE_OTOMATIS_PENGUMUMAN',
        target: `Pengumuman "${purged.judul}"`,
        detail: `Auto-purge pengumuman terlama karena batas maksimal 5 data tercapai saat menambahkan "${judul}"`,
        status: 'WARNING'
      });
    }

    const newAnnouncement: Announcement = {
      id: `ANN-${Date.now()}`,
      judul,
      isi,
      adminId: adminId || 'ADMIN-01',
      adminNama: adminNama || 'Admin Slog',
      createdAt: isoWIB,
      updatedAt: isoWIB
    };

    db.announcements.push(newAnnouncement);
    appendAuditLog(db, {
      actorId: adminId || 'ADMIN',
      actorNama: adminNama || 'Administrator',
      actorRole: 'admin',
      tindakan: 'TAMBAH_PENGUMUMAN',
      target: `Pengumuman: ${judul}`,
      detail: purgedNotice ? `Ditambahkan (Menggantikan pengumuman lama "${purgedNotice}")` : 'Ditambahkan secara normal',
      status: 'SUCCESS'
    });

    saveDatabase(db);
    res.status(201).json({
      announcement: newAnnouncement,
      totalCount: db.announcements.length,
      purgedOldest: purgedNotice
    });
  });

  // Edit Announcement (Does NOT change original createdAt!)
  app.put('/api/announcements/:id', (req: Request, res: Response) => {
    db = loadDatabase();
    const { id } = req.params;
    const { judul, isi, adminId, adminNama } = req.body;

    const ann = db.announcements.find(a => a.id === id);
    if (!ann) {
      return res.status(404).json({ error: 'Pengumuman tidak ditemukan.' });
    }

    const { isoWIB } = getWIBDate();
    ann.judul = judul ?? ann.judul;
    ann.isi = isi ?? ann.isi;
    ann.updatedAt = isoWIB;
    // Note: ann.createdAt is strictly preserved!

    appendAuditLog(db, {
      actorId: adminId || 'ADMIN',
      actorNama: adminNama || 'Administrator',
      actorRole: 'admin',
      tindakan: 'UBAH_PENGUMUMAN',
      target: `Pengumuman ID ${id}`,
      detail: `Perubahan judul/isi: ${ann.judul}`,
      status: 'SUCCESS'
    });

    saveDatabase(db);
    res.json(ann);
  });

  // Delete Announcement
  app.delete('/api/announcements/:id', (req: Request, res: Response) => {
    db = loadDatabase();
    const { id } = req.params;
    const { adminId, adminNama } = req.body;

    const index = db.announcements.findIndex(a => a.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Pengumuman tidak ditemukan.' });
    }

    const deleted = db.announcements.splice(index, 1)[0];
    appendAuditLog(db, {
      actorId: adminId || 'ADMIN',
      actorNama: adminNama || 'Administrator',
      actorRole: 'admin',
      tindakan: 'HAPUS_MANUAL_PENGUMUMAN',
      target: `Pengumuman: ${deleted.judul}`,
      detail: 'Dihapus manual oleh admin',
      status: 'SUCCESS'
    });

    saveDatabase(db);
    res.json({ message: 'Pengumuman berhasil dihapus.', deletedId: id });
  });

  // ---------------- LEAVE REQUESTS (KETERANGAN KEHADIRAN) ----------------
  app.get('/api/leave-requests', (req: Request, res: Response) => {
    db = loadDatabase();
    const { personnelId, status } = req.query;
    let list = [...db.leaveRequests];

    if (personnelId && typeof personnelId === 'string') {
      list = list.filter(l => l.personnelId === personnelId || l.personnelNrp === personnelId);
    }
    if (status && typeof status === 'string' && status !== 'ALL') {
      list = list.filter(l => l.status === status);
    }

    res.json(list.reverse());
  });

  // Submit Leave Request
  app.post('/api/leave-requests', (req: Request, res: Response) => {
    db = loadDatabase();
    const {
      personnelId,
      jenis,
      kode,
      tanggalMulai,
      tanggalSelesai,
      jumlahHari,
      alasan,
      nomorSurat,
      tanggalSurat,
      pejabatPenerbit,
      dokumenNama,
      dokumenData
    } = req.body;

    const person = db.personnel.find(p => p.id === personnelId || p.nrp === personnelId);
    if (!person) {
      return res.status(404).json({ error: 'Personel tidak ditemukan.' });
    }

    const { isoWIB } = getWIBDate();
    const newRequest: LeaveRequest = {
      id: `REQ-${Date.now()}`,
      personnelId: person.id,
      personnelNrp: person.nrp,
      personnelNama: person.nama,
      personnelPangkat: person.pangkat,
      personnelJabatan: person.jabatan,
      jenis,
      kode: kode || 'I',
      tanggalMulai,
      tanggalSelesai,
      jumlahHari: Number(jumlahHari) || 1,
      alasan: alasan || '',
      nomorSurat: nomorSurat || '',
      tanggalSurat: tanggalSurat || '',
      pejabatPenerbit: pejabatPenerbit || '',
      dokumenNama,
      dokumenData,
      status: 'Menunggu Persetujuan',
      createdAt: isoWIB
    };

    db.leaveRequests.push(newRequest);
    appendAuditLog(db, {
      actorId: person.nrp,
      actorNama: person.nama,
      actorRole: 'personel',
      tindakan: 'PENGAJUAN_IZIN',
      target: `${jenis} (${tanggalMulai} s.d ${tanggalSelesai})`,
      detail: `Pengajuan ${jenis} ${jumlahHari} hari. Alasan: ${alasan}`,
      status: 'SUCCESS'
    });

    saveDatabase(db);
    res.status(201).json(newRequest);
  });

  // Approve / Reject Leave Request
  app.post('/api/leave-requests/:id/action', (req: Request, res: Response) => {
    db = loadDatabase();
    const { id } = req.params;
    const { action, catatanAtasan, approverNama, approverRole } = req.body;

    const reqItem = db.leaveRequests.find(l => l.id === id);
    if (!reqItem) {
      return res.status(404).json({ error: 'Pengajuan tidak ditemukan.' });
    }

    const { isoWIB, dateStr } = getWIBDate();
    if (action === 'approve') {
      reqItem.status = 'Disetujui';
      reqItem.disetujuiOleh = approverNama || 'Pejabat Berwenang';
      reqItem.disetujuiPada = isoWIB;
      reqItem.catatanAtasan = catatanAtasan || 'Disetujui';

      // Update or create Attendance Record for affected days
      // If the leave period includes today, update today's attendance record
      if (reqItem.tanggalMulai <= dateStr && dateStr <= reqItem.tanggalSelesai) {
        let attIndex = db.attendance.findIndex(a => a.personnelId === reqItem.personnelId && a.tanggal === dateStr);
        if (attIndex !== -1) {
          db.attendance[attIndex].statusKehadiran = reqItem.jenis as any;
          db.attendance[attIndex].keteranganKode = reqItem.kode;
          db.attendance[attIndex].catatanKoreksi = reqItem.alasan;
        } else {
          db.attendance.push({
            id: `ATT-${dateStr.replace(/-/g, '')}-${reqItem.personnelNrp}`,
            personnelId: reqItem.personnelId,
            personnelNrp: reqItem.personnelNrp,
            personnelNama: reqItem.personnelNama,
            personnelPangkat: reqItem.personnelPangkat,
            personnelJabatan: reqItem.personnelJabatan,
            unit: 'Paban Terkait',
            tanggal: dateStr,
            statusKehadiran: reqItem.jenis as any,
            keteranganKode: reqItem.kode,
            catatanKoreksi: reqItem.alasan,
            serverTimestamp: isoWIB
          });
        }
      }
    } else if (action === 'reject') {
      reqItem.status = 'Ditolak';
      reqItem.catatanAtasan = catatanAtasan || 'Ditolak';
      reqItem.disetujuiOleh = approverNama || 'Pejabat Berwenang';
      reqItem.disetujuiPada = isoWIB;
    } else if (action === 'revision') {
      reqItem.status = 'Perlu Perbaikan';
      reqItem.catatanAtasan = catatanAtasan || 'Perlu perbaikan berkas/keterangan';
    }

    appendAuditLog(db, {
      actorId: approverNama || 'ATASAN',
      actorNama: approverNama || 'Pejabat Berwenang',
      actorRole: approverRole || 'atasan',
      tindakan: action === 'approve' ? 'PERSETUJUAN_IZIN' : (action === 'reject' ? 'PENOLAKAN_IZIN' : 'PERBAIKAN_IZIN'),
      target: `Pengajuan ${reqItem.jenis} - ${reqItem.personnelNama}`,
      detail: `Keputusan: ${reqItem.status}. Catatan: ${catatanAtasan || '-'}`,
      status: action === 'reject' ? 'WARNING' : 'SUCCESS'
    });

    saveDatabase(db);
    res.json(reqItem);
  });

  // ---------------- ATTENDANCE CORRECTIONS (KOREKSI ABSENSI) ----------------
  app.get('/api/corrections', (req: Request, res: Response) => {
    db = loadDatabase();
    res.json([...db.corrections].reverse());
  });

  // Submit Correction Request
  app.post('/api/corrections', (req: Request, res: Response) => {
    db = loadDatabase();
    const {
      personnelId,
      tanggal,
      jenisKoreksi,
      jamMasukKoreksi,
      jamPulangKoreksi,
      alasan,
      dokumenBukti
    } = req.body;

    const person = db.personnel.find(p => p.id === personnelId || p.nrp === personnelId);
    if (!person) {
      return res.status(404).json({ error: 'Personel tidak ditemukan.' });
    }

    const { isoWIB } = getWIBDate();
    const existingAtt = db.attendance.find(a => (a.personnelId === person.id || a.personnelNrp === person.nrp) && a.tanggal === tanggal);

    const correction: AttendanceCorrection = {
      id: `CORR-${Date.now()}`,
      attendanceId: existingAtt?.id,
      personnelId: person.id,
      personnelNrp: person.nrp,
      personnelNama: person.nama,
      tanggal,
      jenisKoreksi,
      jamMasukAwal: existingAtt?.jamMasuk,
      jamMasukKoreksi,
      jamPulangAwal: existingAtt?.jamPulang,
      jamPulangKoreksi,
      alasan,
      dokumenBukti,
      status: 'Menunggu Persetujuan',
      createdAt: isoWIB
    };

    db.corrections.push(correction);
    appendAuditLog(db, {
      actorId: person.nrp,
      actorNama: person.nama,
      actorRole: 'personel',
      tindakan: 'PENGAJUAN_KOREKSI_ABSENSI',
      target: `Koreksi tanggal ${tanggal}`,
      detail: `Jenis koreksi: ${jenisKoreksi}. Alasan: ${alasan}`,
      status: 'SUCCESS'
    });

    saveDatabase(db);
    res.status(201).json(correction);
  });

  // Approve / Reject Correction
  app.post('/api/corrections/:id/action', (req: Request, res: Response) => {
    db = loadDatabase();
    const { id } = req.params;
    const { action, catatanPemeriksa, approverNama, approverRole } = req.body;

    const corr = db.corrections.find(c => c.id === id);
    if (!corr) {
      return res.status(404).json({ error: 'Permohonan koreksi tidak ditemukan.' });
    }

    const { isoWIB } = getWIBDate();
    if (action === 'approve') {
      corr.status = 'Disetujui';
      corr.disetujuiOleh = approverNama || 'Administrator';
      corr.disetujuiPada = isoWIB;
      corr.catatanPemeriksa = catatanPemeriksa || 'Disetujui secara administratif';

      // Apply correction to attendance without overwriting historical original GPS points
      let attIndex = db.attendance.findIndex(a => (a.personnelId === corr.personnelId || a.personnelNrp === corr.personnelNrp) && a.tanggal === corr.tanggal);
      if (attIndex !== -1) {
        if (corr.jamMasukKoreksi) db.attendance[attIndex].jamMasuk = corr.jamMasukKoreksi;
        if (corr.jamPulangKoreksi) db.attendance[attIndex].jamPulang = corr.jamPulangKoreksi;
        db.attendance[attIndex].isCorrected = true;
        db.attendance[attIndex].catatanKoreksi = `Dikoreksi administratif oleh ${approverNama}: ${corr.alasan}`;
        db.attendance[attIndex].statusKehadiran = 'Hadir';
      } else {
        db.attendance.push({
          id: `ATT-${corr.tanggal.replace(/-/g, '')}-${corr.personnelNrp}`,
          personnelId: corr.personnelId,
          personnelNrp: corr.personnelNrp,
          personnelNama: corr.personnelNama,
          personnelPangkat: '-',
          personnelJabatan: '-',
          unit: 'Slog Koopsudnas',
          tanggal: corr.tanggal,
          jamMasuk: corr.jamMasukKoreksi,
          jamPulang: corr.jamPulangKoreksi,
          statusKehadiran: 'Hadir',
          isCorrected: true,
          catatanKoreksi: `Koreksi administratif: ${corr.alasan}`,
          serverTimestamp: isoWIB
        });
      }
    } else {
      corr.status = 'Ditolak';
      corr.catatanPemeriksa = catatanPemeriksa || 'Permohonan koreksi ditolak';
      corr.disetujuiOleh = approverNama || 'Administrator';
      corr.disetujuiPada = isoWIB;
    }

    appendAuditLog(db, {
      actorId: approverNama || 'ADMIN',
      actorNama: approverNama || 'Administrator',
      actorRole: approverRole || 'admin',
      tindakan: action === 'approve' ? 'SETUJUI_KOREKSI_ABSENSI' : 'TOLAK_KOREKSI_ABSENSI',
      target: `Koreksi ${corr.personnelNama} tgl ${corr.tanggal}`,
      detail: `Keputusan: ${corr.status}. Catatan: ${catatanPemeriksa || '-'}`,
      status: action === 'approve' ? 'SUCCESS' : 'WARNING'
    });

    saveDatabase(db);
    res.json(corr);
  });

  // ---------------- OFFICE CONFIG & GPS SETTINGS ----------------
  app.get('/api/settings/office', (req: Request, res: Response) => {
    db = loadDatabase();
    res.json(db.office);
  });

  app.put('/api/settings/office', (req: Request, res: Response) => {
    db = loadDatabase();
    const { namaKantor, lat, lng, radiusMaksimalMeter, akurasiThresholdMeter, alamat, actorNama, actorId } = req.body;

    db.office = {
      namaKantor: namaKantor ?? db.office.namaKantor,
      lat: Number(lat) || db.office.lat,
      lng: Number(lng) || db.office.lng,
      radiusMaksimalMeter: Number(radiusMaksimalMeter) || db.office.radiusMaksimalMeter,
      akurasiThresholdMeter: Number(akurasiThresholdMeter) || db.office.akurasiThresholdMeter,
      alamat: alamat ?? db.office.alamat,
      isConfirmed: true
    };

    appendAuditLog(db, {
      actorId: actorId || 'ADMIN',
      actorNama: actorNama || 'Administrator',
      actorRole: 'admin',
      tindakan: 'UPDATE_PENGATURAN_GPS',
      target: 'Konfigurasi Kantor & Geofence',
      detail: `Koordinat: ${db.office.lat}, ${db.office.lng}. Radius: ${db.office.radiusMaksimalMeter}m`,
      status: 'SUCCESS'
    });

    saveDatabase(db);
    res.json(db.office);
  });

  // ---------------- AUDIT LOGS ----------------
  app.get('/api/audit-logs', (req: Request, res: Response) => {
    db = loadDatabase();
    const { limit } = req.query;
    const max = Number(limit) || 100;
    res.json(db.auditLogs.slice(0, max));
  });

  // ---------------- GAS SPREADSHEET SYNC CONFIG ----------------
  app.get('/api/gas/config', (req: Request, res: Response) => {
    db = loadDatabase();
    res.json({
      webhookUrl: db.gasWebhookUrl || '',
      connected: Boolean(db.gasWebhookUrl),
      totalPersonnelSynced: db.personnel.length,
      totalAttendanceSynced: db.attendance.length
    });
  });

  app.post('/api/gas/config', (req: Request, res: Response) => {
    db = loadDatabase();
    const { webhookUrl, actorNama, actorId } = req.body;
    db.gasWebhookUrl = webhookUrl || '';

    appendAuditLog(db, {
      actorId: actorId || 'ADMIN',
      actorNama: actorNama || 'Administrator',
      actorRole: 'admin',
      tindakan: 'UPDATE_GAS_WEBHOOK',
      target: 'Integrasi Google Spreadsheet',
      detail: webhookUrl ? `Webhook URL tersimpan: ${webhookUrl}` : 'Webhook URL dikosongkan',
      status: 'SUCCESS'
    });

    saveDatabase(db);
    res.json({ message: 'Konfigurasi Google Apps Script diperbarui.', webhookUrl: db.gasWebhookUrl });
  });

  // Re-seed Database if needed
  app.post('/api/seed/reset', (req: Request, res: Response) => {
    db = loadDatabase();
    res.json({
      message: 'Database disinkronkan dengan 26 Personel Koopsudnas.',
      totalPersonnel: db.personnel.length
    });
  });

  // ---------------- VITE MIDDLEWARE / STATIC FILES ----------------
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (req: Request, res: Response) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[DATA KEHADIRAN STAF LOGISTIK KOOPSUDNAS] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
});
