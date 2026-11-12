/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { 
  initializeDatabase, 
  persistConsumerUpdate, 
  persistAllConsumers, 
  persistStaffList, 
  resetDatabaseToPreloaded,
  clearAllConsumerData,
  deleteAllConsumerData,
  flagDuplicates
} from './db/storage';
import { Consumer, StaffMember, ViewTab, DashboardStats, UpdateHistoryItem, ImportMode } from './types';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { DashboardView } from './components/DashboardView';
import { ConsumerListView } from './components/ConsumerListView';
import { SmartSearchView } from './components/SmartSearchView';
import { StaffManagementView } from './components/StaffManagementView';
import { ReportsView } from './components/ReportsView';
import { BackupSettingsView } from './components/BackupSettingsView';
import { UpdateConsumerModal } from './components/UpdateConsumerModal';
import { DuplicateReviewModal } from './components/DuplicateReviewModal';
import { AddConsumerModal } from './components/AddConsumerModal';
import { ExcelImportModal } from './components/ExcelImportModal';
import { DeleteConfirmationModal } from './components/DeleteConfirmationModal';
import { exportConsumersToExcel, readExcelWorkbook, mergeImportedRecords } from './utils/excel';
import * as XLSX from 'xlsx';
import { 
  Plus, 
  CheckCircle, 
  AlertTriangle, 
  X,
  FileSpreadsheet,
  Upload
} from 'lucide-react';

