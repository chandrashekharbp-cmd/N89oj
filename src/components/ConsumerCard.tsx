/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Wrench, 
  MapPin, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  User, 
  Copy, 
  Check, 
  History, 
  ShieldAlert, 
  Calendar, 
  Cpu, 
  FileText,
  ChevronDown,
  ChevronUp,
  Cable,
  Lock
} from 'lucide-react';
import { Consumer } from '../types';
import { getStatusConfig } from '../utils/status';

interface ConsumerCardProps {
  consumer: Consumer;
  onUpdateClick: (consumer: Consumer) => void;
}

export const ConsumerCard: React.FC<ConsumerCardProps> = ({
  consumer,
  onUpdateClick
}) => {
  const [copied, setCopied] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(consumer.consumerNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const statusConfig = getStatusConfig(consumer.status);
  const isShifted = consumer.status === 'SHIFTED';

  return (
    <div className={`bg-white rounded-xl border transition-all duration-200 overflow-hidden shadow-xs hover:shadow-md ${
      isShifted 
        ? 'border-emerald-200 hover:border-emerald-300' 
        : (consumer.status === 'CABLE SHORTAGE' ? 'border-amber-200 hover:border-amber-300' : (consumer.status === 'DOOR LOCK' ? 'border-red-200 hover:border-red-300' : 'border-slate-200 hover:border-blue-300'))
    } ${consumer.isDuplicate ? 'ring-2 ring-amber-400 ring-offset-1' : ''}`}>
      
      {/* Top Banner: Consumer Number, Section, Status */}
      <div className={`px-4 py-2.5 flex items-center justify-between border-b ${
        isShifted 
          ? 'bg-emerald-50/70 border-emerald-100' 
          : (consumer.status === 'CABLE SHORTAGE' ? 'bg-amber-50/70 border-amber-100' : (consumer.status === 'DOOR LOCK' ? 'bg-red-50/70 border-red-100' : 'bg-slate-50 border-slate-100'))
      }`}>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-white px-2.5 py-1 rounded-md border border-slate-200 shadow-2xs">
            <span className="text-[10px] text-slate-400 font-bold uppercase mr-1">No:</span>
            <span className="font-mono text-xs sm:text-sm font-extrabold text-slate-900 tracking-wider">
              {consumer.consumerNumber}
            </span>
            <button
              onClick={handleCopy}
              className="ml-1.5 text-slate-400 hover:text-slate-700 transition p-0.5 cursor-pointer"
              title="Copy Consumer Number"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Section Chip */}
          <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-semibold truncate max-w-[130px] sm:max-w-[170px]">
            {consumer.section}
          </span>

          {/* Duplicate Warning Badge */}
          {consumer.isDuplicate && (
            <span className="inline-flex items-center gap-1 text-[10px] bg-amber-500 text-slate-950 font-black px-2 py-0.5 rounded-full shadow-2xs">
              <AlertTriangle className="w-3 h-3 text-slate-950" />
              Duplicate No.
            </span>
          )}
        </div>

        {/* Status Badge with Specific Color */}
        <div>
          <span className={`inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full shadow-2xs ${statusConfig.badgeClass}`}>
            {consumer.status === 'SHIFTED' && <CheckCircle2 className="w-3.5 h-3.5" />}
            {consumer.status === 'CABLE SHORTAGE' && <Cable className="w-3.5 h-3.5" />}
            {consumer.status === 'DOOR LOCK' && <Lock className="w-3.5 h-3.5" />}
            {consumer.status === 'NOT UPDATED' && <Clock className="w-3.5 h-3.5" />}
            <span>{consumer.status}</span>
          </span>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 space-y-3">
        
        {/* Consumer Name */}
        <div>
          <h3 className="text-base font-bold text-slate-900 tracking-tight leading-snug">
            {consumer.consumerName}
          </h3>
        </div>

        {/* Address */}
        <div className="flex items-start gap-2 text-xs text-slate-600">
          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
          <span className="leading-relaxed">{consumer.address}</span>
        </div>

        {/* Types of Irregularities */}
        <div className="flex items-start gap-2 text-xs">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Irregularity:
            </span>
            <span className="font-semibold text-slate-800 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md inline-block mt-0.5">
              {consumer.irregularityType}
            </span>
          </div>
        </div>

        {/* Assigned Staff */}
        <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
          <div className="flex items-center gap-1.5 text-slate-600">
            <User className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[11px]">
              Assigned: <strong className="text-slate-800">{consumer.assignedStaff || consumer.actionTeam}</strong>
            </span>
          </div>
        </div>

        {/* Specific Status Banner */}
        {consumer.status === 'SHIFTED' && (
          <div className="p-2.5 bg-emerald-50 rounded-lg border border-emerald-100 space-y-1.5 text-xs">
            <div className="flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-1 text-emerald-800 font-semibold">
                <Calendar className="w-3 h-3 text-emerald-600" />
                <span>Shifted: <strong>{consumer.shiftingDate || 'Recorded'}</strong></span>
              </div>
              {consumer.newMeterNumber && (
                <div className="flex items-center gap-1 font-mono text-emerald-900 font-bold bg-white px-1.5 py-0.5 rounded border border-emerald-200">
                  <Cpu className="w-3 h-3 text-emerald-600" />
                  <span>New: {consumer.newMeterNumber}</span>
                </div>
              )}
            </div>

            {consumer.oldMeterNumber && (
              <div className="text-[11px] text-slate-600 font-mono">
                Old Meter: <span className="font-semibold">{consumer.oldMeterNumber}</span>
              </div>
            )}

            {consumer.remarks && (
              <div className="text-[11px] text-emerald-900 italic flex items-start gap-1">
                <FileText className="w-3 h-3 text-emerald-600 shrink-0 mt-0.5" />
                <span>"{consumer.remarks}"</span>
              </div>
            )}
          </div>
        )}

        {consumer.status === 'CABLE SHORTAGE' && (
          <div className="p-2.5 bg-amber-50 rounded-lg border border-amber-200 space-y-1 text-xs text-amber-950">
            <div className="flex items-center justify-between text-[11px] font-bold text-amber-900">
              <span className="flex items-center gap-1">
                <Cable className="w-3.5 h-3.5 text-amber-600" />
                <span>Pending Cable Allotment</span>
              </span>
              <span>{consumer.shiftingDate || 'Recorded'}</span>
            </div>
            {consumer.remarks && (
              <div className="text-[11px] text-amber-900 mt-1">
                <strong>Remark: </strong>{consumer.remarks}
              </div>
            )}
          </div>
        )}

        {consumer.status === 'DOOR LOCK' && (
          <div className="p-2.5 bg-red-50 rounded-lg border border-red-200 space-y-1 text-xs text-red-950">
            <div className="flex items-center justify-between text-[11px] font-bold text-red-900">
              <span className="flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-red-600" />
                <span>Premises Locked (Revisit Needed)</span>
              </span>
              <span>{consumer.shiftingDate || 'Recorded'}</span>
            </div>
            {consumer.remarks && (
              <div className="text-[11px] text-red-900 mt-1">
                <strong>Remark: </strong>{consumer.remarks}
              </div>
            )}
          </div>
        )}

        {/* Duplicate Review Note */}
        {consumer.isDuplicate && consumer.duplicateNotes && (
          <div className="text-[11px] bg-amber-50 border border-amber-200 text-amber-900 p-2 rounded-lg">
            <strong>Supervisor Note:</strong> {consumer.duplicateNotes}
          </div>
        )}

      </div>

      {/* Card Action Footer */}
      <div className="px-4 py-3 bg-slate-50/90 border-t border-slate-100 flex items-center justify-between gap-2">
        
        {/* History Toggle */}
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 font-medium transition cursor-pointer"
        >
          <History className="w-3.5 h-3.5" />
          <span>Audit ({consumer.history?.length || 0})</span>
          {showHistory ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>

        {/* Big Touch-Friendly UPDATE Button */}
        <button
          onClick={() => onUpdateClick(consumer)}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold transition shadow-xs active:scale-95 cursor-pointer bg-[#0d3b66] hover:bg-blue-900 text-white ring-2 ring-blue-700/20"
        >
          <Wrench className="w-3.5 h-3.5 text-amber-400" />
          <span>UPDATE STATUS</span>
        </button>

      </div>

      {/* Collapsible History Drawer */}
      {showHistory && (
        <div className="px-4 py-3 bg-slate-100/90 border-t border-slate-200 text-xs space-y-2">
          <div className="font-bold text-slate-700 flex items-center justify-between text-[11px] uppercase tracking-wider">
            <span>Audit Trail & Update Log</span>
            <span>ID: {consumer.id}</span>
          </div>
          {consumer.history && consumer.history.length > 0 ? (
            <div className="space-y-1.5">
              {consumer.history.map((h, i) => (
                <div key={h.id || i} className="bg-white p-2 rounded border border-slate-200 text-[11px]">
                  <div className="flex items-center justify-between font-semibold text-slate-800">
                    <span>{h.action} {h.newStatus ? `→ ${h.newStatus}` : ''}</span>
                    <span className="text-slate-400 text-[10px]">
                      {new Date(h.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <div className="text-slate-600 mt-0.5">
                    {h.notes || `Changed by ${h.changedBy}`}
                  </div>
                  {h.meterNumber && (
                    <div className="text-emerald-700 font-mono text-[10px] mt-0.5">
                      New Meter: {h.meterNumber}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-slate-400 text-[11px] italic">
              Original preloaded record. No status updates yet.
            </div>
          )}
        </div>
      )}

    </div>
  );
};
