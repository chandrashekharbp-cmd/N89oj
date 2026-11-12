/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Wrench, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Copy, 
  Check, 
  Calendar,
  Cable,
  Lock
} from 'lucide-react';
import { Consumer } from '../types';
import { getStatusConfig } from '../utils/status';

interface ConsumerTableViewProps {
  consumers: Consumer[];
  onUpdateClick: (consumer: Consumer) => void;
}

export const ConsumerTableView: React.FC<ConsumerTableViewProps> = ({
  consumers,
  onUpdateClick
}) => {
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  const handleCopy = (consNo: string) => {
    navigator.clipboard.writeText(consNo);
    setCopiedId(consNo);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return consumers.length === 0 ? (
    <div className="bg-white rounded-xl p-12 text-center border border-slate-200 text-slate-500">
      No consumer records match the current criteria.
    </div>
  ) : (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-[#0d3b66] text-white font-bold border-b border-blue-900">
              <th className="py-3 px-3 w-12 text-center">Sl</th>
              <th className="py-3 px-3 w-36">Consumer No.</th>
              <th className="py-3 px-3">Consumer Name</th>
              <th className="py-3 px-3">Address & Section</th>
              <th className="py-3 px-3">Types of Irregularities</th>
              <th className="py-3 px-3">Assigned Squad</th>
              <th className="py-3 px-3 w-32 text-center">Status</th>
              <th className="py-3 px-3 w-28 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {consumers.map((c, index) => {
              const statusConfig = getStatusConfig(c.status);
              return (
                <tr 
                  key={c.id} 
                  className={`hover:bg-blue-50/40 transition ${
                    c.isDuplicate ? 'bg-amber-50/50' : (index % 2 === 0 ? 'bg-white' : 'bg-slate-50/60')
                  }`}
                >
                  {/* Sl No */}
                  <td className="py-3 px-3 text-center text-slate-400 font-mono text-[11px]">
                    {index + 1}
                  </td>

                  {/* Consumer Number */}
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {c.consumerNumber}
                      </span>
                      <button
                        onClick={() => handleCopy(c.consumerNumber)}
                        className="text-slate-400 hover:text-slate-700 p-0.5 cursor-pointer"
                        title="Copy Consumer No"
                      >
                        {copiedId === c.consumerNumber ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>

                    {c.isDuplicate && (
                      <span className="inline-flex items-center gap-0.5 text-[9px] bg-amber-500 text-slate-950 font-black px-1.5 py-0.2 rounded-full mt-1">
                        <AlertTriangle className="w-2.5 h-2.5" /> DUP
                      </span>
                    )}
                  </td>

                  {/* Consumer Name */}
                  <td className="py-3 px-3">
                    <div className="font-bold text-slate-900">{c.consumerName}</div>
                    {c.status === 'SHIFTED' && c.newMeterNumber && (
                      <div className="text-[10px] text-emerald-700 font-mono mt-0.5 font-bold">
                        New Meter: {c.newMeterNumber}
                      </div>
                    )}
                    {c.remarks && (
                      <div className="text-[10px] text-slate-500 truncate max-w-xs mt-0.5 italic">
                        "{c.remarks}"
                      </div>
                    )}
                  </td>

                  {/* Address & Section */}
                  <td className="py-3 px-3 max-w-[240px]">
                    <div className="text-slate-700 line-clamp-2 leading-tight">
                      {c.address}
                    </div>
                    <div className="text-[10px] text-blue-700 font-semibold mt-0.5">
                      {c.section}
                    </div>
                  </td>

                  {/* Types of Irregularities */}
                  <td className="py-3 px-3 max-w-[200px]">
                    <span className="inline-block bg-slate-100 border border-slate-200 text-slate-800 px-2 py-0.5 rounded font-semibold text-[11px] leading-tight">
                      {c.irregularityType}
                    </span>
                  </td>

                  {/* Assigned Squad */}
                  <td className="py-3 px-3 text-slate-600">
                    <div className="font-medium truncate max-w-[150px]">
                      {c.assignedStaff || c.actionTeam}
                    </div>
                    {c.shiftingDate && (
                      <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Calendar className="w-2.5 h-2.5" />
                        <span>{c.shiftingDate}</span>
                      </div>
                    )}
                  </td>

                  {/* Status Badge */}
                  <td className="py-3 px-3 text-center">
                    <span className={`inline-flex items-center justify-center gap-1 text-[10px] px-2.5 py-0.5 rounded-full ${statusConfig.badgeClass}`}>
                      {c.status === 'SHIFTED' && <CheckCircle2 className="w-3 h-3" />}
                      {c.status === 'CABLE SHORTAGE' && <Cable className="w-3 h-3" />}
                      {c.status === 'DOOR LOCK' && <Lock className="w-3 h-3" />}
                      {c.status === 'NOT UPDATED' && <Clock className="w-3 h-3" />}
                      <span>{c.status}</span>
                    </span>
                  </td>

                  {/* Update Button */}
                  <td className="py-3 px-3 text-center">
                    <button
                      onClick={() => onUpdateClick(c)}
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-xs active:scale-95 cursor-pointer bg-[#0d3b66] hover:bg-blue-900 text-white"
                    >
                      <Wrench className="w-3 h-3 text-amber-400" />
                      <span>Update</span>
                    </button>
                  </td>

                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
