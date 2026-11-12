/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { 
  FileSpreadsheet, 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  Upload, 
  Layers, 
  HelpCircle,
  FileCheck,
  ShieldCheck,
  SlidersHorizontal,
  RefreshCw,
  PlusCircle,
  Check,
  Info
} from 'lucide-react';
import { Consumer, ExcelColumnMapping, ImportMode, ExcelImportPreviewData } from '../types';
import * as XLSX from 'xlsx';
import { detectExcelColumns, previewExcelSheetWithMapping } from '../utils/excel';

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  workbook: XLSX.WorkBook | null;
  fileName: string;
  existingConsumers: Consumer[];
  onConfirmImport: (imported: Consumer[], preserveExistingStatus: boolean, mode: ImportMode) => void;
}

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({
  isOpen,
  onClose,
  workbook,
  fileName,
  existingConsumers,
  onConfirmImport
}) => {
  // All hooks declared at top level
  const sheetNames = useMemo(() => {
    if (!workbook) return [];
    return workbook.SheetNames || ['Sheet1'];
  }, [workbook]);

  // Default to Sheet2 if present or first sheet
  const defaultSheet = useMemo(() => {
    if (!sheetNames.length) return '';
    const s2 = sheetNames.find(s => s.toLowerCase().includes('sheet2'));
    return s2 || sheetNames[0];
  }, [sheetNames]);

  const [selectedSheet, setSelectedSheet] = useState<string>(defaultSheet);
  const [importMode, setImportMode] = useState<ImportMode>('UPDATE_EXISTING');
  const [showMappingEditor, setShowMappingEditor] = useState<boolean>(true);

  // Column mapping state
  const [columnMapping, setColumnMapping] = useState<ExcelColumnMapping>({
    consumerNumber: '',
    consumerName: '',
    address: '',
    section: '',
    irregularityType: '',
    assignedStaff: ''
  });

  const [detectedColumns, setDetectedColumns] = useState<string[]>([]);

  // Update selected sheet when default sheet changes
  useEffect(() => {
    if (defaultSheet) {
      setSelectedSheet(defaultSheet);
    }
  }, [defaultSheet]);

  // Auto-detect columns whenever workbook or sheet changes
  useEffect(() => {
    if (!workbook || !selectedSheet) return;
    const worksheet = workbook.Sheets[selectedSheet];
    if (worksheet) {
      const { columns, suggestedMapping } = detectExcelColumns(worksheet);
      setDetectedColumns(columns);
      setColumnMapping(suggestedMapping);
    }
  }, [workbook, selectedSheet]);

  // Compute live preview based on selected sheet, mapping, and import mode
  const previewData: ExcelImportPreviewData | null = useMemo(() => {
    if (!workbook || !selectedSheet) return null;
    try {
      return previewExcelSheetWithMapping(
        workbook,
        selectedSheet,
        fileName,
        existingConsumers,
        columnMapping,
        importMode
      );
    } catch (err) {
      console.error('Failed to preview sheet:', err);
      return null;
    }
  }, [workbook, selectedSheet, fileName, existingConsumers, columnMapping, importMode]);

  // Handle column map change
  const handleMapField = (field: keyof ExcelColumnMapping, value: string) => {
    setColumnMapping(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (!isOpen || !workbook) return null;

  const handleImport = () => {
    if (!previewData || previewData.records.length === 0) {
      alert('No valid consumer records found in selected sheet to import.');
      return;
    }
    // preserveExistingStatus is always true to guarantee 100% status protection
    onConfirmImport(previewData.records, true, importMode);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="bg-[#0d3b66] text-white px-5 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500 text-white rounded-xl font-black">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] bg-emerald-500 text-slate-950 font-black px-2 py-0.5 rounded uppercase">
                  Excel Import & Update Engine
                </span>
                <span className="text-xs text-blue-200 truncate max-w-[200px] sm:max-w-xs font-mono">
                  {fileName}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold tracking-tight text-white mt-0.5">
                Import Consumer Data (.xlsx / .xls)
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-blue-200 hover:text-white rounded-lg hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs sm:text-sm">
          
          {/* Sheet Selector Bar */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#0d3b66]" />
              <label className="font-bold text-slate-800 text-xs sm:text-sm">
                Select Worksheet:
              </label>
            </div>

            <select
              value={selectedSheet}
              onChange={(e) => setSelectedSheet(e.target.value)}
              className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 font-bold text-slate-900 text-xs sm:text-sm focus:ring-2 focus:ring-[#0d3b66] focus:outline-none"
            >
              {sheetNames.map((s) => (
                <option key={s} value={s}>
                  {s} {s.toLowerCase().includes('sheet2') ? '(Recommended)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* TWO IMPORT OPTIONS SELECTOR */}
          <div className="space-y-2">
            <label className="font-extrabold text-slate-900 text-xs sm:text-sm flex items-center gap-2">
              <span>Choose Import & Update Mode:</span>
            </label>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              
              {/* Option A: Import New Consumers */}
              <div 
                onClick={() => setImportMode('IMPORT_NEW')}
                className={`p-3.5 rounded-xl border-2 transition cursor-pointer flex flex-col justify-between ${
                  importMode === 'IMPORT_NEW' 
                    ? 'border-[#0d3b66] bg-blue-50/70 shadow-xs' 
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <input 
                        type="radio" 
                        name="importMode" 
                        checked={importMode === 'IMPORT_NEW'}
                        onChange={() => setImportMode('IMPORT_NEW')}
                        className="text-[#0d3b66] focus:ring-[#0d3b66]" 
                      />
                      <span className="font-black text-slate-900 text-xs sm:text-sm">
                        Option A: Import New Consumers Only
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed pl-5">
                    Adds only fresh consumer records from Excel. If a Consumer Number is already in the database, it is <strong>skipped</strong> without creating duplicates.
                  </p>
                </div>
                <div className="mt-2.5 pt-2 border-t border-slate-200/60 pl-5 text-[11px] text-slate-500 font-medium">
                  Ideal for: Adding brand new consumer batches.
                </div>
              </div>

              {/* Option B: Update Existing Consumers (Recommended) */}
              <div 
                onClick={() => setImportMode('UPDATE_EXISTING')}
                className={`p-3.5 rounded-xl border-2 transition cursor-pointer flex flex-col justify-between ${
                  importMode === 'UPDATE_EXISTING' 
                    ? 'border-emerald-600 bg-emerald-50/60 shadow-xs' 
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <input 
                        type="radio" 
                        name="importMode" 
                        checked={importMode === 'UPDATE_EXISTING'}
                        onChange={() => setImportMode('UPDATE_EXISTING')}
                        className="text-emerald-600 focus:ring-emerald-600" 
                      />
                      <span className="font-black text-slate-900 text-xs sm:text-sm flex items-center gap-1.5">
                        <span>Option B: Update Existing & Add New</span>
                        <span className="text-[10px] bg-emerald-600 text-white font-extrabold px-1.5 py-0.5 rounded uppercase">
                          Recommended
                        </span>
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed pl-5">
                    Matches by <strong>Consumer Number</strong>. Updates master details (Name, Address, Section, Irregularities, Staff) and adds new records. <strong>Existing consumers missing from Excel are never deleted.</strong>
                  </p>
                </div>
                <div className="mt-2.5 pt-2 border-t border-emerald-200/60 pl-5 text-[11px] text-emerald-800 font-medium flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Meter shifting status & details are 100% protected.</span>
                </div>
              </div>

            </div>
          </div>

          {/* CRITICAL STATUS PROTECTION GUARANTEE BANNER */}
          <div className="bg-emerald-50 border-2 border-emerald-500 rounded-xl p-3.5 flex items-start gap-3">
            <div className="p-2 bg-emerald-600 text-white rounded-lg shrink-0 mt-0.5">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-black text-emerald-950 text-xs sm:text-sm">
                Meter Shifting Status & Progress Guaranteed
              </h4>
              <p className="text-xs text-emerald-800 mt-0.5 leading-relaxed">
                When importing an updated Excel file, any consumer already marked as <strong>SHIFTED</strong>, <strong>CABLE SHORTAGE</strong>, or <strong>DOOR LOCK</strong> will <strong>NEVER</strong> be reset to pending. Meter shifting dates, new/old meter numbers, readings, remarks, and complete audit history are permanently preserved.
              </p>
            </div>
          </div>

          {/* COLUMN MAPPING SECTION */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden">
            <div 
              onClick={() => setShowMappingEditor(!showMappingEditor)}
              className="px-4 py-3 bg-slate-100 flex items-center justify-between cursor-pointer hover:bg-slate-200/70 transition"
            >
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-[#0d3b66]" />
                <span className="font-extrabold text-slate-900 text-xs sm:text-sm">
                  Excel Column Mapping (Auto-Detected)
                </span>
                <span className="text-[11px] text-slate-500">
                  Click to {showMappingEditor ? 'collapse' : 'view or adjust'}
                </span>
              </div>
              <button
                type="button"
                className="text-xs text-[#0d3b66] font-bold"
              >
                {showMappingEditor ? 'Hide Mapping' : 'Adjust Mapping'}
              </button>
            </div>

            {showMappingEditor && (
              <div className="p-4 space-y-3 bg-white">
                <p className="text-xs text-slate-500">
                  Headers detected from your Excel sheet. If your Excel file uses different column names, select the matching column below:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  
                  {/* 1. Consumer Number */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-extrabold text-slate-700 block">
                      Consumer Number <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={columnMapping.consumerNumber}
                      onChange={(e) => handleMapField('consumerNumber', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-[#0d3b66] focus:bg-white"
                    >
                      <option value="">-- Select Column --</option>
                      {detectedColumns.map(col => (
                        <option key={col} value={col}>{col}</option>
                      ))}
                    </select>
                  </div>

                  {/* 2. Consumer Name */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-extrabold text-slate-700 block">
                      Consumer Name
                    </label>
                    <select
                      value={columnMapping.consumerName}
                      onChange={(e) => handleMapField('consumerName', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-[#0d3b66] focus:bg-white"
                    >
                      <option value="">-- [Not Mapped / Auto] --</option>
                      {detectedColumns.map(col => (
                        <option key={col} value={col}>{col}</option>
                      ))}
                    </select>
                  </div>

                  {/* 3. Address */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-extrabold text-slate-700 block">
                      Address
                    </label>
                    <select
                      value={columnMapping.address}
                      onChange={(e) => handleMapField('address', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-[#0d3b66] focus:bg-white"
                    >
                      <option value="">-- [Not Mapped / Auto] --</option>
                      {detectedColumns.map(col => (
                        <option key={col} value={col}>{col}</option>
                      ))}
                    </select>
                  </div>

                  {/* 4. Section */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-extrabold text-slate-700 block">
                      Section
                    </label>
                    <select
                      value={columnMapping.section}
                      onChange={(e) => handleMapField('section', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-[#0d3b66] focus:bg-white"
                    >
                      <option value="">-- [Not Mapped / Auto] --</option>
                      {detectedColumns.map(col => (
                        <option key={col} value={col}>{col}</option>
                      ))}
                    </select>
                  </div>

                  {/* 5. Types of Irregularities */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-extrabold text-slate-700 block">
                      Types of Irregularities
                    </label>
                    <select
                      value={columnMapping.irregularityType}
                      onChange={(e) => handleMapField('irregularityType', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-[#0d3b66] focus:bg-white"
                    >
                      <option value="">-- [Not Mapped / Auto] --</option>
                      {detectedColumns.map(col => (
                        <option key={col} value={col}>{col}</option>
                      ))}
                    </select>
                  </div>

                  {/* 6. Assigned Staff */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-extrabold text-slate-700 block">
                      Assigned Staff / Team
                    </label>
                    <select
                      value={columnMapping.assignedStaff}
                      onChange={(e) => handleMapField('assignedStaff', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-[#0d3b66] focus:bg-white"
                    >
                      <option value="">-- [Not Mapped / Auto] --</option>
                      {detectedColumns.map(col => (
                        <option key={col} value={col}>{col}</option>
                      ))}
                    </select>
                  </div>

                </div>
              </div>
            )}
          </div>

          {/* 4 SUMMARY METRIC CARDS */}
          {previewData && (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              
              <div className="bg-slate-100 border border-slate-200 rounded-xl p-3">
                <span className="text-[10px] text-slate-600 font-bold uppercase tracking-wider block">
                  Total in Excel
                </span>
                <span className="text-xl sm:text-2xl font-black text-slate-900 mt-1 block">
                  {previewData.totalFound}
                </span>
                <span className="text-[10px] text-slate-500">Rows evaluated</span>
              </div>

              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                <span className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider block">
                  New to Add
                </span>
                <span className="text-xl sm:text-2xl font-black text-emerald-800 mt-1 block">
                  +{previewData.addedCount}
                </span>
                <span className="text-[10px] text-emerald-700">New consumers</span>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                <span className="text-[10px] text-blue-700 font-bold uppercase tracking-wider block">
                  {importMode === 'UPDATE_EXISTING' ? 'To Update' : 'Skipped Existing'}
                </span>
                <span className="text-xl sm:text-2xl font-black text-blue-900 mt-1 block">
                  {importMode === 'UPDATE_EXISTING' ? previewData.updatedCount : previewData.unchangedCount}
                </span>
                <span className="text-[10px] text-blue-700">
                  {importMode === 'UPDATE_EXISTING' ? 'Details synced' : 'Skipped duplicate'}
                </span>
              </div>

              <div className="bg-purple-50 border border-purple-200 rounded-xl p-3">
                <span className="text-[10px] text-purple-700 font-bold uppercase tracking-wider block">
                  Unchanged
                </span>
                <span className="text-xl sm:text-2xl font-black text-purple-900 mt-1 block">
                  {importMode === 'UPDATE_EXISTING' ? previewData.unchangedCount : existingConsumers.length}
                </span>
                <span className="text-[10px] text-purple-700">Already up-to-date</span>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 col-span-2 sm:col-span-1">
                <span className="text-[10px] text-amber-700 font-bold uppercase tracking-wider block">
                  Duplicates in File
                </span>
                <span className="text-xl sm:text-2xl font-black text-amber-900 mt-1 block">
                  {previewData.duplicateCount}
                </span>
                <span className="text-[10px] text-amber-800">Flagged for review</span>
              </div>

            </div>
          )}

          {/* TABLE PREVIEW */}
          {previewData && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 text-xs">
                  Data Preview (Showing first {previewData.sampleRows.length} of {previewData.totalFound} rows):
                </span>
                <span className="text-[11px] text-slate-500 font-medium">
                  {previewData.invalidCount > 0 ? `${previewData.invalidCount} invalid row(s) skipped` : 'All valid'}
                </span>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden overflow-x-auto max-h-56">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#0d3b66] text-white font-bold">
                      <th className="p-2 w-10 text-center">#</th>
                      <th className="p-2 w-24">Action</th>
                      <th className="p-2 w-28">Consumer No.</th>
                      <th className="p-2">Name</th>
                      <th className="p-2">Address</th>
                      <th className="p-2">Section</th>
                      <th className="p-2">Irregularity</th>
                      <th className="p-2">Assigned Staff</th>
                      <th className="p-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {previewData.sampleRows.map((row, i) => {
                      const c = row.consumer;
                      return (
                        <tr key={c.id || i} className="hover:bg-slate-50">
                          <td className="p-2 text-center text-slate-400 font-mono text-[11px]">{i + 1}</td>
                          <td className="p-2 whitespace-nowrap">
                            {row.actionType === 'NEW' && (
                              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                                <PlusCircle className="w-3 h-3 text-emerald-600" />
                                <span>+ NEW</span>
                              </span>
                            )}
                            {row.actionType === 'UPDATE' && (
                              <span className="text-[10px] bg-blue-100 text-blue-800 font-extrabold px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                                <RefreshCw className="w-3 h-3 text-blue-600" />
                                <span>↻ UPDATE</span>
                              </span>
                            )}
                            {row.actionType === 'UNCHANGED' && (
                              <span className="text-[10px] bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded-full">
                                = UNCHANGED
                              </span>
                            )}
                            {row.actionType === 'DUPLICATE_IN_FILE' && (
                              <span className="text-[10px] bg-amber-100 text-amber-800 font-extrabold px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3 text-amber-600" />
                                <span>DUPLICATE</span>
                              </span>
                            )}
                          </td>
                          <td className="p-2 font-mono font-bold text-slate-900">{c.consumerNumber}</td>
                          <td className="p-2 font-semibold text-slate-800">{c.consumerName}</td>
                          <td className="p-2 text-slate-600 truncate max-w-[150px]">{c.address}</td>
                          <td className="p-2 text-blue-800 font-medium truncate max-w-[120px]">{c.section}</td>
                          <td className="p-2 text-slate-700 truncate max-w-[130px]">{c.irregularityType}</td>
                          <td className="p-2 text-slate-600 truncate max-w-[120px]">{c.assignedStaff || c.actionTeam}</td>
                          <td className="p-2 whitespace-nowrap">
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              c.status === 'SHIFTED' 
                                ? 'bg-emerald-100 text-emerald-800' 
                                : (c.status === 'CABLE SHORTAGE' ? 'bg-amber-100 text-amber-800' : (c.status === 'DOOR LOCK' ? 'bg-red-100 text-red-800' : 'bg-slate-100 text-slate-600'))
                            }`}>
                              {c.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-lg transition cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleImport}
            className="flex items-center gap-2 px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-md transition active:scale-95 cursor-pointer"
          >
            <Upload className="w-4 h-4 text-emerald-200" />
            <span>CONFIRM & IMPORT TO DATABASE</span>
          </button>
        </div>

      </div>
    </div>
  );
};
