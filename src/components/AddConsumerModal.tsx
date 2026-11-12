/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, UserPlus, Save, Building2, MapPin, ShieldAlert, Users } from 'lucide-react';
import { Consumer, StaffMember } from '../types';

interface AddConsumerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddConsumer: (consumer: Consumer) => void;
  staffList: StaffMember[];
}

export const AddConsumerModal: React.FC<AddConsumerModalProps> = ({
  isOpen,
  onClose,
  onAddConsumer,
  staffList
}) => {
  const [consumerNumber, setConsumerNumber] = useState('');
  const [consumerName, setConsumerName] = useState('');
  const [address, setAddress] = useState('');
  const [section, setSection] = useState('Titlagarh Town Section - I');
  const [irregularityType, setIrregularityType] = useState('Meter Inside Premises / Inaccessible');
  const [actionTeam, setActionTeam] = useState('Team A - Subrat & Rajesh');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!consumerNumber.trim() || !consumerName.trim()) {
      alert('Please fill in Consumer Number and Name');
      return;
    }

    const newConsumer: Consumer = {
      id: `CONS-MANUAL-${Date.now()}`,
      consumerNumber: consumerNumber.trim(),
      consumerName: consumerName.trim(),
      address: address.trim() || 'Titlagarh, Balangir',
      section: section,
      irregularityType: irregularityType,
      actionTeam: actionTeam,
      status: 'NOT UPDATED',
      history: [
        {
          id: `HIST-${Date.now()}`,
          timestamp: new Date().toISOString(),
          action: 'STATUS_CHANGE',
          newStatus: 'NOT UPDATED',
          changedBy: 'Supervisor Titlagarh',
          notes: 'New consumer record manually added by Supervisor'
        }
      ]
    };

    onAddConsumer(newConsumer);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* Header */}
        <div className="bg-[#0d3b66] text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-400 text-slate-950 rounded-xl">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base">Add Consumer Record</h3>
              <p className="text-[11px] text-blue-200">Titlagarh Electrical Section</p>
            </div>
          </div>
          <button onClick={onClose} className="text-blue-200 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs sm:text-sm">
          
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Consumer Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. 6112001999"
              value={consumerNumber}
              onChange={(e) => setConsumerNumber(e.target.value)}
              required
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-mono focus:bg-white focus:ring-2 focus:ring-[#0d3b66] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Consumer Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Ramesh Chandra Sahu"
              value={consumerName}
              onChange={(e) => setConsumerName(e.target.value)}
              required
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:bg-white focus:ring-2 focus:ring-[#0d3b66] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Premises Address
            </label>
            <input
              type="text"
              placeholder="e.g. Plot No. 45, Ward No. 4, Daily Market, Titlagarh"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:bg-white focus:ring-2 focus:ring-[#0d3b66] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Section
            </label>
            <select
              value={section}
              onChange={(e) => setSection(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:bg-white"
            >
              <option value="Titlagarh Town Section - I">Titlagarh Town Section - I</option>
              <option value="Titlagarh Town Section - II">Titlagarh Town Section - II</option>
              <option value="Hatpadapara Section">Hatpadapara Section</option>
              <option value="Station Road Section">Station Road Section</option>
              <option value="Daily Market Section">Daily Market Section</option>
              <option value="Old Bus Stand Section">Old Bus Stand Section</option>
              <option value="Kumharpara Section">Kumharpara Section</option>
              <option value="Bhatipara Section">Bhatipara Section</option>
              <option value="Kholanpara Section">Kholanpara Section</option>
              <option value="Sai Mandir Road Section">Sai Mandir Road Section</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Irregularity Type
            </label>
            <select
              value={irregularityType}
              onChange={(e) => setIrregularityType(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:bg-white"
            >
              <option value="Meter Inside Premises / Inaccessible">Meter Inside Premises / Inaccessible</option>
              <option value="Burnt Meter / Display Defective">Burnt Meter / Display Defective</option>
              <option value="Tampered Meter / Suspected Bypass">Tampered Meter / Suspected Bypass</option>
              <option value="Electromechanical Old Meter Replacement">Electromechanical Old Meter Replacement</option>
              <option value="Height Violation / Non-Standard Position">Height Violation / Non-Standard Position</option>
              <option value="Direct Tapping Suspected">Direct Tapping Suspected</option>
              <option value="Glass Broken / Body Damaged">Glass Broken / Body Damaged</option>
              <option value="Burnt Terminal Block">Burnt Terminal Block</option>
              <option value="Service Line Joint Before Meter">Service Line Joint Before Meter</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Action / Team Assigned
            </label>
            <select
              value={actionTeam}
              onChange={(e) => setActionTeam(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:bg-white"
            >
              {staffList.map(s => (
                <option key={s.id} value={`${s.team} - ${s.name}`}>
                  {s.name} ({s.team})
                </option>
              ))}
              <option value="Team A - Subrat & Rajesh">Team A - Subrat & Rajesh</option>
              <option value="Team B - Pradeep & Santosh">Team B - Pradeep & Santosh</option>
              <option value="Team C - Manas & Bikash">Team C - Manas & Bikash</option>
              <option value="Team D - Rakesh & Amit">Team D - Rakesh & Amit</option>
            </select>
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2 bg-[#0d3b66] hover:bg-blue-900 text-white font-bold text-xs rounded-xl shadow-xs"
            >
              <Save className="w-3.5 h-3.5 text-amber-400" />
              <span>Save Consumer</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
