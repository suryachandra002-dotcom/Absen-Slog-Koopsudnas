import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Sidebar, NavTab } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { PersonnelModule } from './components/PersonnelModule';
import { GpsAttendanceModule } from './components/GpsAttendanceModule';
import { LeaveModule } from './components/LeaveModule';
import { ApprovalModule } from './components/ApprovalModule';
import { CorrectionModule } from './components/CorrectionModule';
import { CalendarModule } from './components/CalendarModule';
import { RecapModule } from './components/RecapModule';
import { AnnouncementAdminModule } from './components/AnnouncementAdminModule';
import { GpsSettingsModule } from './components/GpsSettingsModule';
import { GasIntegrationModule } from './components/GasIntegrationModule';
import { AuditLogModule } from './components/AuditLogModule';
import { ProfileModule } from './components/ProfileModule';
import { LoginModule } from './components/LoginModule';
import { api } from './services/api';
import { 
  Personnel, 
  AttendanceRecord, 
  Announcement, 
  LeaveRequest, 
  AttendanceCorrection, 
  OfficeConfig, 
  AuditLog, 
  UserAccount, 
  SystemStats 
} from './types';

// Default Demo Accounts
const DEFAULT_USERS: UserAccount[] = [
  {
    id: 'USR-01',
    username: 'admin',
    nama: 'Administrator Slog',
    role: 'admin',
    pangkat: 'PNS / Penata',
    jabatan: 'Admin Sistem Slog'
  },
  {
    id: 'USR-02',
    username: '520336',
    nama: 'Fiyono, S.T., M.M.',
    role: 'atasan',
    personnelId: 'PERS-001',
    pangkat: 'Kolonel Kal',
    jabatan: 'Waaslog Kaskoopsudnas'
  },
  {
    id: 'USR-03',
    username: '523371',
    nama: 'Agus Sutopo',
    role: 'atasan',
    personnelId: 'PERS-002',
    pangkat: 'Kolonel Tek',
    jabatan: 'Paban I/Ren Slog Kaskoopsudnas'
  },
  {
    id: 'USR-04',
    username: '543331',
    nama: 'Saifudin Toyo S',
    role: 'personel',
    personnelId: 'PERS-018',
    pangkat: 'Serka',
    jabatan: 'Ba Adminu Paban III/Sista'
  }
];

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(DEFAULT_USERS[0]);
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Application Data States
  const [personnelList, setPersonnelList] = useState<Personnel[]>([]);
  const [attendanceList, setAttendanceList] = useState<AttendanceRecord[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [corrections, setCorrections] = useState<AttendanceCorrection[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [officeConfig, setOfficeConfig] = useState<OfficeConfig>({
    namaKantor: 'Kantor Staf Logistik Koopsudnas',
    lat: -6.262500,
    lng: 106.891200,
    radiusMaksimalMeter: 3000,
    akurasiThresholdMeter: 100,
    alamat: 'Jl. Komodor Halim Perdanakusuma, Halim Perdanakusuma, Kec. Makasar, Jakarta Timur 13610',
    isConfirmed: true
  });
  const [gasWebhookUrl, setGasWebhookUrl] = useState('');
  const [stats, setStats] = useState<SystemStats>({
    totalPersonnel: 26,
    activePersonnel: 26,
    archivedPersonnel: 0,
    todayPresent: 2,
    todayAbsent: 24,
    categoryBreakdown: { DD: 2, DL: 1, DK: 0, DIK: 0, CT: 0, S: 0, I: 0, TP: 23, BP: 0 },
    pendingLeaveApprovals: 0,
    pendingCorrectionApprovals: 0
  });

  // Track Read Announcements per User for unread badge indicator
  const [readAnnouncementIds, setReadAnnouncementIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem(`read_ann_${DEFAULT_USERS[0].username}`);
      return saved ? new Set(JSON.parse(saved)) : new Set<string>();
    } catch {
      return new Set<string>();
    }
  });

  useEffect(() => {
    if (!currentUser) return;
    try {
      const saved = localStorage.getItem(`read_ann_${currentUser.username}`);
      if (saved) {
        setReadAnnouncementIds(new Set(JSON.parse(saved)));
      } else {
        setReadAnnouncementIds(new Set<string>());
      }
    } catch {
      setReadAnnouncementIds(new Set<string>());
    }
  }, [currentUser?.username]);

  const handleReadAnnouncement = (id: string) => {
    setReadAnnouncementIds(prev => {
      const updated = new Set(prev);
      updated.add(id);
      if (currentUser) {
        localStorage.setItem(`read_ann_${currentUser.username}`, JSON.stringify(Array.from(updated)));
      }
      return updated;
    });
  };

  const handleMarkAllAnnouncementsRead = () => {
    const allIds = announcements.map(a => a.id);
    const updated = new Set(allIds);
    setReadAnnouncementIds(updated);
    if (currentUser) {
      localStorage.setItem(`read_ann_${currentUser.username}`, JSON.stringify(allIds));
    }
  };

  const unreadAnnouncementsCount = announcements.filter(a => !readAnnouncementIds.has(a.id)).length;

  const [isLoading, setIsLoading] = useState(true);
  const [isRecordingAttendance, setIsRecordingAttendance] = useState(false);
  const [attendanceFeedback, setAttendanceFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Fetch all initial data
  const loadAllData = async () => {
    try {
      const [
        statsData,
        personnelData,
        attendanceData,
        announcementData,
        leaveData,
        correctionData,
        officeData,
        logsData,
        gasData
      ] = await Promise.all([
        api.getStats().catch(() => stats),
        api.getPersonnel().catch(() => []),
        api.getAttendance().catch(() => []),
        api.getAnnouncements().catch(() => []),
        api.getLeaveRequests().catch(() => []),
        api.getCorrections().catch(() => []),
        api.getOfficeConfig().catch(() => officeConfig),
        api.getAuditLogs().catch(() => []),
        api.getGasConfig().catch(() => ({ webhookUrl: '', connected: false, totalPersonnelSynced: 26, totalAttendanceSynced: 0 }))
      ]);

      if (statsData) setStats(statsData);
      if (personnelData) setPersonnelList(personnelData);
      if (attendanceData) setAttendanceList(attendanceData);
      if (announcementData) setAnnouncements(announcementData);
      if (leaveData) setLeaveRequests(leaveData);
      if (correctionData) setCorrections(correctionData);
      if (officeData) setOfficeConfig(officeData);
      if (logsData) setAuditLogs(logsData);
      if (gasData) setGasWebhookUrl(gasData.webhookUrl);
    } catch (err) {
      console.error('Error loading initial data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Today's date in YYYY-MM-DD
  const todayDateStr = new Date().toISOString().split('T')[0];

  // User's today attendance record
  const userTodayRecord = currentUser 
    ? attendanceList.find(a => (a.personnelId === currentUser.personnelId || a.personnelNrp === currentUser.username) && a.tanggal === todayDateStr)
    : undefined;

  const todayAttendanceList = attendanceList.filter(a => a.tanggal === todayDateStr);

  // Attendance Clock-in / Clock-out Action
  const handleRecordAttendance = async (
    type: 'masuk' | 'pulang', 
    lat: number, 
    lng: number, 
    isSimulated: boolean = false,
    targetPersonnelId?: string
  ) => {
    if (!currentUser) throw new Error('Pengguna belum masuk.');

    // Determine target personnel ID (default to selected personnel or current user)
    const targetPersonnelIdFinal = targetPersonnelId || currentUser.personnelId || (personnelList[0]?.id || 'PERS-001');

    setIsRecordingAttendance(true);
    setAttendanceFeedback(null);
    try {
      const res = await api.recordAttendance({
        personnelId: targetPersonnelIdFinal,
        type,
        lat,
        lng,
        isSimulated
      });

      setAttendanceFeedback({
        type: 'success',
        message: `${res.message} (Pukul ${res.time} WIB, Jarak: ${res.distanceMeters}m)`
      });

      // Reload data to reflect in counters & tables
      await loadAllData();
      return res;
    } catch (err: any) {
      setAttendanceFeedback({
        type: 'error',
        message: err.message || 'Gagal merekam absensi'
      });
      throw err;
    } finally {
      setIsRecordingAttendance(false);
    }
  };

  // Quick attendance from dashboard (with optional forceOfficeCoords)
  const handleQuickAttendance = async (
    type: 'masuk' | 'pulang', 
    targetPersonnelId?: string, 
    forceOfficeCoords?: boolean
  ) => {
    if (forceOfficeCoords) {
      // Instant office coordinates (~200m from office center inside 3km radius)
      return handleRecordAttendance(type, officeConfig.lat + 0.0018, officeConfig.lng + 0.0015, true, targetPersonnelId);
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          handleRecordAttendance(type, pos.coords.latitude, pos.coords.longitude, false, targetPersonnelId);
        },
        () => {
          // Fallback inside radius
          handleRecordAttendance(type, officeConfig.lat + 0.002, officeConfig.lng + 0.002, true, targetPersonnelId);
        },
        { timeout: 7000 }
      );
    } else {
      handleRecordAttendance(type, officeConfig.lat + 0.002, officeConfig.lng + 0.002, true, targetPersonnelId);
    }
  };

  // Personnel Handlers
  const handleAddPersonnel = async (data: Partial<Personnel>) => {
    await api.addPersonnel({
      ...data,
      actorNama: currentUser?.nama || 'Administrator'
    });
    await loadAllData();
  };

  const handleUpdatePersonnel = async (id: string, data: Partial<Personnel>) => {
    await api.updatePersonnel(id, {
      ...data,
      actorNama: currentUser?.nama || 'Administrator'
    });
    await loadAllData();
  };

  const handleArchivePersonnel = async (id: string, alasan: string) => {
    await api.archivePersonnel(id, alasan, currentUser?.nama || 'Administrator');
    await loadAllData();
  };

  const handleRestorePersonnel = async (id: string) => {
    await api.restorePersonnel(id, currentUser?.nama || 'Administrator');
    await loadAllData();
  };

  const handleTogglePersonnelStatus = async (id: string) => {
    await api.togglePersonnelStatus(id, currentUser?.nama || 'Administrator');
    await loadAllData();
  };

  const handleDeletePersonnel = async (id: string, confirmationName: string, alasan: string) => {
    await api.deletePersonnel(id, confirmationName, alasan, currentUser?.nama || 'Administrator');
    await loadAllData();
  };

  // Announcement Handlers (5-Max FIFO)
  const handleAddAnnouncement = async (judul: string, isi: string) => {
    const res = await api.addAnnouncement(judul, isi, currentUser?.nama || 'Administrator');
    await loadAllData();
    return { purgedOldest: res.purgedOldest };
  };

  const handleUpdateAnnouncement = async (id: string, judul: string, isi: string) => {
    await api.updateAnnouncement(id, judul, isi, currentUser?.nama || 'Administrator');
    await loadAllData();
  };

  const handleDeleteAnnouncement = async (id: string) => {
    await api.deleteAnnouncement(id, currentUser?.nama || 'Administrator');
    await loadAllData();
  };

  // Leave Handlers
  const handleSubmitLeave = async (data: Partial<LeaveRequest>) => {
    await api.submitLeaveRequest(data);
    await loadAllData();
  };

  const handleActionLeave = async (id: string, action: 'approve' | 'reject' | 'revision', catatanAtasan: string) => {
    await api.actionLeaveRequest(id, action, catatanAtasan, currentUser?.nama || 'Pejabat Berwenang', currentUser?.role || 'atasan');
    await loadAllData();
  };

  // Correction Handlers
  const handleSubmitCorrection = async (data: Partial<AttendanceCorrection>) => {
    await api.submitCorrection(data);
    await loadAllData();
  };

  const handleActionCorrection = async (id: string, action: 'approve' | 'reject', catatan: string) => {
    await api.actionCorrection(id, action, catatan, currentUser?.nama || 'Administrator', currentUser?.role || 'admin');
    await loadAllData();
  };

  // GPS Settings
  const handleUpdateOffice = async (config: Partial<OfficeConfig>) => {
    const updated = await api.updateOfficeConfig({
      ...config,
      actorNama: currentUser?.nama || 'Administrator'
    });
    setOfficeConfig(updated);
    await loadAllData();
  };

  // Webhook
  const handleSaveWebhook = async (url: string) => {
    await api.updateGasWebhook(url, currentUser?.nama || 'Administrator');
    setGasWebhookUrl(url);
  };

  // Title for active tab
  const getTabTitle = (tab: NavTab): string => {
    switch (tab) {
      case 'dashboard': return 'Dashboard Utama';
      case 'gps-attendance': return 'Absensi GPS Geofence 3 KM';
      case 'calendar': return 'Kalender Kehadiran Personel';
      case 'history': return 'Riwayat Absensi Individu';
      case 'leave-request': return 'Pengajuan Keterangan Kehadiran';
      case 'correction': return 'Koreksi Absensi Administratif';
      case 'approvals': return 'Persetujuan Atasan (Menunggu)';
      case 'approval-history': return 'Riwayat Keputusan Persetujuan';
      case 'personnel': return 'Manajemen Data Personel (26 Personel)';
      case 'recap': return 'Rekapitulasi Kehadiran Personel';
      case 'reports': return 'Laporan Excel & PDF Kehadiran';
      case 'announcements': return 'Manajemen Pengumuman (Maks 5 FIFO)';
      case 'gps-settings': return 'Pengaturan Koordinat GPS Kantor';
      case 'gas-integration': return 'Google Apps Script & Spreadsheet';
      case 'audit-log': return 'Audit Log & Integritas Rekam Jejak';
      case 'profile': return 'Profil Saya & Keamanan Sesi';
      default: return 'Data Kehadiran Staf Logistik Koopsudnas';
    }
  };

  if (!currentUser) {
    return (
      <LoginModule 
        onLoginSuccess={setCurrentUser} 
        availableUsers={DEFAULT_USERS} 
        allPersonnel={personnelList}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        userRole={currentUser.role}
        pendingApprovalsCount={stats.pendingLeaveApprovals + stats.pendingCorrectionApprovals}
        unreadAnnouncementsCount={unreadAnnouncementsCount}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        onLogout={() => setCurrentUser(null)}
      />

      {/* Main Content Area */}
      <div className="lg:pl-64 flex flex-col flex-1 min-w-0">
        <Header
          currentUser={currentUser}
          onSwitchUser={setCurrentUser}
          availableUsers={DEFAULT_USERS}
          allPersonnel={personnelList}
          pendingApprovalsCount={stats.pendingLeaveApprovals + stats.pendingCorrectionApprovals}
          unreadAnnouncementsCount={unreadAnnouncementsCount}
          announcements={announcements}
          onOpenPendingApprovals={() => setActiveTab('approvals')}
          onOpenAnnouncements={() => setActiveTab('announcements')}
          onReadAnnouncement={handleReadAnnouncement}
          onMarkAllAnnouncementsRead={handleMarkAllAnnouncementsRead}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          activeTabTitle={getTabTitle(activeTab)}
        />

        <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto">
          {activeTab === 'dashboard' && (
            <Dashboard
              stats={stats}
              announcements={announcements}
              currentUser={currentUser}
              todayRecord={userTodayRecord}
              onNavigate={setActiveTab}
              onQuickAttendance={handleQuickAttendance}
              isRecordingAttendance={isRecordingAttendance}
              attendanceFeedback={attendanceFeedback}
              allPersonnel={personnelList}
              todayAttendanceList={todayAttendanceList}
            />
          )}

          {activeTab === 'gps-attendance' && (
            <GpsAttendanceModule
              office={officeConfig}
              currentUser={currentUser}
              allPersonnel={personnelList}
              allAttendanceRecords={attendanceList}
              todayRecord={userTodayRecord}
              onRecordAttendance={handleRecordAttendance}
            />
          )}

          {activeTab === 'calendar' && (
            <CalendarModule
              attendanceList={attendanceList}
              personnelList={personnelList}
            />
          )}

          {activeTab === 'history' && (
            <RecapModule
              attendanceList={attendanceList.filter(a => a.personnelId === currentUser.personnelId || a.personnelNrp === currentUser.username)}
              personnelList={personnelList}
            />
          )}

          {activeTab === 'leave-request' && (
            <LeaveModule
              leaveRequests={leaveRequests}
              allPersonnel={personnelList}
              currentUser={currentUser}
              onSubmitLeave={handleSubmitLeave}
            />
          )}

          {activeTab === 'correction' && (
            <CorrectionModule
              corrections={corrections}
              allPersonnel={personnelList}
              currentUser={currentUser}
              onSubmitCorrection={handleSubmitCorrection}
              onActionCorrection={handleActionCorrection}
              userRole={currentUser.role}
            />
          )}

          {activeTab === 'approvals' && (
            <ApprovalModule
              leaveRequests={leaveRequests}
              currentUser={currentUser}
              onActionRequest={handleActionLeave}
              showHistoryOnly={false}
            />
          )}

          {activeTab === 'approval-history' && (
            <ApprovalModule
              leaveRequests={leaveRequests}
              currentUser={currentUser}
              onActionRequest={handleActionLeave}
              showHistoryOnly={true}
            />
          )}

          {activeTab === 'personnel' && (
            <PersonnelModule
              personnelList={personnelList}
              onAddPersonnel={handleAddPersonnel}
              onUpdatePersonnel={handleUpdatePersonnel}
              onArchivePersonnel={handleArchivePersonnel}
              onRestorePersonnel={handleRestorePersonnel}
              onToggleStatus={handleTogglePersonnelStatus}
              onDeletePersonnel={handleDeletePersonnel}
              userRole={currentUser.role}
            />
          )}

          {activeTab === 'recap' && (
            <RecapModule
              attendanceList={attendanceList}
              personnelList={personnelList}
              showReportsOnly={false}
            />
          )}

          {activeTab === 'reports' && (
            <RecapModule
              attendanceList={attendanceList}
              personnelList={personnelList}
              showReportsOnly={true}
            />
          )}

          {activeTab === 'announcements' && (
            <AnnouncementAdminModule
              announcements={announcements}
              currentUser={currentUser}
              onAddAnnouncement={handleAddAnnouncement}
              onUpdateAnnouncement={handleUpdateAnnouncement}
              onDeleteAnnouncement={handleDeleteAnnouncement}
              readAnnouncementIds={readAnnouncementIds}
              onMarkAsRead={handleReadAnnouncement}
              onMarkAllAsRead={handleMarkAllAnnouncementsRead}
            />
          )}

          {activeTab === 'gps-settings' && (
            <GpsSettingsModule
              office={officeConfig}
              onUpdateOffice={handleUpdateOffice}
              userRole={currentUser.role}
            />
          )}

          {activeTab === 'gas-integration' && (
            <GasIntegrationModule
              webhookUrl={gasWebhookUrl}
              onSaveWebhook={handleSaveWebhook}
              personnelList={personnelList}
              attendanceList={attendanceList}
              announcements={announcements}
              leaveRequests={leaveRequests}
              corrections={corrections}
              auditLogs={auditLogs}
            />
          )}

          {activeTab === 'audit-log' && (
            <AuditLogModule
              logs={auditLogs}
            />
          )}

          {activeTab === 'profile' && (
            <ProfileModule
              currentUser={currentUser}
              onLogout={() => setCurrentUser(null)}
            />
          )}
        </main>
      </div>
    </div>
  );
}
