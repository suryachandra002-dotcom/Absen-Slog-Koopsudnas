import React, { useState } from 'react';
import { 
  MapPin, 
  Check, 
  AlertCircle, 
  CheckCircle2, 
  Building2, 
  ShieldCheck,
  Compass,
  RotateCcw
} from 'lucide-react';
import { OfficeConfig } from '../types';

interface GpsSettingsModuleProps {
  office: OfficeConfig;
  onUpdateOffice: (config: Partial<OfficeConfig>) => Promise<void>;
  userRole: string;
}

export const GpsSettingsModule: React.FC<GpsSettingsModuleProps> = ({
  office,
  onUpdateOffice,
  userRole
}) => {
  const [formData, setFormData] = useState({
    namaKantor: office.namaKantor,
    lat: office.lat,
    lng: office.lng,
    radiusMaksimalMeter: office.radiusMaksimalMeter,
    akurasiThresholdMeter: office.akurasiThresholdMeter,
    alamat: office.alamat
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      await onUpdateOffice(formData);
      setSuccessMsg('Konfigurasi koordinat kantor dan radius GPS berhasil diperbarui.');
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menyimpan pengaturan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetDefault = () => {
    setFormData({
      namaKantor: 'Kantor Staf Logistik Koopsudnas',
      lat: -6.262500,
      lng: 106.891200,
      radiusMaksimalMeter: 3000,
      akurasiThresholdMeter: 100,
      alamat: 'Jl. Komodor Halim Perdanakusuma, Halim Perdanakusuma, Kec. Makasar, Jakarta Timur 13610'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <span className="p-2.5 rounded-xl bg-blue-50 text-blue-700 border border-blue-200">
            <MapPin className="w-5 h-5" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">
                Pengaturan Lokasi GPS Kantor & Radius Geofence
              </h2>
              <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                ADMIN
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Konfigurasi titik koordinat resmi kantor Staf Logistik Koopsudnas dan batas radius absensi 3 km
            </p>
          </div>
        </div>

        {successMsg && (
          <div className="mt-4 p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-900 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <div>{successMsg}</div>
          </div>
        )}

        {errorMsg && (
          <div className="mt-4 p-3.5 bg-rose-50 border border-rose-300 rounded-xl text-xs text-rose-900 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <div>{errorMsg}</div>
          </div>
        )}
      </div>

      {/* Form Settings */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="font-bold text-slate-700 mb-1 block">Nama Lokasi Kantor Resmi *</label>
            <input
              type="text"
              required
              value={formData.namaKantor}
              onChange={e => setFormData({ ...formData, namaKantor: e.target.value })}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-slate-700 mb-1 block">Titik Lintang (Latitude) *</label>
              <input
                type="number"
                step="0.000001"
                required
                value={formData.lat}
                onChange={e => setFormData({ ...formData, lat: parseFloat(e.target.value) })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Default Halim: -6.262500</span>
            </div>

            <div>
              <label className="font-bold text-slate-700 mb-1 block">Titik Bujur (Longitude) *</label>
              <input
                type="number"
                step="0.000001"
                required
                value={formData.lng}
                onChange={e => setFormData({ ...formData, lng: parseFloat(e.target.value) })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Default Halim: 106.891200</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-slate-700 mb-1 block">Radius Maksimal (Meter) *</label>
              <input
                type="number"
                required
                min="50"
                max="10000"
                value={formData.radiusMaksimalMeter}
                onChange={e => setFormData({ ...formData, radiusMaksimalMeter: parseInt(e.target.value, 10) })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-blue-900"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Ketentuan spesifikasi: 3.000 Meter (3 KM)
              </span>
            </div>

            <div>
              <label className="font-bold text-slate-700 mb-1 block">Ambang Akurasi GPS (Meter)</label>
              <input
                type="number"
                required
                value={formData.akurasiThresholdMeter}
                onChange={e => setFormData({ ...formData, akurasiThresholdMeter: parseInt(e.target.value, 10) })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Toleransi akurasi sinyal satelit: 100m</span>
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 mb-1 block">Alamat Fisik Kantor Staf Logistik</label>
            <textarea
              rows={2}
              value={formData.alamat}
              onChange={e => setFormData({ ...formData, alamat: e.target.value })}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={handleResetDefault}
              className="px-3 py-2 rounded-xl text-slate-500 hover:text-slate-800 font-semibold flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Standar Koopsudnas</span>
            </button>

            <button
              type="submit"
              disabled={isSubmitting || userRole !== 'admin'}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition disabled:opacity-50 flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Konfigurasi GPS'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
