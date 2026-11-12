/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MeterShiftingStatus } from '../types';

export interface StatusConfig {
  label: MeterShiftingStatus;
  badgeClass: string;
  pillClass: string;
  lightClass: string;
  borderClass: string;
  textClass: string;
  bgHex: string;
}

export const STATUS_CONFIG: Record<MeterShiftingStatus, StatusConfig> = {
  'SHIFTED': {
    label: 'SHIFTED',
    badgeClass: 'bg-emerald-600 text-white font-bold',
    pillClass: 'bg-emerald-100 text-emerald-800 font-bold',
    lightClass: 'bg-emerald-50 text-emerald-900 border-emerald-200',
    borderClass: 'border-emerald-500',
    textClass: 'text-emerald-700',
    bgHex: '#059669' // Green
  },
  'CABLE SHORTAGE': {
    label: 'CABLE SHORTAGE',
    badgeClass: 'bg-amber-500 text-slate-950 font-black',
    pillClass: 'bg-amber-100 text-amber-900 font-black',
    lightClass: 'bg-amber-50 text-amber-950 border-amber-300',
    borderClass: 'border-amber-500',
    textClass: 'text-amber-800',
    bgHex: '#f59e0b' // Orange
  },
  'DOOR LOCK': {
    label: 'DOOR LOCK',
    badgeClass: 'bg-red-600 text-white font-bold',
    pillClass: 'bg-red-100 text-red-800 font-bold',
    lightClass: 'bg-red-50 text-red-900 border-red-200',
    borderClass: 'border-red-500',
    textClass: 'text-red-700',
    bgHex: '#dc2626' // Red
  },
  'NOT UPDATED': {
    label: 'NOT UPDATED',
    badgeClass: 'bg-slate-400 text-white font-bold',
    pillClass: 'bg-slate-200 text-slate-700 font-semibold',
    lightClass: 'bg-slate-50 text-slate-700 border-slate-200',
    borderClass: 'border-slate-300',
    textClass: 'text-slate-600',
    bgHex: '#94a3b8' // Grey
  }
};

export function getStatusConfig(status?: MeterShiftingStatus): StatusConfig {
  if (!status || !STATUS_CONFIG[status]) {
    return STATUS_CONFIG['NOT UPDATED'];
  }
  return STATUS_CONFIG[status];
}
