/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Database, 
  Upload, 
  Download, 
  FileSpreadsheet, 
  RefreshCcw, 
  Trash2, 
  CheckCircle2, 
  HardDrive, 
  AlertTriangle,
  FileDown,
  ShieldCheck,
  Cable,
  Lock,
  Layers
} from 'lucide-react';
import { Consumer, StaffMember } from '../types';
import { exportConsumersToExcel, downloadExcelTemplate } from '../utils/excel';

interface BackupSettingsViewProps {
  consumers: Consumer[];
  staffList: StaffMember[];
  onOpenImportExcel: () => void;
  onOpenDeleteAllModal: () => void;
  onRestoreBackup: (backupData: { consumers: Consumer[]; staff: StaffMember[] }) => void;
  onResetToPreloaded: () => void;
  onOpenDuplicates: () => void;
}

export const BackupSettingsView: React.FC<BackupSettingsViewProps> = ({
  consumers,
  staffList,
  onOpenImportExcel,
  onOpenDeleteAllModal,
  onRestoreBackup,
  onResetToPreloaded,
  onOpenDuplicates
}) => {
  const jsonInputRef = React.useRef<HTMLInputElement | null>(null);

  // Handle JSON Backup download
  const handleDownloadBackup = () => {
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
    a.download = `TPWODL_Titlagarh_DB_Backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Handle JSON Backup restore
  const handleJsonRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (!parsed.consumers || !Array.isArray(parsed.consumers)) {
          throw new Error('Invalid backup file structure: missing consumers array');
        }

        const confirmRestore = window.confirm(
          `Restore backup from ${parsed.exportedAt || 'previous file'} with ${parsed.consumers.length} consumers? This will update the local database.`
        );

        if (confirmRestore) {
          onRestoreBackup({
            consumers: parsed.consumers,
            staff: parsed.staff || staffList
          });
          alert('Database restored successfully from backup file!');
        }
      } catch (err: any) {
        alert(`Restore failed: ${err.message}`);
      }
    };
    reader.readAsText(file);
    if (jsonInputRef.current) jsonInputRef.current.value = '';
  };

  const handleExportFullExcel = () => {
    exportConsumersToExcel(
      consumers,
      `TPWODL_Titlagarh_Full_Database_${new Date().toISOString().split('T')[0]}`,
      'All Consumers'
    );
  };

  const handleConfirmReset = () => {
    const proceed = window.confirm(
      'Are you sure you want to re-seed the database with the original 374 consumer records from "Meter shift.xlsx"? All changes will be reset to factory defaults.'
    );
    if (proceed) {
      onResetToPreloaded();
    }
  };

  const duplicateCount = consumers.filter(c => c.isDuplicate).length;
  const shiftedCount = consumers.filter(c => c.status === 'SHIFTED').length;
  const cableCount = consumers.filter(c => c.status === 'CABLE SHORTAGE').length;
  const lockCount = consumers.filter(c => c.status === 'DOOR LOCK').length;

  return (
    <div className="space-y-5 pb-12">
      
      {/* Top Banner */}
      <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-[#0d3b66]" />
            <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
              Settings, Excel Import & Data Operations
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Offline database engine (IndexedDB + Storage Mirror). Manage Excel sheets, backups, and data.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Persistent Offline Active</span>
          </span>
        </div>
      </div>

      {/* Diagnostics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
            Total Records
          </span>
          <span className="text-xl sm:text-2xl font-black text-slate-900 mt-1 block">
            {consumers.length}
          </span>
          <span className="text-[11px] text-slate-500">In Local Storage</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-emerald-200 shadow-xs">
          <span className="text-[10px] text-emerald-700 uppercase font-bold tracking-wider block">
            Shifted
          </span>
          <span className="text-xl sm:text-2xl font-black text-emerald-700 mt-1 block">
            {shiftedCount}
          </span>
          <span className="text-[11px] text-emerald-600">Completed Work</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-amber-200 shadow-xs">
          <span className="text-[10px] text-amber-700 uppercase font-bold tracking-wider block">
            Cable Shortage
          </span>
          <span className="text-xl sm:text-2xl font-black text-amber-800 mt-1 block">
            {cableCount}
          </span>
          <span className="text-[11px] text-amber-700">Impediment Flag</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-red-200 shadow-xs">
          <span className="text-[10px] text-red-700 uppercase font-bold tracking-wider block">
            Door Lock
          </span>
          <span className="text-xl sm:text-2xl font-black text-red-700 mt-1 block">
            {lockCount}
          </span>
          <span className="text-[11px] text-red-600">Premises Locked</span>
        </div>
      </div>

      {/* SECTION 1: EXCEL IMPORT SYSTEM */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-700" />
            <h3 className="font-black text-slate-900 text-base">
              Excel Import System
            </h3>
          </div>
          <span className="text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-full font-bold">
            Multi-Sheet & Preview Supported
          </span>
        </div>
        
        <p className="text-xs text-slate-600 leading-relaxed">
          Upload any meter data Excel file (<strong>.xlsx</strong> or <strong>.xls</strong>). Automatically reads sheets, maps columns (<em>Consumer Number, Name, Address, Section, Irregularities, Staff</em>), provides record preview, detects duplicate numbers, and preserves your existing shifted work.
        </p>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <button
              onClick={downloadExcelTemplate}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition cursor-pointer"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>Download Excel Template</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Prominent IMPORT EXCEL Button in Settings */}
            <button
              onClick={onOpenImportExcel}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs sm:text-sm font-extrabold transition shadow-sm cursor-pointer active:scale-95"
            >
              <Upload className="w-4 h-4 text-emerald-200" />
              <span>IMPORT EXCEL FILE</span>
            </button>
          </div>
        </div>

      </div>

      {/* SECTION 2: EMPTY DATABASE MANAGEMENT - CLEAR ALL CONSUMER DATA */}
      <div className="bg-white rounded-xl border-2 border-red-300 shadow-xs p-5 space-y-3.5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 text-red-600">
            <Trash2 className="w-5 h-5 text-red-600" />
            <h3 className="font-black text-red-950 text-base">
              Clear All Consumer Data (Empty Database)
            </h3>
          </div>
          <span className="text-xs bg-red-100 text-red-800 font-extrabold px-2.5 py-0.5 rounded-full">
            Confirmation Warning
          </span>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          Removes all consumer records from the persistent database and resets all dashboard statistics to zero. Clears the Pending, Shifted, Cable Shortage, and Door Lock lists so you can start fresh or import an updated Excel file. 
          <strong className="text-slate-900 block mt-1">Staff profiles and application settings are preserved.</strong>
        </p>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2 border-t border-red-100">
          <span className="text-xs text-slate-500">
            Current consumer records: <strong className="text-slate-900">{consumers.length}</strong>
          </span>

          {/* Dedicated CLEAR ALL CONSUMER DATA Button */}
          <button
            onClick={onOpenDeleteAllModal}
            className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs sm:text-sm font-black transition shadow-sm cursor-pointer active:scale-95"
          >
            <Trash2 className="w-4 h-4" />
            <span>CLEAR ALL CONSUMER DATA</span>
          </button>
        </div>
      </div>

      {/* SECTION 3: BACKUP, EXPORT & RESET */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Full Excel Export */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-3">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-700" />
            <h3 className="font-bold text-slate-900 text-sm">
              Export Complete Database to Excel
            </h3>
          </div>
          <p className="text-xs text-slate-500">
            Export all {consumers.length} consumer records, with shifting dates, new meter numbers, readings, and staff assignments into a styled .xlsx spreadsheet.
          </p>
          <button
            onClick={handleExportFullExcel}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl transition shadow-xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Full Database Excel (.xlsx)</span>
          </button>
        </div>

        {/* Offline JSON Backup & Device Transfer */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-3">
          <div className="flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-[#0d3b66]" />
            <h3 className="font-bold text-slate-900 text-sm">
              Full Backup & Device-to-Device Sync
            </h3>
          </div>
          <p className="text-xs text-slate-500">
            Export a full JSON backup to transfer data to another supervisor's device offline.
          </p>
          
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleDownloadBackup}
              className="flex items-center justify-center gap-1.5 py-2 bg-[#0d3b66] hover:bg-blue-900 text-white font-bold text-xs rounded-xl transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              <span>Export Backup</span>
            </button>

            <input
              type="file"
              ref={jsonInputRef}
              onChange={handleJsonRestore}
              accept=".json"
              className="hidden"
            />

            <button
              onClick={() => jsonInputRef.current?.click()}
              className="flex items-center justify-center gap-1.5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl transition cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-emerald-400" />
              <span>Restore Backup</span>
            </button>
          </div>
        </div>

      </div>

      {/* SECTION 4: EXCEL TEMPLATE DOWNLOAD */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 text-slate-700">
            <FileSpreadsheet className="w-5 h-5 text-emerald-700" />
            <h3 className="font-bold text-slate-900 text-sm">
              TPWODL Standard Excel Template
            </h3>
          </div>
          <button
            onClick={downloadExcelTemplate}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-bold transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-emerald-700" />
            <span>Download Sample Template (.xlsx)</span>
          </button>
        </div>
        <p className="text-xs text-slate-500">
          Download a formatted sample spreadsheet with the official column headers (Consumer Number, Consumer Name, Address, Section, Types of Irregularities, Assigned Staff) for easy field data collection.
        </p>
      </div>

    </div>
  );
};
