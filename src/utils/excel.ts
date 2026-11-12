/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Excel Import and Export System for TPWODL Meter Shifting Management
 * Supports .xlsx, .xls parsing with multi-sheet inspection, auto & manual column mapping,
 * live preview generation, duplicate detection, and STRICT meter shifting status protection.
 */

import * as XLSX from 'xlsx';
import { 
  Consumer, 
  MeterShiftingStatus, 
  ExcelImportPreviewData, 
  ExcelColumnMapping, 
  ImportMode, 
  ExcelPreviewRow 
} from '../types';
import { normalizeStatus } from '../db/storage';

function normalizeKey(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export interface WorkbookInfo {
  workbook: XLSX.WorkBook;
  sheetNames: string[];
  fileName: string;
}

/**
 * Reads any uploaded Excel file (.xlsx or .xls) and returns available sheets
 */
export async function readExcelWorkbook(file: File): Promise<WorkbookInfo> {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: 'array' });
  return {
    workbook,
    sheetNames: workbook.SheetNames || ['Sheet1'],
    fileName: file.name
  };
}

/**
 * Extracts detected column headers from worksheet and suggests intelligent mappings
 */
export function detectExcelColumns(worksheet: XLSX.WorkSheet): {
  columns: string[];
  suggestedMapping: ExcelColumnMapping;
} {
  // Read first few rows as array of arrays to find header row
  const rows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
  
  if (!rows || rows.length === 0) {
    return {
      columns: [],
      suggestedMapping: {
        consumerNumber: '',
        consumerName: '',
        address: '',
        section: '',
        irregularityType: '',
        assignedStaff: ''
      }
    };
  }

  // Find header row (usually first row with multiple non-empty strings)
  let headerRowIndex = 0;
  for (let i = 0; i < Math.min(rows.length, 5); i++) {
    const stringCount = rows[i].filter(cell => typeof cell === 'string' && cell.trim().length > 0).length;
    if (stringCount >= 2) {
      headerRowIndex = i;
      break;
    }
  }

  const rawHeaders = rows[headerRowIndex] || [];
  const columns: string[] = rawHeaders
    .map(h => String(h || '').trim())
    .filter(h => h.length > 0);

  const suggestedMapping: ExcelColumnMapping = {
    consumerNumber: '',
    consumerName: '',
    address: '',
    section: '',
    irregularityType: '',
    assignedStaff: ''
  };

  columns.forEach(col => {
    const norm = normalizeKey(col);

    // 1. Consumer Number
    if (!suggestedMapping.consumerNumber) {
      if (
        norm === 'consumernumber' || 
        norm === 'consumerno' || 
        norm === 'consno' || 
        norm === 'consumerid' || 
        norm === 'canumber' || 
        norm === 'accountno' || 
        norm === 'acno' ||
        norm === 'kno' ||
        norm === 'scno' ||
        norm === 'id'
      ) {
        suggestedMapping.consumerNumber = col;
      } else if (norm.includes('consumerno') || norm.includes('consumernumber') || norm.includes('consno')) {
        suggestedMapping.consumerNumber = col;
      }
    }

    // 2. Consumer Name
    if (!suggestedMapping.consumerName) {
      if (
        norm === 'consumername' || 
        norm === 'consname' || 
        norm === 'customername' || 
        norm === 'name' ||
        norm === 'nameoftheconsumer'
      ) {
        suggestedMapping.consumerName = col;
      } else if (norm.includes('consumername') || norm.includes('customername')) {
        suggestedMapping.consumerName = col;
      }
    }

    // 3. Address
    if (!suggestedMapping.address) {
      if (
        norm === 'address' || 
        norm === 'premises' || 
        norm === 'location' || 
        norm === 'fulladdress' ||
        norm === 'consumeraddress'
      ) {
        suggestedMapping.address = col;
      } else if (norm.includes('address') || norm.includes('location')) {
        suggestedMapping.address = col;
      }
    }

    // 4. Section
    if (!suggestedMapping.section) {
      if (
        norm === 'section' || 
        norm === 'subdivision' || 
        norm === 'sectionname' || 
        norm === 'area' || 
        norm === 'zone' ||
        norm === 'ward'
      ) {
        suggestedMapping.section = col;
      } else if (norm.includes('section') || norm.includes('subdiv')) {
        suggestedMapping.section = col;
      }
    }

    // 5. Types of Irregularities
    if (!suggestedMapping.irregularityType) {
      if (
        norm === 'typesofirregularities' || 
        norm === 'typeofirregularity' || 
        norm === 'irregularitytype' || 
        norm === 'irregularity' || 
        norm === 'irregularities' || 
        norm === 'issue' || 
        norm === 'defect'
      ) {
        suggestedMapping.irregularityType = col;
      } else if (norm.includes('irregular') || norm.includes('defect')) {
        suggestedMapping.irregularityType = col;
      }
    }

    // 6. Assigned Staff / Action Team
    if (!suggestedMapping.assignedStaff) {
      if (
        norm === 'assignedstaff' || 
        norm === 'actionteam' || 
        norm === 'action' || 
        norm === 'team' || 
        norm === 'lineman' || 
        norm === 'staff' ||
        norm === 'staffname'
      ) {
        suggestedMapping.assignedStaff = col;
      } else if (norm.includes('staff') || norm.includes('team') || norm.includes('lineman') || norm.includes('action')) {
        suggestedMapping.assignedStaff = col;
      }
    }
  });

  return { columns, suggestedMapping };
}

