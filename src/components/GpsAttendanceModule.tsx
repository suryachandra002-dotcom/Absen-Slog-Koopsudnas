import React, { useState, useEffect, useRef } from 'react';
import { 
  Crosshair, 
  MapPin, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Compass, 
  Navigation, 
  RefreshCw, 
  ShieldCheck, 
  Info,
  Building2,
  SlidersHorizontal,
  Users
} from 'lucide-react';
import { OfficeConfig, UserAccount, AttendanceRecord, Personnel } from '../types';

interface GpsAttendanceModuleProps {
  office: OfficeConfig;
  currentUser: UserAccount;
  allPersonnel: Personnel[];
  allAttendanceRecords: AttendanceRecord[];
  todayRecord?: AttendanceRecord;
  onRecordAttendance: (type: 'masuk' | 'pulang', lat: number, lng: number, isSimulated: boolean, targetPersonnelId?: string) => Promise<{ success: boolean; message: string; time: string; distanceMeters: number }>;
}

export const GpsAttendanceModule: React.FC<GpsAttendanceModuleProps> = ({
  office,
  currentUser,
  allPersonnel,
  allAttendanceRecords,
  todayRecord,
  onRecordAttendance
}) => {
  const [selectedPersonnelId, setSelectedPersonnelId] = useState<string>(
    currentUser.personnelId || (allPersonnel[0]?.id || '')
  );
  const [deviceLat, setDeviceLat] = useState<number | null>(null);
  const [deviceLng, setDeviceLng] = useState<number | null>(null);
  const [deviceAccuracy, setDeviceAccuracy] = useState<number | null>(null);
  const [distanceMeters, setDistanceMeters] = useState<number | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Simulation mode for testing (Inside radius vs Outside radius)
  const [isSimulated, setIsSimulated] = useState(false);
  const [simScenario, setSimScenario] = useState<'inside' | 'outside'>('inside');

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const circleLayerRef = useRef<any>(null);
  const userMarkerRef = useRef<any>(null);

  // Haversine calculation for frontend display
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3;
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
  };

  // Get real device location from navigator.geolocation
  const detectLocation = () => {
    setIsLocating(true);
    setGpsError(null);

    if (isSimulated) {
      // Use simulation coordinates
      if (simScenario === 'inside') {
        // ~450 meters from office
        const lat = office.lat + 0.0028;
        const lng = office.lng + 0.0031;
        setDeviceLat(lat);
        setDeviceLng(lng);
        setDeviceAccuracy(15);
        const dist = calculateDistance(lat, lng, office.lat, office.lng);
        setDistanceMeters(dist);
      } else {
        // ~6.5 km from office (Outside 3 km)
        const lat = office.lat + 0.0450;
        const lng = office.lng + 0.0420;
        setDeviceLat(lat);
        setDeviceLng(lng);
        setDeviceAccuracy(25);
        const dist = calculateDistance(lat, lng, office.lat, office.lng);
        setDistanceMeters(dist);
      }
      setIsLocating(false);
      return;
    }

    if (!navigator.geolocation) {
      setGpsError('Peramban Anda tidak mendukung sensor Geolocation.');
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      pos => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setDeviceLat(lat);
        setDeviceLng(lng);
        setDeviceAccuracy(Math.round(pos.coords.accuracy));
        const dist = calculateDistance(lat, lng, office.lat, office.lng);
        setDistanceMeters(dist);
        setIsLocating(false);
      },
      err => {
        let msg = 'Lokasi belum dapat diverifikasi. Aktifkan layanan lokasi dan coba kembali.';
        if (err.code === 1) msg = 'Izin akses lokasi ditolak oleh pengguna/browser. Mohon aktifkan izin GPS.';
        if (err.code === 2) msg = 'Posisi GPS tidak dapat diperoleh. Pastikan sinyal GPS atau WiFi aktif.';
        if (err.code === 3) msg = 'Waktu permintaan lokasi habis (timeout). Silakan coba kembali.';
        setGpsError(msg);
        setIsLocating(false);

        // Fallback to simulation option
        setIsSimulated(true);
        const lat = office.lat + 0.0025;
        const lng = office.lng + 0.0025;
        setDeviceLat(lat);
        setDeviceLng(lng);
        setDeviceAccuracy(12);
        setDistanceMeters(calculateDistance(lat, lng, office.lat, office.lng));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  useEffect(() => {
    detectLocation();
  }, [isSimulated, simScenario, office.lat, office.lng]);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    const L = (window as any).L;
    if (!L) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current).setView([office.lat, office.lng], 13);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap kontributor'
      }).addTo(map);

      // Office Marker (Custom Blue Flag)
      const officeIcon = L.divIcon({
        className: 'office-icon',
        html: `
          <div style="background:#1e3a8a;color:white;padding:6px;border-radius:10px;border:2px solid white;box-shadow:0 4px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:10px;">
            🏢 KANTOR SLOG
          </div>
        `,
        iconSize: [95, 30],
        iconAnchor: [47, 15]
      });

      L.marker([office.lat, office.lng], { icon: officeIcon })
        .addTo(map)
        .bindPopup(`<b>${office.namaKantor}</b><br/>Titik Acuan Absensi Resmi Koopsudnas`);

      // 3 KM Radius Geofence Circle
      const circle = L.circle([office.lat, office.lng], {
        color: '#2563eb',
        fillColor: '#3b82f6',
        fillOpacity: 0.15,
        radius: office.radiusMaksimalMeter,
        weight: 2,
        dashArray: '6, 6'
      }).addTo(map);

      circle.bindTooltip(`Batas Radius Absensi: ${office.radiusMaksimalMeter / 1000} KM`, { permanent: false });

      circleLayerRef.current = circle;
      mapInstanceRef.current = map;
    }

    // Update User Position Marker
    if (mapInstanceRef.current && deviceLat !== null && deviceLng !== null) {
      const map = mapInstanceRef.current;
      const isWithin = (distanceMeters || 0) <= office.radiusMaksimalMeter;

      if (userMarkerRef.current) {
        map.removeLayer(userMarkerRef.current);
      }

      const userIcon = L.divIcon({
        className: 'user-icon',
        html: `
          <div style="background:${isWithin ? '#059669' : '#dc2626'};color:white;padding:5px 8px;border-radius:20px;border:2px solid white;box-shadow:0 4px 8px rgba(0,0,0,0.4);font-weight:bold;font-size:10px;display:flex;align-items:center;gap:4px;">
            <div style="width:8px;height:8px;background:white;border-radius:50%;"></div>
            POSISI ANDA (${distanceMeters}m)
          </div>
        `,
        iconSize: [120, 26],
        iconAnchor: [60, 13]
      });

      userMarkerRef.current = L.marker([deviceLat, deviceLng], { icon: userIcon }).addTo(map);

      // Fit bounds to show both office and user
      const bounds = L.latLngBounds([
        [office.lat, office.lng],
        [deviceLat, deviceLng]
      ]);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  }, [office, deviceLat, deviceLng, distanceMeters]);

  // Handle Attendance Action (Masuk / Pulang)
  const handleSubmitAttendance = async (type: 'masuk' | 'pulang') => {
    if (deviceLat === null || deviceLng === null) {
      setFeedback({
        type: 'error',
        message: 'Lokasi belum dapat diverifikasi. Aktifkan layanan lokasi dan coba kembali.'
      });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    try {
      const res = await onRecordAttendance(type, deviceLat, deviceLng, isSimulated, selectedPersonnelId);
      setFeedback({
        type: 'success',
        message: `${res.message} (Pukul ${res.time} WIB)`
      });
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Gagal menyimpan absensi.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle instant office attendance (fallback for indoor signal loss)
  const handleOfficeInstantAttendance = async (type: 'masuk' | 'pulang') => {
    setIsSubmitting(true);
    setFeedback(null);
    try {
      const officeLat = office.lat + 0.0018;
      const officeLng = office.lng + 0.0015;
      setDeviceLat(officeLat);
      setDeviceLng(officeLng);
      setDeviceAccuracy(10);
      setDistanceMeters(200);
      const res = await onRecordAttendance(type, officeLat, officeLng, true, selectedPersonnelId);
      setFeedback({
        type: 'success',
        message: `${res.message} (Pukul ${res.time} WIB)`
      });
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Gagal menyimpan absensi.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isWithinRadius = distanceMeters !== null && distanceMeters <= office.radiusMaksimalMeter;

  return (
    <div className="space-y-6">
      {/* Top Banner / Status Overview */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-blue-50 text-blue-700">
                <Crosshair className="w-5 h-5 text-blue-700" />
              </span>
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Modul Absensi Geofencing GPS (Radius 3 KM)
                </h2>
                <p className="text-xs text-slate-500">
                  Validasi lokasi waktu-nyata dan timestamp resmi Asia/Jakarta (WIB)
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Refresh GPS Button */}
            <button
              onClick={detectLocation}
              disabled={isLocating}
              className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin text-blue-600' : ''}`} />
              <span>{isLocating ? 'Memindai GPS...' : 'Pindai Ulang Lokasi'}</span>
            </button>

            {/* Test Location Simulator Toggle */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
              <button
                onClick={() => {
                  setIsSimulated(false);
                  detectLocation();
                }}
                className={`px-2.5 py-1 rounded-lg font-medium transition ${!isSimulated ? 'bg-white text-blue-900 shadow-2xs font-bold' : 'text-slate-600'}`}
              >
                GPS Asli Perangkat
              </button>

              <button
                onClick={() => {
                  setIsSimulated(true);
                  setSimScenario('inside');
                }}
                className={`px-2.5 py-1 rounded-lg font-medium transition ${isSimulated && simScenario === 'inside' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-600'}`}
              >
                Uji: Di Dalam 3 KM
              </button>

              <button
                onClick={() => {
                  setIsSimulated(true);
                  setSimScenario('outside');
                }}
                className={`px-2.5 py-1 rounded-lg font-medium transition ${isSimulated && simScenario === 'outside' ? 'bg-rose-600 text-white font-bold' : 'text-slate-600'}`}
              >
                Uji: Di Luar 3 KM
              </button>
            </div>
          </div>
        </div>

        {/* Status Alert Messages */}
        {feedback && (
          <div className={`mt-4 p-4 rounded-xl border text-xs flex items-start gap-3 ${
            feedback.type === 'success' 
              ? 'bg-emerald-50 border-emerald-300 text-emerald-950' 
              : 'bg-rose-50 border-rose-300 text-rose-950'
          }`}>
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            )}
            <div>
              <div className="font-bold text-sm">
                {feedback.type === 'success' ? 'Perekaman Absensi Berhasil' : 'Absensi Ditolak'}
              </div>
              <div className="mt-0.5">{feedback.message}</div>
            </div>
          </div>
        )}

        {gpsError && (
          <div className="mt-4 p-3.5 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-900 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Pemberitahuan Sensor GPS: </span>
              {gpsError}
              <div className="mt-1 text-[11px] text-amber-800">
                Mode simulasi koordinat telah diaktifkan otomatis agar Anda tetap dapat menguji modul ini secara penuh.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Grid: Interactive Map + Action Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left (2 cols): Leaflet Radar Map */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-blue-600" />
              <h3 className="font-bold text-slate-800 text-xs">
                Peta Radar Geofence Radius 3.000 Meter
              </h3>
            </div>
            <div className="text-[11px] font-mono text-slate-500">
              Titik Pusat: {office.lat.toFixed(4)}, {office.lng.toFixed(4)}
            </div>
          </div>

          {/* Map Canvas */}
          <div 
            ref={mapContainerRef} 
            className="w-full h-[400px] z-10 bg-slate-100"
          />

          {/* Map Footer Bar with Distance & Status */}
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-4">
              <div>
                <span className="text-slate-400 block text-[10px]">JARAK KE KANTOR:</span>
                <span className="text-base font-black text-slate-900">
                  {distanceMeters !== null ? `${distanceMeters.toLocaleString('id-ID')} Meter` : 'Menghitung...'}
                </span>
                {distanceMeters !== null && (
                  <span className="text-[11px] text-slate-500 ml-1">
                    ({(distanceMeters / 1000).toFixed(2)} km)
                  </span>
                )}
              </div>

              <div className="h-8 w-px bg-slate-200" />

              <div>
                <span className="text-slate-400 block text-[10px]">STATUS RADIUS:</span>
                <span className={`inline-flex items-center gap-1 font-black px-2.5 py-0.5 rounded-full text-xs ${
                  isWithinRadius 
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                    : 'bg-rose-100 text-rose-800 border border-rose-300'
                }`}>
                  {isWithinRadius ? '✓ DALAM RADIUS (DIIZINKAN)' : '✕ DI LUAR RADIUS (DITOLAK)'}
                </span>
              </div>
            </div>

            <div className="text-[11px] text-slate-500">
              Akurasi GPS Perangkat: <span className="font-mono font-bold text-slate-800">{deviceAccuracy ? `±${deviceAccuracy}m` : '-'}</span>
            </div>
          </div>
        </div>

        {/* Right (1 col): Check-in / Check-out Execution Panel */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          {/* Active Target Personnel for Attendance */}
          {(() => {
            const activePersonnel = allPersonnel.find(p => p.id === selectedPersonnelId) || allPersonnel[0] || {
              id: currentUser.personnelId || 'PERS-001',
              nama: currentUser.nama,
              pangkat: currentUser.pangkat,
              nrp: currentUser.username,
              jabatan: currentUser.jabatan,
              unit: 'Slog'
            };

            const activeTodayRecord = allAttendanceRecords.find(
              a => (a.personnelId === activePersonnel.id || a.personnelNrp === activePersonnel.nrp) &&
                   a.tanggal === new Date().toISOString().split('T')[0]
            ) || todayRecord;

            return (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-blue-700" />
                    <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                      Presensi Personel
                    </h3>
                  </div>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-300">
                    AKSES TERBUKA
                  </span>
                </div>

                {/* Quick Personnel Selector Dropdown for Fast Presence */}
                <div className="p-3 bg-blue-50/80 rounded-2xl border border-blue-200 space-y-1.5">
                  <label className="text-[11px] font-bold text-blue-950 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-blue-700" />
                      <span>Pilih Personel yang Melaksanakan Presensi:</span>
                    </span>
                    <span className="text-[10px] text-blue-700 bg-white px-2 py-0.5 rounded-full border border-blue-200 font-semibold">
                      26 Personel
                    </span>
                  </label>
                  <select
                    value={selectedPersonnelId}
                    onChange={e => setSelectedPersonnelId(e.target.value)}
                    className="w-full p-2 bg-white border border-blue-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
                  >
                    {allPersonnel.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.pangkat} {p.nama} (NRP: {p.nrp})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Selected Personnel Identity Card */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                  <div className="font-bold text-slate-900 text-sm">{activePersonnel.nama}</div>
                  <div className="text-slate-600 font-medium">{activePersonnel.pangkat} • {activePersonnel.jabatan}</div>
                  <div className="text-[11px] text-slate-500 font-mono">NRP: {activePersonnel.nrp}</div>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-200 text-blue-950">
                    <div className="font-bold flex items-center justify-between mb-1">
                      <span>Absen Masuk:</span>
                      <span className="font-mono text-xs font-bold text-blue-700">
                        {activeTodayRecord?.jamMasuk ? `${activeTodayRecord.jamMasuk} WIB` : 'Belum Absen'}
                      </span>
                    </div>
                    <div className="text-[11px] text-blue-800">
                      {activeTodayRecord?.jamMasuk 
                        ? `Tercatat pada jarak ${activeTodayRecord.jarakMasukMeter || 0}m dari kantor.` 
                        : 'Perekaman waktu jam dinas pagi.'}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800">
                    <div className="font-bold flex items-center justify-between mb-1">
                      <span>Absen Pulang:</span>
                      <span className="font-mono text-xs font-bold text-blue-700">
                        {activeTodayRecord?.jamPulang ? `${activeTodayRecord.jamPulang} WIB` : 'Belum Absen'}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {activeTodayRecord?.jamPulang 
                        ? `Tercatat pada jarak ${activeTodayRecord.jarakPulangMeter || 0}m dari kantor.` 
                        : 'Perekaman waktu saat jam dinas berakhir.'}
                    </div>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  {/* Button Absen Masuk */}
                  <button
                    onClick={() => handleSubmitAttendance('masuk')}
                    disabled={isSubmitting || Boolean(activeTodayRecord?.jamMasuk)}
                    className={`w-full py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition ${
                      activeTodayRecord?.jamMasuk
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white active:scale-98'
                    }`}
                  >
                    <Clock className="w-4 h-4" />
                    <span>
                      {activeTodayRecord?.jamMasuk ? 'SUDAH ABSEN MASUK' : `ABSEN MASUK: ${activePersonnel.nama.split(',')[0].substring(0, 15)}`}
                    </span>
                  </button>

                  {/* Button Absen Pulang */}
                  <button
                    onClick={() => handleSubmitAttendance('pulang')}
                    disabled={isSubmitting || !activeTodayRecord?.jamMasuk || Boolean(activeTodayRecord?.jamPulang)}
                    className={`w-full py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition ${
                      !activeTodayRecord?.jamMasuk
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                        : activeTodayRecord?.jamPulang
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                        : 'bg-blue-600 hover:bg-blue-700 text-white active:scale-98'
                    }`}
                  >
                    <Clock className="w-4 h-4" />
                    <span>
                      {activeTodayRecord?.jamPulang 
                        ? 'SUDAH ABSEN PULANG' 
                        : activeTodayRecord?.jamMasuk 
                        ? `ABSEN PULANG: ${activePersonnel.nama.split(',')[0].substring(0, 15)}` 
                        : 'ABSEN PULANG (KUNCI)'}
                    </span>
                  </button>

                  {/* Indoor Office Fallback Button */}
                  <div className="pt-2 border-t border-slate-100">
                    <div className="text-[10px] text-slate-500 mb-1 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-blue-600" />
                      <span>Sinyal GPS lemah di dalam gedung Slog?</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleOfficeInstantAttendance('masuk')}
                        disabled={isSubmitting || Boolean(activeTodayRecord?.jamMasuk)}
                        className="py-1.5 px-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-[10px] font-bold transition disabled:opacity-40"
                      >
                        Presensi Masuk (Kantor)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOfficeInstantAttendance('pulang')}
                        disabled={isSubmitting || !activeTodayRecord?.jamMasuk || Boolean(activeTodayRecord?.jamPulang)}
                        className="py-1.5 px-2 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-300 rounded-lg text-[10px] font-bold transition disabled:opacity-40"
                      >
                        Presensi Pulang (Kantor)
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          <div className="pt-4 border-t border-slate-100 text-[11px] text-slate-500 space-y-1">
            <div className="flex items-center gap-1.5 text-slate-700 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>Integritas Waktu Server</span>
            </div>
            <p>
              Waktu absensi resmi ditetapkan oleh server (WIB Asia/Jakarta) dan tidak dapat dimanipulasi melalui jam perangkat.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
