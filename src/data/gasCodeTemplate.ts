export const GOOGLE_APPS_SCRIPT_CODE = `/**
 * =========================================================================
 * DATA KEHADIRAN STAF LOGISTIK KOOPSUDNAS
 * BACKEND GOOGLE APPS SCRIPT (GAS) & GOOGLE SPREADSHEET DATABASE
 * =========================================================================
 * Instansi: Komando Operasi Udara Nasional (Koopsudnas) - Staf Logistik
 * Zona Waktu: Asia/Jakarta (WIB)
 * Radius GPS Kantor: 3.000 Meter
 * Koordinat Kantor Resmi: Lat -6.262500, Lng 106.891200 (Halim Perdanakusuma)
 * =========================================================================
 */

// KONFIGURASI SISTEM
const CONFIG = {
  APP_NAME: "DATA KEHADIRAN STAF LOGISTIK KOOPSUDNAS",
  TIMEZONE: "Asia/Jakarta",
  OFFICE_LAT: -6.262500,
  OFFICE_LNG: 106.891200,
  MAX_RADIUS_METERS: 3000,
  MAX_ANNOUNCEMENTS: 5,
  SHEETS: {
    PERSONEL: "Personel",
    ABSENSI: "Absensi",
    PENGUMUMAN: "Pengumuman",
    PENGAJUAN_IZIN: "Pengajuan_Izin",
    KOREKSI_ABSENSI: "Koreksi_Absensi",
    PENGGUNA_AKSES: "Pengguna_Akses",
    AUDIT_LOG: "Audit_Log",
    KONFIGURASI: "Konfigurasi"
  }
};

/**
 * 1. INISIALISASI DATABASE GOOGLE SPREADSHEET OTOMATIS
 * Menyiapkan sheet, format kolom teks untuk NRP/NIP, dan data 26 personel awal secara idempoten.
 */
function setupSpreadsheetDatabase() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  ss.setSpreadsheetTimeZone(CONFIG.TIMEZONE);

  const headers = {
    [CONFIG.SHEETS.PERSONEL]: ["ID", "Nama", "Pangkat_Golongan", "NRP_NIP", "Jabatan", "Unit", "Telepon", "Alamat_Rumah", "Tinggal_Di_Mes", "Alamat_Mes", "Foto_URL", "Status", "Alasan_Arsip", "Dibuat_Pada", "Diperbarui_Pada"],
    [CONFIG.SHEETS.ABSENSI]: ["ID", "Personnel_ID", "NRP_NIP", "Nama", "Pangkat", "Jabatan", "Unit", "Tanggal", "Jam_Masuk", "Jam_Pulang", "Lat_Masuk", "Lng_Masuk", "Jarak_Masuk_M", "Status_GPS_Masuk", "Lat_Pulang", "Lng_Pulang", "Jarak_Pulang_M", "Status_GPS_Pulang", "Status_Kehadiran", "Kode_Keterangan", "Is_Koreksi", "Catatan", "Server_Timestamp"],
    [CONFIG.SHEETS.PENGUMUMAN]: ["ID", "Judul", "Isi", "Admin_ID", "Admin_Nama", "Dibuat_Pada", "Diperbarui_Pada"],
    [CONFIG.SHEETS.PENGAJUAN_IZIN]: ["ID", "Personnel_ID", "NRP_NIP", "Nama", "Pangkat", "Jabatan", "Jenis", "Kode", "Tanggal_Mulai", "Tanggal_Selesai", "Jumlah_Hari", "Alasan", "Nomor_Surat", "Tanggal_Surat", "Pejabat_Penerbit", "Dokumen_URL", "Status", "Catatan_Atasan", "Disetujui_Oleh", "Disetujui_Pada", "Dibuat_Pada"],
    [CONFIG.SHEETS.KOREKSI_ABSENSI]: ["ID", "Attendance_ID", "Personnel_ID", "NRP_NIP", "Nama", "Tanggal", "Jenis_Koreksi", "Jam_Masuk_Awal", "Jam_Masuk_Koreksi", "Jam_Pulang_Awal", "Jam_Pulang_Koreksi", "Alasan", "Dokumen_Bukti_URL", "Status", "Catatan_Pemeriksa", "Disetujui_Oleh", "Disetujui_Pada", "Dibuat_Pada"],
    [CONFIG.SHEETS.PENGGUNA_AKSES]: ["ID", "Username", "Nama", "Role", "Personnel_ID", "Pangkat", "Jabatan", "Status_Akun"],
    [CONFIG.SHEETS.AUDIT_LOG]: ["ID", "Timestamp", "Actor_ID", "Actor_Nama", "Actor_Role", "Tindakan", "Target", "Detail", "Status"]
  };

  // Buat Sheet jika belum ada dan tetapkan header
  Object.keys(headers).forEach(sheetName => {
    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
    }
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(headers[sheetName]);
      sheet.getRange(1, 1, 1, headers[sheetName].length)
        .setBackground("#1e3a8a")
        .setFontColor("#ffffff")
        .setFontWeight("bold");
      sheet.setFrozenRows(1);
    }
  });

  // Pastikan kolom NRP_NIP diformat sebagai plain text ('@') agar tidak kehilangan digit 0
  const sheetPersonel = ss.getSheetByName(CONFIG.SHEETS.PERSONEL);
  sheetPersonel.getRange("D:D").setNumberFormat("@");

  // Masukkan 26 Personel Awal secara Idempoten
  seed26Personnel(sheetPersonel);

  logAudit("SYSTEM", "Administrator", "admin", "SETUP_DATABASE", "Spreadsheet", "Inisialisasi database dan seeding 26 personel berhasil", "SUCCESS");
  return { status: "success", message: "Inisialisasi database berhasil dan 26 personel siap digunakan." };
}

/**
 * 2. SEEDING 26 PERSONEL KOOPSUDNAS (IDEMPOTEN)
 */
function seed26Personnel(sheet) {
  const existingData = sheet.getDataRange().getValues();
  const existingNRPs = new Set();
  for (let i = 1; i < existingData.length; i++) {
    existingNRPs.add(String(existingData[i][3]).trim());
  }

  const rawPersonnel = [
    ["Fiyono, S.T., M.M.", "Kolonel Kal", "520336", "Waaslog Kaskoopsudnas", "Pimpinan Slog"],
    ["Agus Sutopo", "Kolonel Tek", "523371", "Paban I/Ren Slog Kaskoopsudnas", "Paban I/Ren"],
    ["Triningsih Malyati, S.E.", "Kolonel Kal", "520916", "Paban II/Kalmat Slog Kaskoopsudnas", "Paban II/Kalmat"],
    ["David Alwi", "Kolonel Tek", "523376", "Paban III/Sista Slog Kaskoopsudnas", "Paban III/Sista"],
    ["Andi Wijaya", "Kolonel Tum", "525881", "Paban IV/Kons Slog Kaskoopsudnas", "Paban IV/Kons"],
    ["Xanthoniar Taufan Wijaya, S.T., M.EngMgt.", "Kolonel Kal", "525098", "Paban V/BMN Slog Kaskoopsudnas", "Paban V/BMN"],
    ["Sulistyo Adi", "Letkol Kal", "527593", "Pabandya BMN Paban V/BMN", "Paban V/BMN"],
    ["Prasetiyo Tri Hadi N, S.T.", "Letkol Lek", "528702", "Pabandya Alpasus Paban III/Sista", "Paban III/Sista"],
    ["Chandra Surya S., S.T., M.M.", "Letkol Tum", "529242", "Pabandya Faskon Paban IV/Kons", "Paban IV/Kons"],
    ["Kokoh Pramono", "Letkol Tek", "529631", "Pabandya Matkomlek Paban III/Sista", "Paban III/Sista"],
    ["Alexander Maspanator, S.M., M.M.", "Letkol Kal", "531235", "Pabandya Dukminmal Paban II/Kalmat", "Paban II/Kalmat"],
    ["Harsoyo, S.T.", "Letkol Tum", "529240", "Pabandya BTB Paban IV/Kons", "Paban IV/Kons"],
    ["Dwi Wahyu Irianto, S.T., M.Han.", "Letkol Tek", "533606", "Pabandya Senamu Paban III/Sista", "Paban III/Sista"],
    ["Agus Jamaludin", "Letkol Tek", "536368", "Pabandya Pesbang Paban III/Sista", "Paban III/Sista"],
    ["Aam Hindaya", "Mayor Tek", "534477", "Ps. Pabandyarenlog Paban I/Ren", "Paban I/Ren"],
    ["Wahyu Seno S", "Mayor Tek", "536410", "Pabandyabinsisevlap Paban I/Ren", "Paban I/Ren"],
    ["Pandu Kresnahadi, S.E.", "Mayor Kal", "538642", "Pabanda Bekum Bandya Dukminkal Paban II/Kalmat", "Paban II/Kalmat"],
    ["Saifudin Toyo S", "Serka", "543331", "Ba Adminu Paban III/Sista", "Paban III/Sista"],
    ["Yudha Prakoso", "Serka", "543422", "Ba Smin Taud Slog Kaskoopsudnas", "Taud Slog"],
    ["Yusup Firdaus S", "Sertu", "41819703547297", "Ba Simak BMN Paban V/BMN", "Paban V/BMN"],
    ["Dimas Bayu Pamungkas", "Sertu", "41819810547530", "Ba Harfasint Paban IV/Kons", "Paban IV/Kons"],
    ["Kevin Nur Kisyuwono", "Serda", "3523107010557136", "Ba BTB Paban IV/Kons", "Paban IV/Kons"],
    ["Nurul Yusri", "Serda", "3523104020558259", "Ba Adminu Paban I/Ren Slog", "Paban I/Ren"],
    ["Tony Dwihandoko", "Praka", "61619410545049", "Ta Mudi Aslog Kaskoopsudnas", "Pimpinan Slog"],
    ["Andreansah Prasetyo Wibowo", "Prada", "3725101050561494", "Ta Operator Komputer Paban I/Ren", "Paban I/Ren"],
    ["Ismaryadi", "Penata III C", "196812191990031005", "Kataud Slog Kaskoopsudnas", "Taud Slog"]
  ];

  const now = Utilities.formatDate(new Date(), CONFIG.TIMEZONE, "yyyy-MM-dd HH:mm:ss");
  const newRows = [];

  rawPersonnel.forEach((p, idx) => {
    const nrp = String(p[2]).trim();
    if (!existingNRPs.has(nrp)) {
      const id = "PERS-" + ("000" + (idx + 1)).slice(-3);
      newRows.push([
        id, p[0], p[1], "'" + nrp, p[3], p[4], "", "", "Tidak", "", "", "aktif", "", now, now
      ]);
    }
  });

  if (newRows.length > 0) {
    sheet.getRange(sheet.getLastRow() + 1, 1, newRows.length, newRows[0].length).setValues(newRows);
  }
}

/**
 * 3. VALIDASI JARAK GPS (HAVERSINE FORMULA)
 */
function calculateDistanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Radius bumi dalam meter
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * 4. PENCATATAN ABSENSI GPS DENGAN LOCKSERVICE
 */
function recordAttendance(params) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    const { personnelId, type, lat, lng } = params;
    const distance = calculateDistanceMeters(lat, lng, CONFIG.OFFICE_LAT, CONFIG.OFFICE_LNG);

    if (distance > CONFIG.MAX_RADIUS_METERS) {
      return {
        status: "error",
        message: "Absensi ditolak. Lokasi Anda berada di luar radius 3 km dari kantor Staf Logistik Koopsudnas. Jarak Anda: " + (distance / 1000).toFixed(2) + " km."
      };
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(CONFIG.SHEETS.ABSENSI);
    const now = new Date();
    const today = Utilities.formatDate(now, CONFIG.TIMEZONE, "yyyy-MM-dd");
    const currentTime = Utilities.formatDate(now, CONFIG.TIMEZONE, "HH:mm:ss");
    const timestamp = Utilities.formatDate(now, CONFIG.TIMEZONE, "yyyy-MM-dd HH:mm:ss");

    // Ambil Data Personel
    const pSheet = ss.getSheetByName(CONFIG.SHEETS.PERSONEL);
    const pData = pSheet.getDataRange().getValues();
    let person = null;
    for (let i = 1; i < pData.length; i++) {
      if (String(pData[i][0]) === String(personnelId) || String(pData[i][3]).replace("'", "") === String(personnelId)) {
        person = {
          id: pData[i][0],
          nama: pData[i][1],
          pangkat: pData[i][2],
          nrp: String(pData[i][3]).replace("'", ""),
          jabatan: pData[i][4],
          unit: pData[i][5]
        };
        break;
      }
    }

    if (!person) {
      return { status: "error", message: "Data personel tidak ditemukan." };
    }

    // Periksa apakah sudah ada catatan hari ini
    const data = sheet.getDataRange().getValues();
    let rowIndex = -1;
    for (let i = 1; i < data.length; i++) {
      if (data[i][1] === person.id && data[i][7] === today) {
        rowIndex = i + 1; // 1-based index
        break;
      }
    }

    if (type === "masuk") {
      if (rowIndex !== -1 && data[rowIndex - 1][8]) {
        return { status: "error", message: "Anda sudah melakukan Absen Masuk hari ini pukul " + data[rowIndex - 1][8] + " WIB." };
      }

      if (rowIndex === -1) {
        const id = "ATT-" + Utilities.formatDate(now, CONFIG.TIMEZONE, "yyyyMMdd") + "-" + person.nrp;
        sheet.appendRow([
          id, person.id, "'" + person.nrp, person.nama, person.pangkat, person.jabatan, person.unit,
          today, currentTime, "", lat, lng, distance, "valid", "", "", "", "", "Hadir", "DD", false, "", timestamp
        ]);
      } else {
        sheet.getRange(rowIndex, 9).setValue(currentTime);
        sheet.getRange(rowIndex, 11).setValue(lat);
        sheet.getRange(rowIndex, 12).setValue(lng);
        sheet.getRange(rowIndex, 13).setValue(distance);
        sheet.getRange(rowIndex, 14).setValue("valid");
        sheet.getRange(rowIndex, 19).setValue("Hadir");
      }
      logAudit(person.nrp, person.nama, "personel", "ABSEN_MASUK", "Absensi", "Absen Masuk sukses pada jarak " + distance + "m", "SUCCESS");
      return { status: "success", message: "Absen Masuk berhasil dicatat. Jarak: " + distance + " meter.", time: currentTime, distance: distance };
    } else if (type === "pulang") {
      if (rowIndex === -1 || !data[rowIndex - 1][8]) {
        return { status: "error", message: "Silakan lakukan Absen Masuk terlebih dahulu sebelum Absen Pulang." };
      }
      sheet.getRange(rowIndex, 10).setValue(currentTime);
      sheet.getRange(rowIndex, 15).setValue(lat);
      sheet.getRange(rowIndex, 16).setValue(lng);
      sheet.getRange(rowIndex, 17).setValue(distance);
      sheet.getRange(rowIndex, 18).setValue("valid");

      logAudit(person.nrp, person.nama, "personel", "ABSEN_PULANG", "Absensi", "Absen Pulang sukses pada jarak " + distance + "m", "SUCCESS");
      return { status: "success", message: "Absen Pulang berhasil dicatat. Jarak: " + distance + " meter.", time: currentTime, distance: distance };
    }
  } catch (err) {
    return { status: "error", message: "Gagal menyimpan absensi: " + err.toString() };
  } finally {
    lock.releaseLock();
  }
}

/**
 * 5. PENGUMUMAN DENGAN BATAS MAKSIMAL 5 (ATOMIC FIFO)
 */
function manageAnnouncement(action, payload) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(CONFIG.SHEETS.PENGUMUMAN);
    const now = Utilities.formatDate(new Date(), CONFIG.TIMEZONE, "yyyy-MM-dd HH:mm:ss");

    if (action === "add") {
      const data = sheet.getDataRange().getValues();
      const rows = data.slice(1); // Abaikan header

      // Jika sudah mencapai 5, hapus pengumuman tertua (berdasarkan waktu server)
      if (rows.length >= CONFIG.MAX_ANNOUNCEMENTS) {
        let oldestIndex = 0;
        let oldestTime = new Date(rows[0][5]).getTime();

        for (let i = 1; i < rows.length; i++) {
          const t = new Date(rows[i][5]).getTime();
          if (t < oldestTime) {
            oldestTime = t;
            oldestIndex = i;
          }
        }
        const deletedTitle = rows[oldestIndex][1];
        sheet.deleteRow(oldestIndex + 2); // 1-based + offset header
        logAudit(payload.adminId, payload.adminNama, "admin", "PURGE_PENGUMUMAN", "Pengumuman", "Auto-purge pengumuman tertua: " + deletedTitle, "SUCCESS");
      }

      const id = "ANN-" + new Date().getTime();
      sheet.appendRow([id, payload.judul, payload.isi, payload.adminId, payload.adminNama, now, now]);
      logAudit(payload.adminId, payload.adminNama, "admin", "ADD_PENGUMUMAN", "Pengumuman", "Tambah pengumuman: " + payload.judul, "SUCCESS");
      return { status: "success", message: "Pengumuman berhasil ditambahkan." };
    }

    if (action === "edit") {
      const data = sheet.getDataRange().getValues();
      for (let i = 1; i < data.length; i++) {
        if (data[i][0] === payload.id) {
          sheet.getRange(i + 1, 2).setValue(payload.judul);
          sheet.getRange(i + 1, 3).setValue(payload.isi);
          sheet.getRange(i + 1, 7).setValue(now);
          logAudit(payload.adminId, payload.adminNama, "admin", "EDIT_PENGUMUMAN", "Pengumuman", "Ubah pengumuman ID: " + payload.id, "SUCCESS");
          return { status: "success", message: "Pengumuman berhasil diperbarui." };
        }
      }
      return { status: "error", message: "Pengumuman tidak ditemukan." };
    }

    if (action === "delete") {
      const data = sheet.getDataRange().getValues();
      for (let i = 1; i < data.length; i++) {
        if (data[i][0] === payload.id) {
          sheet.deleteRow(i + 1);
          logAudit(payload.adminId, payload.adminNama, "admin", "DELETE_PENGUMUMAN", "Pengumuman", "Hapus pengumuman ID: " + payload.id, "SUCCESS");
          return { status: "success", message: "Pengumuman berhasil dihapus." };
        }
      }
      return { status: "error", message: "Pengumuman tidak ditemukan." };
    }
  } finally {
    lock.releaseLock();
  }
}

/**
 * 6. PENCATATAN AUDIT LOG (APPEND ONLY)
 */
function logAudit(actorId, actorNama, actorRole, tindakan, target, detail, status) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(CONFIG.SHEETS.AUDIT_LOG);
    if (!sheet) return;
    const now = Utilities.formatDate(new Date(), CONFIG.TIMEZONE, "yyyy-MM-dd HH:mm:ss");
    const id = "AUD-" + new Date().getTime();
    sheet.appendRow([id, now, actorId, actorNama, actorRole, tindakan, target, detail, status]);
  } catch (e) {
    console.error("Audit log error:", e);
  }
}

/**
 * 7. ENDPOINT WEB APP (doGet & doPost)
 */
function doGet(e) {
  return HtmlService.createHtmlOutput(
    "<h3>DATA KEHADIRAN STAF LOGISTIK KOOPSUDNAS (GAS BACKEND AKTIF)</h3><p>API Endpoint siap menerima request.</p>"
  ).setTitle(CONFIG.APP_NAME);
}

function doPost(e) {
  try {
    const contents = JSON.parse(e.postData.contents);
    const action = contents.action;
    let result = { status: "error", message: "Aksi tidak dikenali" };

    if (action === "setup") {
      result = setupSpreadsheetDatabase();
    } else if (action === "recordAttendance") {
      result = recordAttendance(contents.params);
    } else if (action === "announcement") {
      result = manageAnnouncement(contents.subAction, contents.payload);
    }

    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
`;