export default function App() {
  const [consumers, setConsumers] = useState<Consumer[]>([]);
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState<ViewTab>('dashboard');

  // Modals state
  const [selectedConsumer, setSelectedConsumer] = useState<Consumer | null>(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Excel Import Preview Modal state
  const [isExcelImportModalOpen, setIsExcelImportModalOpen] = useState(false);
  const [uploadedWorkbook, setUploadedWorkbook] = useState<XLSX.WorkBook | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState('');

  // Delete All Preloaded Data Modal state
  const [isDeleteAllModalOpen, setIsDeleteAllModalOpen] = useState(false);

  // Hidden File input ref for Excel upload
  const excelFileInputRef = useRef<HTMLInputElement | null>(null);

  // Toast Notification
  const [toast, setToast] = useState<{ type: 'success' | 'warning' | 'info'; message: string } | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'warning' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  }, []);

  // Initialize persistent database
  const loadDatabase = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await initializeDatabase();
      setConsumers(data.consumers);
      setStaffList(data.staff);
    } catch (err) {
      console.error('Failed to load database:', err);
      showToast('Error loading database, using local fallback', 'warning');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadDatabase();
  }, [loadDatabase]);

  // Compute Live Dashboard Statistics (Shifted, Cable Shortage, Door Lock, Remaining Pending)
  const stats: DashboardStats = useMemo(() => {
    const total = consumers.length;
    const shifted = consumers.filter(c => c.status === 'SHIFTED').length;
    const cableShortage = consumers.filter(c => c.status === 'CABLE SHORTAGE').length;
    const doorLock = consumers.filter(c => c.status === 'DOOR LOCK').length;
    const notUpdated = consumers.filter(c => c.status === 'NOT UPDATED').length;
    
    // Remaining Pending = Total Consumers - Shifted (includes Cable Shortage + Door Lock + Not Updated)
    const remainingPending = total - shifted;
    
    const percentage = total > 0 ? Math.round((shifted / total) * 100) : 0;
    
    // Today's shifting count
    const todayStr = new Date().toISOString().split('T')[0];
    const todayCount = consumers.filter(
      c => c.status === 'SHIFTED' && c.shiftingDate === todayStr
    ).length;

    const duplicateCount = consumers.filter(c => c.isDuplicate).length;

    return {
      totalConsumers: total,
      shifted,
      cableShortage,
      doorLock,
      notUpdated,
      remainingPending,
      completionPercentage: percentage,
      todayShifted: todayCount,
      duplicateCount
    };
  }, [consumers]);

  // Handle Save Update (SHIFTED, CABLE SHORTAGE, DOOR LOCK, or NOT UPDATED)
  const handleSaveUpdate = async (updatedConsumer: Consumer, historyItem: UpdateHistoryItem) => {
    try {
      const saved = await persistConsumerUpdate(updatedConsumer, historyItem);
      
      setConsumers(prev => {
        const next = prev.map(c => (c.id === saved.id ? saved : c));
        return flagDuplicates(next);
      });

      if (saved.status === 'SHIFTED') {
        showToast(`Meter Shifting recorded for Consumer ${saved.consumerNumber} (${saved.consumerName})! Moved to Shifted List.`, 'success');
      } else if (saved.status === 'CABLE SHORTAGE') {
        showToast(`Consumer ${saved.consumerNumber} recorded as CABLE SHORTAGE. Retained in Pending List.`, 'warning');
      } else if (saved.status === 'DOOR LOCK') {
        showToast(`Consumer ${saved.consumerNumber} recorded as DOOR LOCK. Retained in Pending List.`, 'warning');
      } else {
        showToast(`Consumer ${saved.consumerNumber} reset to NOT UPDATED with audit record.`, 'info');
      }
    } catch (err) {
      console.error('Failed to save update:', err);
      showToast('Failed to save update to database', 'warning');
    }
  };

  // Open Update Modal for a consumer
  const handleOpenUpdateModal = (consumer: Consumer) => {
    setSelectedConsumer(consumer);
    setIsUpdateModalOpen(true);
  };

  // Trigger file selection for Excel Import
  const handleTriggerExcelImport = () => {
    if (excelFileInputRef.current) {
      excelFileInputRef.current.value = '';
      excelFileInputRef.current.click();
    }
  };

  // Handle Excel file chosen
  const handleExcelFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const info = await readExcelWorkbook(file);
      setUploadedWorkbook(info.workbook);
      setUploadedFileName(info.fileName);
      setIsExcelImportModalOpen(true);
    } catch (err: any) {
      alert(`Could not open Excel file: ${err.message || 'Invalid format'}`);
    }
  };

  // Handle Confirm Import from Preview Modal (Supports Option A & Option B with status protection)
  const handleConfirmExcelImport = async (
    importedRecords: Consumer[], 
    preserveExistingStatus: boolean,
    mode: ImportMode = 'UPDATE_EXISTING'
  ) => {
    try {
      const merged = mergeImportedRecords(importedRecords, consumers, preserveExistingStatus, mode);
      const flagged = flagDuplicates(merged);
      setConsumers(flagged);
      await persistAllConsumers(flagged);
      if (mode === 'IMPORT_NEW') {
        showToast(`Successfully added new consumers from Excel! Existing records preserved.`, 'success');
      } else {
        showToast(`Updated consumer details from Excel. All SHIFTED, CABLE SHORTAGE & DOOR LOCK statuses 100% protected!`, 'success');
      }
    } catch (err: any) {
      console.error('Import error:', err);
      showToast('Failed to save imported Excel records', 'warning');
    }
  };

  // Handle Clear All Consumer Data
  const handleConfirmDeleteAll = async (downloadSafetyBackup: boolean) => {
    if (downloadSafetyBackup && consumers.length > 0) {
      const backupData = {
        app: 'METER_SHIFTING_MANAGEMENT_TPWODL_TITLAGARH',
        version: '2.0.0',
        exportedAt: new Date().toISOString(),
        section: 'Titlagarh Section',
        totalRecords: consumers.length,
        consumers,
        staff: staffList
      };
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `TPWODL_Safety_Backup_Before_Delete_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }

    await clearAllConsumerData();
    setConsumers([]);
    showToast('All consumer data cleared. Dashboard & lists reset to zero.', 'info');
  };

  // Handle Factory Re-seed
  const handleResetToPreloaded = async () => {
    setIsLoading(true);
    try {
      const res = await resetDatabaseToPreloaded();
      setConsumers(res.consumers);
      setStaffList(res.staff);
      showToast('Reset to original 374 preloaded records from Meter shift.xlsx (Sheet2)', 'info');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Add New Consumer
  const handleAddConsumer = async (newConsumer: Consumer) => {
    const updatedList = [newConsumer, ...consumers];
    const flagged = flagDuplicates(updatedList);
    setConsumers(flagged);
    await persistAllConsumers(flagged);
    showToast(`Added new consumer ${newConsumer.consumerNumber} to database!`, 'success');
  };

  // Handle Staff updates
  const handleAddStaff = async (newStaff: StaffMember) => {
    const updated = [...staffList, newStaff];
    setStaffList(updated);
    await persistStaffList(updated);
    showToast(`Staff member "${newStaff.name}" added successfully`, 'success');
  };

  const handleUpdateStaff = async (updatedMember: StaffMember) => {
    const updated = staffList.map(s => (s.id === updatedMember.id ? updatedMember : s));
    setStaffList(updated);
    await persistStaffList(updated);
    showToast(`Staff member "${updatedMember.name}" updated`, 'success');
  };

  // Quick navigation to filtered staff view
  const handleFilterByStaff = (staffName: string) => {
    setCurrentTab('all-consumers');
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-['Plus_Jakarta_Sans',sans-serif] selection:bg-amber-400 selection:text-slate-950">
      
      {/* Hidden file input for Excel upload across Dashboard and Settings */}
      <input
        type="file"
        ref={excelFileInputRef}
        onChange={handleExcelFileSelected}
        accept=".xlsx,.xls"
        className="hidden"
      />

      {/* Toast Notification Banner */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 animate-bounce duration-300">
          <div className={`px-4 py-2.5 rounded-xl shadow-lg border text-xs sm:text-sm font-bold flex items-center gap-2 ${
            toast.type === 'success' 
              ? 'bg-emerald-700 text-white border-emerald-600' 
              : (toast.type === 'warning' ? 'bg-amber-500 text-slate-950 border-amber-600' : 'bg-[#0d3b66] text-white border-blue-900')
          }`}>
            {toast.type === 'success' && <CheckCircle className="w-4 h-4 text-emerald-300 shrink-0" />}
            {toast.type === 'warning' && <AlertTriangle className="w-4 h-4 text-slate-950 shrink-0" />}
            <span>{toast.message}</span>
            <button onClick={() => setToast(null)} className="ml-1 opacity-70 hover:opacity-100 cursor-pointer">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Official Header */}
      <Header
        stats={stats}
        isOfflineReady={true}
        onRefresh={loadDatabase}
        onOpenDuplicates={() => setIsDuplicateModalOpen(true)}
      />

      {/* Main Navigation (Dashboard + 5 Separate Lists + Tools) */}
      <Navigation
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        stats={stats}
      />

      {/* Main Body Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-6">
        
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-500">
            <div className="w-10 h-10 border-4 border-[#0d3b66] border-t-amber-400 rounded-full animate-spin mb-3" />
            <p className="font-bold text-sm text-slate-700">Loading TPWODL Database...</p>
            <p className="text-xs text-slate-400 mt-1">Connecting persistent offline storage</p>
          </div>
        ) : (
          <>
            {/* 1. DASHBOARD */}
            {currentTab === 'dashboard' && (
              <DashboardView
                stats={stats}
                consumers={consumers}
                onNavigate={setCurrentTab}
                onOpenConsumer={handleOpenUpdateModal}
                onOpenDuplicates={() => setIsDuplicateModalOpen(true)}
                onExportExcel={() => exportConsumersToExcel(consumers, 'TPWODL_Titlagarh_All_Consumers', 'All Consumers')}
                onOpenImportExcel={handleTriggerExcelImport}
              />
            )}

            {/* 2. ALL CONSUMERS */}
            {currentTab === 'all-consumers' && (
              <ConsumerListView
                title="All Consumers"
                subtitle="Complete database of all consumer records in Titlagarh Section"
                filterMode="ALL"
                consumers={consumers}
                onUpdateClick={handleOpenUpdateModal}
                onOpenDuplicates={() => setIsDuplicateModalOpen(true)}
                onOpenImportExcel={handleTriggerExcelImport}
              />
            )}

            {/* 3. SHIFTED LIST (Green) */}
            {currentTab === 'shifted' && (
              <ConsumerListView
                title="Shifted List (Completed)"
                subtitle="Consumers whose meter shifting has been completed and verified"
                filterMode="SHIFTED"
                consumers={consumers}
                onUpdateClick={handleOpenUpdateModal}
                onOpenDuplicates={() => setIsDuplicateModalOpen(true)}
                onOpenImportExcel={handleTriggerExcelImport}
              />
            )}

            {/* 4. CABLE SHORTAGE LIST (Orange) */}
            {currentTab === 'cable-shortage' && (
              <ConsumerListView
                title="Cable Shortage List"
                subtitle="Field impediment: Consumers awaiting armored service cable allotment"
                filterMode="CABLE SHORTAGE"
                consumers={consumers}
                onUpdateClick={handleOpenUpdateModal}
                onOpenDuplicates={() => setIsDuplicateModalOpen(true)}
                onOpenImportExcel={handleTriggerExcelImport}
              />
            )}

            {/* 5. DOOR LOCK LIST (Red) */}
            {currentTab === 'door-lock' && (
              <ConsumerListView
                title="Door Lock List"
                subtitle="Field impediment: Premises locked during inspection; revisit required"
                filterMode="DOOR LOCK"
                consumers={consumers}
                onUpdateClick={handleOpenUpdateModal}
                onOpenDuplicates={() => setIsDuplicateModalOpen(true)}
                onOpenImportExcel={handleTriggerExcelImport}
              />
            )}

            {/* 6. REMAINING PENDING LIST */}
            {currentTab === 'remaining-pending' && (
              <ConsumerListView
                title="Remaining Pending List"
                subtitle="All pending meter shifts (Includes Cable Shortage, Door Lock, and Not Updated)"
                filterMode="REMAINING PENDING"
                consumers={consumers}
                onUpdateClick={handleOpenUpdateModal}
                onOpenDuplicates={() => setIsDuplicateModalOpen(true)}
                onOpenImportExcel={handleTriggerExcelImport}
              />
            )}

            {/* 7. SMART SEARCH */}
            {currentTab === 'search' && (
              <SmartSearchView
                consumers={consumers}
                onUpdateClick={handleOpenUpdateModal}
              />
            )}

            {/* 8. STAFF TRACKING */}
            {currentTab === 'staff' && (
              <StaffManagementView
                staffList={staffList}
                consumers={consumers}
                onAddStaff={handleAddStaff}
                onUpdateStaff={handleUpdateStaff}
                onFilterByStaff={handleFilterByStaff}
              />
            )}

            {/* 9. REPORTS */}
            {currentTab === 'reports' && (
              <ReportsView
                consumers={consumers}
                onOpenConsumer={handleOpenUpdateModal}
              />
            )}

            {/* 10. BACKUP & SETTINGS */}
            {currentTab === 'backup-settings' && (
              <BackupSettingsView
                consumers={consumers}
                staffList={staffList}
                onOpenImportExcel={handleTriggerExcelImport}
                onOpenDeleteAllModal={() => setIsDeleteAllModalOpen(true)}
                onRestoreBackup={async (data) => {
                  const flagged = flagDuplicates(data.consumers);
                  setConsumers(flagged);
                  setStaffList(data.staff);
                  await persistAllConsumers(flagged);
                  await persistStaffList(data.staff);
                  showToast(`Restored ${flagged.length} consumers from backup!`, 'success');
                }}
                onResetToPreloaded={handleResetToPreloaded}
                onOpenDuplicates={() => setIsDuplicateModalOpen(true)}
              />
            )}
          </>
        )}

      </main>

      {/* Floating Action Button (FAB) for adding a consumer */}
      <div className="fixed right-4 bottom-20 md:bottom-6 z-20">
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-4 py-3 bg-[#0d3b66] hover:bg-blue-900 text-white rounded-full shadow-2xl font-bold text-xs sm:text-sm border-2 border-amber-400 active:scale-95 transition cursor-pointer"
          title="Add New Consumer Record"
        >
          <Plus className="w-5 h-5 text-amber-400" />
          <span className="hidden sm:inline">Add Consumer</span>
        </button>
      </div>

      {/* Modal 1: Update Consumer Detail Modal */}
      {isUpdateModalOpen && selectedConsumer && (
        <UpdateConsumerModal
          consumer={selectedConsumer}
          isOpen={isUpdateModalOpen}
          onClose={() => setIsUpdateModalOpen(false)}
          onSaveUpdate={handleSaveUpdate}
          staffList={staffList}
        />
      )}

      {/* Modal 2: Excel Import Preview Modal */}
      {isExcelImportModalOpen && uploadedWorkbook && (
        <ExcelImportModal
          isOpen={isExcelImportModalOpen}
          onClose={() => {
            setIsExcelImportModalOpen(false);
            setUploadedWorkbook(null);
          }}
          workbook={uploadedWorkbook}
          fileName={uploadedFileName}
          existingConsumers={consumers}
          onConfirmImport={handleConfirmExcelImport}
        />
      )}

      {/* Modal 3: Delete All Preloaded Data Confirmation Modal */}
      {isDeleteAllModalOpen && (
        <DeleteConfirmationModal
          isOpen={isDeleteAllModalOpen}
          onClose={() => setIsDeleteAllModalOpen(false)}
          onConfirmDelete={handleConfirmDeleteAll}
          consumerCount={consumers.length}
        />
      )}

      {/* Modal 4: Duplicate Review Hub Modal */}
      {isDuplicateModalOpen && (
        <DuplicateReviewModal
          isOpen={isDuplicateModalOpen}
          onClose={() => setIsDuplicateModalOpen(false)}
          consumers={consumers}
          onUpdateConsumer={handleSaveUpdate}
          onOpenUpdateModal={handleOpenUpdateModal}
        />
      )}

      {/* Modal 5: Manual Add Consumer Modal */}
      {isAddModalOpen && (
        <AddConsumerModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onAddConsumer={handleAddConsumer}
          staffList={staffList}
        />
      )}

    </div>
  );
}
