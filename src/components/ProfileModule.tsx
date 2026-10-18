import React from 'react';
import { 
  User, 
  ShieldCheck, 
  Key, 
  Building2, 
  Clock, 
  CheckCircle2, 
  Calendar,
  LogOut
} from 'lucide-react';
import { UserAccount } from '../types';

interface ProfileModuleProps {
  currentUser: UserAccount;
  onLogout: () => void;
}

export const ProfileModule: React.FC<ProfileModuleProps> = ({
  currentUser,
  onLogout
}) => {
  return (
    <div className="space-y-6 max-w-3xl">
      {/* Profile Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row items-center gap-5">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-blue-900 to-blue-600 text-white flex items-center justify-center font-black text-2xl shadow-md border-2 border-white">
            {currentUser.nama.charAt(0)}
          </div>
          <div className="text-center sm:text-left">
            <h2 className="text-lg font-black text-slate-900">{currentUser.nama}</h2>
            <div className="text-blue-700 font-bold text-xs mt-0.5">{currentUser.pangkat}</div>
            <div className="text-slate-500 font-mono text-xs mt-0.5">NRP / NIP: {currentUser.username}</div>
            <div className="mt-2 flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-800 text-[11px] font-bold border border-blue-200">
                {currentUser.jabatan}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-bold border border-emerald-200">
                PERAN: {currentUser.role.toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Account Details & Security Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3 text-xs">
          <div className="font-bold text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
            <Building2 className="w-4 h-4 text-blue-600" />
            <span>Informasi Kesatuan & Hak Akses</span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Instansi:</span>
              <span className="font-semibold text-slate-900 text-right">Staf Logistik Koopsudnas</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Mabes:</span>
              <span className="font-semibold text-slate-900 text-right">TNI Angkatan Udara</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Zona Waktu:</span>
              <span className="font-semibold text-blue-800 text-right">Asia/Jakarta (UTC+07:00)</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Hak Akses:</span>
              <span className="font-bold text-slate-900 capitalize">{currentUser.role}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3 text-xs">
          <div className="font-bold text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Keamanan & Integritas Sesi</span>
          </div>
          <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200 text-blue-950 text-[11px] space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
              <span>Ketentuan Hak Akses Sistem:</span>
            </div>
            <p>
              • <strong>Akses Terbuka Personel:</strong> Semua personel dapat langsung menggunakan seluruh modul presensi, kalender, rekap, permohonan keterangan, dan laporan tanpa sandi.
            </p>
            <p>
              • <strong>Administrator Khusus:</strong> Konfigurasi sistem dan parameter GPS kantor dikhususkan untuk akun dengan User ID: <code className="font-bold">admin</code> dan Kata Sandi: <code className="font-bold">admin</code>.
            </p>
          </div>

          <div className="pt-2">
            <button
              onClick={onLogout}
              className="w-full py-2 px-3 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold transition flex items-center justify-center gap-2 border border-rose-200"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Ganti Akun / Keluar Sesi</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
