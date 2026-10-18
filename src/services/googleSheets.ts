import { Personnel, AttendanceRecord, Announcement, LeaveRequest, AttendanceCorrection, AuditLog } from '../types';

export interface SpreadsheetInfo {
  spreadsheetId: string;
  title: string;
  spreadsheetUrl: string;
  sheets: string[];
}

const SHEETS_CONFIG = [
  {
    title: 'Personel',
    headers: ["ID", "Nama", "Pangkat_Golongan", "NRP_NIP", "Jabatan", "Unit", "Telepon", "Alamat_Rumah", "Tinggal_Di_Mes", "Alamat_Mes", "Status", "Dibuat_Pada"]
  },
  {
    title: 'Absensi',
    headers: ["ID", "Personnel_ID", "NRP_NIP", "Nama", "Pangkat", "Jabatan", "Tanggal", "Jam_Masuk", "Jam_Pulang", "Lat_Masuk", "Lng_Masuk", "Jarak_Masuk_M", "Status_GPS_Masuk", "Status_Kehadiran", "Catatan", "Server_Timestamp"]
  },
  {
    title: 'Pengumuman',
    headers: ["ID", "Judul", "Isi", "Admin_Nama", "Dibuat_Pada"]
  },
  {
    title: 'Pengajuan_Izin',
    headers: ["ID", "Personnel_ID", "Nama", "Pangkat", "Jenis", "Kode", "Tanggal_Mulai", "Tanggal_Selesai", "Jumlah_Hari", "Alasan", "Status", "Disetujui_Oleh"]
  },
  {
    title: 'Koreksi_Absensi',
    headers: ["ID", "Attendance_ID", "Personnel_ID", "Nama", "Tanggal", "Jenis_Koreksi", "Jam_Masuk_Koreksi", "Jam_Pulang_Koreksi", "Alasan", "Status"]
  },
  {
    title: 'Pengguna_Akses',
    headers: ["ID", "Username", "Nama", "Role", "Pangkat", "Jabatan", "Status_Akun"]
  },
  {
    title: 'Audit_Log',
    headers: ["ID", "Timestamp", "Actor_ID", "Actor_Nama", "Actor_Role", "Tindakan", "Target", "Detail", "Status"]
  }
];

