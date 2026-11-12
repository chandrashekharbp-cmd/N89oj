/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Grid, 
  List, 
  Download, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  RotateCcw,
  Users,
  ChevronLeft,
  ChevronRight,
  X,
  Cable,
  Lock,
  ListTodo,
  Upload,
  FileSpreadsheet
} from 'lucide-react';
import { Consumer, MeterShiftingStatus } from '../types';
import { ConsumerCard } from './ConsumerCard';
import { ConsumerTableView } from './ConsumerTableView';
import { exportConsumersToExcel } from '../utils/excel';

export type ListViewFilterMode = 'ALL' | 'SHIFTED' | 'CABLE SHORTAGE' | 'DOOR LOCK' | 'REMAINING PENDING' | 'NOT UPDATED';

interface ConsumerListViewProps {
  title: string;
  subtitle: string;
  filterMode?: ListViewFilterMode;
  consumers: Consumer[];
  onUpdateClick: (consumer: Consumer) => void;
  onOpenDuplicates?: () => void;
  onOpenImportExcel?: () => void;
}

export const ConsumerListView: React.FC<ConsumerListViewProps> = ({
  title,
  subtitle,
  filterMode = 'ALL',
  consumers,
  onUpdateClick,
  onOpenDuplicates,
  onOpenImportExcel
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<ListViewFilterMode>(filterMode);
  const [selectedSection, setSelectedSection] = useState('ALL');
  const [selectedIrregularity, setSelectedIrregularity] = useState('ALL');
  const [selectedStaff, setSelectedStaff] = useState('ALL');
  const [showDuplicatesOnly, setShowDuplicatesOnly] = useState(false);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [sortBy, setSortBy] = useState<'consNo' | 'name' | 'date'>('consNo');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  // Update internal selectedStatus if parent filterMode changes
  React.useEffect(() => {
    setSelectedStatus(filterMode);
  }, [filterMode]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(24);

  // Distinct Filter options
  const sections = useMemo(() => {
    const set = new Set<string>();
    consumers.forEach(c => { if (c.section) set.add(c.section); });
    return Array.from(set).sort();
  }, [consumers]);

  const irregularities = useMemo(() => {
    const set = new Set<string>();
    consumers.forEach(c => { if (c.irregularityType) set.add(c.irregularityType); });
    return Array.from(set).sort();
  }, [consumers]);

  const staffMembers = useMemo(() => {
    const set = new Set<string>();
    consumers.forEach(c => {
      const s = c.assignedStaff || c.actionTeam;
      if (s) set.add(s);
    });
    return Array.from(set).sort();
  }, [consumers]);

  // Filtered dataset
  const filtered = useMemo(() => {
    return consumers.filter(c => {
      // 1. Status Filter Mode
      if (selectedStatus === 'SHIFTED') {
        if (c.status !== 'SHIFTED') return false;
      } else if (selectedStatus === 'CABLE SHORTAGE') {
        if (c.status !== 'CABLE SHORTAGE') return false;
      } else if (selectedStatus === 'DOOR LOCK') {
        if (c.status !== 'DOOR LOCK') return false;
      } else if (selectedStatus === 'NOT UPDATED') {
        if (c.status !== 'NOT UPDATED') return false;
      } else if (selectedStatus === 'REMAINING PENDING') {
        // Must include Cable Shortage, Door Lock, and Not Updated
        if (c.status === 'SHIFTED') return false;
      }

      // 2. Duplicates Only
      if (showDuplicatesOnly && !c.isDuplicate) {
        return false;
      }

      // 3. Section Filter
      if (selectedSection !== 'ALL' && c.section !== selectedSection) {
        return false;
      }

      // 4. Irregularity Filter
      if (selectedIrregularity !== 'ALL' && c.irregularityType !== selectedIrregularity) {
        return false;
      }

      // 5. Staff Filter
      if (selectedStaff !== 'ALL' && (c.assignedStaff !== selectedStaff && c.actionTeam !== selectedStaff)) {
        return false;
      }

      // 6. Search Query (Consumer No, Name, Address, Team, etc.)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesNo = (c.consumerNumber || '').toLowerCase().includes(q);
        const matchesName = (c.consumerName || '').toLowerCase().includes(q);
        const matchesAddress = (c.address || '').toLowerCase().includes(q);
        const matchesSection = (c.section || '').toLowerCase().includes(q);
        const matchesStaff = (c.assignedStaff || c.actionTeam || '').toLowerCase().includes(q);
        const matchesNewMeter = (c.newMeterNumber || '').toLowerCase().includes(q);
        const matchesOldMeter = (c.oldMeterNumber || '').toLowerCase().includes(q);

        if (!matchesNo && !matchesName && !matchesAddress && !matchesSection && !matchesStaff && !matchesNewMeter && !matchesOldMeter) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'consNo') {
        const comp = (a.consumerNumber || '').localeCompare(b.consumerNumber || '', undefined, { numeric: true });
        return sortOrder === 'asc' ? comp : -comp;
      } else if (sortBy === 'name') {
        const comp = (a.consumerName || '').localeCompare(b.consumerName || '');
        return sortOrder === 'asc' ? comp : -comp;
      } else {
        const dateA = a.shiftingDate || '';
        const dateB = b.shiftingDate || '';
        const comp = dateA.localeCompare(dateB);
        return sortOrder === 'asc' ? comp : -comp;
      }
    });
  }, [
    consumers,
    selectedStatus,
    showDuplicatesOnly,
    selectedSection,
    selectedIrregularity,
    selectedStaff,
    searchQuery,
    sortBy,
    sortOrder
  ]);

  // Pagination calculation
  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginatedList = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedStatus, selectedSection, selectedIrregularity, selectedStaff, showDuplicatesOnly, pageSize]);

  const handleExportExcel = () => {
    const filename = `TPWODL_${title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}`;
    exportConsumersToExcel(filtered, filename, title);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedStatus(filterMode);
    setSelectedSection('ALL');
    setSelectedIrregularity('ALL');
    setSelectedStaff('ALL');
    setShowDuplicatesOnly(false);
  };

  const hasActiveFilters = searchQuery !== '' || selectedStatus !== filterMode || selectedSection !== 'ALL' || selectedIrregularity !== 'ALL' || selectedStaff !== 'ALL' || showDuplicatesOnly;

  return (
    <div className="space-y-4 pb-12">
      
      {/* Top Header Card */}
      <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
              {title}
            </h2>
            <span className="bg-[#0d3b66] text-white text-xs font-bold px-2.5 py-0.5 rounded-full">
              {filtered.length} {filtered.length === 1 ? 'Record' : 'Records'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {subtitle}
          </p>
        </div>

        {/* View Mode & Export Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Duplicate quick filter button */}
          <button
            onClick={() => setShowDuplicatesOnly(!showDuplicatesOnly)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition border cursor-pointer ${
              showDuplicatesOnly
                ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-xs'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span>Duplicates Only</span>
          </button>

          {/* Cards / Table toggle */}
          <div className="hidden sm:flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded-md text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                viewMode === 'cards' ? 'bg-white text-[#0d3b66] shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Card View (Field Friendly)"
            >
              <Grid className="w-3.5 h-3.5" />
              <span>Cards</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                viewMode === 'table' ? 'bg-white text-[#0d3b66] shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Table View (High Density)"
            >
              <List className="w-3.5 h-3.5" />
              <span>Table</span>
            </button>
          </div>

          {/* Excel Export */}
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Excel</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-xl p-3 sm:p-4 border border-slate-200 shadow-xs space-y-3">
        
        {/* Search input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by consumer number, name, address, section, or assigned lineman..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-10 py-2.5 text-xs sm:text-sm font-medium focus:bg-white focus:ring-2 focus:ring-[#0d3b66] focus:outline-none transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Dropdown Filters Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 text-xs">
          
          {/* Status Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Status Filter
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as any)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-2 font-medium text-slate-800 focus:bg-white focus:ring-1 focus:ring-[#0d3b66]"
            >
              <option value="ALL">All Statuses</option>
              <option value="SHIFTED">SHIFTED (Green)</option>
              <option value="CABLE SHORTAGE">CABLE SHORTAGE (Orange)</option>
              <option value="DOOR LOCK">DOOR LOCK (Red)</option>
              <option value="REMAINING PENDING">REMAINING PENDING (All Unshifted)</option>
              <option value="NOT UPDATED">NOT UPDATED (Grey)</option>
            </select>
          </div>

          {/* Section Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Section
            </label>
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-2 font-medium text-slate-800 focus:bg-white focus:ring-1 focus:ring-[#0d3b66]"
            >
              <option value="ALL">All Sections ({sections.length})</option>
              {sections.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Irregularity Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Irregularity Type
            </label>
            <select
              value={selectedIrregularity}
              onChange={(e) => setSelectedIrregularity(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-2 font-medium text-slate-800 focus:bg-white focus:ring-1 focus:ring-[#0d3b66]"
            >
              <option value="ALL">All Irregularities ({irregularities.length})</option>
              {irregularities.map(irr => (
                <option key={irr} value={irr}>{irr}</option>
              ))}
            </select>
          </div>

          {/* Staff Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Assigned Staff / Squad
            </label>
            <select
              value={selectedStaff}
              onChange={(e) => setSelectedStaff(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-2 font-medium text-slate-800 focus:bg-white focus:ring-1 focus:ring-[#0d3b66]"
            >
              <option value="ALL">All Staff / Teams</option>
              {staffMembers.map(st => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Sort By
            </label>
            <div className="flex gap-1.5">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-2 font-medium text-slate-800"
              >
                <option value="consNo">Consumer No.</option>
                <option value="name">Consumer Name</option>
                <option value="date">Date</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="px-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg text-slate-700 font-bold shrink-0 cursor-pointer"
                title={`Order: ${sortOrder.toUpperCase()}`}
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>
            </div>
          </div>

        </div>

        {/* Filter Summary & Reset */}
        {hasActiveFilters && (
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">
              Filtered: <strong>{filtered.length}</strong> of {consumers.length} consumers
            </span>
            <button
              onClick={handleResetFilters}
              className="flex items-center gap-1 text-[#0d3b66] hover:underline font-bold cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset All Filters</span>
            </button>
          </div>
        )}

      </div>

      {/* Main List Rendering */}
      {viewMode === 'cards' ? (
        paginatedList.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {paginatedList.map(consumer => (
              <ConsumerCard
                key={consumer.id}
                consumer={consumer}
                onUpdateClick={onUpdateClick}
              />
            ))}
          </div>
        ) : (
          consumers.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 text-center border-2 border-dashed border-slate-300">
              <div className="w-14 h-14 bg-blue-50 text-[#0d3b66] rounded-2xl flex items-center justify-center mx-auto mb-3">
                <FileSpreadsheet className="w-7 h-7 text-[#0d3b66]" />
              </div>
              <h3 className="font-extrabold text-slate-800 text-base">
                Database is currently empty (0 records)
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 leading-relaxed">
                No consumer data loaded. Please import an Excel file (.xlsx or .xls) to start managing meter shifting for Titlagarh Section.
              </p>
              {onOpenImportExcel && (
                <button
                  onClick={onOpenImportExcel}
                  className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs sm:text-sm font-extrabold rounded-xl shadow-sm transition active:scale-95 cursor-pointer"
                >
                  <Upload className="w-4 h-4 text-emerald-200" />
                  <span>IMPORT EXCEL</span>
                </button>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-xl p-12 text-center border border-slate-200">
              <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <h3 className="font-bold text-slate-700 text-sm">No consumers match your search</h3>
              <p className="text-xs text-slate-400 mt-1">Try clearing filters or search terms</p>
              <button
                onClick={handleResetFilters}
                className="mt-3 px-3 py-1.5 bg-[#0d3b66] text-white text-xs font-bold rounded-lg cursor-pointer"
              >
                Clear Filters
              </button>
            </div>
          )
        )
      ) : (
        <ConsumerTableView
          consumers={paginatedList}
          onUpdateClick={onUpdateClick}
        />
      )}

      {/* Pagination Bar */}
      {filtered.length > pageSize && (
        <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          
          <div className="text-slate-500">
            Showing <strong className="text-slate-900">{(currentPage - 1) * pageSize + 1}</strong> to{' '}
            <strong className="text-slate-900">{Math.min(currentPage * pageSize, filtered.length)}</strong> of{' '}
            <strong className="text-slate-900">{filtered.length}</strong> records
          </div>

          <div className="flex items-center gap-2">
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 text-xs"
            >
              <option value={12}>12 per page</option>
              <option value={24}>24 per page</option>
              <option value={48}>48 per page</option>
              <option value={100}>100 per page</option>
              <option value={400}>All records</option>
            </select>

            <button
              onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="font-semibold text-slate-700 px-2">
              Page {currentPage} of {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

        </div>
      )}

    </div>
  );
};
