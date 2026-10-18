import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Calendar as CalendarIcon, 
  Bell, 
  ShieldCheck, 
  User, 
  Menu, 
  CheckCircle2, 
  ChevronDown,
  RefreshCw
} from 'lucide-react';
import { Announcement, UserAccount, UserRole, Personnel } from '../types';

interface HeaderProps {
  currentUser: UserAccount;
  onSwitchUser: (user: UserAccount) => void;
  availableUsers: UserAccount[];
  allPersonnel?: Personnel[];
  pendingApprovalsCount: number;
  unreadAnnouncementsCount: number;
  announcements: Announcement[];
  onOpenPendingApprovals: () => void;
  onOpenAnnouncements: () => void;
  onReadAnnouncement: (announcementId: string) => void;
  onMarkAllAnnouncementsRead: () => void;
  onToggleMobileSidebar: () => void;
  activeTabTitle: string;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onSwitchUser,
  availableUsers,
  allPersonnel = [],
  pendingApprovalsCount,
  unreadAnnouncementsCount,
  announcements,
  onOpenPendingApprovals,
  onOpenAnnouncements,
  onReadAnnouncement,
  onMarkAllAnnouncementsRead,
  onToggleMobileSidebar,
  activeTabTitle
}) => {
  const [currentTimeWIB, setCurrentTimeWIB] = useState<string>('');
  const [currentDateWIB, setCurrentDateWIB] = useState<string>('');
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [userSearchText, setUserSearchText] = useState('');
  const [showAdminPasswordPrompt, setShowAdminPasswordPrompt] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [adminPasswordError, setAdminPasswordError] = useState<string | null>(null);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const dateFormatted = new Intl.DateTimeFormat('id-ID', {
        timeZone: 'Asia/Jakarta',
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }).format(now);

      const timeFormatted = new Intl.DateTimeFormat('id-ID', {
        timeZone: 'Asia/Jakarta',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      }).format(now).replace(/\./g, ':');

      setCurrentDateWIB(dateFormatted);
      setCurrentTimeWIB(`${timeFormatted} WIB`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return <span className="bg-amber-100 text-amber-800 text-[10px] px-2 py-0.5 rounded font-bold border border-amber-300">Administrator</span>;
      case 'atasan':
        return <span className="bg-blue-100 text-blue-800 text-[10px] px-2 py-0.5 rounded font-bold border border-blue-300">Pejabat Atasan</span>;
      default:
        return <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 rounded font-bold border border-emerald-300">Personel</span>;
    }
  };

  const handleSwitchToPerson = (person: Personnel) => {
    const userAccount: UserAccount = {
      id: `USR-${person.nrp}`,
      username: person.nrp,
      nama: person.nama,
      role: person.jabatan.toLowerCase().includes('waaslog') || person.jabatan.toLowerCase().includes('paban ') 
        ? 'atasan' 
        : 'personel',
      personnelId: person.id,
      pangkat: person.pangkat,
      jabatan: person.jabatan
    };
    onSwitchUser(userAccount);
    setShowRoleMenu(false);
    setUserSearchText('');
  };

  const handleVerifyAdminSwitch = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPasswordInput.trim() === 'admin') {
      const adminAccount: UserAccount = {
        id: 'USR-ADMIN',
        username: 'admin',
        nama: 'Administrator Slog',
        role: 'admin',
        pangkat: 'PNS / Penata',
        jabatan: 'Admin Sistem Slog'
      };
      onSwitchUser(adminAccount);
      setShowAdminPasswordPrompt(false);
      setShowRoleMenu(false);
      setAdminPasswordInput('');
      setAdminPasswordError(null);
    } else {
      setAdminPasswordError('Kata sandi admin salah. Gunakan: admin');
    }
  };

  // Filter 26 personnel for switcher
  const filteredPersonnelForSwitcher = allPersonnel.filter(p => {
    const q = userSearchText.toLowerCase();
    return p.nama.toLowerCase().includes(q) ||
           p.nrp.toLowerCase().includes(q) ||
           p.pangkat.toLowerCase().includes(q) ||
           p.jabatan.toLowerCase().includes(q);
  });

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="flex items-center justify-between px-4 lg:px-6 py-2.5">
        {/* Left: Mobile Toggle & Page Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleMobileSidebar}
            className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
            aria-label="Toggle Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                SLOG KOOPSUDNAS
              </span>
              <span className="text-slate-400 text-xs">/</span>
              <h1 className="text-sm md:text-base font-bold text-slate-800 truncate">
                {activeTabTitle}
              </h1>
            </div>
            <p className="text-[11px] text-slate-500 hidden sm:block">
              Komando Operasi Udara Nasional • Markas Besar TNI AU
            </p>
          </div>
        </div>

        {/* Center: Live Digital Clock & WIB Calendar */}
        <div className="hidden md:flex items-center gap-4 bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-lg shadow-2xs">
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <CalendarIcon className="w-3.5 h-3.5 text-blue-600" />
            <span className="font-medium">{currentDateWIB || 'Memuat tanggal...'}</span>
          </div>
          <div className="h-3 w-px bg-slate-300" />
          <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-blue-900">
            <Clock className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
            <span>{currentTimeWIB || '00:00:00 WIB'}</span>
          </div>
        </div>

        {/* Right: Notifications & User Role Switcher */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifMenu(!showNotifMenu)}
              className="relative p-2 text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition"
              title="Notifikasi & Pengumuman Baru"
            >
              <Bell className="w-5 h-5" />
              {(pendingApprovalsCount + unreadAnnouncementsCount) > 0 && (
                <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 bg-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-bounce shadow-xs">
                  {pendingApprovalsCount + unreadAnnouncementsCount}
                </span>
              )}
            </button>

            {showNotifMenu && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 p-3.5 z-50 text-xs animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 font-bold text-slate-800">
                  <span className="flex items-center gap-1.5">
                    <Bell className="w-4 h-4 text-blue-600" />
                    <span>Pemberitahuan Sistem</span>
                  </span>
                  {(pendingApprovalsCount + unreadAnnouncementsCount) > 0 && (
                    <span className="text-[10px] bg-red-100 text-red-800 font-black px-2 py-0.5 rounded-full border border-red-200">
                      {pendingApprovalsCount + unreadAnnouncementsCount} Baru
                    </span>
                  )}
                </div>

                <div className="py-2.5 space-y-3 max-h-80 overflow-y-auto">
                  {/* Section 1: Unread Announcements */}
                  <div>
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 mb-1.5">
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-blue-600" />
                        Pengumuman Baru ({unreadAnnouncementsCount})
                      </span>
                      {unreadAnnouncementsCount > 0 && (
                        <button
                          onClick={() => {
                            onMarkAllAnnouncementsRead();
                          }}
                          className="text-[10px] text-blue-600 hover:text-blue-800 font-semibold"
                        >
                          Tandai Semua Dibaca
                        </button>
                      )}
                    </div>

                    {unreadAnnouncementsCount > 0 ? (
                      <div className="space-y-1.5">
                        {announcements.slice(0, 4).map(ann => (
                          <div
                            key={ann.id}
                            className="p-2 rounded-xl bg-blue-50/70 border border-blue-200/80 hover:bg-blue-100/70 transition flex flex-col justify-between"
                          >
                            <div className="flex items-start justify-between gap-1">
                              <span className="font-bold text-blue-950 line-clamp-1">{ann.judul}</span>
                              <span className="text-[9px] bg-red-500 text-white font-black px-1.5 py-0.2 rounded-full shrink-0">
                                BARU
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-600 line-clamp-2 mt-0.5">
                              {ann.isi}
                            </p>
                            <div className="mt-1.5 flex items-center justify-between pt-1 border-t border-blue-200/50 text-[10px]">
                              <span className="text-slate-400">
                                {new Date(ann.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                              </span>
                              <button
                                onClick={() => {
                                  onReadAnnouncement(ann.id);
                                  setShowNotifMenu(false);
                                  onOpenAnnouncements();
                                }}
                                className="font-bold text-blue-700 hover:underline"
                              >
                                Buka Pengumuman &rarr;
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-[11px] text-slate-400 py-1.5 text-center italic bg-slate-50 rounded-lg">
                        Seluruh pengumuman sudah dibaca.
                      </div>
                    )}
                  </div>

                  {/* Section 2: Pending Approvals (if any) */}
                  {pendingApprovalsCount > 0 && (
                    <div className="pt-2 border-t border-slate-100">
                      <div className="text-[11px] font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-amber-500" />
                        Persetujuan Izin Menunggu ({pendingApprovalsCount})
                      </div>
                      <button
                        onClick={() => {
                          setShowNotifMenu(false);
                          onOpenPendingApprovals();
                        }}
                        className="w-full text-left p-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 transition"
                      >
                        <div className="font-semibold text-xs">Verifikasi Pengajuan Cuti / Izin</div>
                        <div className="text-[11px] text-amber-700 mt-0.5">
                          Terdapat {pendingApprovalsCount} permohonan yang menunggu persetujuan atasan.
                        </div>
                      </button>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-[10px] text-slate-400">
                  <span>Staf Logistik Koopsudnas</span>
                  <button
                    onClick={() => {
                      setShowNotifMenu(false);
                      onOpenAnnouncements();
                    }}
                    className="text-blue-700 font-bold hover:underline"
                  >
                    Lihat Semua Pengumuman
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User Account / Role Switcher */}
          <div className={`relative transition-all duration-300 ${showRoleMenu ? 'z-50' : 'z-20'}`}>
            <button
              onClick={() => setShowRoleMenu(!showRoleMenu)}
              className={`flex items-center gap-2 p-1.5 md:px-2.5 md:py-1.5 rounded-xl border transition-all duration-300 ease-out origin-right select-none ${
                showRoleMenu
                  ? 'scale-[2] shadow-2xl border-blue-600 bg-white ring-2 ring-blue-500/25 z-40 text-blue-950 font-medium'
                  : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50 text-slate-800 active:scale-[2]'
              }`}
              title={showRoleMenu ? 'Tutup menu akun' : 'Beralih akun personel / admin'}
            >
              <div className={`w-8 h-8 rounded-full bg-gradient-to-tr from-blue-900 to-blue-700 text-white flex items-center justify-center font-bold text-xs shadow-xs transition-transform duration-300 ${showRoleMenu ? 'ring-1 ring-blue-300' : ''}`}>
                {currentUser.nama.charAt(0)}
              </div>
              <div className="text-left hidden lg:block">
                <div className="text-xs font-bold text-slate-800 truncate max-w-[140px]">
                  {currentUser.nama}
                </div>
                <div className="text-[10px] text-slate-500 truncate max-w-[140px]">
                  {currentUser.pangkat} • {currentUser.jabatan}
                </div>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-300 ${showRoleMenu ? 'rotate-180 text-blue-600' : ''}`} />
            </button>

            {showRoleMenu && (
              <div className="absolute right-0 mt-6 md:mt-7 w-84 md:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 py-2.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                {/* Active Session Info */}
                <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50/70">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      Akun Aktif Saat Ini
                    </span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-300">
                      Akses Terbuka
                    </span>
                  </div>
                  <div className="font-bold text-slate-900 text-sm mt-1">
                    {currentUser.nama}
                  </div>
                  <div className="text-xs text-slate-600">
                    {currentUser.pangkat} • NRP: <span className="font-mono text-slate-800">{currentUser.username}</span>
                  </div>
                  <div className="text-[11px] text-blue-700 font-semibold mt-0.5">
                    {currentUser.jabatan}
                  </div>
                  <div className="mt-2 flex items-center gap-1.5">
                    {getRoleBadge(currentUser.role)}
                  </div>
                </div>

                {/* Switch to Administrator with Password */}
                <div className="p-3 border-b border-slate-100 bg-amber-50/40">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-bold text-amber-950 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-amber-600" />
                      <span>Masuk Sebagai Administrator</span>
                    </span>
                    <span className="text-[10px] text-amber-700 font-medium">Perlu Kata Sandi</span>
                  </div>

                  {!showAdminPasswordPrompt ? (
                    <button
                      type="button"
                      onClick={() => {
                        setShowAdminPasswordPrompt(true);
                        setAdminPasswordError(null);
                        setAdminPasswordInput('');
                      }}
                      className="w-full py-1.5 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-2xs"
                    >
                      <span>Beralih ke Administrator (admin)</span>
                    </button>
                  ) : (
                    <form onSubmit={handleVerifyAdminSwitch} className="space-y-2 mt-2">
                      <div className="text-[11px] text-amber-900 font-semibold">
                        Masukkan kata sandi admin (<code className="font-bold">admin</code>):
                      </div>
                      <div className="flex gap-1.5">
                        <input
                          type="password"
                          autoFocus
                          placeholder="Password admin..."
                          value={adminPasswordInput}
                          onChange={e => setAdminPasswordInput(e.target.value)}
                          className="flex-1 px-2.5 py-1.5 bg-white border border-amber-300 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                        <button
                          type="submit"
                          className="px-3 py-1.5 rounded-lg bg-amber-600 text-white font-bold text-xs hover:bg-amber-700 transition"
                        >
                          OK
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowAdminPasswordPrompt(false);
                            setAdminPasswordError(null);
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-200 text-slate-700 text-xs hover:bg-slate-300 transition"
                        >
                          Batal
                        </button>
                      </div>
                      {adminPasswordError && (
                        <div className="text-[10px] text-rose-600 font-bold">
                          {adminPasswordError}
                        </div>
                      )}
                    </form>
                  )}
                </div>

                {/* Switch to Any Personnel (Open Access) */}
                <div className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-slate-700">
                      Pilih Profil Personel (26 Personel)
                    </span>
                    <span className="text-[10px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full font-bold">
                      Bebas Akses
                    </span>
                  </div>

                  {/* Search box */}
                  <input
                    type="text"
                    placeholder="Cari nama / NRP personel..."
                    value={userSearchText}
                    onChange={e => setUserSearchText(e.target.value)}
                    className="w-full mb-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />

                  {/* List of 26 Personnel */}
                  <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
                    {filteredPersonnelForSwitcher.length === 0 ? (
                      <div className="p-4 text-center text-slate-400 text-xs italic">
                        Personel tidak ditemukan.
                      </div>
                    ) : (
                      filteredPersonnelForSwitcher.map(person => (
                        <button
                          key={person.id}
                          onClick={() => handleSwitchToPerson(person)}
                          className={`w-full text-left p-2.5 hover:bg-blue-50 transition flex items-center justify-between group ${
                            person.id === currentUser.personnelId || person.nrp === currentUser.username
                              ? 'bg-blue-50/80 font-bold border-l-4 border-blue-600'
                              : ''
                          }`}
                        >
                          <div>
                            <div className="text-xs font-semibold text-slate-900 group-hover:text-blue-900 truncate max-w-[210px]">
                              {person.nama}
                            </div>
                            <div className="text-[10px] text-slate-500">
                              {person.pangkat} • NRP: <span className="font-mono">{person.nrp}</span>
                            </div>
                            <div className="text-[9px] text-blue-700 truncate max-w-[210px]">
                              {person.jabatan}
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="text-[9px] bg-slate-100 group-hover:bg-blue-600 group-hover:text-white text-slate-600 px-2 py-0.5 rounded font-bold transition">
                              Pilih
                            </span>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