export const googleSheetsApi = {
  /**
   * Create a new Google Spreadsheet with all 7 sheets and headers formatted
   */
  async createAttendanceSpreadsheet(accessToken: string, customTitle?: string): Promise<SpreadsheetInfo> {
    const title = customTitle || `DATABASE KEHADIRAN SLOG KOOPSUDNAS - ${new Date().toLocaleDateString('id-ID')}`;

    const requestBody = {
      properties: {
        title,
        timeZone: 'Asia/Jakarta',
        locale: 'id_ID'
      },
      sheets: SHEETS_CONFIG.map(sheet => ({
        properties: {
          title: sheet.title,
          gridProperties: {
            frozenRowCount: 1
          }
        }
      }))
    };

    const res = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error?.message || 'Gagal membuat Google Spreadsheet baru');
    }

    const data = await res.json();
    const spreadsheetId = data.spreadsheetId;

    // Populate Headers for each sheet
    const headerData = SHEETS_CONFIG.map(sheet => ({
      range: `'${sheet.title}'!A1`,
      values: [sheet.headers]
    }));

    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        valueInputOption: 'USER_ENTERED',
        data: headerData
      })
    });

    return {
      spreadsheetId,
      title: data.properties.title,
      spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
      sheets: data.sheets.map((s: any) => s.properties.title)
    };
  },

  /**
   * Get metadata of an existing spreadsheet
   */
  async getSpreadsheetInfo(accessToken: string, spreadsheetId: string): Promise<SpreadsheetInfo> {
    const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error?.message || 'Gagal mengakses informasi Google Spreadsheet');
    }

    const data = await res.json();
    return {
      spreadsheetId: data.spreadsheetId,
      title: data.properties.title,
      spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${data.spreadsheetId}/edit`,
      sheets: (data.sheets || []).map((s: any) => s.properties.title)
    };
  },

  /**
   * Sync all local data into the target Google Spreadsheet
   */
  async syncAllData(
    accessToken: string,
    spreadsheetId: string,
    payload: {
      personnel: Personnel[];
      attendance: AttendanceRecord[];
      announcements: Announcement[];
      leaves: LeaveRequest[];
      corrections: AttendanceCorrection[];
      logs: AuditLog[];
    }
  ): Promise<{ updatedSheetsCount: number }> {
    // 1. Format Personel Rows
    const personelValues = [
      SHEETS_CONFIG[0].headers,
      ...payload.personnel.map(p => [
        p.id,
        p.nama,
        p.pangkat,
        `'${p.nrp}`,
        p.jabatan,
        p.unit,
        p.telepon || '',
        p.alamatRumah || '',
        p.tinggalDiMes ? 'Ya' : 'Tidak',
        p.alamatMes || '',
        p.status,
        p.createdAt || new Date().toISOString()
      ])
    ];

    // 2. Format Absensi Rows
    const absensiValues = [
      SHEETS_CONFIG[1].headers,
      ...payload.attendance.map(a => [
        a.id,
        a.personnelId,
        `'${a.personnelNrp || ''}`,
        a.personnelNama || '',
        a.personnelPangkat || '',
        a.personnelJabatan || '',
        a.tanggal,
        a.jamMasuk || '',
        a.jamPulang || '',
        a.latMasuk || '',
        a.lngMasuk || '',
        a.jarakMasukMeter || '',
        a.statusValidasiMasuk || '',
        a.statusKehadiran,
        a.catatanKoreksi || '',
        a.serverTimestamp
      ])
    ];

    // 3. Format Pengumuman Rows
    const pengumumanValues = [
      SHEETS_CONFIG[2].headers,
      ...payload.announcements.map(ann => [
        ann.id,
        ann.judul,
        ann.isi,
        ann.adminNama,
        ann.createdAt
      ])
    ];

    // 4. Format Pengajuan_Izin Rows
    const izinValues = [
      SHEETS_CONFIG[3].headers,
      ...payload.leaves.map(l => [
        l.id,
        l.personnelId,
        l.personnelNama || '',
        l.personnelPangkat || '',
        l.jenis,
        l.kode,
        l.tanggalMulai,
        l.tanggalSelesai,
        l.jumlahHari,
        l.alasan,
        l.status,
        l.disetujuiOleh || ''
      ])
    ];

    // 5. Format Koreksi_Absensi Rows
    const koreksiValues = [
      SHEETS_CONFIG[4].headers,
      ...payload.corrections.map(c => [
        c.id,
        c.attendanceId || '',
        c.personnelId,
        c.personnelNama || '',
        c.tanggal,
        c.jenisKoreksi,
        c.jamMasukKoreksi || '',
        c.jamPulangKoreksi || '',
        c.alasan,
        c.status
      ])
    ];

    // 6. Format Audit_Log Rows
    const logValues = [
      SHEETS_CONFIG[6].headers,
      ...payload.logs.map(log => [
        log.id,
        log.timestamp,
        log.actorId,
        log.actorNama,
        log.actorRole,
        log.tindakan,
        log.target,
        log.detail,
        log.status
      ])
    ];

    const dataUpdates = [
      { range: `'Personel'!A1`, values: personelValues },
      { range: `'Absensi'!A1`, values: absensiValues },
      { range: `'Pengumuman'!A1`, values: pengumumanValues },
      { range: `'Pengajuan_Izin'!A1`, values: izinValues },
      { range: `'Koreksi_Absensi'!A1`, values: koreksiValues },
      { range: `'Audit_Log'!A1`, values: logValues }
    ];

    const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        valueInputOption: 'USER_ENTERED',
        data: dataUpdates
      })
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error?.message || 'Gagal menyinkronkan data ke Google Spreadsheet');
    }

    return { updatedSheetsCount: dataUpdates.length };
  }
};
