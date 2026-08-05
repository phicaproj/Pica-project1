"use client";

import { useEffect, useState, useCallback } from "react";
import { Activity, Search, AlertCircle, Loader } from "lucide-react";
import { getAdminAuditLogs, type AdminAuditLog } from "@/lib/authClient";

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AdminAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

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
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Activity className="h-8 w-8 text-blue-500" /> Audit Logs
          </h1>
          <p className="mt-2 text-sm text-gray-400">
            Track administrative actions, entity mutations, and permission changes across the platform.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-white/5 bg-[#1C1F2E] p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search logs by admin email, entity type, or action..."
            className="w-full rounded-lg border border-white/10 bg-[#111318] px-10 py-3 text-sm text-white outline-none transition placeholder:text-gray-700 focus:border-blue-500/50"
          />
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex min-h-[400px] items-center justify-center rounded-xl border border-white/5 bg-[#1C1F2E]">
          <Loader className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      ) : logs.length === 0 ? (
        <div className="rounded-xl border border-white/5 bg-[#1C1F2E] p-12 text-center text-sm text-gray-500">
          No audit logs found matching your criteria.
        </div>
      ) : (
        <div className="rounded-xl border border-white/5 bg-[#1C1F2E] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-400">
              <thead className="border-b border-white/5 bg-white/[0.02] text-xs uppercase tracking-wider text-gray-500">
                <tr>
                  <th className="px-6 py-4 font-semibold">Timestamp</th>
                  <th className="px-6 py-4 font-semibold">Admin</th>
                  <th className="px-6 py-4 font-semibold">Action</th>
                  <th className="px-6 py-4 font-semibold">Entity</th>
                  <th className="px-6 py-4 font-semibold">Field Changes</th>
                  <th className="px-6 py-4 font-semibold">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/[0.01] transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-white">
                        {new Date(log.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(log.createdAt).toLocaleTimeString("en-US", {
                          hour12: false,
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-white font-medium">
                        {log.admin?.firstName} {log.admin?.lastName}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">{log.admin?.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="rounded-md bg-blue-500/10 px-2.5 py-1 text-[10px] font-bold text-blue-400 uppercase tracking-wider">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-white">{log.entityType}</div>
                      {log.entityId && (
                        <div className="text-xs text-gray-500 mt-1 font-mono">
                          {log.entityId.slice(0, 8)}...
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs">
                        <span className="font-semibold text-gray-300">Field:</span> {log.field}
                      </div>
                      {(log.oldValue || log.newValue) && (
                        <div className="mt-2 space-y-1 text-xs">
                          {log.oldValue && (
                            <div className="text-red-400 line-clamp-1">
                              - {log.oldValue}
                            </div>
                          )}
                          {log.newValue && (
                            <div className="text-emerald-400 line-clamp-1">
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
    </div>
  );
}
