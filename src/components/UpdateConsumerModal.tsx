/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  CheckCircle2, 
  Clock, 
  Save, 
  Wrench, 
  Calendar, 
  User, 
  FileText, 
  Cpu, 
  AlertTriangle, 
  Lock, 
  Cable, 
  Check, 
  ShieldCheck,
  History,
  RotateCcw
} from 'lucide-react';
import { Consumer, MeterShiftingStatus, StaffMember, UpdateHistoryItem } from '../types';
import { getStatusConfig } from '../utils/status';

interface UpdateConsumerModalProps {
  consumer: Consumer | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveUpdate: (updatedConsumer: Consumer, historyItem: UpdateHistoryItem) => void;
  staffList: StaffMember[];
}

export const UpdateConsumerModal: React.FC<UpdateConsumerModalProps> = ({
  consumer,
  isOpen,
  onClose,
  onSaveUpdate,
  staffList
}) => {
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  const [status, setStatus] = useState<MeterShiftingStatus>(consumer?.status || 'NOT UPDATED');
  const [shiftingDate, setShiftingDate] = useState<string>(consumer?.shiftingDate || todayStr);
  const [newMeterNumber, setNewMeterNumber] = useState<string>(consumer?.newMeterNumber || '');
  const [oldMeterNumber, setOldMeterNumber] = useState<string>(consumer?.oldMeterNumber || '');
  const [initialReading, setInitialReading] = useState<string>(consumer?.initialReading || '');
  const [finalReading, setFinalReading] = useState<string>(consumer?.finalReading || '');
  const [assignedStaff, setAssignedStaff] = useState<string>(consumer?.assignedStaff || consumer?.actionTeam || '');
  const [remarks, setRemarks] = useState<string>(consumer?.remarks || '');

  // Reset local state when consumer changes
  useEffect(() => {
    if (consumer) {
      setStatus(consumer.status || 'NOT UPDATED');
      setShiftingDate(consumer.shiftingDate || todayStr);
      setNewMeterNumber(consumer.newMeterNumber || '');
      setOldMeterNumber(consumer.oldMeterNumber || '');
      setInitialReading(consumer.initialReading || '');
      setFinalReading(consumer.finalReading || '');
      setAssignedStaff(consumer.assignedStaff || consumer.actionTeam || '');
      setRemarks(consumer.remarks || '');
    }
  }, [consumer, todayStr]);

  if (!isOpen || !consumer) return null;

  const currentConfig = getStatusConfig(status);

  // Status-specific quick chips for field convenience
  const quickRemarksByStatus: Record<MeterShiftingStatus, string[]> = {
    'SHIFTED': [
      'Shifted outside to boundary wall with armored service cable',
      'Shifted to external service pole outside premises',
      'New electronic digital meter installed and energized',
      'Service line joints removed; direct connection ensured',
      'Old meter replaced and verified with official seal'
    ],
    'CABLE SHORTAGE': [
      'Armored service cable shortage at site; 15m cable needed',
      'Pending armored service cable allotment from Titlagarh store',
      'Service line length exceeding standard span; awaiting cable dispatch',
      'Partial work done; meter mounting ready, awaiting cable connection'
    ],
    'DOOR LOCK': [
      'Consumer premises locked / gate locked during squad visit',
      'Spoke with consumer by phone; scheduled revisit for next working day',
      'Premises locked; neighbor informed regarding meter shifting drive',
      'Repeatedly locked premises; notice slip pasted on door'
    ],
    'NOT UPDATED': [
      'Work pending squad inspection',
      'Scheduled for shifting by squad this week'
    ]
  };

  const handleApplyQuickRemark = (text: string) => {
    setRemarks((prev) => (prev ? `${prev}. ${text}` : text));
  };

  const handleGenerateMeterNumber = () => {
    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    setNewMeterNumber(`TPW-${randomSuffix}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const previousStatus = consumer.status;
    const isStatusChanged = previousStatus !== status;

    const historyItem: UpdateHistoryItem = {
      id: `HIST-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: isStatusChanged ? 'STATUS_CHANGE' : 'DETAILS_EDITED',
      previousStatus: previousStatus,
      newStatus: status,
      changedBy: 'Supervisor Titlagarh',
      notes: remarks || `Status set to ${status}`,
      meterNumber: newMeterNumber || undefined,
      oldMeterNumber: oldMeterNumber || undefined,
      assignedStaff: assignedStaff || undefined
    };

    const updated: Consumer = {
      ...consumer,
      status: status,
      shiftingDate: status !== 'NOT UPDATED' ? (shiftingDate || todayStr) : undefined,
      newMeterNumber: status === 'SHIFTED' ? (newMeterNumber.trim() || undefined) : undefined,
      oldMeterNumber: oldMeterNumber.trim() || undefined,
      initialReading: initialReading.trim() || undefined,
      finalReading: finalReading.trim() || undefined,
      assignedStaff: assignedStaff.trim() || consumer.actionTeam,
      remarks: remarks.trim() || undefined,
      updatedBy: 'Supervisor Titlagarh'
    };

    onSaveUpdate(updated, historyItem);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header Banner */}
        <div className="bg-[#0d3b66] text-white px-5 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-400 text-slate-950 rounded-xl font-black">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] bg-amber-400 text-slate-950 px-2 py-0.5 rounded font-black uppercase">
                  TPWODL Field Action
                </span>
                <span className="text-xs text-blue-200 font-mono">
                  No: {consumer.consumerNumber}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold tracking-tight text-white mt-0.5">
                Update Meter Shifting Record
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-blue-200 hover:text-white rounded-lg hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-5 space-y-4 text-xs sm:text-sm">
          
          {/* Consumer Overview Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                  Consumer Name
                </span>
                <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
                  {consumer.consumerName}
                </h3>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                  Section
                </span>
                <span className="block font-bold text-slate-800 text-xs bg-slate-200/80 px-2 py-0.5 rounded">
                  {consumer.section}
                </span>
              </div>
            </div>

            <div className="text-xs text-slate-600">
              <span className="font-semibold text-slate-500">Address: </span>
              {consumer.address}
            </div>

            <div className="text-xs flex items-center justify-between flex-wrap gap-2">
              <div>
                <span className="font-semibold text-slate-500">Current Irregularity: </span>
                <span className="font-bold text-slate-800 bg-slate-200/80 px-2 py-0.5 rounded ml-1">
                  {consumer.irregularityType}
                </span>
              </div>
              <div>
                <span className="font-semibold text-slate-500">Active Status: </span>
                <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${getStatusConfig(consumer.status).pillClass}`}>
                  {consumer.status}
                </span>
              </div>
            </div>
          </div>

          {/* 3 Main Status Buttons Requirement: SHIFTED, CABLE SHORTAGE, DOOR LOCK */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-black text-slate-900 uppercase tracking-wider">
                Select Meter Shifting Status <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => setStatus('NOT UPDATED')}
                className="text-[11px] text-slate-500 hover:text-slate-800 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset to Not Updated</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              
              {/* Status 1: SHIFTED (Green) */}
              <button
                type="button"
                onClick={() => setStatus('SHIFTED')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition font-bold text-center cursor-pointer ${
                  status === 'SHIFTED'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-900 shadow-sm ring-2 ring-emerald-500/30'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-emerald-300'
                }`}
              >
                <div className={`p-2 rounded-full mb-1 ${status === 'SHIFTED' ? 'bg-emerald-600 text-white' : 'bg-emerald-100 text-emerald-700'}`}>
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <span className="text-xs sm:text-sm font-black">1. SHIFTED</span>
                <span className="text-[10px] text-emerald-700 mt-0.5 font-medium">Work Completed</span>
              </button>

              {/* Status 2: CABLE SHORTAGE (Orange) */}
              <button
                type="button"
                onClick={() => setStatus('CABLE SHORTAGE')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition font-bold text-center cursor-pointer ${
                  status === 'CABLE SHORTAGE'
                    ? 'border-amber-500 bg-amber-50 text-amber-950 shadow-sm ring-2 ring-amber-500/30'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-amber-300'
                }`}
              >
                <div className={`p-2 rounded-full mb-1 ${status === 'CABLE SHORTAGE' ? 'bg-amber-500 text-slate-950' : 'bg-amber-100 text-amber-800'}`}>
                  <Cable className="w-5 h-5" />
                </div>
                <span className="text-xs sm:text-sm font-black">2. CABLE SHORTAGE</span>
                <span className="text-[10px] text-amber-800 mt-0.5 font-medium">Pending Cable Allotment</span>
              </button>

              {/* Status 3: DOOR LOCK (Red) */}
              <button
                type="button"
                onClick={() => setStatus('DOOR LOCK')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition font-bold text-center cursor-pointer ${
                  status === 'DOOR LOCK'
                    ? 'border-red-600 bg-red-50 text-red-950 shadow-sm ring-2 ring-red-500/30'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-red-300'
                }`}
              >
                <div className={`p-2 rounded-full mb-1 ${status === 'DOOR LOCK' ? 'bg-red-600 text-white' : 'bg-red-100 text-red-700'}`}>
                  <Lock className="w-5 h-5" />
                </div>
                <span className="text-xs sm:text-sm font-black">3. DOOR LOCK</span>
                <span className="text-[10px] text-red-800 mt-0.5 font-medium">Premises Locked</span>
              </button>

            </div>
          </div>

          {/* Date Field (Common to all active statuses) */}
          {status !== 'NOT UPDATED' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>
                  {status === 'SHIFTED' ? 'Meter Shifting Date' : (status === 'CABLE SHORTAGE' ? 'Cable Shortage Observation Date' : 'Door Lock Inspection Date')} <span className="text-red-500">*</span>
                </span>
              </label>
              <input
                type="date"
                value={shiftingDate}
                onChange={(e) => setShiftingDate(e.target.value)}
                required
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-[#0d3b66] focus:outline-none"
              />
            </div>
          )}

          {/* Specific Fields for SHIFTED Status */}
          {status === 'SHIFTED' && (
            <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4 space-y-3.5">
              
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Shifted Meter Information</span>
              </div>

              {/* New Meter Number */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5 text-slate-500" />
                    <span>New Meter Number (Optional)</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleGenerateMeterNumber}
                    className="text-[11px] font-bold text-emerald-700 hover:underline cursor-pointer"
                  >
                    + Generate Auto No.
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="e.g. TPW-20260481"
                  value={newMeterNumber}
                  onChange={(e) => setNewMeterNumber(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 font-mono text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {/* Old Meter Number and Final Reading */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Old Meter Number (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. GEN-940212"
                    value={oldMeterNumber}
                    onChange={(e) => setOldMeterNumber(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 font-mono text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Final Reading of Old Meter (kWh)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 1420 kWh"
                    value={finalReading}
                    onChange={(e) => setFinalReading(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

            </div>
          )}

          {/* Assigned Staff Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-500" />
              <span>Assigned Staff / Lineman Squad</span>
            </label>
            <select
              value={assignedStaff}
              onChange={(e) => setAssignedStaff(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-[#0d3b66] focus:outline-none"
            >
              <option value="">Select Staff / Squad...</option>
              {staffList.map((s) => (
                <option key={s.id} value={s.name}>
                  {s.name} ({s.role} - {s.team})
                </option>
              ))}
              <option value="Team A - Subrat & Rajesh">Team A - Subrat & Rajesh</option>
              <option value="Team B - Pradeep & Santosh">Team B - Pradeep & Santosh</option>
              <option value="Team C - Manas & Bikash">Team C - Manas & Bikash</option>
              <option value="Team D - Rakesh & Amit">Team D - Rakesh & Amit</option>
              <option value="MRT Squad 1 (Sanjay Lineman)">MRT Squad 1 (Sanjay Lineman)</option>
              <option value="MRT Squad 2 (Birendra Lineman)">MRT Squad 2 (Birendra Lineman)</option>
              <option value="Contractor Squad 1 (M/s Shree Power)">Contractor Squad 1 (M/s Shree Power)</option>
              <option value="Contractor Squad 2 (M/s Samaleswari)">Contractor Squad 2 (M/s Samaleswari)</option>
            </select>
          </div>

          {/* Remarks Field & Quick Selection Chips */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                <span>Remarks & Field Observations</span>
              </label>
              <span className="text-[10px] text-slate-400">Click to append</span>
            </div>

            {/* Quick chips matching the active status */}
            <div className="flex flex-wrap gap-1.5 mb-2">
              {(quickRemarksByStatus[status] || []).map((qr, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => handleApplyQuickRemark(qr)}
                  className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded-md border border-slate-200 transition text-left cursor-pointer"
                >
                  + {qr}
                </button>
              ))}
            </div>

            <textarea
              rows={3}
              placeholder="Enter remarks, cable length, boundary location, reason for shortage, or contact notes..."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-[#0d3b66] focus:outline-none"
            />
          </div>

          {/* Audit History display */}
          {consumer.history && consumer.history.length > 0 && (
            <div className="pt-2 border-t border-slate-200">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-2">
                <History className="w-3.5 h-3.5 text-slate-500" />
                <span>Status Update History & Audit Trail ({consumer.history.length})</span>
              </div>
              <div className="space-y-1.5 max-h-32 overflow-y-auto">
                {consumer.history.map((h, i) => (
                  <div key={h.id || i} className="p-2 bg-slate-50 rounded border border-slate-200 text-[11px]">
                    <div className="flex justify-between font-semibold text-slate-700">
                      <span>{h.action} {h.newStatus ? `→ ${h.newStatus}` : ''}</span>
                      <span className="text-slate-400">{new Date(h.timestamp).toLocaleDateString()}</span>
                    </div>
                    <div className="text-slate-600">{h.notes}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Submit Action Footer */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3 sticky bottom-0 bg-white py-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2.5 bg-[#0d3b66] hover:bg-blue-900 text-white text-xs sm:text-sm font-extrabold rounded-xl shadow-md transition active:scale-95 cursor-pointer"
            >
              <Save className="w-4 h-4 text-amber-400" />
              <span>SAVE STATUS UPDATE</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
