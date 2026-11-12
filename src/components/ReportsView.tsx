/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  Download, 
  Printer, 
  CheckCircle2, 
  FileSpreadsheet, 
  Cable,
  Lock,
  ListTodo,
  Users,
  ShieldCheck,
  Calendar,
  User
} from 'lucide-react';
import { Consumer } from '../types';
import { exportConsumersToExcel } from '../utils/excel';
import { generateCategoryPdf, ReportCategory } from '../utils/pdf';
import { getStatusConfig } from '../utils/status';

interface ReportsViewProps {
  consumers: Consumer[];
  onOpenConsumer: (consumer: Consumer) => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  consumers,
  onOpenConsumer
}) => {
  const [activeCategory, setActiveCategory] = useState<ReportCategory>('SHIFTED');
  const [selectedStaff, setSelectedStaff] = useState('ALL');
  const [selectedSection, setSelectedSection] = useState('ALL');
  const [selectedDate, setSelectedDate] = useState('');
  const [supervisorName, setSupervisorName] = useState('Supervisor Titlagarh');

  // Filtered dataset for active category
  const reportRecords = useMemo(() => {
    return consumers.filter(c => {
      // Category filter
      if (activeCategory === 'SHIFTED') {
        if (c.status !== 'SHIFTED') return false;
      } else if (activeCategory === 'CABLE SHORTAGE') {
        if (c.status !== 'CABLE SHORTAGE') return false;
      } else if (activeCategory === 'DOOR LOCK') {
        if (c.status !== 'DOOR LOCK') return false;
      } else if (activeCategory === 'REMAINING PENDING') {
        if (c.status === 'SHIFTED') return false;
      }

      // Section filter
      if (selectedSection !== 'ALL' && c.section !== selectedSection) {
        return false;
      }

      // Staff filter
      if (selectedStaff !== 'ALL' && (c.assignedStaff !== selectedStaff && c.actionTeam !== selectedStaff)) {
        return false;
      }

      // Date filter
      if (selectedDate && c.shiftingDate !== selectedDate) {
        return false;
      }

      return true;
    });
  }, [consumers, activeCategory, selectedSection, selectedStaff, selectedDate]);

  // Distinct staff options
  const staffOptions = useMemo(() => {
    const set = new Set<string>();
    consumers.forEach(c => {
      const s = c.assignedStaff || c.actionTeam;
      if (s) set.add(s);
    });
    return Array.from(set).sort();
  }, [consumers]);

  // Distinct section options
  const sectionOptions = useMemo(() => {
    const set = new Set<string>();
    consumers.forEach(c => { if (c.section) set.add(c.section); });
    return Array.from(set).sort();
  }, [consumers]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = () => {
    const filename = `TPWODL_Titlagarh_${activeCategory.replace(/\s+/g, '_')}_Report_${new Date().toISOString().split('T')[0]}`;
    exportConsumersToExcel(reportRecords, filename, activeCategory);
  };

  const handleExportPdf = () => {
    generateCategoryPdf(reportRecords, activeCategory, supervisorName);
  };

  const categories: { id: ReportCategory; label: string; count: number; colorClass: string; icon: React.ComponentType<{ className?: string }> }[] = [
    {
      id: 'SHIFTED',
      label: 'Shifted Consumers',
      count: consumers.filter(c => c.status === 'SHIFTED').length,
      colorClass: 'bg-emerald-600 text-white',
      icon: CheckCircle2
    },
    {
      id: 'CABLE SHORTAGE',
      label: 'Cable Shortage',
      count: consumers.filter(c => c.status === 'CABLE SHORTAGE').length,
      colorClass: 'bg-amber-500 text-slate-950',
      icon: Cable
    },
    {
      id: 'DOOR LOCK',
      label: 'Door Lock',
      count: consumers.filter(c => c.status === 'DOOR LOCK').length,
      colorClass: 'bg-red-600 text-white',
      icon: Lock
    },
    {
      id: 'REMAINING PENDING',
      label: 'Remaining Pending',
      count: consumers.filter(c => c.status !== 'SHIFTED').length,
      colorClass: 'bg-slate-800 text-amber-400',
      icon: ListTodo
    },
    {
      id: 'ALL',
      label: 'All Consumers',
      count: consumers.length,
      colorClass: 'bg-[#0d3b66] text-white',
      icon: Users
    }
  ];

  return (
    <div className="space-y-4 pb-12">
      
      {/* 5 Report Sub-Tabs Strip (Print-Hidden) */}
      <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-xs flex items-center justify-between flex-wrap gap-2 print:hidden">
        
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {categories.map(cat => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  isActive
                    ? `${cat.colorClass} shadow-xs`
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cat.label} ({cat.count})</span>
              </button>
            );
          })}
        </div>

        {/* Action Buttons for Export & Print */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Excel</span>
          </button>

          <button
            onClick={handleExportPdf}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>PDF</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-amber-400" />
            <span>Print Report</span>
          </button>
        </div>

      </div>

      {/* Filter Toolbar (Print-Hidden) */}
      <div className="bg-white rounded-xl p-3 sm:p-4 border border-slate-200 shadow-xs space-y-2 print:hidden">
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          Filter {activeCategory} Report Records:
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          
          <div>
            <label className="block text-slate-600 font-semibold mb-1">
              Filter by Section:
            </label>
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium"
            >
              <option value="ALL">All Sections</option>
              {sectionOptions.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-slate-600 font-semibold mb-1">
              Filter by Assigned Staff:
            </label>
            <select
              value={selectedStaff}
              onChange={(e) => setSelectedStaff(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium"
            >
              <option value="ALL">All Staff / Teams</option>
              {staffOptions.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-slate-600 font-semibold mb-1">
              Filter by Date:
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium"
            />
          </div>

        </div>
      </div>

      {/* Official Printable Report Document Body */}
      <div className="bg-white rounded-xl border border-slate-300 shadow-xs p-5 sm:p-7 print:border-none print:shadow-none print:p-0">
        
        {/* Printable Header */}
        <div className="border-b-2 border-[#0d3b66] pb-4 mb-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-[#0d3b66] text-white text-[11px] font-extrabold px-2 py-0.5 rounded">
                  TPWODL
                </span>
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Tata Power Western Odisha Distribution Limited
                </span>
              </div>
              <h1 className="text-lg sm:text-2xl font-black text-[#0d3b66] tracking-tight mt-1">
                TITLAGARH ELECTRICAL SECTION – {activeCategory} REPORT
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Balangir Electrical Division | Meter Shifting Drive
              </p>
            </div>

            <div className="text-right text-xs text-slate-600">
              <div>Date: <strong className="text-slate-900">{new Date().toLocaleDateString('en-IN')}</strong></div>
              <div>Supervisor: <strong className="text-slate-900">{supervisorName}</strong></div>
              <div className="mt-1">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-black ${getStatusConfig(activeCategory === 'ALL' || activeCategory === 'REMAINING PENDING' ? 'NOT UPDATED' : activeCategory).pillClass}`}>
                  Total Records: {reportRecords.length}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Report Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border border-slate-200">
            <thead>
              <tr className="bg-slate-100 text-slate-900 font-bold border-b border-slate-300">
                <th className="py-2.5 px-3 w-10 text-center">Sl</th>
                <th className="py-2.5 px-3 w-32">Consumer No.</th>
                <th className="py-2.5 px-3 w-40">Consumer Name</th>
                <th className="py-2.5 px-3">Address</th>
                <th className="py-2.5 px-3 w-28">Section</th>
                <th className="py-2.5 px-3 w-32">Status</th>
                <th className="py-2.5 px-3 w-28">Date / Meter</th>
                <th className="py-2.5 px-3 w-36">Assigned Staff</th>
                <th className="py-2.5 px-3">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {reportRecords.map((c, i) => {
                const conf = getStatusConfig(c.status);
                return (
                  <tr 
                    key={c.id} 
                    onClick={() => onOpenConsumer(c)}
                    className="hover:bg-slate-50 cursor-pointer print:cursor-default"
                  >
                    <td className="py-2 px-3 text-center text-slate-400 font-mono">
                      {i + 1}
                    </td>
                    <td className="py-2 px-3 font-mono font-bold text-slate-900">
                      {c.consumerNumber}
                    </td>
                    <td className="py-2 px-3 font-semibold text-slate-800">
                      {c.consumerName}
                    </td>
                    <td className="py-2 px-3 text-slate-600">
                      {c.address}
                    </td>
                    <td className="py-2 px-3 text-blue-800 font-medium">
                      {c.section}
                    </td>
                    <td className="py-2 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${conf.pillClass}`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="py-2 px-3 font-mono text-slate-700">
                      {c.status === 'SHIFTED' && c.newMeterNumber ? (
                        <span>{c.newMeterNumber}</span>
                      ) : (
                        <span>{c.shiftingDate || '—'}</span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-slate-700 font-semibold">
                      {c.assignedStaff || c.actionTeam}
                    </td>
                    <td className="py-2 px-3 text-slate-500 italic">
                      {c.remarks || '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {reportRecords.length === 0 && (
          <div className="text-center py-10 text-slate-500 text-xs">
            No consumer records match the selected category and filters.
          </div>
        )}

        {/* Official Sign-off Block */}
        <div className="mt-12 pt-8 border-t border-slate-300 grid grid-cols-2 text-xs text-slate-700">
          <div>
            <p className="font-semibold">Prepared By:</p>
            <div className="h-10"></div>
            <p className="font-bold">Meter Shifting Lineman / Squad Lead</p>
            <p className="text-slate-500">TPWODL Titlagarh Section</p>
          </div>
          <div className="text-right">
            <p className="font-semibold">Verified & Approved By:</p>
            <div className="h-10"></div>
            <p className="font-bold">Junior Engineer (Elect.) / Supervisor</p>
            <p className="text-slate-500">TPWODL Electrical Division, Titlagarh</p>
          </div>
        </div>

      </div>

    </div>
  );
};
