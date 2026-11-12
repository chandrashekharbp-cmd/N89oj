/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Sparkles, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  X, 
  RotateCcw,
  Cable,
  Lock,
  ListTodo
} from 'lucide-react';
import { Consumer, MeterShiftingStatus } from '../types';
import { ConsumerCard } from './ConsumerCard';

interface SmartSearchViewProps {
  consumers: Consumer[];
  onUpdateClick: (consumer: Consumer) => void;
}

export const SmartSearchView: React.FC<SmartSearchViewProps> = ({
  consumers,
  onUpdateClick
}) => {
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | MeterShiftingStatus | 'REMAINING PENDING'>('ALL');
  const [staffFilter, setStaffFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState<'ALL' | 'TODAY' | 'CUSTOM'>('ALL');
  const [customDate, setCustomDate] = useState('');

  // Extract distinct staff
  const staffOptions = useMemo(() => {
    const set = new Set<string>();
    consumers.forEach(c => {
      const s = c.assignedStaff || c.actionTeam;
      if (s) set.add(s);
    });
    return Array.from(set).sort();
  }, [consumers]);

  // Reactive instant filtering
  const results = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const q = query.toLowerCase().trim();

    return consumers.filter(c => {
      // 1. Status Filter
      if (statusFilter === 'SHIFTED') {
        if (c.status !== 'SHIFTED') return false;
      } else if (statusFilter === 'CABLE SHORTAGE') {
        if (c.status !== 'CABLE SHORTAGE') return false;
      } else if (statusFilter === 'DOOR LOCK') {
        if (c.status !== 'DOOR LOCK') return false;
      } else if (statusFilter === 'NOT UPDATED') {
        if (c.status !== 'NOT UPDATED') return false;
      } else if (statusFilter === 'REMAINING PENDING') {
        if (c.status === 'SHIFTED') return false;
      }

      // 2. Staff Filter
      if (staffFilter !== 'ALL') {
        const staff = (c.assignedStaff || c.actionTeam || '');
        if (staff !== staffFilter) return false;
      }

      // 3. Date filter
      if (dateFilter === 'TODAY') {
        if (c.shiftingDate !== todayStr) return false;
      } else if (dateFilter === 'CUSTOM' && customDate) {
        if (c.shiftingDate !== customDate) return false;
      }

      // 4. Query across Consumer Number, Name, Address, Assigned Staff
      if (q) {
        const matchNumber = (c.consumerNumber || '').toLowerCase().includes(q);
        const matchName = (c.consumerName || '').toLowerCase().includes(q);
        const matchAddress = (c.address || '').toLowerCase().includes(q);
        const matchStaff = (c.assignedStaff || c.actionTeam || '').toLowerCase().includes(q);
        const matchNewMeter = (c.newMeterNumber || '').toLowerCase().includes(q);

        return matchNumber || matchName || matchAddress || matchStaff || matchNewMeter;
      }

      return true;
    });
  }, [
    consumers,
    query,
    statusFilter,
    staffFilter,
    dateFilter,
    customDate
  ]);

  const handleClearAll = () => {
    setQuery('');
    setStatusFilter('ALL');
    setStaffFilter('ALL');
    setDateFilter('ALL');
    setCustomDate('');
  };

  return (
    <div className="space-y-4 pb-12">
      
      {/* Search Header Banner */}
      <div className="bg-gradient-to-r from-[#0d3b66] to-blue-900 text-white rounded-2xl p-5 shadow-md">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-5 h-5 text-amber-400" />
          <h2 className="text-lg sm:text-xl font-black tracking-tight">
            TPWODL Smart Consumer Search & Filters
          </h2>
        </div>
        <p className="text-xs text-blue-200 mb-4 max-w-2xl">
          Instantly search through consumer records by Consumer Number, Name, Address, or Assigned Staff with live status filters.
        </p>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            autoFocus
            placeholder="Type Consumer Number, Name, Address, or Staff..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-white text-slate-900 rounded-xl pl-12 pr-12 py-3 text-sm sm:text-base font-semibold shadow-inner placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-amber-400/50"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Filter Chips Bar */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs space-y-3">
        
        {/* Status Filters Requirement: Shifted, Cable Shortage, Door Lock, Not Updated */}
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
            Filter by Status:
          </span>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                statusFilter === 'ALL'
                  ? 'bg-[#0d3b66] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              All ({consumers.length})
            </button>

            {/* Shifted (Green) */}
            <button
              onClick={() => setStatusFilter('SHIFTED')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                statusFilter === 'SHIFTED'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Shifted</span>
            </button>

            {/* Cable Shortage (Orange) */}
            <button
              onClick={() => setStatusFilter('CABLE SHORTAGE')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                statusFilter === 'CABLE SHORTAGE'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'bg-amber-50 text-amber-900 hover:bg-amber-100'
              }`}
            >
              <Cable className="w-3.5 h-3.5" />
              <span>Cable Shortage</span>
            </button>

            {/* Door Lock (Red) */}
            <button
              onClick={() => setStatusFilter('DOOR LOCK')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                statusFilter === 'DOOR LOCK'
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'bg-red-50 text-red-800 hover:bg-red-100'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Door Lock</span>
            </button>

            {/* Not Updated (Grey) */}
            <button
              onClick={() => setStatusFilter('NOT UPDATED')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                statusFilter === 'NOT UPDATED'
                  ? 'bg-slate-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Not Updated</span>
            </button>

            {/* Remaining Pending */}
            <button
              onClick={() => setStatusFilter('REMAINING PENDING')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                statusFilter === 'REMAINING PENDING'
                  ? 'bg-slate-900 text-amber-400 shadow-xs'
                  : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
              }`}
            >
              <ListTodo className="w-3.5 h-3.5" />
              <span>Remaining Pending</span>
            </button>
          </div>
        </div>

        {/* Staff & Date Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100 text-xs">
          
          {/* Staff-wise filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Staff-wise Filter
            </label>
            <select
              value={staffFilter}
              onChange={(e) => setStaffFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-2 text-xs font-medium"
            >
              <option value="ALL">All Staff Members</option>
              {staffOptions.map(st => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          </div>

          {/* Date-wise filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Date-wise Filter
            </label>
            <div className="flex gap-2">
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-2 text-xs font-medium"
              >
                <option value="ALL">Any Date</option>
                <option value="TODAY">Today's Shifts/Visits</option>
                <option value="CUSTOM">Specific Date...</option>
              </select>
              {dateFilter === 'CUSTOM' && (
                <input
                  type="date"
                  value={customDate}
                  onChange={(e) => setCustomDate(e.target.value)}
                  className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs"
                />
              )}
            </div>
          </div>

        </div>

        {/* Clear Filters Button */}
        {(query || statusFilter !== 'ALL' || staffFilter !== 'ALL' || dateFilter !== 'ALL') && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
            <span className="text-slate-600 font-bold">
              Found {results.length} matching records
            </span>
            <button
              onClick={handleClearAll}
              className="text-[#0d3b66] hover:underline font-bold flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Search & Filters</span>
            </button>
          </div>
        )}

      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-bold text-slate-700">
          Search Results: <strong className="text-[#0d3b66]">{results.length}</strong> {results.length === 1 ? 'Consumer' : 'Consumers'}
        </span>
        {query && (
          <span className="text-xs text-slate-500">
            Keyword: "<strong className="text-slate-800">{query}</strong>"
          </span>
        )}
      </div>

      {/* Results Grid */}
      {results.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {results.map(c => (
            <ConsumerCard
              key={c.id}
              consumer={c}
              onUpdateClick={onUpdateClick}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl p-12 text-center border border-slate-200">
          <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <h3 className="font-bold text-slate-800 text-sm">No records matched your search</h3>
          <p className="text-xs text-slate-400 mt-1">
            Check consumer number, name spelling, or clear filters.
          </p>
          <button
            onClick={handleClearAll}
            className="mt-3 px-4 py-2 bg-[#0d3b66] text-white text-xs font-bold rounded-lg cursor-pointer"
          >
            Show All Records
          </button>
        </div>
      )}

    </div>
  );
};