/**
 * Inspects a chosen worksheet, parses records according to manual column mappings,
 * evaluates changes against existing database, and produces full preview breakdown.
 */
export function previewExcelSheetWithMapping(
  workbook: XLSX.WorkBook,
  sheetName: string,
  fileName: string,
  existingConsumers: Consumer[],
  columnMapping: ExcelColumnMapping,
  mode: ImportMode
): ExcelImportPreviewData {
  const worksheet = workbook.Sheets[sheetName];
  if (!worksheet) {
    throw new Error(`Sheet "${sheetName}" not found in workbook`);
  }

  const { columns } = detectExcelColumns(worksheet);
  const rawJson = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: '' });

  const existingMap = new Map<string, Consumer>();
  existingConsumers.forEach(c => {
    const num = (c.consumerNumber || '').trim();
    if (num) existingMap.set(num, c);
  });

  const parsedRecords: Consumer[] = [];
  const previewRows: ExcelPreviewRow[] = [];
  const fileSeenNumbers = new Map<string, number>();
  
  let invalidCount = 0;
  let addedCount = 0;
  let updatedCount = 0;
  let unchangedCount = 0;
  let duplicateCount = 0;

  rawJson.forEach((row, index) => {
    // Read based on mapping
    const getVal = (colName: string): string => {
      if (!colName) return '';
      return String(row[colName] !== undefined ? row[colName] : '').trim();
    };

    let consNo = getVal(columnMapping.consumerNumber);
    let consName = getVal(columnMapping.consumerName);
    let address = getVal(columnMapping.address);
    let section = getVal(columnMapping.section);
    let irregularity = getVal(columnMapping.irregularityType);
    let assignedStaff = getVal(columnMapping.assignedStaff);

    // Fallbacks if mapping was empty or not matched
    if (!consNo) {
      // Try common header names
      for (const k of Object.keys(row)) {
        const norm = normalizeKey(k);
        if (norm.includes('consumerno') || norm.includes('consumernumber') || norm === 'id') {
          consNo = String(row[k]).trim();
          break;
        }
      }
    }

    if (!consNo) {
      invalidCount++;
      return;
    }

    if (!consName) {
      consName = `Consumer ${consNo}`;
    }

    if (!section) {
      section = 'Titlagarh Section';
    }

    if (!irregularity) {
      irregularity = 'Meter Inside Premises / Inaccessible';
    }

    const actionTeam = assignedStaff ? `Team Squad (${assignedStaff})` : 'Team A - Subrat & Rajesh';

    // Check duplicate count in this file
    const fileCount = (fileSeenNumbers.get(consNo) || 0) + 1;
    fileSeenNumbers.set(consNo, fileCount);
    const isFileDuplicate = fileCount > 1;

    if (isFileDuplicate) {
      duplicateCount++;
    }

    const existingRecord = existingMap.get(consNo);

    // Determine Action & Status Protection
    let actionType: 'NEW' | 'UPDATE' | 'UNCHANGED' | 'DUPLICATE_IN_FILE' = 'NEW';
    const changedFields: string[] = [];

    if (isFileDuplicate) {
      actionType = 'DUPLICATE_IN_FILE';
    }

    if (existingRecord) {
      // Existing consumer found in database
      if (mode === 'IMPORT_NEW') {
        // Option A: Skip existing records (do not duplicate or overwrite)
        actionType = 'UNCHANGED';
        unchangedCount++;
      } else {
        // Option B: Update existing consumer master details
        // Compare fields to see what's changed
        if (consName && consName !== existingRecord.consumerName) changedFields.push('Name');
        if (address && address !== existingRecord.address) changedFields.push('Address');
        if (section && section !== existingRecord.section) changedFields.push('Section');
        if (irregularity && irregularity !== existingRecord.irregularityType) changedFields.push('Irregularity');
        if (assignedStaff && assignedStaff !== existingRecord.assignedStaff) changedFields.push('Staff');

        if (changedFields.length > 0) {
          actionType = 'UPDATE';
          updatedCount++;
        } else {
          actionType = 'UNCHANGED';
          unchangedCount++;
        }
      }

      // CRITICAL STATUS PROTECTION:
      // Status, shiftingDate, meter numbers, readings, remarks, and update history are ALWAYS PRESERVED!
      const preservedConsumer: Consumer = {
        ...existingRecord,
        consumerName: mode === 'UPDATE_EXISTING' && consName ? consName : existingRecord.consumerName,
        address: mode === 'UPDATE_EXISTING' && address ? address : existingRecord.address,
        section: mode === 'UPDATE_EXISTING' && section ? section : existingRecord.section,
        irregularityType: mode === 'UPDATE_EXISTING' && irregularity ? irregularity : existingRecord.irregularityType,
        assignedStaff: mode === 'UPDATE_EXISTING' && assignedStaff ? assignedStaff : existingRecord.assignedStaff,
        actionTeam: mode === 'UPDATE_EXISTING' && actionTeam ? actionTeam : existingRecord.actionTeam,
        // Status & Shifting details NEVER reset!
        status: existingRecord.status,
        shiftingDate: existingRecord.shiftingDate,
        newMeterNumber: existingRecord.newMeterNumber,
        oldMeterNumber: existingRecord.oldMeterNumber,
        initialReading: existingRecord.initialReading,
        finalReading: existingRecord.finalReading,
        remarks: existingRecord.remarks,
        history: existingRecord.history || [],
        isDuplicate: isFileDuplicate || existingRecord.isDuplicate
      };

      parsedRecords.push(preservedConsumer);

      previewRows.push({
        consumer: preservedConsumer,
        actionType,
        existingRecord,
        changedFields
      });
    } else {
      // New record not present in database
      actionType = isFileDuplicate ? 'DUPLICATE_IN_FILE' : 'NEW';
      addedCount++;

      const newConsumer: Consumer = {
        id: `EXCEL-${Date.now()}-${index + 1}`,
        consumerNumber: consNo,
        consumerName: consName,
        address: address || 'Titlagarh, Balangir',
        section: section,
        irregularityType: irregularity,
        actionTeam: actionTeam,
        status: 'NOT UPDATED',
        assignedStaff: assignedStaff || undefined,
        history: [],
        isDuplicate: isFileDuplicate,
        duplicateNotes: isFileDuplicate ? 'Duplicate consumer number detected across multiple rows in imported file.' : undefined
      };

      parsedRecords.push(newConsumer);

      previewRows.push({
        consumer: newConsumer,
        actionType,
        changedFields: ['New Consumer Record']
      });
    }
  });

  return {
    fileName,
    availableSheets: workbook.SheetNames || ['Sheet1'],
    selectedSheet: sheetName,
    totalFound: parsedRecords.length,
    addedCount,
    updatedCount,
    unchangedCount,
    duplicateCount,
    invalidCount,
    records: parsedRecords,
    sampleRows: previewRows.slice(0, 10),
    detectedColumns: columns,
    columnMapping,
    mode
  };
}

