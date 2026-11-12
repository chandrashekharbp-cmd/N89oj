/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * PDF Generation Utilities for TPWODL Titlagarh Section
 * Produces official inspection and status reports for:
 * - Shifted Consumers
 * - Cable Shortage Consumers
 * - Door Lock Consumers
 * - Remaining Pending Consumers
 * - All Consumers
 */

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Consumer } from '../types';

export type ReportCategory = 'SHIFTED' | 'CABLE SHORTAGE' | 'DOOR LOCK' | 'REMAINING PENDING' | 'ALL';

interface ReportStyle {
  title: string;
  subTitle: string;
  headerColor: [number, number, number];
  subBarColor: [number, number, number];
  subTextColor: [number, number, number];
}

const REPORT_STYLES: Record<ReportCategory, ReportStyle> = {
  'SHIFTED': {
    title: 'COMPLETED & VERIFIED METER SHIFTING WORK REPORT',
    subTitle: 'All meters shifted outside premises and energized with armored service cable.',
    headerColor: [5, 150, 105], // Emerald green #059669
    subBarColor: [236, 253, 245],
    subTextColor: [6, 95, 70]
  },
  'CABLE SHORTAGE': {
    title: 'FIELD IMPEDIMENT: CABLE SHORTAGE PENDING REPORT',
    subTitle: 'Premises requiring armored cable allotment before meter shift can be completed.',
    headerColor: [217, 119, 6], // Amber orange #d97706
    subBarColor: [254, 243, 199],
    subTextColor: [146, 64, 14]
  },
  'DOOR LOCK': {
    title: 'FIELD IMPEDIMENT: DOOR / PREMISES LOCKED REPORT',
    subTitle: 'Premises visited by lineman team but found locked; consumer revisit required.',
    headerColor: [220, 38, 38], // Red #dc2626
    subBarColor: [254, 242, 242],
    subTextColor: [153, 27, 27]
  },
  'REMAINING PENDING': {
    title: 'OVERALL REMAINING PENDING METER SHIFTING WORK REPORT',
    subTitle: 'All pending consumers including Cable Shortage, Door Lock, and Unworked meters.',
    headerColor: [13, 59, 102], // TPWODL Navy #0d3b66
    subBarColor: [254, 243, 199],
    subTextColor: [146, 64, 14]
  },
  'ALL': {
    title: 'MASTER CONSUMER REGISTER & SHIFTING STATUS REPORT',
    subTitle: 'Complete section register of all consumers in Titlagarh Electrical Division.',
    headerColor: [13, 59, 102], // TPWODL Navy
    subBarColor: [241, 245, 249],
    subTextColor: [30, 41, 59]
  }
};

/**
 * Universal PDF generator for any report category
 */
export function generateCategoryPdf(
  consumers: Consumer[],
  category: ReportCategory,
  supervisorName: string = 'Supervisor Titlagarh'
) {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const style = REPORT_STYLES[category] || REPORT_STYLES['ALL'];
  const generatedDate = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  // Top Navy banner with TPWODL title
  doc.setFillColor(style.headerColor[0], style.headerColor[1], style.headerColor[2]);
  doc.rect(0, 0, 297, 25, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('TPWODL – TATA POWER WESTERN ODISHA DISTRIBUTION LIMITED', 14, 9);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`TITLAGARH SECTION | ${style.title}`, 14, 17);

  doc.setFontSize(8.5);
  doc.text(`Generated: ${generatedDate} | Records: ${consumers.length}`, 225, 17);

  // Sub-summary strip
  doc.setFillColor(style.subBarColor[0], style.subBarColor[1], style.subBarColor[2]);
  doc.rect(14, 28, 269, 9, 'F');
  doc.setTextColor(style.subTextColor[0], style.subTextColor[1], style.subTextColor[2]);
  doc.setFontSize(8);
  doc.text(`Scope: ${style.subTitle}`, 17, 34);
  doc.text(`Supervisor: ${supervisorName}`, 220, 34);

  // Table Data mapping
  const tableRows = consumers.map((c, i) => [
    i + 1,
    c.consumerNumber,
    c.consumerName,
    c.address,
    c.section,
    c.irregularityType,
    c.status,
    c.status === 'SHIFTED' ? (c.newMeterNumber || c.shiftingDate || 'Shifted') : (c.shiftingDate || 'Pending'),
    c.assignedStaff || c.actionTeam || 'Squad',
    c.remarks || '—'
  ]);

  autoTable(doc, {
    startY: 40,
    head: [[
      'Sl',
      'Consumer No',
      'Consumer Name',
      'Address',
      'Section',
      'Irregularity Type',
      'Status',
      'Date / Meter',
      'Assigned Staff',
      'Remarks'
    ]],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: style.headerColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'left'
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [30, 41, 59],
      cellPadding: 2
    },
    columnStyles: {
      0: { cellWidth: 9, halign: 'center' },
      1: { cellWidth: 25, fontStyle: 'bold' },
      2: { cellWidth: 32 },
      3: { cellWidth: 46 },
      4: { cellWidth: 26 },
      5: { cellWidth: 34 },
      6: { cellWidth: 24, fontStyle: 'bold' },
      7: { cellWidth: 22 },
      8: { cellWidth: 25 },
      9: { cellWidth: 26 }
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    margin: { left: 14, right: 14, bottom: 20 },
    didDrawPage: (data) => {
      const pageCount = (doc.internal as any).getNumberOfPages();
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text(
        `Page ${data.pageNumber} of ${pageCount} — TPWODL Titlagarh Section (Meter Shifting Management System)`,
        14,
        202
      );
      doc.text(
        `Verified by: ________________________ (Junior Engineer / Supervisor Titlagarh)`,
        170,
        202
      );
    }
  });

  const safeCategory = category.replace(/\s+/g, '_');
  doc.save(`TPWODL_Titlagarh_${safeCategory}_Report_${new Date().toISOString().split('T')[0]}.pdf`);
}
