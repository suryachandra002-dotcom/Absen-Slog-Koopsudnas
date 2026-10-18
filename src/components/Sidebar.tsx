import React, { useState, useEffect } from 'react';
import { 
  Home, 
  MapPin, 
  Calendar, 
  Clock, 
  FileText, 
  CheckSquare, 
  Users, 
  Table, 
  FileSpreadsheet, 
  Bell, 
  Settings, 
  ShieldAlert, 
  LogOut, 
  UserCheck, 
  FileCode2, 
  Crosshair,
  Megaphone,
  X,
  ChevronDown,
  EyeOff
} from 'lucide-react';
import { UserRole } from '../types';

export type NavTab = 
  | 'dashboard'
  | 'gps-attendance'
  | 'calendar'
  | 'history'
  | 'leave-request'
  | 'correction'
  | 'approvals'
  | 'approval-history'
  | 'personnel'
  | 'recap'
  | 'reports'
  | 'announcements'
  | 'gps-settings'
  | 'gas-integration'
  | 'audit-log'
  | 'profile';

interface SidebarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  userRole: UserRole;
  pendingApprovalsCount: number;
  unreadAnnouncementsCount: number;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  onLogout: () => void;
}

type SectionId = 'beranda' | 'kehadiran' | 'persetujuan' | 'data' | 'administrasi';

const SECTION_TABS: Record<SectionId, NavTab[]> = {
  beranda: ['dashboard', 'announcements'],
  kehadiran: ['gps-attendance', 'calendar', 'history', 'leave-request', 'correction'],
  persetujuan: ['approvals', 'approval-history'],
  data: ['personnel', 'recap', 'reports'],
  administrasi: ['gps-settings', 'gas-integration', 'audit-log']
};

