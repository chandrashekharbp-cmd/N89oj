/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Zap, 
  Wifi, 
  Database, 
  ShieldCheck, 
  RefreshCw, 
  AlertTriangle,
  HardDrive
} from 'lucide-react';
import { DashboardStats } from '../types';

interface HeaderProps {
  stats: DashboardStats;
  isOfflineReady: boolean;
  onRefresh: () => void;
  onOpenDuplicates?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  stats,
  isOfflineReady,
  onRefresh,
  onOpenDuplicates
}) => {
  const todayFormatted = new Date().toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  return (
    <header className="sticky top-0 z-30 bg-[#0d3b66] text-white shadow-md border-b border-blue-900/50">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3">
        <div className="flex items-center justify-between gap-3">
          
          {/* Logo & Section Title */}
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shadow-md shrink-0 border-2 border-white/20">
              <Zap className="w-6 h-6 text-slate-900 fill-slate-900" />
            </div>
            
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="bg-amber-400 text-slate-950 text-[10px] sm:text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded shadow-sm">
                  TPWODL
                </span>
                <span className="text-[11px] sm:text-xs text-blue-200 font-semibold tracking-wide truncate">
                  Titlagarh Electrical Section
                </span>
              </div>
              <h1 className="text-sm sm:text-lg font-bold tracking-tight text-white truncate leading-tight mt-0.5">
                Meter Shifting Management
              </h1>
            </div>
          </div>

          {/* Right Status badges & Actions */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            
            {/* Duplicates Alert Button */}
            {stats.duplicateCount > 0 && onOpenDuplicates && (
              <button
                onClick={onOpenDuplicates}
                className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 px-2.5 py-1.5 rounded-lg text-xs font-bold transition shadow-sm animate-pulse cursor-pointer"
                title="Duplicate consumer numbers detected for supervisor review"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-slate-950" />
                <span className="hidden sm:inline">Duplicates:</span>
                <span className="bg-slate-950 text-amber-400 px-1.5 py-0.2 rounded-full text-[11px] font-black">
                  {stats.duplicateCount}
                </span>
              </button>
            )}

            {/* Offline Persistent Badge */}
            <div 
              className="flex items-center gap-1.5 bg-blue-950/70 border border-blue-400/30 text-blue-100 px-2.5 py-1 rounded-lg text-[11px] sm:text-xs font-medium"
              title="Data is stored permanently in device IndexedDB storage"
            >
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <div className="w-2 h-2 rounded-full bg-emerald-400 -ml-3.5" />
              <span className="hidden md:inline font-semibold text-emerald-300">Offline Ready</span>
              <span className="md:hidden text-[10px] font-semibold text-emerald-300">Offline</span>
            </div>

            {/* Sync / Refresh Button */}
            <button
              onClick={onRefresh}
              className="p-2 rounded-lg bg-blue-800/60 hover:bg-blue-700/80 text-blue-100 transition active:scale-95"
              title="Refresh database view"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

          </div>

        </div>

        {/* Date and Quick Metric Bar on Mobile / Tablet */}
        <div className="mt-2 pt-2 border-t border-blue-800/40 flex items-center justify-between text-[11px] text-blue-200">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-white">{todayFormatted}</span>
            <span className="text-blue-300">•</span>
            <span>Total: <strong className="text-white">{stats.totalConsumers}</strong></span>
            <span className="text-blue-300">•</span>
            <span>Shifted: <strong className="text-emerald-300">{stats.shifted}</strong></span>
            <span className="text-blue-300">•</span>
            <span>Pending: <strong className="text-amber-300">{stats.remainingPending}</strong></span>
            {stats.cableShortage > 0 && (
              <>
                <span className="text-blue-300 hidden md:inline">•</span>
                <span className="hidden md:inline">Cable Shortage: <strong className="text-amber-400">{stats.cableShortage}</strong></span>
              </>
            )}
            {stats.doorLock > 0 && (
              <>
                <span className="text-blue-300 hidden md:inline">•</span>
                <span className="hidden md:inline">Door Lock: <strong className="text-red-300">{stats.doorLock}</strong></span>
              </>
            )}
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-blue-200">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>TPWODL Field Supervisor Portal</span>
          </div>
        </div>

      </div>
    </header>
  );
};