/**
 * Backward compatible preview function
 */
export function previewExcelSheet(
  workbook: XLSX.WorkBook,
  sheetName: string,
  fileName: string,
  existingConsumers: Consumer[]
): ExcelImportPreviewData {
  const worksheet = workbook.Sheets[sheetName];
  if (!worksheet) {
    throw new Error(`Sheet "${sheetName}" not found in workbook`);
  }
  const { suggestedMapping } = detectExcelColumns(worksheet);
  return previewExcelSheetWithMapping(
    workbook,
    sheetName,
    fileName,
    existingConsumers,
    suggestedMapping,
    'UPDATE_EXISTING'
  );
}

/**
 * Merges imported records with existing records according to the selected mode
 * while strictly protecting meter shifting statuses!
 * 
 * Mode A: IMPORT_NEW
 * - Adds new consumer records from Excel.
 * - Detects existing Consumer Numbers and skips them.
 * - Does not create duplicate records.
 * 
 * Mode B: UPDATE_EXISTING
 * - Matches records using Consumer Number as unique identifier.
 * - Updates Consumer Name, Address, Section, Irregularity Type and Assigned Staff from Excel.
 * - Adds new Consumer Numbers that do not exist in database.
 * - Does not delete consumers missing from uploaded Excel file.
 * - NEVER resets SHIFTED, CABLE SHORTAGE, or DOOR LOCK statuses!
 * - NEVER overwrites shifting dates, old/new meter numbers, or remarks!
 * - Preserves complete audit history.
 */
