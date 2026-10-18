import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AttendanceRecord, Personnel } from '../types';

export const MONTH_NAMES_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export interface MonthlyPDFOptions {
  month: number; // 1-12
  year: number;
  unit?: string;
  approverTitle: string;
  approverName: string;
  approverRank: string;
  approverNrp: string;
  docNumber?: string;
}

export const exportService = {
  // Export Attendance Recap to Excel (.xlsx)
  exportAttendanceToExcel(data: AttendanceRecord[], title: string = 'Rekapitulasi_Kehadiran_Koopsudnas') {
    const rows = [
      ['DATA KEHADIRAN STAF LOGISTIK KOOPSUDNAS'],
      [`Waktu Pembuatan: ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB`],
      [''],
      [
        'No',
        'Tanggal',
        'NRP/NIP',
        'Nama Lengkap',
        'Pangkat/Gol',
        'Jabatan',
        'Unit/Paban',
        'Jam Masuk',
        'Jam Pulang',
        'Jarak Masuk (m)',
        'Status GPS',
        'Status Kehadiran',
        'Kode',
        'Koreksi',
        'Catatan'
      ]
    ];

    data.forEach((item, index) => {
      rows.push([
        String(index + 1),
        item.tanggal || '-',
        item.personnelNrp || '-',
        item.personnelNama || '-',
        item.personnelPangkat || '-',
        item.personnelJabatan || '-',
        item.unit || '-',
        item.jamMasuk || '-',
        item.jamPulang || '-',
        item.jarakMasukMeter !== undefined ? String(item.jarakMasukMeter) : '-',
        item.statusValidasiMasuk || '-',
        item.statusKehadiran || '-',
        item.keteranganKode || '-',
        item.isCorrected ? 'Ya' : 'Tidak',
        item.catatanKoreksi || '-'
      ]);
    });

    const worksheet = XLSX.utils.aoa_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Rekap_Kehadiran');
    XLSX.writeFile(workbook, `${title}_${Date.now()}.xlsx`);
  },

  // Export Personnel Master to Excel (.xlsx)
  exportPersonnelToExcel(data: Personnel[], title: string = 'Master_Data_Personel_Slog_Koopsudnas') {
    const rows = [
      ['MASTER DATA PERSONEL STAF LOGISTIK KOOPSUDNAS'],
      [`Total Personel: ${data.length}`],
      [`Tanggal Ekspor: ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB`],
      [''],
      [
        'No',
        'Nama Lengkap',
        'Pangkat/Golongan',
        'NRP/NIP',
        'Jabatan',
        'Unit Kerja',
        'Status',
        'No Telepon',
        'Alamat Rumah',
        'Tinggal di Mes',
        'Alamat Mes',
        'Keterangan'
      ]
    ];

    data.forEach((p, index) => {
      rows.push([
        String(index + 1),
        p.nama,
        p.pangkat,
        p.nrp,
        p.jabatan,
        p.unit,
        p.status,
        p.telepon || '-',
        p.alamatRumah || '-',
        p.tinggalDiMes ? 'Ya' : 'Tidak',
        p.alamatMes || '-',
        p.keteranganTambahan || '-'
      ]);
    });

    const worksheet = XLSX.utils.aoa_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data_Personel');
    XLSX.writeFile(workbook, `${title}_${Date.now()}.xlsx`);
  },

  // Quick Export to PDF
  exportAttendanceToPDF(data: AttendanceRecord[], title: string = 'Rekapitulasi Kehadiran Personel') {
    const doc = new jsPDF('landscape');

    // Header Kop Resmi
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('KOMANDO OPERASI UDARA NASIONAL', 148, 14, { align: 'center' });
    doc.setFontSize(11);
    doc.text('STAF LOGISTIK', 148, 20, { align: 'center' });
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(title.toUpperCase(), 148, 26, { align: 'center' });
    doc.setFontSize(8);
    doc.text(`Waktu Cetak: ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB | Zona Waktu: Asia/Jakarta (WIB)`, 148, 31, { align: 'center' });

    // Header separator line
    doc.setLineWidth(0.6);
    doc.line(14, 34, 282, 34);
    doc.setLineWidth(0.2);
    doc.line(14, 35.5, 282, 35.5);

    const tableData = data.map((item, idx) => [
      idx + 1,
      item.tanggal || '-',
      item.personnelNrp || '-',
      item.personnelNama || '-',
      item.personnelPangkat || '-',
      item.personnelJabatan || '-',
      item.unit || '-',
      item.jamMasuk ? `${item.jamMasuk} WIB` : '-',
      item.jamPulang ? `${item.jamPulang} WIB` : '-',
      item.statusKehadiran || '-',
      item.keteranganKode || (item.isCorrected ? 'KOR' : '-')
    ]);

    autoTable(doc, {
      startY: 38,
      head: [['No', 'Tanggal', 'NRP/NIP', 'Nama Lengkap', 'Pangkat', 'Jabatan', 'Unit Kerja', 'Jam Masuk', 'Jam Pulang', 'Status', 'Kode']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: [30, 58, 138], // Navy blue
        textColor: 255,
        fontSize: 8,
        fontStyle: 'bold',
        halign: 'center'
      },
      styles: {
        fontSize: 7.5,
        cellPadding: 2,
        valign: 'middle'
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 10 },
        1: { halign: 'center', cellWidth: 20 },
        2: { halign: 'center', cellWidth: 24, fontStyle: 'bold' },
        3: { cellWidth: 44 },
        4: { cellWidth: 22 },
        5: { cellWidth: 45 },
        6: { cellWidth: 25 },
        7: { halign: 'center', cellWidth: 22 },
        8: { halign: 'center', cellWidth: 22 },
        9: { halign: 'center', cellWidth: 22 },
        10: { halign: 'center', cellWidth: 12 }
      },
      margin: { left: 14, right: 14 }
    });

    // Add Signature on the bottom
    const finalY = (doc as any).lastAutoTable.finalY + 12;
    const pageHeight = doc.internal.pageSize.height;

    if (finalY + 45 > pageHeight) {
      doc.addPage();
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(`Jakarta, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`, 220, 20);
      doc.text('Waaslog Kaskoopsudnas,', 220, 26);
      doc.setFont('helvetica', 'bold');
      doc.text('Fiyono, S.T., M.M.', 220, 50);
      doc.setFont('helvetica', 'normal');
      doc.text('Kolonel Kal NRP 520336', 220, 55);
    } else {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(`Jakarta, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`, 220, finalY);
      doc.text('Waaslog Kaskoopsudnas,', 220, finalY + 6);
      doc.setFont('helvetica', 'bold');
      doc.text('Fiyono, S.T., M.M.', 220, finalY + 28);
      doc.setFont('helvetica', 'normal');
      doc.text('Kolonel Kal NRP 520336', 220, finalY + 33);
    }

    doc.save(`Rekapitulasi_Kehadiran_Koopsudnas_${Date.now()}.pdf`);
  },

  // COMPREHENSIVE READY-TO-PRINT MONTHLY REPORT FOR SUPERIORS (LAPORAN BULANAN SIAP CETAK)
  exportMonthlyAttendancePDF(
    personnelList: Personnel[],
    attendanceList: AttendanceRecord[],
    opts: MonthlyPDFOptions
  ) {
    const doc = new jsPDF('landscape', 'mm', 'a4');
    const monthName = MONTH_NAMES_ID[opts.month - 1];
    const monthStr = String(opts.month).padStart(2, '0');
    const prefixDate = `${opts.year}-${monthStr}`;

    // Filter attendance in that month
    const monthRecords = attendanceList.filter(a => a.tanggal && a.tanggal.startsWith(prefixDate));

    // Target personnel
    let targetPersonnel = personnelList.filter(p => p.status === 'aktif');
    if (opts.unit && opts.unit !== 'ALL') {
      targetPersonnel = targetPersonnel.filter(p => p.unit === opts.unit);
    }

    // Calculate aggregated attendance per personnel for the month
    const summaryRows = targetPersonnel.map((person, index) => {
      const records = monthRecords.filter(a => a.personnelId === person.id || a.personnelNrp === person.nrp);

      const countHadir = records.filter(r => r.statusKehadiran === 'Hadir').length;
      const countDL = records.filter(r => r.keteranganKode === 'DL').length;
      const countDK = records.filter(r => r.keteranganKode === 'DK').length;
      const countDIK = records.filter(r => r.keteranganKode === 'DIK').length;
      const countCT = records.filter(r => r.keteranganKode === 'CT').length;
      const countS = records.filter(r => r.keteranganKode === 'S').length;
      const countI = records.filter(r => r.keteranganKode === 'I').length;
      const countTP = records.filter(r => r.keteranganKode === 'TP').length;

      // Effective working days in military/office (approx 20-22 days or present count)
      const totalRecordedDinas = countHadir + countDL + countDK + countDIK;
      const totalOfficeDays = Math.max(records.length, 20);
      const persentase = totalOfficeDays > 0 ? Math.min(100, Math.round((totalRecordedDinas / totalOfficeDays) * 100)) : 100;

      return [
        index + 1,
        person.nrp,
        person.nama,
        person.pangkat,
        person.jabatan,
        person.unit,
        countHadir,
        countDL + countDK,
        countCT,
        countS,
        countI,
        countTP,
        `${persentase}%`,
        persentase >= 85 ? 'Memenuhi' : 'Perlu Evaluasi'
      ];
    });

    // 1. KOP SURAT RESMI KASKOOPSUDNAS
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('KOMANDO OPERASI UDARA NASIONAL', 20, 14);
    doc.text('STAF LOGISTIK', 20, 18);
    doc.setLineWidth(0.4);
    doc.line(20, 20, 85, 20);

    // Nomor Dokumen
    if (opts.docNumber) {
      doc.setFontSize(8);
      doc.text(opts.docNumber, 20, 24);
    }

    // Judul Dokumen
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('LAPORAN BULANAN REKAPITULASI KEHADIRAN PERSONEL', 148, 22, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`BULAN ${monthName.toUpperCase()} TAHUN ${opts.year}`, 148, 28, { align: 'center' });
    if (opts.unit && opts.unit !== 'ALL') {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(`UNIT / SUB-BIDANG: ${opts.unit.toUpperCase()}`, 148, 33, { align: 'center' });
    }

    // Garis Pemisah Ganda
    doc.setLineWidth(0.8);
    doc.line(14, 36, 282, 36);
    doc.setLineWidth(0.2);
    doc.line(14, 37.5, 282, 37.5);

    // 2. KOTAK RINGKASAN EKSEKUTIF (EXECUTIVE SUMMARY STATS)
    const totalStaff = targetPersonnel.length;
    const totalHadirGlobal = summaryRows.reduce((acc, r) => acc + (Number(r[6]) || 0), 0);
    const totalDinasLuarGlobal = summaryRows.reduce((acc, r) => acc + (Number(r[7]) || 0), 0);
    const totalCutiGlobal = summaryRows.reduce((acc, r) => acc + (Number(r[8]) || 0), 0);
    const totalSakitGlobal = summaryRows.reduce((acc, r) => acc + (Number(r[9]) || 0), 0);

    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, 40, 268, 14, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(30, 58, 138);
    doc.text(`Kekuatan Personel: ${totalStaff} Orang`, 20, 48);
    doc.setTextColor(5, 150, 105);
    doc.text(`Total Kehadiran Fisik: ${totalHadirGlobal} Transaksi`, 75, 48);
    doc.setTextColor(37, 99, 235);
    doc.text(`Dinas Luar/Khusus: ${totalDinasLuarGlobal}`, 145, 48);
    doc.setTextColor(217, 119, 6);
    doc.text(`Cuti Tahunan: ${totalCutiGlobal}`, 205, 48);
    doc.setTextColor(225, 29, 72);
    doc.text(`Sakit: ${totalSakitGlobal}`, 250, 48);
    doc.setTextColor(0, 0, 0);

    // 3. TABEL DATA MENGGUNAKAN AUTOTABLE DENGAN HEADER SPESIFIKASI MILITER
    autoTable(doc, {
      startY: 57,
      head: [
        [
          { content: 'No', rowSpan: 2, styles: { valign: 'middle', halign: 'center' } },
          { content: 'NRP/NIP', rowSpan: 2, styles: { valign: 'middle', halign: 'center' } },
          { content: 'Nama Lengkap', rowSpan: 2, styles: { valign: 'middle', halign: 'center' } },
          { content: 'Pangkat', rowSpan: 2, styles: { valign: 'middle', halign: 'center' } },
          { content: 'Jabatan Resmi', rowSpan: 2, styles: { valign: 'middle', halign: 'center' } },
          { content: 'Unit', rowSpan: 2, styles: { valign: 'middle', halign: 'center' } },
          { content: 'Rekapitulasi Kehadiran & Ketidakhadiran (Hari)', colSpan: 6, styles: { halign: 'center' } },
          { content: 'Tingkat Hadir', rowSpan: 2, styles: { valign: 'middle', halign: 'center' } },
          { content: 'Evaluasi', rowSpan: 2, styles: { valign: 'middle', halign: 'center' } }
        ],
        [
          { content: 'Hadir', styles: { halign: 'center' } },
          { content: 'DL/DK', styles: { halign: 'center' } },
          { content: 'CT', styles: { halign: 'center' } },
          { content: 'S', styles: { halign: 'center' } },
          { content: 'I', styles: { halign: 'center' } },
          { content: 'TP', styles: { halign: 'center' } }
        ]
      ],
      body: summaryRows,
      theme: 'grid',
      headStyles: {
        fillColor: [15, 23, 42], // Slate-900 / Navy
        textColor: 255,
        fontSize: 7.5,
        fontStyle: 'bold'
      },
      styles: {
        fontSize: 7.5,
        cellPadding: 1.8,
        valign: 'middle'
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 8 },
        1: { halign: 'center', cellWidth: 22, fontStyle: 'bold' },
        2: { cellWidth: 45, fontStyle: 'bold' },
        3: { cellWidth: 22 },
        4: { cellWidth: 50 },
        5: { cellWidth: 22 },
        6: { halign: 'center', cellWidth: 12 },
        7: { halign: 'center', cellWidth: 12 },
        8: { halign: 'center', cellWidth: 10 },
        9: { halign: 'center', cellWidth: 10 },
        10: { halign: 'center', cellWidth: 10 },
        11: { halign: 'center', cellWidth: 10 },
        12: { halign: 'center', cellWidth: 16, fontStyle: 'bold' },
        13: { halign: 'center', cellWidth: 19 }
      },
      margin: { left: 14, right: 14 },
      didDrawPage: (data) => {
        // Page footer numbering
        const str = `Dokumen Resmi Slog Koopsudnas • Halaman ${doc.getNumberOfPages()} • Klasifikasi: Terbatas`;
        doc.setFontSize(7.5);
        doc.setTextColor(120);
        doc.text(str, 14, doc.internal.pageSize.height - 8);
      }
    });

    // 4. LEMBAR PENGESAHAN & TANDA TANGAN ATASAN
    const finalTableY = (doc as any).lastAutoTable.finalY + 10;
    const pageHeight = doc.internal.pageSize.height;

    // Check if signature fits on current page
    let sigPage = doc;
    let sigY = finalTableY;

    if (finalTableY + 45 > pageHeight - 15) {
      doc.addPage();
      sigY = 25;
    }

    const todayIndo = new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    sigPage.setFont('helvetica', 'normal');
    sigPage.setFontSize(9);
    sigPage.setTextColor(0, 0, 0);

    // Keterangan Kode Singkat di Kiri Bawah
    sigPage.text('Keterangan Kode:', 14, sigY);
    sigPage.setFontSize(7.5);
    sigPage.setTextColor(70);
    sigPage.text('• DL: Dinas Luar  • DK: Dinas Khusus  • CT: Cuti Tahunan', 14, sigY + 5);
    sigPage.text('• S: Sakit (SKD)  • I: Izin Dinas     • TP: Tanpa Pemberitahuan', 14, sigY + 9);
    sigPage.text('• Validasi GPS: Radius Maksimal 3.000 Meter Kantor Slog Koopsudnas', 14, sigY + 13);

    // Tanda Tangan Atasan di Kanan Bawah
    sigPage.setFontSize(9);
    sigPage.setTextColor(0, 0, 0);
    sigPage.text(`Jakarta, ${todayIndo}`, 215, sigY);
    sigPage.text(opts.approverTitle + ',', 215, sigY + 5);

    sigPage.setFont('helvetica', 'bold');
    sigPage.text(opts.approverName, 215, sigY + 28);
    sigPage.setLineWidth(0.3);
    sigPage.line(215, sigY + 29, 275, sigY + 29);

    sigPage.setFont('helvetica', 'normal');
    sigPage.setFontSize(8.5);
    sigPage.text(`${opts.approverRank} NRP ${opts.approverNrp}`, 215, sigY + 34);

    // Save PDF
    const filename = `Laporan_Bulanan_Kehadiran_Slog_${monthName}_${opts.year}.pdf`;
    doc.save(filename);
  }
};
