/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  AlertTriangle, 
  X, 
  CheckCircle2, 
  Wrench, 
  MapPin, 
  User, 
  ShieldAlert, 
  Save, 
  FileText 
} from 'lucide-react';
import { Consumer, UpdateHistoryItem } from '../types';
import { getStatusConfig } from '../utils/status';

interface DuplicateReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  consumers: Consumer[];
  onUpdateConsumer: (consumer: Consumer, historyItem: UpdateHistoryItem) => void;
  onOpenUpdateModal: (consumer: Consumer) => void;
}

export const DuplicateReviewModal: React.FC<DuplicateReviewModalProps> = ({
  isOpen,
  onClose,
  consumers,
  onUpdateConsumer,
  onOpenUpdateModal
}) => {
  // Group duplicate consumers by consumer number
  const duplicateGroups = useMemo(() => {
    const map = new Map<string, Consumer[]>();
    consumers.forEach(c => {
      if (c.isDuplicate) {
        const num = c.consumerNumber.trim();
        const list = map.get(num) || [];
        list.push(c);
        map.set(num, list);
      }
    });
    return Array.from(map.entries());
  }, [consumers]);

  const [activeNumber, setActiveNumber] = useState<string>(
    duplicateGroups[0] ? duplicateGroups[0][0] : ''
  );
  const [reviewNote, setReviewNote] = useState('');

  const currentRecords = useMemo(() => {
    const group = duplicateGroups.find(([num]) => num === activeNumber);
    return group ? group[1] : [];
  }, [duplicateGroups, activeNumber]);

  if (!isOpen) return null;

  const handleMarkReviewed = () => {
    if (!reviewNote.trim()) {
      alert('Please add a supervisor note explaining the review decision (e.g., verified two separate premises, or verified sub-meter connection).');
      return;
    }

    currentRecords.forEach(c => {
      const historyItem: UpdateHistoryItem = {
        id: `HIST-DUP-${Date.now()}-${c.id}`,
        timestamp: new Date().toISOString(),
        action: 'DUPLICATE_REVIEW',
        changedBy: 'Supervisor Titlagarh',
        notes: `Supervisor Review: ${reviewNote}`
      };

      const updated: Consumer = {
        ...c,
        duplicateNotes: reviewNote,
        isReviewed: true
      };

      onUpdateConsumer(updated, historyItem);
    });

    alert(`Saved supervisor review note for Consumer Number ${activeNumber}. Both records preserved safely.`);
    setReviewNote('');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-amber-500 text-slate-950 px-5 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-950 text-amber-400 rounded-xl font-black">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider bg-slate-950 text-amber-400 px-2 py-0.5 rounded">
                TPWODL Audit Protocol
              </span>
              <h2 className="text-base sm:text-lg font-extrabold tracking-tight mt-0.5">
                Duplicate Consumer Numbers Review Hub
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-950 hover:bg-black/10 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900">
            <strong>Supervisor Notice:</strong> In compliance with TPWODL data governance, duplicate consumer numbers are flagged and preserved. They are <strong>never silently deleted or merged</strong>. Review the paired entries below, inspect individual premises, and annotate your findings.
          </div>

          {duplicateGroups.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-xs">
              No duplicate consumer numbers currently flagged.
            </div>
          ) : (
            <>
              {/* Consumer Number Tab Buttons */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                <span className="text-xs font-bold text-slate-500 shrink-0">Select Number:</span>
                {duplicateGroups.map(([num, list]) => (
                  <button
                    key={num}
                    onClick={() => setActiveNumber(num)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition shrink-0 cursor-pointer ${
                      activeNumber === num
                        ? 'bg-[#0d3b66] text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {num} ({list.length} records)
                  </button>
                ))}
              </div>

              {/* Side-by-Side Comparison */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentRecords.map((consumer, index) => (
                  <div 
                    key={consumer.id}
                    className="border-2 border-slate-200 rounded-xl p-4 bg-slate-50 flex flex-col justify-between space-y-3"
                  >
                    <div>
                      <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                        <span className="text-xs font-black bg-[#0d3b66] text-white px-2 py-0.5 rounded">
                          Entry #{index + 1}
                        </span>
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${getStatusConfig(consumer.status).pillClass}`}>
                          {consumer.status}
                        </span>
                      </div>

                      <div className="mt-3 space-y-2 text-xs">
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold uppercase block">Consumer Name</span>
                          <span className="text-sm font-extrabold text-slate-900">{consumer.consumerName}</span>
                        </div>

                        <div>
                          <span className="text-[10px] text-slate-400 font-bold uppercase block">Address</span>
                          <span className="text-slate-700">{consumer.address}</span>
                        </div>

                        <div>
                          <span className="text-[10px] text-slate-400 font-bold uppercase block">Section</span>
                          <span className="text-blue-800 font-semibold">{consumer.section}</span>
                        </div>

                        <div>
                          <span className="text-[10px] text-slate-400 font-bold uppercase block">Irregularity</span>
                          <span className="text-amber-900 font-semibold bg-amber-100/60 px-2 py-0.5 rounded inline-block">
                            {consumer.irregularityType}
                          </span>
                        </div>

                        <div>
                          <span className="text-[10px] text-slate-400 font-bold uppercase block">Assigned Team</span>
                          <span className="text-slate-800 font-medium">{consumer.assignedStaff || consumer.actionTeam}</span>
                        </div>

                        {consumer.duplicateNotes && (
                          <div className="p-2 bg-white rounded border border-amber-200 text-amber-900 text-[11px]">
                            <strong>Audit Note:</strong> {consumer.duplicateNotes}
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        onClose();
                        onOpenUpdateModal(consumer);
                      }}
                      className="w-full py-2 bg-[#0d3b66] hover:bg-blue-900 text-white font-bold text-xs rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Wrench className="w-3.5 h-3.5 text-amber-400" />
                      <span>Update This Entry</span>
                    </button>
                  </div>
                ))}
              </div>

              {/* Review Annotation Input */}
              <div className="bg-slate-100 p-4 rounded-xl space-y-2 text-xs">
                <label className="block font-bold text-slate-800">
                  Supervisor Audit Review Note for Consumer #{activeNumber}:
                </label>
                <input
                  type="text"
                  placeholder="e.g. Verified: Two separate shops sharing service line. Both to be metered independently."
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-[#0d3b66] focus:outline-none"
                />
                <div className="flex justify-end pt-1">
                  <button
                    onClick={handleMarkReviewed}
                    className="flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-lg transition shadow-xs cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Review Note (Preserve Both)</span>
                  </button>
                </div>
              </div>
            </>
          )}

        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-lg transition"
          >
            Close Review Hub
          </button>
        </div>

      </div>
    </div>
  );
};
