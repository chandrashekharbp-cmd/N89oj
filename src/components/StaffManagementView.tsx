/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  UserCheck, 
  Plus, 
  Users, 
  CheckCircle2, 
  Clock, 
  Percent, 
  TrendingUp, 
  Edit2, 
  Trash2, 
  Phone, 
  Shield, 
  ArrowRight,
  HardHat
} from 'lucide-react';
import { StaffMember, Consumer, ViewTab } from '../types';

interface StaffManagementViewProps {
  staffList: StaffMember[];
  consumers: Consumer[];
  onAddStaff: (newStaff: StaffMember) => void;
  onUpdateStaff: (updated: StaffMember) => void;
  onFilterByStaff: (staffName: string) => void;
}

export const StaffManagementView: React.FC<StaffManagementViewProps> = ({
  staffList,
  consumers,
  onAddStaff,
  onUpdateStaff,
  onFilterByStaff
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [role, setRole] = useState<StaffMember['role']>('Lineman');
  const [team, setTeam] = useState('');
  const [phone, setPhone] = useState('');

  // Calculate live statistics for each staff member
  const staffWithStats = useMemo(() => {
    return staffList.map(member => {
      let total = 0;
      let completed = 0;
      let pending = 0;

      consumers.forEach(c => {
        const assigned = (c.assignedStaff || c.actionTeam || '').toLowerCase();
        const memName = member.name.toLowerCase();
        const memTeam = member.team.toLowerCase();

        if (assigned.includes(memName) || (memTeam && assigned.includes(memTeam))) {
          total += 1;
          if (c.status === 'SHIFTED') {
            completed += 1;
          } else {
            pending += 1;
          }
        }
      });

      const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

      return {
        ...member,
        assignedCount: total,
        completedCount: completed,
        pendingCount: pending,
        percentage
      };
    }).sort((a, b) => (b.completedCount || 0) - (a.completedCount || 0));
  }, [staffList, consumers]);

  const handleOpenAdd = () => {
    setName('');
    setRole('Lineman');
    setTeam('Team Squad');
    setPhone('');
    setEditingStaff(null);
    setIsAdding(true);
  };

  const handleOpenEdit = (staff: StaffMember) => {
    setEditingStaff(staff);
    setName(staff.name);
    setRole(staff.role);
    setTeam(staff.team);
    setPhone(staff.phone || '');
    setIsAdding(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingStaff) {
      onUpdateStaff({
        ...editingStaff,
        name: name.trim(),
        role: role,
        team: team.trim() || 'Lineman Squad',
        phone: phone.trim() || undefined
      });
    } else {
      onAddStaff({
        id: `STF-${Date.now()}`,
        name: name.trim(),
        role: role,
        team: team.trim() || 'Lineman Squad',
        phone: phone.trim() || undefined,
        active: true
      });
    }

    setIsAdding(false);
  };

  return (
    <div className="space-y-5 pb-12">
      
      {/* Header Banner */}
      <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <HardHat className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
              Linemen & Squad Management
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Track individual and team performance, completed meter shifts, and pending workload across Titlagarh.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2 bg-[#0d3b66] hover:bg-blue-900 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 text-amber-400" />
          <span>Add Lineman / Squad</span>
        </button>
      </div>

      {/* Staff Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {staffWithStats.map(staff => (
          <div 
            key={staff.id}
            className="bg-white rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition p-4 flex flex-col justify-between"
          >
            <div>
              {/* Top row: Role badge & Edit button */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-[#0d3b66] px-2 py-0.5 rounded">
                  {staff.role} • {staff.team}
                </span>

                <button
                  onClick={() => handleOpenEdit(staff)}
                  className="p-1 text-slate-400 hover:text-slate-700 rounded transition"
                  title="Edit staff details"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Staff Name */}
              <h3 className="text-base font-extrabold text-slate-900 mb-1">
                {staff.name}
              </h3>

              {staff.phone && (
                <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-3">
                  <Phone className="w-3 h-3 text-slate-400" />
                  <span>{staff.phone}</span>
                </div>
              )}

              {/* 3 Metrics Row */}
              <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100 my-3 text-center">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Assigned</span>
                  <span className="text-sm font-extrabold text-slate-800">{staff.assignedCount}</span>
                </div>
                <div>
                  <span className="text-[10px] text-emerald-600 uppercase font-bold block">Shifted</span>
                  <span className="text-sm font-extrabold text-emerald-700">{staff.completedCount}</span>
                </div>
                <div>
                  <span className="text-[10px] text-amber-600 uppercase font-bold block">Pending</span>
                  <span className="text-sm font-extrabold text-amber-700">{staff.pendingCount}</span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-semibold">
                  <span className="text-slate-500">Progress</span>
                  <span className="text-emerald-700">{staff.percentage}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${staff.percentage}%` }}
                  />
                </div>
              </div>

            </div>

            {/* Quick Action: View Assigned Consumers */}
            <div className="pt-3 mt-3 border-t border-slate-100">
              <button
                onClick={() => onFilterByStaff(staff.name)}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-slate-100 hover:bg-[#0d3b66] hover:text-white text-slate-700 font-bold text-xs rounded-lg transition cursor-pointer"
              >
                <span>View {staff.assignedCount} Assigned Consumers</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>
        ))}
      </div>

      {/* Add / Edit Staff Modal */}
      {isAdding && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            
            <div className="bg-[#0d3b66] text-white p-4 flex items-center justify-between">
              <h3 className="font-bold text-base">
                {editingStaff ? 'Edit Staff Member' : 'Add New Lineman / Squad'}
              </h3>
              <button
                onClick={() => setIsAdding(false)}
                className="text-blue-200 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-3.5 text-xs sm:text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Staff / Lineman Name(s) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Subrat & Rajesh or Birendra Lineman"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:bg-white focus:ring-2 focus:ring-[#0d3b66] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Designation / Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:bg-white"
                >
                  <option value="Lineman">Lineman</option>
                  <option value="MRT Squad">MRT Squad</option>
                  <option value="Contractor Squad">Contractor Squad</option>
                  <option value="Supervisor">Supervisor</option>
                  <option value="Technician">Technician</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Team / Squad Identifier
                </label>
                <input
                  type="text"
                  placeholder="e.g. Team A, Team B, MRT Squad 1, Contractor Squad 1"
                  value={team}
                  onChange={(e) => setTeam(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Phone Number (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 9437XXXXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:bg-white"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0d3b66] hover:bg-blue-900 text-white font-bold text-xs rounded-xl shadow-xs"
                >
                  {editingStaff ? 'Save Changes' : 'Add Staff'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
