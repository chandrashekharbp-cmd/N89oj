/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Clock, 
  CheckCircle2, 
  Search, 
  UserCheck, 
  FileText, 
  Settings, 
  Cable,
  Lock,
  Layers,
  ListTodo
} from 'lucide-react';
import { ViewTab, DashboardStats } from '../types';

interface NavigationProps {
  currentTab: ViewTab;
  onTabChange: (tab: ViewTab) => void;
  stats: DashboardStats;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentTab,
  onTabChange,
  stats
}) => {
  const navItems: {
    id: ViewTab;
    label: string;
    shortLabel: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number | string;
    badgeColor?: string;
  }[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      shortLabel: 'Overview',
      icon: LayoutDashboard,
    },
    {
      id: 'all-consumers',
      label: 'All Consumers',
      shortLabel: 'All Records',
      icon: Users,
      badge: stats.totalConsumers,
      badgeColor: 'bg-slate-200 text-slate-800'
    },
    {
      id: 'shifted',
      label: 'Shifted List',
      shortLabel: 'Shifted',
      icon: CheckCircle2,
      badge: stats.shifted,
      badgeColor: 'bg-emerald-600 text-white font-bold'
    },
    {
      id: 'cable-shortage',
      label: 'Cable Shortage',
      shortLabel: 'Cable Shortage',
      icon: Cable,
      badge: stats.cableShortage,
      badgeColor: 'bg-amber-500 text-slate-950 font-black'
    },
    {
      id: 'door-lock',
      label: 'Door Lock',
      shortLabel: 'Door Lock',
      icon: Lock,
      badge: stats.doorLock,
      badgeColor: 'bg-red-600 text-white font-bold'
    },
    {
      id: 'remaining-pending',
      label: 'Remaining Pending',
      shortLabel: 'Remaining Pending',
      icon: ListTodo,
      badge: stats.remainingPending,
      badgeColor: 'bg-slate-800 text-amber-400 font-bold'
    },
    {
      id: 'search',
      label: 'Smart Search',
      shortLabel: 'Search',
      icon: Search,
    },
    {
      id: 'staff',
      label: 'Staff Tracking',
      shortLabel: 'Staff',
      icon: UserCheck,
    },
    {
      id: 'reports',
      label: 'Reports & Export',
      shortLabel: 'Reports',
      icon: FileText,
    },
    {
      id: 'backup-settings',
      label: 'Settings & Excel',
      shortLabel: 'Settings',
      icon: Settings,
      badge: stats.duplicateCount > 0 ? `${stats.duplicateCount} Dup` : undefined,
      badgeColor: 'bg-amber-500 text-slate-950 font-bold'
    }
  ];

  return (
    <>
      {/* Tablet & Desktop Navigation Strip */}
      <nav className="hidden lg:block bg-white border-b border-slate-200 shadow-xs sticky top-[75px] z-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center space-x-1 overflow-x-auto py-2 scrollbar-none">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition cursor-pointer select-none ${
                    isActive
                      ? 'bg-[#0d3b66] text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                  {item.badge !== undefined && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ml-1 ${
                        isActive ? 'bg-white/20 text-white' : item.badgeColor
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Medium screens Tab Scroll strip */}
      <nav className="lg:hidden bg-white border-b border-slate-200 shadow-2xs px-2 py-1.5 sticky top-[70px] z-20 overflow-x-auto scrollbar-none flex items-center gap-1.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-[#0d3b66] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-amber-400' : 'text-slate-500'}`} />
              <span>{item.shortLabel}</span>
              {item.badge !== undefined && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isActive ? 'bg-white/20 text-white' : item.badgeColor
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Android Mobile Thumb-Friendly Fixed Bottom Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 z-30 px-2 py-1 shadow-2xl safe-area-bottom">
        <div className="grid grid-cols-5 items-center gap-1 text-center">
          
          {/* Dashboard */}
          <button
            onClick={() => onTabChange('dashboard')}
            className={`flex flex-col items-center py-1 rounded-lg transition active:scale-95 ${
              currentTab === 'dashboard' ? 'text-[#0d3b66] font-bold' : 'text-slate-500'
            }`}
          >
            <LayoutDashboard className={`w-5 h-5 ${currentTab === 'dashboard' ? 'text-[#0d3b66] stroke-[2.5]' : ''}`} />
            <span className="text-[10px] mt-0.5">Overview</span>
          </button>

          {/* Shifted */}
          <button
            onClick={() => onTabChange('shifted')}
            className={`flex flex-col items-center py-1 rounded-lg transition active:scale-95 relative ${
              currentTab === 'shifted' ? 'text-emerald-700 font-bold' : 'text-slate-500'
            }`}
          >
            <div className="relative">
              <CheckCircle2 className={`w-5 h-5 ${currentTab === 'shifted' ? 'text-emerald-600 stroke-[2.5]' : ''}`} />
              <span className="absolute -top-1 -right-2 bg-emerald-600 text-white text-[9px] font-black rounded-full px-1 min-w-[15px] h-[15px] flex items-center justify-center leading-none">
                {stats.shifted}
              </span>
            </div>
            <span className="text-[10px] mt-0.5">Shifted</span>
          </button>

          {/* Remaining Pending */}
          <button
            onClick={() => onTabChange('remaining-pending')}
            className={`flex flex-col items-center py-1 rounded-lg transition active:scale-95 relative ${
              currentTab === 'remaining-pending' ? 'text-amber-700 font-bold' : 'text-slate-500'
            }`}
          >
            <div className="relative">
              <Clock className={`w-5 h-5 ${currentTab === 'remaining-pending' ? 'text-amber-600 stroke-[2.5]' : ''}`} />
              <span className="absolute -top-1 -right-2 bg-amber-500 text-slate-950 text-[9px] font-black rounded-full px-1 min-w-[15px] h-[15px] flex items-center justify-center leading-none">
                {stats.remainingPending}
              </span>
            </div>
            <span className="text-[10px] mt-0.5">Pending</span>
          </button>

          {/* Search */}
          <button
            onClick={() => onTabChange('search')}
            className={`flex flex-col items-center py-1 rounded-lg transition active:scale-95 ${
              currentTab === 'search' ? 'text-[#0d3b66] font-bold' : 'text-slate-500'
            }`}
          >
            <Search className={`w-5 h-5 ${currentTab === 'search' ? 'text-[#0d3b66] stroke-[2.5]' : ''}`} />
            <span className="text-[10px] mt-0.5">Search</span>
          </button>

          {/* More / All / Settings */}
          <button
            onClick={() => {
              if (currentTab === 'cable-shortage') onTabChange('door-lock');
              else if (currentTab === 'door-lock') onTabChange('reports');
              else if (currentTab === 'reports') onTabChange('backup-settings');
              else onTabChange('all-consumers');
            }}
            className={`flex flex-col items-center py-1 rounded-lg transition active:scale-95 ${
              ['all-consumers', 'cable-shortage', 'door-lock', 'staff', 'reports', 'backup-settings'].includes(currentTab) ? 'text-[#0d3b66] font-bold' : 'text-slate-500'
            }`}
          >
            <Layers className={`w-5 h-5 ${['all-consumers', 'cable-shortage', 'door-lock', 'staff', 'reports', 'backup-settings'].includes(currentTab) ? 'text-[#0d3b66] stroke-[2.5]' : ''}`} />
            <span className="text-[10px] mt-0.5">
              {currentTab === 'all-consumers' ? 'All' : (currentTab === 'cable-shortage' ? 'Cable' : (currentTab === 'door-lock' ? 'Lock' : 'More'))}
            </span>
          </button>

        </div>
      </div>
    </>
  );
};
