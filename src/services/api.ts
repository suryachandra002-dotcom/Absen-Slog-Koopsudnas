import { 
  Personnel, 
  AttendanceRecord, 
  Announcement, 
  LeaveRequest, 
  AttendanceCorrection, 
  OfficeConfig, 
  AuditLog, 
  SystemStats 
} from '../types';

const BASE_URL = '';

export const api = {
  // Stats
  async getStats(): Promise<SystemStats> {
    const res = await fetch(`${BASE_URL}/api/stats`);
    if (!res.ok) throw new Error('Gagal mengambil data statistik');
    return res.json();
  },

  // Server Health & Time
  async getHealth(): Promise<{ serverTimeWIB: string; isoWIB: string }> {
    const res = await fetch(`${BASE_URL}/api/health`);
    if (!res.ok) throw new Error('Gagal memeriksa status server');
    return res.json();
  },

  // Personnel
  async getPersonnel(params?: { status?: string; unit?: string; search?: string }): Promise<Personnel[]> {
    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
    if (params?.unit) query.append('unit', params.unit);
    if (params?.search) query.append('search', params.search);
    const res = await fetch(`${BASE_URL}/api/personnel?${query.toString()}`);
    if (!res.ok) throw new Error('Gagal mengambil data personel');
    return res.json();
  },

  async addPersonnel(data: Partial<Personnel> & { actorNama?: string; actorId?: string }): Promise<Personnel> {
    const res = await fetch(`${BASE_URL}/api/personnel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Gagal menambahkan personel');
    }
    return res.json();
  },

  async updatePersonnel(id: string, data: Partial<Personnel> & { actorNama?: string; actorId?: string }): Promise<Personnel> {
    const res = await fetch(`${BASE_URL}/api/personnel/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Gagal memperbarui data personel');
    }
    return res.json();
  },

  async archivePersonnel(id: string, alasan: string, actorNama: string): Promise<any> {
    const res = await fetch(`${BASE_URL}/api/personnel/${id}/archive`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ alasan, actorNama })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Gagal mengarsipkan personel');
    }
    return res.json();
  },

  async restorePersonnel(id: string, actorNama: string): Promise<any> {
    const res = await fetch(`${BASE_URL}/api/personnel/${id}/restore`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actorNama })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Gagal memulihkan personel');
    }
    return res.json();
  },

  async togglePersonnelStatus(id: string, actorNama: string): Promise<any> {
    const res = await fetch(`${BASE_URL}/api/personnel/${id}/toggle-status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actorNama })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Gagal mengubah status personel');
    }
    return res.json();
  },

  async deletePersonnel(id: string, confirmationName: string, alasan: string, actorNama: string): Promise<any> {
    const res = await fetch(`${BASE_URL}/api/personnel/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ confirmationName, alasan, actorNama })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Gagal menghapus personel');
    }
    return res.json();
  },

  // Attendance
  async getAttendance(params?: { date?: string; month?: string; personnelId?: string; unit?: string }): Promise<AttendanceRecord[]> {
    const query = new URLSearchParams();
    if (params?.date) query.append('date', params.date);
    if (params?.month) query.append('month', params.month);
    if (params?.personnelId) query.append('personnelId', params.personnelId);
    if (params?.unit) query.append('unit', params.unit);
    const res = await fetch(`${BASE_URL}/api/attendance?${query.toString()}`);
    if (!res.ok) throw new Error('Gagal mengambil data kehadiran');
    return res.json();
  },

  async recordAttendance(data: {
    personnelId: string;
    type: 'masuk' | 'pulang';
    lat: number;
    lng: number;
    isSimulated?: boolean;
  }): Promise<{ success: boolean; message: string; time: string; distanceMeters: number }> {
    const res = await fetch(`${BASE_URL}/api/attendance/record`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Gagal mencatat absensi');
    }
    return res.json();
  },

  // Announcements (Max 5 FIFO)
  async getAnnouncements(): Promise<Announcement[]> {
    const res = await fetch(`${BASE_URL}/api/announcements`);
    if (!res.ok) throw new Error('Gagal mengambil daftar pengumuman');
    return res.json();
  },

  async addAnnouncement(judul: string, isi: string, adminNama: string): Promise<{ announcement: Announcement; totalCount: number; purgedOldest: string | null }> {
    const res = await fetch(`${BASE_URL}/api/announcements`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ judul, isi, adminNama })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Gagal menambahkan pengumuman');
    }
    return res.json();
  },

  async updateAnnouncement(id: string, judul: string, isi: string, adminNama: string): Promise<Announcement> {
    const res = await fetch(`${BASE_URL}/api/announcements/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ judul, isi, adminNama })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Gagal memperbarui pengumuman');
    }
    return res.json();
  },

  async deleteAnnouncement(id: string, adminNama: string): Promise<any> {
    const res = await fetch(`${BASE_URL}/api/announcements/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminNama })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Gagal menghapus pengumuman');
    }
    return res.json();
  },

  // Leave Requests
  async getLeaveRequests(params?: { personnelId?: string; status?: string }): Promise<LeaveRequest[]> {
    const query = new URLSearchParams();
    if (params?.personnelId) query.append('personnelId', params.personnelId);
    if (params?.status) query.append('status', params.status);
    const res = await fetch(`${BASE_URL}/api/leave-requests?${query.toString()}`);
    if (!res.ok) throw new Error('Gagal mengambil pengajuan izin');
    return res.json();
  },

  async submitLeaveRequest(data: Partial<LeaveRequest>): Promise<LeaveRequest> {
    const res = await fetch(`${BASE_URL}/api/leave-requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Gagal mengajukan permohonan keterangan');
    }
    return res.json();
  },

  async actionLeaveRequest(id: string, action: 'approve' | 'reject' | 'revision', catatanAtasan: string, approverNama: string, approverRole: string): Promise<LeaveRequest> {
    const res = await fetch(`${BASE_URL}/api/leave-requests/${id}/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, catatanAtasan, approverNama, approverRole })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Gagal memproses persetujuan');
    }
    return res.json();
  },

  // Corrections
  async getCorrections(): Promise<AttendanceCorrection[]> {
    const res = await fetch(`${BASE_URL}/api/corrections`);
    if (!res.ok) throw new Error('Gagal mengambil data koreksi absensi');
    return res.json();
  },

  async submitCorrection(data: Partial<AttendanceCorrection>): Promise<AttendanceCorrection> {
    const res = await fetch(`${BASE_URL}/api/corrections`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Gagal mengajukan koreksi');
    }
    return res.json();
  },

  async actionCorrection(id: string, action: 'approve' | 'reject', catatanPemeriksa: string, approverNama: string, approverRole: string): Promise<AttendanceCorrection> {
    const res = await fetch(`${BASE_URL}/api/corrections/${id}/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, catatanPemeriksa, approverNama, approverRole })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Gagal memproses tindakan koreksi');
    }
    return res.json();
  },

  // Settings
  async getOfficeConfig(): Promise<OfficeConfig> {
    const res = await fetch(`${BASE_URL}/api/settings/office`);
    if (!res.ok) throw new Error('Gagal mengambil pengaturan kantor');
    return res.json();
  },

  async updateOfficeConfig(config: Partial<OfficeConfig> & { actorNama?: string }): Promise<OfficeConfig> {
    const res = await fetch(`${BASE_URL}/api/settings/office`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Gagal memperbarui pengaturan kantor');
    }
    return res.json();
  },

  // Audit Logs
  async getAuditLogs(limit: number = 100): Promise<AuditLog[]> {
    const res = await fetch(`${BASE_URL}/api/audit-logs?limit=${limit}`);
    if (!res.ok) throw new Error('Gagal mengambil audit log');
    return res.json();
  },

  // GAS Sync Config
  async getGasConfig(): Promise<{ webhookUrl: string; connected: boolean; totalPersonnelSynced: number; totalAttendanceSynced: number }> {
    const res = await fetch(`${BASE_URL}/api/gas/config`);
    if (!res.ok) throw new Error('Gagal mengambil konfigurasi Google Spreadsheet');
    return res.json();
  },

  async updateGasWebhook(webhookUrl: string, actorNama: string): Promise<any> {
    const res = await fetch(`${BASE_URL}/api/gas/config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ webhookUrl, actorNama })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Gagal menyimpan Webhook Google Apps Script');
    }
    return res.json();
  }
};