const getSectionForTab = (tab: NavTab): SectionId => {
  for (const [section, tabs] of Object.entries(SECTION_TABS)) {
    if (tabs.includes(tab)) return section as SectionId;
  }
  return 'beranda';
};

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  pendingApprovalsCount,
  unreadAnnouncementsCount,
  isOpenMobile,
  onCloseMobile,
  onLogout
}) => {
  // Track currently chosen / expanded section
  const [selectedSection, setSelectedSection] = useState<SectionId>(() => getSectionForTab(activeTab));

  // Automatically sync and expand section when activeTab changes
  useEffect(() => {
    setSelectedSection(getSectionForTab(activeTab));
  }, [activeTab]);

  const activeSection = getSectionForTab(activeTab);

  // A section is visible if it is either active (contains current tab) or selected by the user.
  // Inactive and unselected sections are automatically hidden.
  const isSectionVisible = (section: SectionId) => {
    return selectedSection === section || activeSection === section;
  };

  const handleToggleSection = (section: SectionId) => {
    if (selectedSection === section) {
      // If user clicks the currently selected section, toggle back to active section or keep active
      setSelectedSection(activeSection === section ? section : activeSection);
    } else {
      setSelectedSection(section);
    }
  };

  const navItemClass = (tab: NavTab) => `
    w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all group
    ${activeTab === tab 
      ? 'bg-blue-600 text-white shadow-sm font-semibold' 
      : 'text-slate-300 hover:text-white hover:bg-slate-800/80'}
  `;

  const handleNavClick = (tab: NavTab) => {
    onSelectTab(tab);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div 
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside className={`
        fixed top-0 bottom-0 left-0 z-50 w-64 bg-gradient-to-b from-slate-950 via-slate-900 to-blue-950 text-white
        flex flex-col border-r border-slate-800 transition-transform duration-300 ease-in-out
        ${isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Brand / Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 via-blue-600 to-cyan-400 p-0.5 shadow-md flex items-center justify-center">
              <div className="w-full h-full bg-slate-900 rounded-[10px] flex items-center justify-center font-black text-cyan-400 text-sm tracking-tighter">
                SLOG
              </div>
            </div>
            <div>
              <div className="font-extrabold text-sm tracking-tight text-white leading-tight">
                DATA KEHADIRAN
              </div>
              <div className="text-[10px] font-semibold tracking-wider text-cyan-400">
                STAF LOGISTIK KOOPSUDNAS
              </div>
            </div>
          </div>

          <button 
            onClick={onCloseMobile}
            className="lg:hidden p-1 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Navigation - Inactive/Unselected menus automatically hidden */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2 scrollbar-thin scrollbar-thumb-slate-800">
          {/* Auto-Hide Status Indicator */}
          <div className="px-2.5 py-1 mb-2 rounded-lg bg-slate-950/80 border border-slate-800/80 flex items-center justify-between text-[10px]">
            <span className="flex items-center gap-1.5 text-slate-400 font-medium">
              <EyeOff className="w-3.5 h-3.5 text-cyan-400" />
              <span>Menu Tak Aktif:</span>
            </span>
            <span className="text-[9px] bg-cyan-950/90 text-cyan-300 font-bold px-1.5 py-0.5 rounded border border-cyan-800/50">
              Otomatis Tersembunyi
            </span>
          </div>

          {/* Section 1: Beranda */}
          <div className="rounded-xl overflow-hidden border border-slate-800/50 bg-slate-950/30">
            <button
              onClick={() => handleToggleSection('beranda')}
              className={`w-full px-3 py-2 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider transition ${
                isSectionVisible('beranda')
                  ? 'bg-slate-800/70 text-cyan-300 border-l-2 border-cyan-400'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
              }`}
              title="Klik untuk membuka / menutup menu Beranda"
            >
              <div className="flex items-center gap-2">
                <Home className="w-3.5 h-3.5" />
                <span>Beranda</span>
                {activeSection === 'beranda' && (
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                )}
              </div>
              <div className="flex items-center gap-1.5">
                {unreadAnnouncementsCount > 0 && !isSectionVisible('beranda') && (
                  <span className="bg-red-500 text-white font-black text-[9px] px-1.5 py-0.2 rounded-full">
                    {unreadAnnouncementsCount}
                  </span>
                )}
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  isSectionVisible('beranda') ? 'rotate-180 text-cyan-400' : 'text-slate-500'
                }`} />
              </div>
            </button>

            {/* Menu Items: Automatically hidden if not active or selected */}
            <div className={`transition-all duration-300 ease-in-out overflow-hidden px-1.5 ${
              isSectionVisible('beranda')
                ? 'max-h-48 opacity-100 py-1.5 space-y-1'
                : 'max-h-0 opacity-0 py-0 pointer-events-none'
            }`}>
              <button 
                onClick={() => handleNavClick('dashboard')}
                className={navItemClass('dashboard')}
              >
                <div className="flex items-center gap-2.5">
                  <Home className="w-4 h-4" />
                  <span>Dashboard Utama</span>
                </div>
              </button>

              <button 
                onClick={() => handleNavClick('announcements')}
                className={navItemClass('announcements')}
              >
                <div className="flex items-center gap-2.5">
                  <Megaphone className="w-4 h-4 text-cyan-400" />
                  <span>Pengumuman</span>
                </div>
                {unreadAnnouncementsCount > 0 && (
                  <span className="bg-red-500 text-white font-black text-[10px] px-1.5 py-0.2 rounded-full animate-pulse shadow-xs">
                    {unreadAnnouncementsCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Section 2: Kehadiran Personel */}
          <div className="rounded-xl overflow-hidden border border-slate-800/50 bg-slate-950/30">
            <button
              onClick={() => handleToggleSection('kehadiran')}
              className={`w-full px-3 py-2 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider transition ${
                isSectionVisible('kehadiran')
                  ? 'bg-slate-800/70 text-cyan-300 border-l-2 border-cyan-400'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
              }`}
              title="Klik untuk membuka / menutup menu Kehadiran Personel"
            >
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5" />
                <span>Kehadiran Personel</span>
                {activeSection === 'kehadiran' && (
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                )}
              </div>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${
                isSectionVisible('kehadiran') ? 'rotate-180 text-cyan-400' : 'text-slate-500'
              }`} />
            </button>

            {/* Menu Items: Automatically hidden if not active or selected */}
            <div className={`transition-all duration-300 ease-in-out overflow-hidden px-1.5 ${
              isSectionVisible('kehadiran')
                ? 'max-h-80 opacity-100 py-1.5 space-y-1'
                : 'max-h-0 opacity-0 py-0 pointer-events-none'
            }`}>
              <button 
                onClick={() => handleNavClick('gps-attendance')}
                className={navItemClass('gps-attendance')}
              >
                <div className="flex items-center gap-2.5">
                  <Crosshair className="w-4 h-4 text-emerald-400" />
                  <span>Absensi GPS (3 KM)</span>
                </div>
                <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-mono">
                  LIVE
                </span>
              </button>

              <button 
                onClick={() => handleNavClick('calendar')}
                className={navItemClass('calendar')}
              >
                <div className="flex items-center gap-2.5">
                  <Calendar className="w-4 h-4" />
                  <span>Kalender Kehadiran</span>
                </div>
              </button>

              <button 
                onClick={() => handleNavClick('history')}
                className={navItemClass('history')}
              >
                <div className="flex items-center gap-2.5">
                  <Clock className="w-4 h-4" />
                  <span>Riwayat Absensi</span>
                </div>
              </button>

              <button 
                onClick={() => handleNavClick('leave-request')}
                className={navItemClass('leave-request')}
              >
                <div className="flex items-center gap-2.5">
                  <FileText className="w-4 h-4" />
                  <span>Keterangan Kehadiran</span>
                </div>
              </button>

              <button 
                onClick={() => handleNavClick('correction')}
                className={navItemClass('correction')}
              >
                <div className="flex items-center gap-2.5">
                  <CheckSquare className="w-4 h-4" />
                  <span>Koreksi Absensi</span>
                </div>
              </button>
            </div>
          </div>

          {/* Section 3: Persetujuan & Verifikasi */}
          <div className="rounded-xl overflow-hidden border border-slate-800/50 bg-slate-950/30">
            <button
              onClick={() => handleToggleSection('persetujuan')}
              className={`w-full px-3 py-2 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider transition ${
                isSectionVisible('persetujuan')
                  ? 'bg-slate-800/70 text-cyan-300 border-l-2 border-cyan-400'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
              }`}
              title="Klik untuk membuka / menutup menu Persetujuan"
            >
              <div className="flex items-center gap-2">
                <UserCheck className="w-3.5 h-3.5" />
                <span>Persetujuan</span>
                {activeSection === 'persetujuan' && (
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                )}
              </div>
              <div className="flex items-center gap-1.5">
                {pendingApprovalsCount > 0 && (
                  <span className="bg-amber-500 text-slate-950 font-black text-[9px] px-1.5 py-0.2 rounded-full">
                    {pendingApprovalsCount}
                  </span>
                )}
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  isSectionVisible('persetujuan') ? 'rotate-180 text-cyan-400' : 'text-slate-500'
                }`} />
              </div>
            </button>

            {/* Menu Items: Automatically hidden if not active or selected */}
            <div className={`transition-all duration-300 ease-in-out overflow-hidden px-1.5 ${
              isSectionVisible('persetujuan')
                ? 'max-h-48 opacity-100 py-1.5 space-y-1'
                : 'max-h-0 opacity-0 py-0 pointer-events-none'
            }`}>
              <button 
                onClick={() => handleNavClick('approvals')}
                className={navItemClass('approvals')}
              >
                <div className="flex items-center gap-2.5">
                  <UserCheck className="w-4 h-4 text-amber-400" />
                  <span>Menunggu Persetujuan</span>
                </div>
                {pendingApprovalsCount > 0 && (
                  <span className="bg-amber-500 text-slate-950 font-black text-[10px] px-1.5 py-0.2 rounded-full">
                    {pendingApprovalsCount}
                  </span>
                )}
              </button>

              <button 
                onClick={() => handleNavClick('approval-history')}
                className={navItemClass('approval-history')}
              >
                <div className="flex items-center gap-2.5">
                  <Clock className="w-4 h-4" />
                  <span>Riwayat Keputusan</span>
                </div>
              </button>
            </div>
          </div>

          {/* Section 4: Data & Laporan */}
          <div className="rounded-xl overflow-hidden border border-slate-800/50 bg-slate-950/30">
            <button
              onClick={() => handleToggleSection('data')}
              className={`w-full px-3 py-2 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider transition ${
                isSectionVisible('data')
                  ? 'bg-slate-800/70 text-cyan-300 border-l-2 border-cyan-400'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
              }`}
              title="Klik untuk membuka / menutup menu Data & Laporan"
            >
              <div className="flex items-center gap-2">
                <Table className="w-3.5 h-3.5" />
                <span>Data & Laporan</span>
                {activeSection === 'data' && (
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                )}
              </div>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${
                isSectionVisible('data') ? 'rotate-180 text-cyan-400' : 'text-slate-500'
              }`} />
            </button>

            {/* Menu Items: Automatically hidden if not active or selected */}
            <div className={`transition-all duration-300 ease-in-out overflow-hidden px-1.5 ${
              isSectionVisible('data')
                ? 'max-h-60 opacity-100 py-1.5 space-y-1'
                : 'max-h-0 opacity-0 py-0 pointer-events-none'
            }`}>
              <button 
                onClick={() => handleNavClick('personnel')}
                className={navItemClass('personnel')}
              >
                <div className="flex items-center gap-2.5">
                  <Users className="w-4 h-4 text-cyan-400" />
                  <span>Data Personel (26)</span>
                </div>
              </button>

              <button 
                onClick={() => handleNavClick('recap')}
                className={navItemClass('recap')}
              >
                <div className="flex items-center gap-2.5">
                  <Table className="w-4 h-4" />
                  <span>Rekapitulasi Kehadiran</span>
                </div>
              </button>

              <button 
                onClick={() => handleNavClick('reports')}
                className={navItemClass('reports')}
              >
                <div className="flex items-center gap-2.5">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                  <span>Laporan Excel & PDF</span>
                </div>
              </button>
            </div>
          </div>

          {/* Section 5: Administrasi & Sistem (Akses Terbuka) */}
          <div className="rounded-xl overflow-hidden border border-slate-800/50 bg-slate-950/30">
            <button
              onClick={() => handleToggleSection('administrasi')}
              className={`w-full px-3 py-2 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider transition ${
                isSectionVisible('administrasi')
                  ? 'bg-slate-800/70 text-cyan-300 border-l-2 border-cyan-400'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
              }`}
              title="Klik untuk membuka / menutup menu Administrasi & Sistem"
            >
              <div className="flex items-center gap-2">
                <Settings className="w-3.5 h-3.5" />
                <span>Administrasi & Sistem</span>
                {activeSection === 'administrasi' && (
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                )}
              </div>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${
                isSectionVisible('administrasi') ? 'rotate-180 text-cyan-400' : 'text-slate-500'
              }`} />
            </button>

            {/* Menu Items: Automatically hidden if not active or selected */}
            <div className={`transition-all duration-300 ease-in-out overflow-hidden px-1.5 ${
              isSectionVisible('administrasi')
                ? 'max-h-60 opacity-100 py-1.5 space-y-1'
                : 'max-h-0 opacity-0 py-0 pointer-events-none'
            }`}>
              <button 
                onClick={() => handleNavClick('gps-settings')}
                className={navItemClass('gps-settings')}
              >
                <div className="flex items-center gap-2.5">
                  <MapPin className="w-4 h-4 text-rose-400" />
                  <span>Pengaturan GPS Kantor</span>
                </div>
              </button>

              <button 
                onClick={() => handleNavClick('gas-integration')}
                className={navItemClass('gas-integration')}
              >
                <div className="flex items-center gap-2.5">
                  <FileCode2 className="w-4 h-4 text-blue-400" />
                  <span>Google Apps Script & Sheets</span>
                </div>
              </button>

              <button 
                onClick={() => handleNavClick('audit-log')}
                className={navItemClass('audit-log')}
              >
                <div className="flex items-center gap-2.5">
                  <ShieldAlert className="w-4 h-4 text-amber-300" />
                  <span>Audit Log Sistem</span>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* User Footer & Logout */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/60">
          <button 
            onClick={() => handleNavClick('profile')}
            className={`w-full flex items-center gap-3 p-2 rounded-lg text-left transition ${
              activeTab === 'profile' ? 'bg-blue-600 text-white font-semibold' : 'hover:bg-slate-800 text-slate-200'
            }`}
          >
            <div className="w-7 h-7 rounded-lg bg-blue-600/30 border border-blue-500/40 text-blue-300 flex items-center justify-center text-xs font-bold">
              ID
            </div>
            <div className="flex-1 truncate">
              <div className="text-xs font-medium truncate">Profil & Keamanan</div>
              <div className="text-[10px] text-slate-400">Pengaturan Akun</div>
            </div>
          </button>

          <button 
            onClick={onLogout}
            className="mt-1 w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-rose-300 hover:text-white hover:bg-rose-900/40 transition font-medium"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Keluar Sesi</span>
          </button>
        </div>
      </aside>
    </>
  );
};
