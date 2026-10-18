import React, { useState } from 'react';
import { 
  Lock, 
  User, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  Building2, 
  Clock, 
  MapPin,
  ArrowRight,
  Users,
  Search,
  KeyRound,
  Sparkles
} from 'lucide-react';
import { UserAccount, Personnel } from '../types';
import { INITIAL_PERSONNEL } from '../data/initialPersonnel';

interface LoginModuleProps {
  onLoginSuccess: (user: UserAccount) => void;
  availableUsers: UserAccount[];
  allPersonnel?: Personnel[];
}

export const LoginModule: React.FC<LoginModuleProps> = ({
  onLoginSuccess,
  availableUsers,
  allPersonnel
}) => {
  const [loginMode, setLoginMode] = useState<'personel' | 'admin'>('personel');
  const [adminUsername, setAdminUsername] = useState('admin');
  const [adminPassword, setAdminPassword] = useState('admin');
  const [searchPersonText, setSearchPersonText] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fallback to INITIAL_PERSONNEL if allPersonnel is not yet loaded
  const personnelData: (Personnel | (Omit<Personnel, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }))[] = 
    allPersonnel && allPersonnel.length > 0 ? allPersonnel : INITIAL_PERSONNEL;

  // Filter 26 personnel for quick search
  const filteredPersonnel = personnelData.filter(p => {
    const q = searchPersonText.toLowerCase();
    return p.nama.toLowerCase().includes(q) ||
           String(p.nrp).toLowerCase().includes(q) ||
           p.pangkat.toLowerCase().includes(q) ||
           p.jabatan.toLowerCase().includes(q);
  });

  // Handle Admin Login (User ID: admin, Password: admin)
  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    setTimeout(() => {
      if (adminUsername.trim().toLowerCase() === 'admin' && adminPassword === 'admin') {
        const adminAccount: UserAccount = {
          id: 'USR-ADMIN',
          username: 'admin',
          nama: 'Administrator Slog',
          role: 'admin',
          pangkat: 'PNS / Penata',
          jabatan: 'Admin Sistem Slog'
        };
        onLoginSuccess(adminAccount);
      } else {
        setErrorMsg('User ID atau Kata Sandi admin salah. Gunakan User ID: admin dan Password: admin.');
      }
      setIsLoading(false);
    }, 250);
  };

  // Handle Personel Login (Open access without password!)
  const handlePersonelLogin = (person: any) => {
    setIsLoading(true);
    setErrorMsg(null);

    const userAccount: UserAccount = {
      id: `USR-${person.nrp}`,
      username: String(person.nrp),
      nama: person.nama,
      role: person.jabatan?.toLowerCase().includes('waaslog') || person.jabatan?.toLowerCase().includes('paban ') 
        ? 'atasan' 
        : 'personel',
      personnelId: person.id || `PERS-${person.nrp}`,
      pangkat: person.pangkat,
      jabatan: person.jabatan
    };

    setTimeout(() => {
      onLoginSuccess(userAccount);
      setIsLoading(false);
    }, 150);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-xl w-full">
        {/* Brand Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100 text-slate-800 space-y-5">
          <div className="text-center space-y-2">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-900 to-cyan-500 p-1 shadow-lg flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-xl flex items-center justify-center font-black text-cyan-400 text-lg tracking-tight">
                SLOG
              </div>
            </div>
            <h1 className="text-lg font-black text-slate-900 tracking-tight leading-tight">
              DATA KEHADIRAN STAF LOGISTIK
            </h1>
            <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider">
              KOMANDO OPERASI UDARA NASIONAL
            </p>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-[11px] font-bold">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Akses Terbuka untuk Seluruh Personel</span>
            </div>
          </div>

          {/* Mode Switcher: Personel (Akses Terbuka) vs Admin (User ID & Password) */}
          <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-100 rounded-2xl text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setLoginMode('personel');
                setErrorMsg(null);
              }}
              className={`py-2.5 px-3 rounded-xl transition flex items-center justify-center gap-2 ${
                loginMode === 'personel'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Akses Semua Personel</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setLoginMode('admin');
                setErrorMsg(null);
              }}
              className={`py-2.5 px-3 rounded-xl transition flex items-center justify-center gap-2 ${
                loginMode === 'admin'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <KeyRound className="w-4 h-4" />
              <span>Admin (User & Password)</span>
            </button>
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>{errorMsg}</div>
            </div>
          )}

          {/* MODE 1: PERSONEL (AKSES TERBUKA TANPA KATA SANDI) */}
          {loginMode === 'personel' ? (
            <div className="space-y-3.5">
              <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-2xl text-xs text-blue-950 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Akses Langsung Tanpa Kata Sandi: </span>
                  Pilih nama Anda dari daftar 26 personel di bawah ini untuk langsung masuk dan melakukan presensi.
                </div>
              </div>

              {/* Search box for 26 personnel */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Ketik nama Anda atau NRP/NIP (26 Personel)..."
                  value={searchPersonText}
                  onChange={e => setSearchPersonText(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
              </div>

              {/* List of 26 Personnel */}
              <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-2xl bg-white shadow-2xs">
                {filteredPersonnel.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 text-xs italic">
                    Personel tidak ditemukan. Coba ketik nama atau NRP lain.
                  </div>
                ) : (
                  filteredPersonnel.map(person => (
                    <button
                      key={person.nrp}
                      type="button"
                      onClick={() => handlePersonelLogin(person)}
                      disabled={isLoading}
                      className="w-full p-3 text-left hover:bg-blue-50/80 transition flex items-center justify-between group active:bg-blue-100"
                    >
                      <div className="pr-2">
                        <div className="font-bold text-slate-900 group-hover:text-blue-900 text-xs">
                          {person.nama}
                        </div>
                        <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                          {person.pangkat} • NRP: <span className="font-mono text-slate-700 font-semibold">{person.nrp}</span>
                        </div>
                        <div className="text-[10px] text-blue-700 font-semibold mt-0.5">
                          {person.jabatan} ({person.unit})
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 text-blue-600 group-hover:translate-x-1 transition text-xs font-bold shrink-0 bg-blue-50 px-2 py-1 rounded-lg group-hover:bg-blue-600 group-hover:text-white">
                        <span>Masuk</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          ) : (
            /* MODE 2: ADMIN KHUSUS (User ID: admin, Password: admin) */
            <form onSubmit={handleAdminLogin} className="space-y-4 text-xs">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Khusus Administrator Sistem: </span>
                  Masuk menggunakan User ID: <code className="font-bold text-amber-950 bg-amber-100 px-1 py-0.5 rounded">admin</code> dan Kata Sandi: <code className="font-bold text-amber-950 bg-amber-100 px-1 py-0.5 rounded">admin</code>.
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 mb-1 block">User ID Admin *</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    value={adminUsername}
                    onChange={e => setAdminUsername(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 mb-1 block">Kata Sandi Admin *</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    required
                    value={adminPassword}
                    onChange={e => setAdminPassword(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition shadow-md flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
              >
                <span>{isLoading ? 'Memverifikasi...' : 'Masuk Sebagai Administrator'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          <div className="text-center text-[10px] text-slate-400 pt-2 border-t border-slate-100">
            Sistem Informasi Kehadiran Staf Logistik Koopsudnas • Markas Besar TNI AU
          </div>
        </div>
      </div>
    </div>
  );
};