export function mergeImportedRecords(
  imported: Consumer[],
  existing: Consumer[],
  preserveExistingStatus: boolean = true,
  mode: ImportMode = 'UPDATE_EXISTING'
): Consumer[] {
  const existingMap = new Map<string, Consumer>();
  existing.forEach(c => {
    const num = (c.consumerNumber || '').trim();
    if (num) existingMap.set(num, c);
  });

  const merged: Consumer[] = [];
  const processedNumbers = new Set<string>();

  imported.forEach(item => {
    const consNo = (item.consumerNumber || '').trim();
    if (!consNo || processedNumbers.has(consNo)) return;

    const existingRecord = existingMap.get(consNo);

    if (existingRecord) {
      if (mode === 'IMPORT_NEW') {
        // Option A: Skip existing records (keep existing untouched)
        merged.push(existingRecord);
      } else {
        // Option B: Update existing consumers with strict status protection
        merged.push({
          ...existingRecord,
          consumerName: item.consumerName || existingRecord.consumerName,
          address: item.address || existingRecord.address,
          section: item.section || existingRecord.section,
          irregularityType: item.irregularityType || existingRecord.irregularityType,
          assignedStaff: item.assignedStaff || existingRecord.assignedStaff,
          actionTeam: item.actionTeam || existingRecord.actionTeam,
          
          // STRICT STATUS PROTECTION - NEVER OVERWRITE OR RESET
          status: existingRecord.status,
          shiftingDate: existingRecord.shiftingDate,
          newMeterNumber: existingRecord.newMeterNumber,
          oldMeterNumber: existingRecord.oldMeterNumber,
          initialReading: existingRecord.initialReading,
          finalReading: existingRecord.finalReading,
          remarks: existingRecord.remarks,
          
          // Preserve complete audit history and append update event
          history: [
            ...(existingRecord.history || []),
            {
              id: `HIST-SYNC-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              timestamp: new Date().toISOString(),
              action: 'DETAILS_EDITED',
              changedBy: 'Excel Master Sync',
              notes: 'Consumer master details updated from Excel while strictly preserving meter shifting status.'
            }
          ]
        });
      }
      processedNumbers.add(consNo);
    } else {
      // New record not in existing database
      merged.push({
        ...item,
        status: 'NOT UPDATED',
        history: item.history || []
      });
      processedNumbers.add(consNo);
    }
  });

  // CRITICAL: Preserve all existing consumers not included in the uploaded file
  existing.forEach(oldRecord => {
    const num = (oldRecord.consumerNumber || '').trim();
    if (!processedNumbers.has(num)) {
      merged.push(oldRecord);
      processedNumbers.add(num);
    }
  });

  return merged;
}

/**
 * Export any list of consumers to an Excel (.xlsx) file
 */
export function exportConsumersToExcel(
  consumers: Consumer[],
  fileName: string,
  sheetTitle: string = 'Meter Shifting Data'
) {
  const exportRows = consumers.map((c, i) => ({
    'Sl No': i + 1,
    'Consumer Number': c.consumerNumber,
    'Consumer Name': c.consumerName,
    'Address': c.address,
    'Section': c.section,
    'Types of Irregularities': c.irregularityType,
    'Action / Team': c.actionTeam,
    'Status': c.status,
    'Shifting Date': c.shiftingDate || 'N/A',
    'New Meter Number': c.newMeterNumber || 'N/A',
    'Old Meter Number': c.oldMeterNumber || 'N/A',
    'Assigned Staff': c.assignedStaff || 'N/A',
    'Remarks': c.remarks || '',
    'Last Updated': c.updatedAt ? new Date(c.updatedAt).toLocaleString() : 'N/A',
    'Duplicate Status': c.isDuplicate ? 'Duplicate Number Flagged' : 'Normal'
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportRows);

  const colWidths = [
    { wch: 6 },  // Sl No
    { wch: 18 }, // Consumer Number
    { wch: 24 }, // Consumer Name
    { wch: 35 }, // Address
    { wch: 22 }, // Section
    { wch: 32 }, // Types of Irregularities
    { wch: 24 }, // Action / Team
    { wch: 18 }, // Status
    { wch: 14 }, // Shifting Date
    { wch: 18 }, // New Meter Number
    { wch: 16 }, // Old Meter Number
    { wch: 20 }, // Assigned Staff
    { wch: 30 }, // Remarks
    { wch: 22 }, // Last Updated
    { wch: 20 }  // Duplicate Status
  ];
  worksheet['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetTitle.substring(0, 31));

  XLSX.writeFile(workbook, `${fileName}.xlsx`);
}

/**
 * Download sample template Excel file for TPWODL Titlagarh
 */
export function downloadExcelTemplate() {
  const templateRows = [
    {
      'Consumer Number': '6112001991',
      'Consumer Name': 'Ashok Kumar Sahu',
      'Address': 'Plot No. 42, Ward No. 3, Hatpada Main Road, Titlagarh',
      'Section': 'Hatpadapara Section',
      'Types of Irregularities': 'Meter Inside Premises / Inaccessible',
      'Assigned Staff': 'Subrat & Rajesh'
    },
    {
      'Consumer Number': '6112001992',
      'Consumer Name': 'Bikash Patel',
      'Address': 'Station Chowk, Near Railway Colony, Titlagarh',
      'Section': 'Station Road Section',
      'Types of Irregularities': 'Burnt Meter / Display Defective',
      'Assigned Staff': 'Pradeep & Santosh'
    },
    {
      'Consumer Number': '6112001993',
      'Consumer Name': 'Ramesh Chandra Panda',
      'Address': 'Main Market, Near Daily Market, Titlagarh',
      'Section': 'Titlagarh Town Section - I',
      'Types of Irregularities': 'Direct Hooking / Meter Bypass',
      'Assigned Staff': 'Manas & Bikash'
    }
  ];

  const ws = XLSX.utils.json_to_sheet(templateRows);
  ws['!cols'] = [
    { wch: 18 }, 
    { wch: 24 }, 
    { wch: 45 }, 
    { wch: 24 }, 
    { wch: 35 }, 
    { wch: 22 }
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet2');
  XLSX.writeFile(wb, 'TPWODL_Titlagarh_MeterShift_Template.xlsx');
}
