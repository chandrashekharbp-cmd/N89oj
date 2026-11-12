/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { 
  Users, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  Percent, 
  AlertTriangle, 
  ArrowRight, 
  TrendingUp, 
  FileSpreadsheet, 
  Printer, 
  UserCheck,
  ChevronRight,
  Sparkles,
  Building2,
  ShieldAlert,
  Cable,
  Lock,
  Upload,
  ListTodo
} from 'lucide-react';
import { Consumer, DashboardStats, SectionStat, IrregularityStat, StaffStat, ViewTab } from '../types';
import { downloadExcelTemplate } from '../utils/excel';

interface DashboardViewProps {
  stats: DashboardStats;
  consumers: Consumer[];
  onNavigate: (tab: ViewTab) => void;
  onOpenConsumer: (consumer: Consumer) => void;
  onOpenDuplicates: () => void;
  onExportExcel: () => void;
  onOpenImportExcel: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  stats,
  consumers,
  onNavigate,
  onOpenConsumer,
  onOpenDuplicates,
  onExportExcel,
  onOpenImportExcel
}) => {
  // Compute Section-wise breakdown
  const sectionStats: SectionStat[] = useMemo(() => {
    const map = new Map<string, { total: number; shifted: number; cableShortage: number; doorLock: number }>();
    consumers.forEach(c => {
      const sec = c.section || 'Titlagarh Section';
      const cur = map.get(sec) || { total: 0, shifted: 0, cableShortage: 0, doorLock: 0 };
      cur.total += 1;
      if (c.status === 'SHIFTED') cur.shifted += 1;
      else if (c.status === 'CABLE SHORTAGE') cur.cableShortage += 1;
      else if (c.status === 'DOOR LOCK') cur.doorLock += 1;
      map.set(sec, cur);
    });

    return Array.from(map.entries()).map(([section, data]) => {
      const remaining = data.total - data.shifted;
      return {
        section,
        total: data.total,
        shifted: data.shifted,
        cableShortage: data.cableShortage,
        doorLock: data.doorLock,
        remainingPending: remaining,
        percentage: data.total > 0 ? Math.round((data.shifted / data.total) * 100) : 0
      };
    }).sort((a, b) => b.total - a.total);
  }, [consumers]);

  // Compute Irregularity breakdown
  const irregularityStats: IrregularityStat[] = useMemo(() => {
    const map = new Map<string, { total: number; shifted: number; cableShortage: number; doorLock: number }>();
    consumers.forEach(c => {
      const irr = c.irregularityType || 'Other Irregularity';
      const cur = map.get(irr) || { total: 0, shifted: 0, cableShortage: 0, doorLock: 0 };
      cur.total += 1;
      if (c.status === 'SHIFTED') cur.shifted += 1;
      else if (c.status === 'CABLE SHORTAGE') cur.cableShortage += 1;
      else if (c.status === 'DOOR LOCK') cur.doorLock += 1;
      map.set(irr, cur);
    });

    return Array.from(map.entries()).map(([irregularity, data]) => ({
      irregularity,
      count: data.total,
      shifted: data.shifted,
      cableShortage: data.cableShortage,
      doorLock: data.doorLock,
      remainingPending: data.total - data.shifted
    })).sort((a, b) => b.count - a.count);
  }, [consumers]);

  // Compute Staff Leaderboard
  const staffStats: StaffStat[] = useMemo(() => {
    const map = new Map<string, { total: number; shifted: number; cableShortage: number; doorLock: number }>();
    consumers.forEach(c => {
      const staff = c.assignedStaff || c.actionTeam || 'General Squad';
      const cur = map.get(staff) || { total: 0, shifted: 0, cableShortage: 0, doorLock: 0 };
      cur.total += 1;
      if (c.status === 'SHIFTED') cur.shifted += 1;
      else if (c.status === 'CABLE SHORTAGE') cur.cableShortage += 1;
      else if (c.status === 'DOOR LOCK') cur.doorLock += 1;
      map.set(staff, cur);
    });

    return Array.from(map.entries()).map(([staffName, data]) => ({
      staffName,
      total: data.total,
      shifted: data.shifted,
      cableShortage: data.cableShortage,
      doorLock: data.doorLock,
      remainingPending: data.total - data.shifted,
      percentage: data.total > 0 ? Math.round((data.shifted / data.total) * 100) : 0
    })).sort((a, b) => b.shifted - a.shifted);
  }, [consumers]);

  // Recently updated works
  const recentUpdates = useMemo(() => {
    return consumers
      .filter(c => c.status !== 'NOT UPDATED')
      .slice(0, 5);
  }, [consumers]);

  return (
    <div className="space-y-5 pb-12">
      
      {/* Top Action & Import Bar */}
      <div className="bg-white rounded-xl p-3.5 sm:p-4 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
            TPWODL Titlagarh Live Shifting Dashboard
          </h2>
          <p className="text-xs text-slate-500">
            Real-time tracking of shifted meters and field impediments across sections.
          </p>
        </div>

        {/* Prominent IMPORT EXCEL Button on Dashboard */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={onOpenImportExcel}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-sm transition active:scale-95 cursor-pointer"
            title="Upload any meter data Excel file (.xlsx or .xls)"
          >
            <Upload className="w-4 h-4 text-emerald-200" />
            <span>IMPORT EXCEL</span>
          </button>

          <button
            onClick={onExportExcel}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl transition shadow-xs cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-amber-400" />
            <span>Export All</span>
          </button>
        </div>
      </div>

      {/* Duplicate Alert Banner */}
      {stats.duplicateCount > 0 && (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-xl shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg text-amber-700 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-amber-900">
                {stats.duplicateCount} Duplicate Consumer Numbers Flagged for Review
              </h3>
              <p className="text-xs text-amber-700 mt-0.5">
                Per TPWODL protocol, duplicate consumer numbers are preserved and flagged. Never silently merged or deleted.
              </p>
            </div>
          </div>
          <button
            onClick={onOpenDuplicates}
            className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg shadow-xs transition shrink-0 cursor-pointer"
          >
            Review Duplicates Now
          </button>
        </div>
      )}

      {/* Live Separate Statistics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        
        {/* 1. Total Consumers */}
        <div 
          onClick={() => onNavigate('all-consumers')}
          className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
              Total Consumers
            </span>
            <div className="p-1.5 rounded-lg bg-blue-50 text-[#0d3b66] group-hover:bg-[#0d3b66] group-hover:text-white transition">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {stats.totalConsumers}
            </span>
          </div>
          <div className="mt-2 text-[10px] text-[#0d3b66] font-bold flex items-center gap-0.5">
            <span>View All</span>
            <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition" />
          </div>
        </div>

        {/* 2. Shifted (Green) */}
        <div 
          onClick={() => onNavigate('shifted')}
          className="bg-white p-3.5 rounded-xl border-2 border-emerald-500 shadow-xs hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wide">
              Shifted
            </span>
            <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800 group-hover:bg-emerald-600 group-hover:text-white transition">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-emerald-700 tracking-tight">
              {stats.shifted}
            </span>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1 py-0.2 rounded">
              {stats.completionPercentage}%
            </span>
          </div>
          <div className="mt-2 text-[10px] text-emerald-800 font-bold flex items-center gap-0.5">
            <span>Shifted List</span>
            <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition" />
          </div>
        </div>

        {/* 3. Cable Shortage (Orange) */}
        <div 
          onClick={() => onNavigate('cable-shortage')}
          className="bg-white p-3.5 rounded-xl border-2 border-amber-500 shadow-xs hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wide">
              Cable Shortage
            </span>
            <div className="p-1.5 rounded-lg bg-amber-100 text-amber-800 group-hover:bg-amber-500 group-hover:text-slate-950 transition">
              <Cable className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-amber-800 tracking-tight">
              {stats.cableShortage}
            </span>
          </div>
          <div className="mt-2 text-[10px] text-amber-900 font-bold flex items-center gap-0.5">
            <span>Cable List</span>
            <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition" />
          </div>
        </div>

        {/* 4. Door Lock (Red) */}
        <div 
          onClick={() => onNavigate('door-lock')}
          className="bg-white p-3.5 rounded-xl border-2 border-red-500 shadow-xs hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-red-800 uppercase tracking-wide">
              Door Lock
            </span>
            <div className="p-1.5 rounded-lg bg-red-100 text-red-700 group-hover:bg-red-600 group-hover:text-white transition">
              <Lock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-red-700 tracking-tight">
              {stats.doorLock}
            </span>
          </div>
          <div className="mt-2 text-[10px] text-red-800 font-bold flex items-center gap-0.5">
            <span>Locked List</span>
            <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition" />
          </div>
        </div>

        {/* 5. Remaining Pending (Total - Shifted) */}
        <div 
          onClick={() => onNavigate('remaining-pending')}
          className="bg-white p-3.5 rounded-xl border border-slate-300 shadow-xs hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wide">
              Remaining Pending
            </span>
            <div className="p-1.5 rounded-lg bg-slate-100 text-slate-700 group-hover:bg-slate-800 group-hover:text-white transition">
              <ListTodo className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">
              {stats.remainingPending}
            </span>
          </div>
          <div className="mt-2 text-[10px] text-slate-500 font-medium">
            Total - Shifted
          </div>
        </div>

        {/* 6. Completion Percentage */}
        <div className="bg-gradient-to-br from-[#0d3b66] to-blue-900 text-white p-3.5 rounded-xl shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-blue-200 uppercase tracking-wide">
              Progress
            </span>
            <div className="p-1.5 rounded-lg bg-white/10 text-amber-300">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              {stats.completionPercentage}%
            </span>
          </div>
          <div className="mt-2 text-[10px] text-amber-300 font-bold">
            {stats.shifted} of {stats.totalConsumers} Done
          </div>
        </div>

      </div>

      {consumers.length === 0 ? (
        /* Empty Database State Card per Requirement 6 */
        <div className="bg-white rounded-2xl border-2 border-dashed border-slate-300 p-8 sm:p-12 text-center shadow-xs">
          <div className="w-16 h-16 bg-blue-50 text-[#0d3b66] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm border border-blue-100">
            <FileSpreadsheet className="w-8 h-8 text-[#0d3b66]" />
          </div>

          <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight max-w-xl mx-auto">
            No consumer data loaded. Please import Excel file to start tracking meter shifting.
          </h3>

          <p className="text-xs sm:text-sm text-slate-500 max-w-lg mx-auto mt-2 leading-relaxed">
            The database starts empty with zero consumer records. Upload your section's meter data spreadsheet (.xlsx or .xls) to populate consumer numbers, addresses, and irregularities.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6">
            <button
              onClick={onOpenImportExcel}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-md transition active:scale-95 cursor-pointer"
            >
              <Upload className="w-4 h-4 text-emerald-200" />
              <span>IMPORT EXCEL</span>
            </button>

            <button
              onClick={downloadExcelTemplate}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs sm:text-sm rounded-xl border border-slate-300 transition cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
              <span>Download Sample Template</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-8 pt-6 border-t border-slate-100 max-w-2xl mx-auto text-left">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[10px] font-bold text-emerald-700 uppercase block">1. Clean Database</span>
              <p className="text-xs text-slate-600 mt-1">Starts with 0 records. You have complete control over imported data.</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[10px] font-bold text-blue-700 uppercase block">2. Column Mapping</span>
              <p className="text-xs text-slate-600 mt-1">Automatic column detection with manual mapping dropdowns for all 6 fields.</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[10px] font-bold text-purple-700 uppercase block">3. Status Protected</span>
              <p className="text-xs text-slate-600 mt-1">Completed SHIFTED, Cable Shortage, and Door Lock work are never reset.</p>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Visual Multi-Stage Progress Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <h3 className="text-xs sm:text-sm font-bold text-slate-900">
              Meter Shifting Completion Progress
            </h3>
          </div>
          <span className="text-xs font-black text-[#0d3b66]">
            {stats.shifted} / {stats.totalConsumers} Shifted ({stats.completionPercentage}%)
          </span>
        </div>

        {/* Multi-segmented Progress Bar */}
        <div className="w-full bg-slate-100 rounded-full h-4 overflow-hidden flex border border-slate-200">
          {/* Shifted segment (Green) */}
          <div 
            className="bg-emerald-600 h-full transition-all duration-700"
            style={{ width: `${stats.totalConsumers > 0 ? (stats.shifted / stats.totalConsumers) * 100 : 0}%` }}
            title={`Shifted: ${stats.shifted}`}
          />
          {/* Cable Shortage segment (Orange) */}
          <div 
            className="bg-amber-500 h-full transition-all duration-700"
            style={{ width: `${stats.totalConsumers > 0 ? (stats.cableShortage / stats.totalConsumers) * 100 : 0}%` }}
            title={`Cable Shortage: ${stats.cableShortage}`}
          />
          {/* Door Lock segment (Red) */}
          <div 
            className="bg-red-600 h-full transition-all duration-700"
            style={{ width: `${stats.totalConsumers > 0 ? (stats.doorLock / stats.totalConsumers) * 100 : 0}%` }}
            title={`Door Lock: ${stats.doorLock}`}
          />
        </div>

        {/* Legend */}
        <div className="flex items-center justify-between flex-wrap gap-2 text-[11px] text-slate-600 mt-2 font-semibold">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
            <span>Shifted: <strong>{stats.shifted}</strong></span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            <span>Cable Shortage: <strong>{stats.cableShortage}</strong></span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600"></span>
            <span>Door Lock: <strong>{stats.doorLock}</strong></span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-300"></span>
            <span>Not Updated: <strong>{stats.notUpdated}</strong></span>
          </span>
          <span className="text-slate-500">
            Remaining Pending: <strong className="text-slate-900">{stats.remainingPending}</strong>
          </span>
        </div>
      </div>

      {/* Grid: Section Progress & Irregularities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* Section-wise Progress */}
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#0d3b66]" />
              <h3 className="text-sm font-bold text-slate-900">
                Sub-Section Wise Status (Titlagarh)
              </h3>
            </div>
            <span className="text-xs text-slate-500 font-medium">
              {sectionStats.length} Sections
            </span>
          </div>

          <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
            {sectionStats.map((sec) => (
              <div key={sec.section} className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 hover:bg-slate-100/70 transition">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-bold text-slate-800 truncate max-w-[180px] sm:max-w-[240px]">
                    {sec.section}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-700 font-bold">{sec.shifted} Shifted</span>
                    <span className="text-slate-400">•</span>
                    <span className="text-amber-800 font-semibold">{sec.cableShortage} Cable</span>
                    <span className="text-slate-400">•</span>
                    <span className="text-red-700 font-semibold">{sec.doorLock} Lock</span>
                    <span className="bg-blue-100 text-[#0d3b66] font-bold px-1.5 py-0.2 rounded text-[10px]">
                      {sec.percentage}%
                    </span>
                  </div>
                </div>
                {/* Micro progress bar */}
                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden flex">
                  <div 
                    className="bg-emerald-600 h-full"
                    style={{ width: `${sec.total > 0 ? (sec.shifted / sec.total) * 100 : 0}%` }}
                  />
                  <div 
                    className="bg-amber-500 h-full"
                    style={{ width: `${sec.total > 0 ? (sec.cableShortage / sec.total) * 100 : 0}%` }}
                  />
                  <div 
                    className="bg-red-600 h-full"
                    style={{ width: `${sec.total > 0 ? (sec.doorLock / sec.total) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Irregularity Breakdown */}
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Types of Irregularities Breakdown
              </h3>
            </div>
            <span className="text-xs text-slate-500 font-medium">
              Field Irregularities
            </span>
          </div>

          <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
            {irregularityStats.map((irr) => (
              <div key={irr.irregularity} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                <span className="font-medium text-slate-700 truncate max-w-[200px]">
                  {irr.irregularity}
                </span>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full text-[11px]">
                    {irr.shifted} Shifted
                  </span>
                  <span className="bg-slate-200 text-slate-800 font-semibold px-2 py-0.5 rounded-full text-[11px]">
                    {irr.remainingPending} Pending
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Staff Leaderboard & Recently Updated Works */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* Staff & Squad Performance */}
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Linemen & Squad Performance
              </h3>
            </div>
            <button
              onClick={() => onNavigate('staff')}
              className="text-xs font-bold text-[#0d3b66] hover:underline cursor-pointer"
            >
              Manage Staff
            </button>
          </div>

          <div className="space-y-2.5">
            {staffStats.slice(0, 5).map((staff, idx) => (
              <div key={staff.staffName} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-5 h-5 rounded-full bg-[#0d3b66] text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                    {idx + 1}
                  </span>
                  <div className="truncate">
                    <span className="font-bold text-slate-900 block truncate">{staff.staffName}</span>
                    <span className="text-[10px] text-slate-500">{staff.total} Total Assigned</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-right">
                    <span className="text-emerald-700 font-black">{staff.shifted}</span>
                    <span className="text-[10px] text-slate-500 ml-1">shifted</span>
                  </div>
                  <span className="bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded text-[10px]">
                    {staff.percentage}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recently Updated Works Feed */}
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-bold text-slate-900">
                Recent Status Updates
              </h3>
            </div>
            <button
              onClick={() => onNavigate('shifted')}
              className="text-xs font-bold text-emerald-700 hover:underline cursor-pointer"
            >
              View Shifted ({stats.shifted})
            </button>
          </div>

          <div className="space-y-2.5">
            {recentUpdates.map((c) => (
              <div 
                key={c.id} 
                onClick={() => onOpenConsumer(c)}
                className="p-2.5 rounded-lg bg-slate-50 hover:bg-blue-50/50 transition cursor-pointer flex items-center justify-between text-xs border border-slate-200"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-900 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                      {c.consumerNumber}
                    </span>
                    <span className="font-semibold text-slate-800 truncate">
                      {c.consumerName}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">
                    {c.address}
                  </p>
                </div>

                <div className="text-right shrink-0 ml-2">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full inline-block font-bold ${
                    c.status === 'SHIFTED' ? 'bg-emerald-600 text-white' : (c.status === 'CABLE SHORTAGE' ? 'bg-amber-500 text-slate-950 font-black' : 'bg-red-600 text-white')
                  }`}>
                    {c.status}
                  </span>
                  <span className="block text-[10px] text-slate-500 mt-0.5">
                    {c.shiftingDate || 'Recorded'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
        </>
      )}

    </div>
  );
};
