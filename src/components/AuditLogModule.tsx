import React, { useState } from 'react';
import { 
  ShieldAlert, 
  Search, 
  Filter, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle,
  FileSpreadsheet
} from 'lucide-react';
import { AuditLog } from '../types';
import * as XLSX from 'xlsx';

interface AuditLogModuleProps {
  logs: AuditLog[];
}

export const AuditLogModule: React.FC<AuditLogModuleProps> = ({ logs }) => {
  const [search, setSearch] = useState('');
  const [filterAction, setFilterAction] = useState('ALL');

  const filteredLogs = logs.filter(log => {
    const matchesAction = filterAction === 'ALL' || log.tindakan.includes(filterAction);
    const q = search.toLowerCase();
    const matchesSearch = 
      log.actorNama.toLowerCase().includes(q) ||
      log.tindakan.toLowerCase().includes(q) ||
      log.target.toLowerCase().includes(q) ||
      log.detail.toLowerCase().includes(q);

    return matchesAction && matchesSearch;
  });

  const handleExportExcel = () => {
    const rows = [
      ['AUDIT LOG SISTEM DATA KEHADIRAN STAF LOGISTIK KOOPSUDNAS'],
      [`Waktu Cetak: ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB`],
      [''],
      ['No', 'Waktu Server (WIB)', 'Pelaku (Actor)', 'Peran', 'Tindakan', 'Target Objek', 'Detail Tindakan', 'Status']
    ];

    filteredLogs.forEach((l, i) => {
      rows.push([
        String(i + 1),
        l.timestamp,
        l.actorNama,
        l.actorRole,
        l.tindakan,
        l.target,
        l.detail,
        l.status
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Audit_Log');
    XLSX.writeFile(wb, `Audit_Log_Slog_Koopsudnas_${Date.now()}.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
              <ShieldAlert className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">
                  Audit Log & Integritas Rekam Jejak Sistem
                </h2>
                <span className="bg-slate-100 text-slate-700 text-[10px] font-mono px-2 py-0.5 rounded-full font-bold">
                  APPEND-ONLY
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Catatan kronologis seluruh tindakan penting, presensi GPS, perubahan data personel, persetujuan, dan auto-purge pengumuman
              </p>
            </div>
          </div>

          <button
            onClick={handleExportExcel}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition self-start sm:self-auto"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Ekspor Audit Log (.xlsx)</span>
          </button>
        </div>

        {/* Filter Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-slate-100 mt-4">
          <div className="sm:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Cari aktor, tindakan, atau detail peristiwa audit..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <select
              value={filterAction}
              onChange={e => setFilterAction(e.target.value)}
              className="w-full py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs"
            >
              <option value="ALL">Semua Kategori Tindakan</option>
              <option value="ABSEN">Absensi GPS (Masuk/Pulang)</option>
              <option value="PERSONEL">Data Personel (Tambah/Ubah/Arsip)</option>
              <option value="PENGUMUMAN">Pengumuman & Auto-purge FIFO</option>
              <option value="IZIN">Pengajuan & Persetujuan Izin</option>
              <option value="KOREKSI">Koreksi Absensi</option>
              <option value="GPS">Pengaturan Lokasi GPS</option>
            </select>
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="text-xs font-bold text-slate-700">
            Jejak Rekam Aktivitas ({filteredLogs.length} Catatan)
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold">
                <th className="py-3 px-3 w-10 text-center">No</th>
                <th className="py-3 px-3">Waktu Server (WIB)</th>
                <th className="py-3 px-3">Pelaku (Aktor)</th>
                <th className="py-3 px-3">Tindakan</th>
                <th className="py-3 px-3">Objek / Target</th>
                <th className="py-3 px-3">Detail Peristiwa</th>
                <th className="py-3 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 italic">
                    Tidak ditemukan rekaman log yang cocok.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log, idx) => (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition font-mono text-[11px]">
                    <td className="py-2.5 px-3 text-center text-slate-400 font-sans">
                      {idx + 1}
                    </td>

                    <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">
                      {log.timestamp.replace('T', ' ').substring(0, 19)}
                    </td>

                    <td className="py-2.5 px-3 font-sans">
                      <div className="font-bold text-slate-900">{log.actorNama}</div>
                      <div className="text-[10px] text-slate-500 uppercase">{log.actorRole}</div>
                    </td>

                    <td className="py-2.5 px-3 font-bold text-blue-900">
                      {log.tindakan}
                    </td>

                    <td className="py-2.5 px-3 text-slate-800 font-sans">
                      {log.target}
                    </td>

                    <td className="py-2.5 px-3 text-slate-600 font-sans max-w-xs">
                      <div className="truncate" title={log.detail}>
                        {log.detail}
                      </div>
                    </td>

                    <td className="py-2.5 px-3 text-center font-sans">
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] ${
                        log.status === 'SUCCESS'
                          ? 'bg-emerald-100 text-emerald-800'
                          : log.status === 'WARNING'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
