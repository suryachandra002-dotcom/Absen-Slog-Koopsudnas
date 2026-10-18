export interface Personnel {
  id: string;
  nama: string;
  pangkat: string;
  nrp: string; // Teks string unik (NRP militer / NIP PNS)
  jabatan: string;
  unit: string;
  telepon: string;
  alamatRumah: string;
  tinggalDiMes: boolean;
  alamatMes?: string;
  keteranganTambahan?: string;
  foto?: string; // Data URL atau path
  status: 'aktif' | 'nonaktif' | 'diarsipkan';
  alasanArsip?: string;
  diarsipkanOleh?: string;
  diarsipkanPada?: string;
  createdAt: string;
  updatedAt: string;
}

export type AbsenceCategory = 
  | 'DD' // Dinas Dalam
  | 'DL' // Dinas Luar
  | 'DK' // Dinas Khusus
  | 'DIK' // Pendidikan
  | 'CT' // Cuti
  | 'S' // Sakit
  | 'I' // Izin
  | 'TP' // Tanpa Pemberitahuan
  | 'BP'; // Berhalangan Pasif / Lainnya

export interface AttendanceRecord {
  id: string;
  personnelId: string;
  personnelNrp: string;
  personnelNama: string;
  personnelPangkat: string;
  personnelJabatan: string;
  unit: string;
  tanggal: string; // YYYY-MM-DD
  jamMasuk?: string; // HH:mm:ss WIB
  jamPulang?: string; // HH:mm:ss WIB
  latMasuk?: number;
  lngMasuk?: number;
  jarakMasukMeter?: number;
  statusValidasiMasuk?: 'valid' | 'invalid';
  latPulang?: number;
  lngPulang?: number;
  jarakPulangMeter?: number;
  statusValidasiPulang?: 'valid' | 'invalid';
  statusKehadiran: 'Hadir' | 'Belum Absen' | 'Cuti' | 'Dinas Luar' | 'Izin' | 'Pendidikan' | 'Sakit' | 'Dinas Khusus' | 'Tanpa Pemberitahuan' | 'Berhalangan Pasif';
  keteranganKode?: AbsenceCategory;
  isCorrected?: boolean;
  catatanKoreksi?: string;
  serverTimestamp: string;
}

export interface Announcement {
  id: string;
  judul: string;
  isi: string;
  adminId: string;
  adminNama: string;
  createdAt: string;
  updatedAt: string;
}

export interface LeaveRequest {
  id: string;
  personnelId: string;
  personnelNrp: string;
  personnelNama: string;
  personnelPangkat: string;
  personnelJabatan: string;
  jenis: 'Cuti' | 'Dinas Luar' | 'Izin' | 'Pendidikan' | 'Sakit' | 'Dinas Khusus' | 'Lainnya';
  kode: AbsenceCategory;
  tanggalMulai: string;
  tanggalSelesai: string;
  jumlahHari: number;
  alasan: string;
  nomorSurat: string;
  tanggalSurat: string;
  pejabatPenerbit: string;
  dokumenNama?: string;
  dokumenData?: string;
  status: 'Draft' | 'Menunggu Persetujuan' | 'Perlu Perbaikan' | 'Disetujui' | 'Ditolak' | 'Dibatalkan';
  catatanAtasan?: string;
  disetujuiOleh?: string;
  disetujuiPada?: string;
  createdAt: string;
}

export interface AttendanceCorrection {
  id: string;
  attendanceId?: string;
  personnelId: string;
  personnelNrp: string;
  personnelNama: string;
  tanggal: string;
  jenisKoreksi: 'Masuk' | 'Pulang' | 'Masuk & Pulang';
  jamMasukAwal?: string;
  jamMasukKoreksi?: string;
  jamPulangAwal?: string;
  jamPulangKoreksi?: string;
  alasan: string;
  dokumenBukti?: string;
  status: 'Menunggu Persetujuan' | 'Disetujui' | 'Ditolak';
  catatanPemeriksa?: string;
  disetujuiOleh?: string;
  disetujuiPada?: string;
  createdAt: string;
}

export interface OfficeConfig {
  namaKantor: string;
  lat: number;
  lng: number;
  radiusMaksimalMeter: number;
  akurasiThresholdMeter: number;
  alamat: string;
  isConfirmed: boolean;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  actorId: string;
  actorNama: string;
  actorRole: string;
  tindakan: string;
  target: string;
  detail: string;
  status: 'SUCCESS' | 'WARNING' | 'FAILED';
}

export type UserRole = 'admin' | 'atasan' | 'personel';

export interface UserAccount {
  id: string;
  username: string;
  nama: string;
  role: UserRole;
  personnelId?: string;
  pangkat: string;
  jabatan: string;
}

export interface SystemStats {
  totalPersonnel: number;
  activePersonnel: number;
  archivedPersonnel: number;
  todayPresent: number;
  todayAbsent: number;
  categoryBreakdown: Record<AbsenceCategory, number>;
  pendingLeaveApprovals: number;
  pendingCorrectionApprovals: number;
}
