/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AlertTriangle, Trash2, X, Download, ShieldAlert } from 'lucide-react';
import { Consumer } from '../types';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmDelete: (downloadSafetyBackup: boolean) => void;
  consumerCount: number;
}

export const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirmDelete,
  consumerCount
}) => {
  const [downloadSafetyBackup, setDownloadSafetyBackup] = useState(true);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border-2 border-red-500 overflow-hidden">
        
        {/* Red Warning Header */}
        <div className="bg-red-600 text-white p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white text-red-600 rounded-xl font-black shadow-sm">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] bg-red-900/80 text-white font-black px-2 py-0.5 rounded uppercase">
                Empty Database Management
              </span>
              <h2 className="text-base sm:text-lg font-black tracking-tight mt-0.5">
                Clear All Consumer Data
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-red-200 hover:text-white p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 text-xs sm:text-sm">
          
          <div className="bg-red-50 border-l-4 border-red-500 p-3.5 rounded-r-xl">
            <p className="font-extrabold text-red-950 text-sm sm:text-base leading-snug">
              Are you sure you want to delete all consumer data?
            </p>
            <p className="text-red-800 text-xs mt-1.5 leading-relaxed">
              This action will permanently remove all <strong>{consumerCount}</strong> consumer records. Dashboard statistics will be reset to zero, and the Pending, Shifted, Cable Shortage, and Door Lock lists will be cleared.
            </p>
          </div>

          <div className="text-xs text-slate-600 space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span><strong>Staff profiles</strong> and application settings will be preserved.</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              <span>You can immediately import a fresh Excel file anytime.</span>
            </div>
          </div>

          {/* Safety Backup Option */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={downloadSafetyBackup}
                onChange={(e) => setDownloadSafetyBackup(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded text-red-600 border-slate-300 focus:ring-red-500"
              />
              <div className="text-xs">
                <span className="font-bold text-slate-900 flex items-center gap-1">
                  <Download className="w-3.5 h-3.5 text-slate-600" />
                  <span>Download safety JSON backup before deleting (Recommended)</span>
                </span>
                <span className="text-slate-500 block mt-0.5">
                  Saves a full copy to your device so you can restore it if needed.
                </span>
              </div>
            </label>
          </div>

        </div>

        {/* Footer with CANCEL and CONFIRM DELETE buttons */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-xs font-extrabold text-slate-700 bg-slate-200 hover:bg-slate-300 rounded-xl transition cursor-pointer"
          >
            CANCEL
          </button>

          <button
            type="button"
            onClick={() => {
              onConfirmDelete(downloadSafetyBackup);
              onClose();
            }}
            className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-black text-xs sm:text-sm rounded-xl shadow-md transition active:scale-95 cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>CONFIRM DELETE</span>
          </button>
        </div>

      </div>
    </div>
  );
};
