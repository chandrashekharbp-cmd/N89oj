/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type MeterShiftingStatus = 'SHIFTED' | 'CABLE SHORTAGE' | 'DOOR LOCK' | 'NOT UPDATED';

export interface UpdateHistoryItem {
  id: string;
  timestamp: string;
  action: 'STATUS_CHANGE' | 'DETAILS_EDITED' | 'STATUS_CORRECTION' | 'REMARKS_ADDED' | 'DUPLICATE_REVIEW';
  previousStatus?: string;
  newStatus?: MeterShiftingStatus;
  changedBy: string;
  notes?: string;
  meterNumber?: string;
  oldMeterNumber?: string;
  assignedStaff?: string;
}

export interface Consumer {
  id: string;
  consumerNumber: string;
  consumerName: string;
  address: string;
  section: string;
  irregularityType: string;
  actionTeam: string;
  status: MeterShiftingStatus;
  
  // Shifting update details
  shiftingDate?: string;      // YYYY-MM-DD
  newMeterNumber?: string;
  oldMeterNumber?: string;
  initialReading?: string;
  finalReading?: string;
  assignedStaff?: string;
  remarks?: string;
  
  // Metadata & Audit
  createdAt?: string;
  updatedAt?: string;
  updatedBy?: string;
  history: UpdateHistoryItem[];
  
  // Duplicate detection & review
  isDuplicate?: boolean;
  duplicateNotes?: string;
  isReviewed?: boolean;
}

export interface StaffMember {
  id: string;
  name: string;
  phone?: string;
  role: 'Lineman' | 'Supervisor' | 'MRT Squad' | 'Contractor Squad' | 'Technician';
  team: string;
  assignedCount?: number;
  completedCount?: number;
  pendingCount?: number;
  active: boolean;
}

export interface DashboardStats {
  totalConsumers: number;
  shifted: number;
  cableShortage: number;
  doorLock: number;
  notUpdated: number;
  remainingPending: number;
  completionPercentage: number;
  todayShifted: number;
  duplicateCount: number;
}

export interface SectionStat {
  section: string;
  total: number;
  shifted: number;
  cableShortage: number;
  doorLock: number;
  remainingPending: number;
  percentage: number;
}

export interface IrregularityStat {
  irregularity: string;
  count: number;
  shifted: number;
  cableShortage: number;
  doorLock: number;
  remainingPending: number;
}

export interface StaffStat {
  staffName: string;
  total: number;
  shifted: number;
  cableShortage: number;
  doorLock: number;
  remainingPending: number;
  percentage: number;
}

export type ViewTab =
  | 'dashboard'
  | 'all-consumers'
  | 'shifted'
  | 'cable-shortage'
  | 'door-lock'
  | 'remaining-pending'
  | 'search'
  | 'staff'
  | 'reports'
  | 'backup-settings';

export type ImportMode = 'IMPORT_NEW' | 'UPDATE_EXISTING';

export interface ExcelColumnMapping {
  consumerNumber: string;
  consumerName: string;
  address: string;
  section: string;
  irregularityType: string;
  assignedStaff: string;
}

export interface ExcelPreviewRow {
  consumer: Consumer;
  actionType: 'NEW' | 'UPDATE' | 'UNCHANGED' | 'DUPLICATE_IN_FILE';
  existingRecord?: Consumer;
  changedFields?: string[];
}

export interface ExcelImportPreviewData {
  fileName: string;
  availableSheets: string[];
  selectedSheet: string;
  totalFound: number;
  addedCount: number;
  updatedCount: number;
  unchangedCount: number;
  duplicateCount: number;
  invalidCount: number;
  records: Consumer[];
  sampleRows: ExcelPreviewRow[];
  detectedColumns: string[];
  columnMapping: ExcelColumnMapping;
  mode: ImportMode;
}

