import React, { useState } from 'react';
import { 
  Table, 
  FileSpreadsheet, 
  FileText, 
  Search, 
  Filter, 
  Calendar, 
  Printer, 
  Users, 
  CheckCircle2, 
  AlertCircle,
  X,
  FileCheck2,
  ChevronDown,
  Building2,
  ShieldCheck
} from 'lucide-react';
import { AttendanceRecord, Personnel } from '../types';
import { UNIT_OPTIONS } from '../data/initialPersonnel';
import { exportService, MONTH_NAMES_ID, MonthlyPDFOptions } from '../utils/exporter';

interface RecapModuleProps {
  attendanceList: AttendanceRecord[];
  personnelList: Personnel[];
  showReportsOnly?: boolean;
}

export const RecapModule: React.FC<RecapModuleProps> = ({
  attendanceList,
  personnelList,
  showReportsOnly = false
}) => {
  const [selectedUnit, setSelectedUnit] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  // Modal Cetak Laporan Bulanan PDF Siap Cetak
  const [showMonthlyPdfModal, setShowMonthlyPdfModal] = useState(false);
  const [pdfMonth, setPdfMonth] = useState<number>(new Date().getMonth() + 1); // 1-12
  const [pdfYear, setPdfYear] = useState<number>(new Date().getFullYear());
  const [pdfUnit, setPdfUnit] = useState('ALL');
  const [docNumber, setDocNumber] = useState(`Nomor: B/Lap-${new Date().getMonth() + 1}/X/${new Date().getFullYear()}/Slog`);

  // Pejabat Penandatangan Presets
  const SIGNATORY_PRESETS = [
    {
      label: 'Waaslog Kaskoopsudnas (Kolonel Kal Fiyono, S.T., M.M.)',
      title: 'Waaslog Kaskoopsudnas',
      name: 'Fiyono, S.T., M.M.',
      rank: 'Kolonel Kal',
      nrp: '520336'
    },
    {
      label: 'Paban I/Ren Slog (Kolonel Tek Agus Sutopo)',
      title: 'Paban I/Ren Slog Kaskoopsudnas',
      name: 'Agus Sutopo',
      rank: 'Kolonel Tek',
      nrp: '523371'
    },
    {
      label: 'Paban II/Kalmat Slog (Kolonel Kal Triningsih Malyati, S.E.)',
      title: 'Paban II/Kalmat Slog Kaskoopsudnas',
      name: 'Triningsih Malyati, S.E.',
      rank: 'Kolonel Kal',
      nrp: '520916'
    },
    {
      label: 'Paban III/Sista Slog (Kolonel Tek David Alwi)',
      title: 'Paban III/Sista Slog Kaskoopsudnas',
      name: 'David Alwi',
      rank: 'Kolonel Tek',
      nrp: '523376'
    },
    {
      label: 'Paban IV/Kons Slog (Kolonel Tum Andi Wijaya)',
      title: 'Paban IV/Kons Slog Kaskoopsudnas',
      name: 'Andi Wijaya',
      rank: 'Kolonel Tum',
      nrp: '525881'
    },
    {
      label: 'Paban V/BMN Slog (Kolonel Kal Xanthoniar Taufan Wijaya, S.T., M.EngMgt.)',
      title: 'Paban V/BMN Slog Kaskoopsudnas',
      name: 'Xanthoniar Taufan Wijaya, S.T., M.EngMgt.',
      rank: 'Kolonel Kal',
      nrp: '525098'
    },
    {
      label: 'Kataud Slog (Penata III C Ismaryadi)',
      title: 'Kataud Slog Kaskoopsudnas',
      name: 'Ismaryadi',
      rank: 'Penata III C',
      nrp: '196812191990031005'
    }
  ];

  const [selectedSignatoryIdx, setSelectedSignatoryIdx] = useState(0);
  const [customSignatory, setCustomSignatory] = useState({
    title: SIGNATORY_PRESETS[0].title,
    name: SIGNATORY_PRESETS[0].name,
    rank: SIGNATORY_PRESETS[0].rank,
    nrp: SIGNATORY_PRESETS[0].nrp
  });

  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const filteredList = attendanceList.filter(item => {
    const matchesUnit = selectedUnit === 'ALL' || item.unit === selectedUnit;
    const matchesStatus = selectedStatus === 'ALL' || item.statusKehadiran === selectedStatus;
    const matchesDate = !dateFilter || item.tanggal === dateFilter;
    const q = searchQuery.toLowerCase();
    const matchesSearch = 
      item.personnelNama.toLowerCase().includes(q) ||
      item.personnelNrp.toLowerCase().includes(q) ||
      item.personnelJabatan.toLowerCase().includes(q);

    return matchesUnit && matchesStatus && matchesDate && matchesSearch;
  });

  const handleExportExcel = () => {
    exportService.exportAttendanceToExcel(
      filteredList,
      `Rekap_Presensi_Slog_Koopsudnas_${dateFilter || 'Semua_Periode'}`
    );
  };

  const handleExportQuickPDF = () => {
    exportService.exportAttendanceToPDF(
      filteredList,
      `Rekapitulasi Kehadiran Personel Staf Logistik`
    );
  };

  const handleGenerateMonthlyPrintablePDF = () => {
    setIsGeneratingPdf(true);
    try {
      const opts: MonthlyPDFOptions = {
        month: pdfMonth,
        year: pdfYear,
        unit: pdfUnit,
        approverTitle: customSignatory.title,
        approverName: customSignatory.name,
        approverRank: customSignatory.rank,
        approverNrp: customSignatory.nrp,
        docNumber: docNumber.trim()
      };

      exportService.exportMonthlyAttendancePDF(personnelList, attendanceList, opts);
      setShowMonthlyPdfModal(false);
    } catch (err) {
      console.error('Gagal membuat PDF:', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-blue-50 text-blue-700 border border-blue-200">
              {showReportsOnly ? <FileSpreadsheet className="w-5 h-5" /> : <Table className="w-5 h-5" />}
            </span>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {showReportsOnly ? 'Laporan & Ekspor Kehadiran Resmi' : 'Rekapitulasi Kehadiran Personel'}
              </h2>
              <p className="text-xs text-slate-500">
                Laporan administratif kehadiran harian dan bulanan Staf Logistik Koopsudnas
              </p>
            </div>
          </div>

          {/* Action Buttons: Prominent Ready-to-Print PDF and Excel */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowMonthlyPdfModal(true)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-800 hover:from-blue-950 hover:to-indigo-950 text-white text-xs font-bold flex items-center gap-2 transition shadow-md hover:shadow-lg active:scale-98"
              title="Unduh laporan bulanan formal bertanda tangan atasan siap cetak"
            >
              <Printer className="w-4 h-4 text-cyan-400" />
              <span>Cetak Laporan Bulanan (PDF Siap Cetak)</span>
            </button>

            <button
              onClick={handleExportExcel}
              className="px-3 py-2 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 text-xs font-semibold flex items-center gap-1.5 transition"
              title="Ekspor data aktif ke format Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Ekspor Excel (.xlsx)</span>
            </button>

            <button
              onClick={handleExportQuickPDF}
              className="px-3 py-2 rounded-xl border border-blue-300 bg-blue-50 text-blue-800 hover:bg-blue-100 text-xs font-semibold flex items-center gap-1.5 transition"
              title="Ekspor cepat tabel aktif ke format PDF"
            >
              <FileText className="w-3.5 h-3.5 text-blue-600" />
              <span>Ekspor Cepat PDF</span>
            </button>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-slate-100">
          <div>
            <label className="text-[11px] font-bold text-slate-600 mb-1 block">Pencarian Personel</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Nama atau NRP..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-600 mb-1 block">Filter Tanggal Spesifik</label>
            <input
              type="date"
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value)}
              className="w-full py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-600 mb-1 block">Unit Kerja</label>
            <select
              value={selectedUnit}
              onChange={e => setSelectedUnit(e.target.value)}
              className="w-full py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs"
            >
              <option value="ALL">Semua Unit Kerja</option>
              {UNIT_OPTIONS.map(u => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-600 mb-1 block">Status Kehadiran</label>
            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              className="w-full py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
            >
              <option value="ALL">Semua Status</option>
              <option value="Hadir">Hadir</option>
              <option value="Cuti">Cuti (CT)</option>
              <option value="Dinas Luar">Dinas Luar (DL)</option>
              <option value="Dinas Khusus">Dinas Khusus (DK)</option>
              <option value="Izin">Izin (I)</option>
              <option value="Sakit">Sakit (S)</option>
              <option value="Pendidikan">Pendidikan (DIK)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Recap Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="text-xs font-bold text-slate-700">
            Hasil Rekapitulasi Presensi ({filteredList.length} Catatan Data)
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold">
                <th className="py-3 px-3 w-10 text-center">No</th>
                <th className="py-3 px-3">Tanggal</th>
                <th className="py-3 px-3">Personel</th>
                <th className="py-3 px-3">Pangkat & Jabatan</th>
                <th className="py-3 px-3">Unit</th>
                <th className="py-3 px-3 text-center">Jam Masuk</th>
                <th className="py-3 px-3 text-center">Jam Pulang</th>
                <th className="py-3 px-3 text-center">Jarak GPS</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3">Keterangan / Catatan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400 italic">
                    Tidak ditemukan data rekapitulasi kehadiran yang cocok dengan filter yang dipilih.
                  </td>
                </tr>
              ) : (
                filteredList.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-3 text-center text-slate-500 font-medium">
                      {idx + 1}
                    </td>

                    <td className="py-3 px-3 font-medium text-slate-800 whitespace-nowrap">
                      {item.tanggal}
                    </td>

                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900">{item.personnelNama}</div>
                      <div className="text-[11px] text-slate-500 font-mono">NRP: {item.personnelNrp}</div>
                    </td>

                    <td className="py-3 px-3">
                      <div className="font-semibold text-blue-900">{item.personnelPangkat}</div>
                      <div className="text-[11px] text-slate-600 truncate max-w-[200px]" title={item.personnelJabatan}>
                        {item.personnelJabatan}
                      </div>
                    </td>

                    <td className="py-3 px-3 font-medium text-slate-700 whitespace-nowrap">
                      {item.unit}
                    </td>

                    <td className="py-3 px-3 text-center font-mono font-bold text-emerald-800">
                      {item.jamMasuk ? `${item.jamMasuk} WIB` : '-'}
                    </td>

                    <td className="py-3 px-3 text-center font-mono font-bold text-blue-800">
                      {item.jamPulang ? `${item.jamPulang} WIB` : '-'}
                    </td>

                    <td className="py-3 px-3 text-center font-mono text-[11px]">
                      {item.jarakMasukMeter !== undefined ? `${item.jarakMasukMeter}m` : '-'}
                    </td>

                    <td className="py-3 px-3 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                        item.statusKehadiran === 'Hadir'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : item.statusKehadiran === 'Cuti'
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : 'bg-blue-100 text-blue-800 border border-blue-300'
                      }`}>
                        {item.statusKehadiran.toUpperCase()}
                      </span>
                    </td>

                    <td className="py-3 px-3 max-w-[180px] text-[11px] text-slate-600">
                      {item.isCorrected && (
                        <span className="bg-purple-100 text-purple-800 text-[9px] font-bold px-1.5 py-0.2 rounded mr-1">
                          KOREKSI
                        </span>
                      )}
                      <span className="truncate">{item.catatanKoreksi || '-'}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: PENGATURAN CETAK LAPORAN BULANAN (PDF SIAP CETAK) */}
      {showMonthlyPdfModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 text-xs animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto">
            {/* Header Modal */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-blue-100 text-blue-800">
                  <Printer className="w-5 h-5 text-blue-700" />
                </span>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">
                    Cetak Laporan Bulanan Kehadiran (PDF Siap Cetak)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Format resmi dokumen kedinasan Staf Logistik Koopsudnas dengan Kop & Tanda Tangan
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowMonthlyPdfModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
              {/* Periode Bulan & Tahun */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 mb-1 block">Bulan Laporan *</label>
                  <select
                    value={pdfMonth}
                    onChange={e => setPdfMonth(parseInt(e.target.value, 10))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {MONTH_NAMES_ID.map((name, idx) => (
                      <option key={idx} value={idx + 1}>{name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 mb-1 block">Tahun Laporan *</label>
                  <input
                    type="number"
                    value={pdfYear}
                    onChange={e => setPdfYear(parseInt(e.target.value, 10))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Unit Kerja Filter */}
              <div>
                <label className="font-bold text-slate-700 mb-1 block">Lingkup Unit / Sub-Bidang *</label>
                <select
                  value={pdfUnit}
                  onChange={e => setPdfUnit(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                >
                  <option value="ALL">Seluruh Bagian Staf Logistik (Paban I s.d V & Taud Slog)</option>
                  {UNIT_OPTIONS.map(u => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
              </div>

              {/* Nomor Surat / Dasar Dokumen */}
              <div>
                <label className="font-bold text-slate-700 mb-1 block">Nomor Register Dokumen Resmi</label>
                <input
                  type="text"
                  value={docNumber}
                  onChange={e => setDocNumber(e.target.value)}
                  placeholder="Contoh: Nomor: B/Lap-10/X/2026/Slog"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs"
                />
              </div>

              {/* Pejabat Penandatangan */}
              <div className="pt-3 border-t border-slate-100 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800 block">Pejabat yang Mengesahkan / Mengetahui</label>
                  <span className="text-[10px] text-blue-700 font-semibold">Tanda Tangan Resmi</span>
                </div>

                <div>
                  <label className="text-[11px] text-slate-500 block mb-1">Pilih Jabatan / Penandatangan:</label>
                  <select
                    value={selectedSignatoryIdx}
                    onChange={e => {
                      const idx = parseInt(e.target.value, 10);
                      setSelectedSignatoryIdx(idx);
                      const p = SIGNATORY_PRESETS[idx];
                      setCustomSignatory({
                        title: p.title,
                        name: p.name,
                        rank: p.rank,
                        nrp: p.nrp
                      });
                    }}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                  >
                    {SIGNATORY_PRESETS.map((p, idx) => (
                      <option key={idx} value={idx}>{p.label}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div>
                    <label className="text-[10px] text-slate-500 block">Nama Lengkap & Gelar:</label>
                    <input
                      type="text"
                      value={customSignatory.name}
                      onChange={e => setCustomSignatory({ ...customSignatory, name: e.target.value })}
                      className="w-full p-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-500 block">Pangkat / Korps:</label>
                    <input
                      type="text"
                      value={customSignatory.rank}
                      onChange={e => setCustomSignatory({ ...customSignatory, rank: e.target.value })}
                      className="w-full p-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-500 block">NRP / NIP:</label>
                    <input
                      type="text"
                      value={customSignatory.nrp}
                      onChange={e => setCustomSignatory({ ...customSignatory, nrp: e.target.value })}
                      className="w-full p-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-500 block">Jabatan Pengesah:</label>
                    <input
                      type="text"
                      value={customSignatory.title}
                      onChange={e => setCustomSignatory({ ...customSignatory, title: e.target.value })}
                      className="w-full p-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold"
                    />
                  </div>
                </div>
              </div>

              {/* Informational Box */}
              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-[11px] text-blue-950 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                  <span>Format Dokumen Standar Militer (A4 Landscape):</span>
                </div>
                <p className="text-slate-600">
                  Dokumen memuat Kop Resmi Koopsudnas, Kotak Ringkasan Eksekutif (Kekuatan Personel, Total Hadir, Cuti, Sakit, DL), Tabel Agregasi Presensi, Persentase Kehadiran, Nomor Halaman otomatis, dan Lembar Pengesahan.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowMonthlyPdfModal(false)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={handleGenerateMonthlyPrintablePDF}
                disabled={isGeneratingPdf}
                className="px-5 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold transition shadow-md flex items-center gap-2 active:scale-98 disabled:opacity-50"
              >
                <Printer className="w-4 h-4 text-cyan-300" />
                <span>{isGeneratingPdf ? 'Membuat Dokumen PDF...' : 'Unduh Dokumen PDF Siap Cetak'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
