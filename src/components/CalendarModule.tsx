import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Filter, 
  Users, 
  Clock, 
  CheckCircle2, 
  MapPin, 
  FileSpreadsheet,
  FileText
} from 'lucide-react';
import { AttendanceRecord, Personnel } from '../types';
import { exportService } from '../utils/exporter';

interface CalendarModuleProps {
  attendanceList: AttendanceRecord[];
  personnelList: Personnel[];
}

export const CalendarModule: React.FC<CalendarModuleProps> = ({
  attendanceList,
  personnelList
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedPersonnelId, setSelectedPersonnelId] = useState('ALL');
  const [selectedDateDetails, setSelectedDateDetails] = useState<string | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-based

  // Calendar calculations
  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Filter attendance by personnel if selected
  const filteredAttendance = attendanceList.filter(a => {
    if (selectedPersonnelId === 'ALL') return true;
    return a.personnelId === selectedPersonnelId || a.personnelNrp === selectedPersonnelId;
  });

  const getDayAttendance = (day: number) => {
    const dayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return filteredAttendance.filter(a => a.tanggal === dayStr);
  };

  const selectedDayRecords = selectedDateDetails 
    ? filteredAttendance.filter(a => a.tanggal === selectedDateDetails)
    : [];

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-blue-50 text-blue-700 border border-blue-200">
              <CalendarIcon className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Kalender Kehadiran Staf Logistik Koopsudnas
              </h2>
              <p className="text-xs text-slate-500">
                Pemantauan jadwal kerja dinas, cuti, izin, dan rekap kehadiran bulanan
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => exportService.exportAttendanceToExcel(filteredAttendance, `Kalender_Kehadiran_${monthNames[month]}_${year}`)}
              className="px-3 py-2 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Ekspor Excel</span>
            </button>
            <button
              onClick={() => exportService.exportAttendanceToPDF(filteredAttendance, `Laporan Kehadiran ${monthNames[month]} ${year}`)}
              className="px-3 py-2 rounded-xl border border-blue-300 bg-blue-50 text-blue-800 hover:bg-blue-100 text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <FileText className="w-3.5 h-3.5 text-blue-600" />
              <span>Ekspor PDF</span>
            </button>
          </div>
        </div>

        {/* Month Navigator & Personnel Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-black text-slate-800 min-w-[150px] text-center">
              {monthNames[month]} {year}
            </span>
            <button
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Filter Personel:</span>
            <select
              value={selectedPersonnelId}
              onChange={e => setSelectedPersonnelId(e.target.value)}
              className="py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
            >
              <option value="ALL">Seluruh Personel (26 Anggota)</option>
              {personnelList.map(p => (
                <option key={p.id} value={p.id}>
                  {p.pangkat} {p.nama}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Days of week header */}
        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-center text-xs font-bold py-2.5">
          <div className="text-rose-600">Minggu</div>
          <div className="text-slate-700">Senin</div>
          <div className="text-slate-700">Selasa</div>
          <div className="text-slate-700">Rabu</div>
          <div className="text-slate-700">Kamis</div>
          <div className="text-slate-700">Jumat</div>
          <div className="text-blue-600">Sabtu</div>
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 auto-rows-[90px] divide-x divide-y divide-slate-100 text-xs">
          {/* Empty cells before month start */}
          {Array.from({ length: firstDayIndex }).map((_, i) => (
            <div key={`empty-${i}`} className="bg-slate-50/40 p-1.5" />
          ))}

          {/* Actual days */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const records = getDayAttendance(day);
            const dayDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isToday = new Date().toISOString().split('T')[0] === dayDateStr;
            const isSelected = selectedDateDetails === dayDateStr;

            const presentCount = records.filter(r => r.statusKehadiran === 'Hadir').length;
            const leaveCount = records.filter(r => r.statusKehadiran !== 'Hadir' && r.statusKehadiran !== 'Belum Absen').length;

            return (
              <div
                key={day}
                onClick={() => setSelectedDateDetails(dayDateStr)}
                className={`p-1.5 flex flex-col justify-between cursor-pointer transition hover:bg-blue-50/50 ${
                  isSelected ? 'bg-blue-50/80 ring-2 ring-blue-500 z-10' : ''
                } ${isToday ? 'bg-amber-50/40' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-xs ${
                    isToday ? 'bg-blue-600 text-white' : 'text-slate-700'
                  }`}>
                    {day}
                  </span>
                  {records.length > 0 && (
                    <span className="text-[10px] text-slate-400 font-mono">
                      {records.length} data
                    </span>
                  )}
                </div>

                <div className="space-y-0.5 my-auto">
                  {presentCount > 0 && (
                    <div className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center justify-between">
                      <span>Hadir</span>
                      <span>{presentCount}</span>
                    </div>
                  )}
                  {leaveCount > 0 && (
                    <div className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold flex items-center justify-between">
                      <span>Izin/CT/DL</span>
                      <span>{leaveCount}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Date Details Drilldown Panel */}
      {selectedDateDetails && (
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                <span>Rincian Presensi Tanggal {selectedDateDetails}</span>
              </h3>
              <p className="text-xs text-slate-500">
                {selectedDayRecords.length} personel tercatat pada tanggal ini
              </p>
            </div>
            <button
              onClick={() => setSelectedDateDetails(null)}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800"
            >
              Tutup Rincian
            </button>
          </div>

          <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto">
            {selectedDayRecords.length === 0 ? (
              <div className="py-6 text-center text-slate-400 text-xs italic">
                Tidak ada data presensi tercatat untuk tanggal ini.
              </div>
            ) : (
              selectedDayRecords.map(rec => (
                <div key={rec.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-slate-900">{rec.personnelNama}</div>
                    <div className="text-[11px] text-slate-500">{rec.personnelPangkat} • NRP: {rec.personnelNrp} • {rec.unit}</div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-blue-700">{rec.statusKehadiran}</span>
                    <div className="text-[11px] text-slate-500 font-mono">
                      {rec.jamMasuk ? `Masuk: ${rec.jamMasuk}` : '-'} | {rec.jamPulang ? `Pulang: ${rec.jamPulang}` : '-'}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
