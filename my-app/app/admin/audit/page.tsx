"use client";

import { useEffect, useState, useCallback } from "react";
import { useTheme } from '@/components/ThemeContext';
import { Activity, Search, AlertCircle, Loader } from "lucide-react";
import { getAdminAuditLogs, type AdminAuditLog } from "@/lib/authClient";

export default function AuditLogsPage() {
  const { dark: d } = useTheme();
  const [logs, setLogs] = useState<AdminAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedLog, setSelectedLog] = useState<AdminAuditLog | null>(null);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await getAdminAuditLogs({ search: search.trim() || undefined });
    if (res.error) {
      setError(res.error.message);
    } else if (res.data) {
      setLogs(res.data.logs);
    }
    setLoading(false);
  }, [search]);

  useEffect(() => {
    void loadLogs();
  }, [loadLogs]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className={`flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between`}>
        <div>
          <h1 className={`text-3xl font-bold flex items-center gap-3 ${d ? 'text-white' : 'text-gray-900'}`}>
            <Activity className="h-8 w-8 text-blue-500" /> Audit Logs
          </h1>
          <p className={`mt-2 text-sm ${d ? 'text-gray-400' : 'text-gray-600'}`}>
            Track administrative actions, entity mutations, and permission changes across the platform.
          </p>
        </div>
      </div>

      <div className={`rounded-xl border p-4 ${d ? 'bg-[#1C1F2E] border-white/5' : 'bg-white border-gray-200'}`}>
        <div className="relative">
          <Search className={`absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${d ? 'text-gray-500' : 'text-gray-400'}`} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search logs by admin email, entity type, or action..."
            className={`w-full rounded-lg border px-10 py-3 text-sm outline-none transition focus:border-blue-500/50 ${d ? 'bg-[#111318] border-white/10 text-white placeholder:text-gray-700' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400'}`}
          />
        </div>
      </div>

      {error && (
        <div className={`flex items-start gap-3 rounded-xl border p-4 text-sm ${d ? 'border-red-500/30 bg-red-500/10 text-red-200' : 'border-red-200 bg-red-50 text-red-600'}`}>
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className={`flex min-h-[400px] items-center justify-center rounded-xl border ${d ? 'bg-[#1C1F2E] border-white/5' : 'bg-white border-gray-200'}`}>
          <Loader className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      ) : logs.length === 0 ? (
        <div className={`rounded-xl border p-12 text-center text-sm ${d ? 'bg-[#1C1F2E] border-white/5 text-gray-500' : 'bg-white border-gray-200 text-gray-600'}`}>
          No audit logs found matching your criteria.
        </div>
      ) : (
        <div className={`rounded-xl border overflow-hidden ${d ? 'bg-[#1C1F2E] border-white/5' : 'bg-white border-gray-200'}`}>
          <div className="overflow-x-auto">
            <table className={`w-full text-left text-sm ${d ? 'text-gray-400' : 'text-gray-600'}`}>
              <thead className={`border-b text-xs uppercase tracking-wider ${d ? 'border-white/5 bg-white/[0.02] text-gray-500' : 'border-gray-200 bg-gray-50 text-gray-600'}`}>
                <tr>
                  <th className="px-6 py-4 font-semibold">Timestamp</th>
                  <th className="px-6 py-4 font-semibold">Admin</th>
                  <th className="px-6 py-4 font-semibold">Action</th>
                  <th className="px-6 py-4 font-semibold">Entity</th>
                  <th className="px-6 py-4 font-semibold">Field Changes</th>
                  <th className="px-6 py-4 font-semibold">IP Address</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${d ? 'divide-white/5' : 'divide-gray-200'}`}>
                {logs.map((log) => (
                  <tr 
                    key={log.id} 
                    className={`transition-colors cursor-pointer ${d ? 'hover:bg-white/[0.05]' : 'hover:bg-gray-50'}`}
                    onClick={() => setSelectedLog(log)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={d ? 'text-white' : 'text-gray-900'}>
                        {new Date(log.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </div>
                      <div className={`text-xs mt-1 ${d ? 'text-gray-500' : 'text-gray-500'}`}>
                        {new Date(log.createdAt).toLocaleTimeString("en-US", {
                          hour12: false,
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`font-medium ${d ? 'text-white' : 'text-gray-900'}`}>
                        {log.admin?.firstName} {log.admin?.lastName}
                      </div>
                      <div className={`text-xs mt-1 ${d ? 'text-gray-500' : 'text-gray-500'}`}>{log.admin?.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="rounded-md bg-blue-500/10 px-2.5 py-1 text-[10px] font-bold text-blue-400 uppercase tracking-wider">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={d ? 'text-white' : 'text-gray-900'}>{log.entityType}</div>
                      {log.entityId && (
                        <div className={`text-xs mt-1 font-mono ${d ? 'text-gray-500' : 'text-gray-500'}`}>
                          {log.entityId.slice(0, 8)}...
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs">
                        <span className={`font-semibold ${d ? 'text-gray-300' : 'text-gray-700'}`}>Field:</span> {log.field}
                      </div>
                      {(log.oldValue || log.newValue) && (
                        <div className="mt-2 space-y-1 text-xs">
                          {log.oldValue && (
                            <div className={`line-clamp-1 ${d ? 'text-red-400' : 'text-red-600'}`}>
                              - {log.oldValue}
                            </div>
                          )}
                          {log.newValue && (
                            <div className={`line-clamp-1 ${d ? 'text-emerald-400' : 'text-emerald-600'}`}>
                              + {log.newValue}
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs font-mono">
                      {log.ipAddress || "N/A"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal for detailed view */}
      {selectedLog && (
        <div className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 ${d ? 'bg-black/70' : 'bg-black/40'}`} onClick={() => setSelectedLog(null)}>
          <div className={`relative w-full max-w-2xl rounded-2xl p-6 shadow-2xl border ${d ? 'bg-[#161925] border-white/10' : 'bg-white border-gray-200'}`} onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setSelectedLog(null)}
              className={`absolute right-4 top-4 ${d ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}
            >
              ✕
            </button>
            <h2 className={`text-xl font-bold mb-4 ${d ? 'text-white' : 'text-gray-900'}`}>Audit Log Details</h2>
            
            <div className={`space-y-4 text-sm ${d ? 'text-gray-300' : 'text-gray-700'}`}>
              <div className={`grid grid-cols-2 gap-4 border-b pb-4 ${d ? 'border-white/5' : 'border-gray-200'}`}>
                <div>
                  <div className={`text-xs ${d ? 'text-gray-500' : 'text-gray-600'}`}>Timestamp</div>
                  <div className={`mt-1 ${d ? 'text-white' : 'text-gray-900'}`}>
                    {new Date(selectedLog.createdAt).toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className={`text-xs ${d ? 'text-gray-500' : 'text-gray-600'}`}>IP Address</div>
                  <div className={`mt-1 font-mono ${d ? 'text-white' : 'text-gray-900'}`}>{selectedLog.ipAddress || 'N/A'}</div>
                </div>
              </div>

              <div className={`grid grid-cols-2 gap-4 border-b pb-4 ${d ? 'border-white/5' : 'border-gray-200'}`}>
                <div>
                  <div className={`text-xs ${d ? 'text-gray-500' : 'text-gray-600'}`}>Admin Name</div>
                  <div className={`mt-1 ${d ? 'text-white' : 'text-gray-900'}`}>{selectedLog.admin?.firstName} {selectedLog.admin?.lastName}</div>
                </div>
                <div>
                  <div className={`text-xs ${d ? 'text-gray-500' : 'text-gray-600'}`}>Admin Email</div>
                  <div className={`mt-1 ${d ? 'text-white' : 'text-gray-900'}`}>{selectedLog.admin?.email}</div>
                </div>
              </div>

              <div className={`grid grid-cols-2 gap-4 border-b pb-4 ${d ? 'border-white/5' : 'border-gray-200'}`}>
                <div>
                  <div className={`text-xs ${d ? 'text-gray-500' : 'text-gray-600'}`}>Action</div>
                  <div className="mt-1">
                    <span className="rounded-md bg-blue-500/10 px-2.5 py-1 text-[10px] font-bold text-blue-400 uppercase tracking-wider">
                      {selectedLog.action}
                    </span>
                  </div>
                </div>
                <div>
                  <div className={`text-xs ${d ? 'text-gray-500' : 'text-gray-600'}`}>Entity Type & ID</div>
                  <div className={`mt-1 ${d ? 'text-white' : 'text-gray-900'}`}>
                    {selectedLog.entityType} <br/>
                    <span className={`font-mono text-xs ${d ? 'text-gray-500' : 'text-gray-500'}`}>{selectedLog.entityId || 'N/A'}</span>
                  </div>
                </div>
              </div>

              <div>
                <div className={`text-xs mb-2 ${d ? 'text-gray-500' : 'text-gray-600'}`}>Field Changes (Field: {selectedLog.field || 'N/A'})</div>
                <div className={`p-4 rounded-lg font-mono text-xs overflow-x-auto ${d ? 'bg-[#111318]' : 'bg-gray-50'}`}>
                  <div className={`mb-2 whitespace-pre-wrap break-all ${d ? 'text-red-400' : 'text-red-600'}`}>
                    <span className="select-none font-bold mr-2">-</span>
                    {selectedLog.oldValue || 'None'}
                  </div>
                  <div className={`whitespace-pre-wrap break-all ${d ? 'text-emerald-400' : 'text-emerald-600'}`}>
                    <span className="select-none font-bold mr-2">+</span>
                    {selectedLog.newValue || 'None'}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${d ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-200 text-gray-900 hover:bg-gray-300'}`}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
