"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Search,
  ChevronRight,
  AlertTriangle,
  BarChart2,
  CreditCard,
  Shuffle,
  Wrench,
  Shield,
  RefreshCw,
  TrendingUp,
  Users,
  Settings2,
  Megaphone,
  Scale,
  Cpu,
  Rocket,
  CheckCircle2,
  Info,
  Trash2,
  Loader,
  X,
  Lock,
  ArrowUpRight,
} from "lucide-react";
import {
  getAllUsers,
  listAdminRoles,
  createAdminRole,
  updateAdminRole,
  deleteAdminRole,
  assignAdminRole,
  getScoringSettings,
  updateScoringSettings,
  getAdminPillarsDetailed,
  type AdminUserRow,
  type AdminRoleRow,
  type AdminPillarDetailed,
  type ScoringSettings,
} from "@/lib/authClient";

// ─── Shared Toggle Component ──────────────────────────────────────
function Toggle({ checked, onChange, disabled = false }: { checked: boolean; onChange: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onChange}
      disabled={disabled}
      className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
        checked ? "bg-blue-500" : "bg-white/15"
      } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      <span
        className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-5" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

// ─── Taxonomy of Granular Permissions ──────────────────────────────
const PERMISSIONS_LIST = [
  { key: 'users:read', label: 'View Administrators & Users', description: 'Access user details and admin lists.', icon: Users },
  { key: 'users:write', label: 'Modify Administrators & Users', description: 'Create, update status, and assign roles.', icon: Users },
  { key: 'questions:read', label: 'View Question Bank', description: 'Read question templates and pillars.', icon: Cpu },
  { key: 'questions:write', label: 'Modify Question Bank', description: 'Create, edit, or delete questions and options.', icon: Cpu },
  { key: 'scoring:read', label: 'View Scoring Logic', description: 'Read scoring weights and thresholds.', icon: Shuffle },
  { key: 'scoring:write', label: 'Modify Scoring Logic', description: 'Edit scoring weights and thresholds.', icon: Shuffle },
  { key: 'coupons:read', label: 'View Coupons', description: 'List discounts and active coupons.', icon: Megaphone },
  { key: 'coupons:write', label: 'Modify Coupons', description: 'Create, update, or delete coupons.', icon: Megaphone },
  { key: 'analytics:read', label: 'View Analytics & Reports', description: 'Access KPI metrics, funnel charts, and breakdowns.', icon: BarChart2 },
  { key: 'ledger:read', label: 'View Payments & Pricing', description: 'List transactional ledger records.', icon: CreditCard },
  { key: 'ledger:write', label: 'Modify Payments & Pricing', description: 'Override payment status and change prices.', icon: CreditCard },
  { key: 'settings:read', label: 'View Platform Settings', description: 'View system flags and configuration values.', icon: Settings2 },
  { key: 'settings:write', label: 'Modify Platform Settings', description: 'Save platform configuration toggles and manage roles.', icon: Settings2 }
];

// Helper to get initials
const getInitials = (firstName: string | null, lastName: string | null, email: string) => {
  if (firstName || lastName) {
    return `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase();
  }
  return email.substring(0, 2).toUpperCase();
};

// ─── TAB 2: Pillar Management ─────────────────────────────────────
function PillarTab() {
  const [pillars, setPillars] = useState<AdminPillarDetailed[]>([]);
  const [settings, setSettings] = useState<ScoringSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form states for Limits
  const [p2aLimit, setP2aLimit] = useState(40);
  const [p2bLimit, setP2bLimit] = useState(30);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [pillarsRes, settingsRes] = await Promise.all([
        getAdminPillarsDetailed(),
        getScoringSettings(),
      ]);

      setPillars(pillarsRes.pillars || []);
      setSettings(settingsRes.settings || null);

      if (settingsRes.settings) {
        setP2aLimit(settingsRes.settings.phase2aQuestionLimit ?? 40);
        setP2bLimit(settingsRes.settings.phase2bQuestionLimit ?? 30);
      }
    } catch (err: any) {
      console.error(err);
      setError("Failed to load settings configuration from backend. Ensure migrations are applied.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSaveConfig = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(false);

      const res = await updateScoringSettings({
        phase2aQuestionLimit: p2aLimit,
        phase2bQuestionLimit: p2bLimit,
      });

      setSettings(res.settings);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to save question limit configurations.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-3">
        <Loader className="w-8 h-8 animate-spin text-blue-500" />
        <span>Loading pillar configuration...</span>
      </div>
    );
  }

  // Calculator
  const activePillarsCount = pillars.filter((p) => p.isActive).length || 7;
  const p2aPerPillarTarget = Math.floor(p2aLimit / activePillarsCount);

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 rounded-2xl p-4 text-sm text-red-400">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">Error:</span> {error}
          </div>
        </div>
      )}

      {success && (
        <div className="flex items-start gap-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 text-sm text-emerald-400">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>Question limits configuration saved successfully.</div>
        </div>
      )}

      {/* Row: Limit Configurations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Phase 2A Config */}
        <div className="bg-[#1C1F2E] rounded-2xl border border-white/5 p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-lg">Phase 2A Question Limits</h3>
              <p className="text-xs text-gray-500">Structured diagnosis assessment</p>
            </div>
          </div>
          <p className="text-xs text-gray-400 leading-relaxed">
            Configure the total number of questions a user gets to answer. Questions will be divided equally among all active pillars.
          </p>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">
              Total Target Questions Count
            </label>
            <div className="flex items-center gap-4">
              <input
                type="number"
                min={7}
                max={150}
                value={p2aLimit}
                onChange={(e) => setP2aLimit(Math.max(1, Number(e.target.value)))}
                className="bg-[#111318] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50 w-32"
              />
              <div className="text-xs text-gray-400">
                &asymp; <span className="font-bold text-white">{p2aPerPillarTarget}</span> questions per pillar (across {activePillarsCount} active pillars)
              </div>
            </div>
          </div>
        </div>

        {/* Phase 2B Config */}
        <div className="bg-[#1C1F2E] rounded-2xl border border-white/5 p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <Shuffle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-lg">Phase 2B Question Limits</h3>
              <p className="text-xs text-gray-500">Pillar deep-dive assessment</p>
            </div>
          </div>
          <p className="text-xs text-gray-400 leading-relaxed">
            Configure the limit of questions delivered to users for each specific pillar during a single deep-dive session.
          </p>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">
              Max Questions Per Pillar Session
            </label>
            <div className="flex items-center gap-4">
              <input
                type="number"
                min={1}
                max={100}
                value={p2bLimit}
                onChange={(e) => setP2bLimit(Math.max(1, Number(e.target.value)))}
                className="bg-[#111318] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50 w-32"
              />
              <div className="text-xs text-gray-400">
                Users will answer at most <span className="font-bold text-white">{p2bLimit}</span> questions per pillar.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center justify-between bg-[#1C1F2E] rounded-2xl border border-white/5 px-6 py-4">
        <span className="text-xs text-gray-500 flex items-center gap-1.5">
          <Info className="w-4 h-4 text-blue-400" /> Limits apply to newly initialized sessions only.
        </span>
        <button
          onClick={handleSaveConfig}
          disabled={saving}
          className="px-5 py-2.5 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 text-white text-sm font-semibold rounded-xl transition-colors flex items-center gap-2"
        >
          {saving && <Loader className="w-4 h-4 animate-spin" />}
          Save Question Limits
        </button>
      </div>

      {/* Pillars Audit Table */}
      <div className="bg-[#1C1F2E] rounded-2xl border border-white/5 overflow-hidden">
        <div className="px-6 py-5 border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/[0.01]">
          <div>
            <h2 className="text-base font-semibold text-white">Pillar Configuration Audit</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Live checks comparing configured target limits against actual questions available in database.
            </p>
          </div>
          <a
            href="/admin/scoring"
            className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-semibold transition-colors"
          >
            Manage Scoring Weights <ArrowUpRight className="w-4 h-4" />
          </a>
        </div>

        {/* Table Headers */}
        <div className="grid grid-cols-4 px-6 py-3 border-b border-white/5 bg-white/[0.005] text-[10px] font-bold text-gray-500 uppercase tracking-widest">
          <span>PILLAR & WEIGHT</span>
          <span className="text-center">ACTIVE IN DB</span>
          <span className="text-center">PHASE 2A ACTUALS</span>
          <span className="text-center">PHASE 2B ACTUALS</span>
        </div>

        {/* Rows */}
        <div className="divide-y divide-white/5">
          {pillars.map((pillar) => {
            const hasP2aWarning = p2aPerPillarTarget > pillar.activeQuestionCount;
            const p2aDelivered = Math.min(p2aPerPillarTarget, pillar.activeQuestionCount);
            
            const hasP2bWarning = p2bLimit > pillar.activeQuestionCount;
            const p2bDelivered = Math.min(p2bLimit, pillar.activeQuestionCount);

            return (
              <div key={pillar.id} className="grid grid-cols-4 items-center px-6 py-4 hover:bg-white/[0.01] transition-colors">
                {/* Pillar info */}
                <div>
                  <div className="text-sm font-semibold text-white flex items-center gap-2">
                    {pillar.name}
                    <span className="text-[9px] bg-white/5 text-gray-400 border border-white/10 px-1.5 py-0.5 rounded font-bold">
                      {pillar.code}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">Assigned Share: {pillar.weight}%</div>
                </div>

                {/* Database count */}
                <div className="text-center">
                  <span className="inline-block px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-sm font-semibold text-gray-300">
                    {pillar.activeQuestionCount} questions
                  </span>
                </div>

                {/* Phase 2A Delivery Check */}
                <div className="flex flex-col items-center">
                  {hasP2aWarning ? (
                    <div className="flex flex-col items-center gap-1">
                      <span className="px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs font-bold text-amber-400 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" /> {p2aDelivered} / {p2aPerPillarTarget}
                      </span>
                      <span className="text-[9px] text-amber-500/80 font-medium">Under-populated DB</span>
                    </div>
                  ) : (
                    <span className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-xs font-bold text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> {p2aDelivered} questions
                    </span>
                  )}
                </div>

                {/* Phase 2B Delivery Check */}
                <div className="flex flex-col items-center">
                  {hasP2bWarning ? (
                    <div className="flex flex-col items-center gap-1">
                      <span className="px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs font-bold text-amber-400 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" /> {p2bDelivered} / {p2bLimit}
                      </span>
                      <span className="text-[9px] text-amber-500/80 font-medium">Under-populated DB</span>
                    </div>
                  ) : (
                    <span className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-xs font-bold text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> {p2bDelivered} questions
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Wrapper to expose the modal click to the parent SettingsPage
function RolesTabWrapper() {
  const [showModal, setShowModal] = useState(false);
  
  return (
    <>
      <button
        id="roles-tab-modal-opener"
        onClick={() => {
          const modalBtn = document.getElementById("roles-tab-modal-actual-btn");
          if (modalBtn) modalBtn.click();
        }}
        className="hidden"
      />
      <div className="relative">
        <button
          id="roles-tab-modal-actual-btn"
          onClick={() => {}}
          className="hidden"
        />
        <RolesTabLocalHelper />
      </div>
    </>
  );
}

// Subcomponent which holds local modal opener trigger
function RolesTabLocalHelper() {
  const [openModalDirectly, setOpenModalDirectly] = useState(false);
  
  useEffect(() => {
    const triggerBtn = document.getElementById("roles-tab-modal-actual-btn");
    if (triggerBtn) {
      const handler = () => setOpenModalDirectly(true);
      triggerBtn.addEventListener("click", handler);
      return () => triggerBtn.removeEventListener("click", handler);
    }
  }, []);

  return (
    <RolesTabWithExternalTrigger
      externalModalOpen={openModalDirectly}
      onModalClose={() => setOpenModalDirectly(false)}
    />
  );
}

// Inner RolesTab which receives externalModalOpen trigger
function RolesTabWithExternalTrigger({
  externalModalOpen,
  onModalClose,
}: {
  externalModalOpen: boolean;
  onModalClose: () => void;
}) {
  const [admins, setAdmins] = useState<AdminUserRow[]>([]);
  const [roles, setRoles] = useState<AdminRoleRow[]>([]);
  const [loadingAdmins, setLoadingAdmins] = useState(true);
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Selected Role for Permission Editing Grid
  const [selectedRole, setSelectedRole] = useState<AdminRoleRow | null>(null);
  const [rolePermissions, setRolePermissions] = useState<string[]>([]);
  const [savingPermissions, setSavingPermissions] = useState(false);

  // Search filter
  const [adminSearch, setAdminSearch] = useState("");

  // Role Assignment
  const [assigningUserId, setAssigningUserId] = useState<string | null>(null);

  // Modal to Create Role
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDesc, setNewRoleDesc] = useState("");
  const [newRolePerms, setNewRolePerms] = useState<string[]>([]);
  const [creatingRole, setCreatingRole] = useState(false);

  useEffect(() => {
    if (externalModalOpen) {
      setShowCreateModal(true);
    }
  }, [externalModalOpen]);

  useEffect(() => {
    if (!showCreateModal) {
      onModalClose();
    }
  }, [showCreateModal, onModalClose]);

  const loadData = useCallback(async () => {
    try {
      setError(null);
      setLoadingAdmins(true);
      setLoadingRoles(true);

      const [adminsRes, rolesRes] = await Promise.all([
        getAllUsers({ role: "ADMIN", pageSize: 100 }),
        listAdminRoles(),
      ]);

      setAdmins(adminsRes.users || []);
      setRoles(rolesRes.roles || []);

      if (rolesRes.roles && rolesRes.roles.length > 0) {
        const superAdmin = rolesRes.roles.find((r: any) => r.name === "SUPER ADMIN");
        const defaultRole = superAdmin || rolesRes.roles[0];
        setSelectedRole(defaultRole);
        setRolePermissions(defaultRole.permissions || []);
      }
    } catch (err: any) {
      console.error(err);
      setError("Failed to load settings data. Please ensure database migrations have been run.");
    } finally {
      setLoadingAdmins(false);
      setLoadingRoles(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSelectRole = (role: AdminRoleRow) => {
    setSelectedRole(role);
    setRolePermissions(role.permissions || []);
    setError(null);
    setSuccessMessage(null);
  };

  const handleTogglePermission = (permissionKey: string) => {
    if (!selectedRole || selectedRole.name === "SUPER ADMIN") return;

    setRolePermissions((prev) =>
      prev.includes(permissionKey)
        ? prev.filter((k) => k !== permissionKey)
        : [...prev, permissionKey]
    );
  };

  const handleSavePermissions = async () => {
    if (!selectedRole) return;
    if (selectedRole.name === "SUPER ADMIN") {
      setError("The Super Admin role has immutable permissions.");
      return;
    }

    try {
      setSavingPermissions(true);
      setError(null);
      setSuccessMessage(null);

      const res = await updateAdminRole(selectedRole.id, {
        permissions: rolePermissions,
      });

      setRoles((prev) => prev.map((r) => (r.id === res.role.id ? res.role : r)));
      setSelectedRole(res.role);
      setSuccessMessage(`Authority mapping for "${res.role.name}" updated successfully.`);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to update role permissions.");
    } finally {
      setSavingPermissions(false);
    }
  };

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName.trim()) return;

    try {
      setCreatingRole(true);
      setError(null);

      const res = await createAdminRole({
        name: newRoleName.trim(),
        description: newRoleDesc.trim() || undefined,
        permissions: newRolePerms,
      });

      setRoles((prev) => [...prev, res.role]);
      setShowCreateModal(false);
      setNewRoleName("");
      setNewRoleDesc("");
      setNewRolePerms([]);
      setSuccessMessage(`Role "${res.role.name}" created successfully.`);
      setSelectedRole(res.role);
      setRolePermissions(res.role.permissions);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to create new role.");
    } finally {
      setCreatingRole(false);
    }
  };

  const handleDeleteRole = async (role: AdminRoleRow) => {
    if (role.name === "SUPER ADMIN") return;
    if (!confirm(`Are you sure you want to delete the "${role.name}" role?`)) return;

    try {
      setError(null);
      setSuccessMessage(null);
      await deleteAdminRole(role.id);
      
      setRoles((prev) => prev.filter((r) => r.id !== role.id));
      setSuccessMessage(`Role "${role.name}" deleted successfully.`);
      
      if (selectedRole?.id === role.id && roles.length > 1) {
        const remaining = roles.filter((r) => r.id !== role.id);
        setSelectedRole(remaining[0]);
        setRolePermissions(remaining[0].permissions);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to delete role. Ensure no users are assigned to this role.");
    }
  };

  const handleAssignRole = async (userId: string, roleId: string | null) => {
    try {
      setAssigningUserId(userId);
      setError(null);
      setSuccessMessage(null);

      await assignAdminRole(userId, roleId);
      
      setAdmins((prev) =>
        prev.map((adm) => {
          if (adm.id === userId) {
            const roleObj = roles.find((r) => r.id === roleId);
            return {
              ...adm,
              adminRoleId: roleId,
              adminRole: roleObj ? { id: roleObj.id, name: roleObj.name, permissions: roleObj.permissions } : null,
            };
          }
          return adm;
        })
      );

      setSuccessMessage("Administrator role updated successfully.");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to update administrator role.");
    } finally {
      setAssigningUserId(null);
    }
  };

  const filteredAdmins = admins.filter((a) => {
    const q = adminSearch.toLowerCase();
    const name = `${a.firstName ?? ""} ${a.lastName ?? ""}`.toLowerCase();
    return (
      name.includes(q) ||
      a.email.toLowerCase().includes(q) ||
      (a.adminRole?.name || "Viewer").toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Alert Banners */}
      {error && (
        <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 rounded-2xl p-4 text-sm text-red-400">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">Error:</span> {error}
          </div>
        </div>
      )}
      {successMessage && (
        <div className="flex items-start gap-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 text-sm text-emerald-400">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>{successMessage}</div>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col */}
        <div className="lg:col-span-2 space-y-6">
          <div className="relative bg-[#1C1F2E] rounded-2xl border border-white/5 overflow-hidden">
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-white/5">
              <h2 className="text-base font-semibold text-white">System Administrators</h2>
              <div className="relative">
                <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter admins..."
                  value={adminSearch}
                  onChange={(e) => setAdminSearch(e.target.value)}
                  className="bg-[#111318] border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50 w-52"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 px-6 py-3 border-b border-white/5 bg-white/[0.01]">
              {["ADMINISTRATOR", "ASSIGNED ROLE", "STATUS"].map((h) => (
                <span key={h} className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{h}</span>
              ))}
            </div>

            {loadingAdmins ? (
              <div className="flex items-center justify-center py-12 text-sm text-gray-400 gap-2">
                <Loader className="w-4 h-4 animate-spin text-blue-500" />
                <span>Loading administrators...</span>
              </div>
            ) : filteredAdmins.length === 0 ? (
              <div className="text-center py-12 text-sm text-gray-500">
                No administrators found matching your filter.
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {filteredAdmins.map((admin) => {
                  const roleName = admin.adminRole?.name || "Viewer";
                  const initialLetters = getInitials(admin.firstName, admin.lastName, admin.email);
                  
                  return (
                    <div key={admin.id} className="grid grid-cols-3 items-center px-6 py-4 hover:bg-white/[0.01] transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-blue-600/80 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {initialLetters}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-white truncate">
                            {admin.firstName || admin.lastName ? `${admin.firstName ?? ""} ${admin.lastName ?? ""}`.trim() : "Admin Profile"}
                          </div>
                          <div className="text-xs text-gray-500 truncate">{admin.email}</div>
                        </div>
                      </div>

                      <div className="pr-4">
                        {assigningUserId === admin.id ? (
                          <div className="flex items-center gap-1.5 text-xs text-gray-400">
                            <Loader className="w-3.5 h-3.5 animate-spin text-blue-400" />
                            <span>Updating...</span>
                          </div>
                        ) : (
                          <select
                            value={admin.adminRoleId || ""}
                            onChange={(e) => handleAssignRole(admin.id, e.target.value || null)}
                            className="bg-[#111318] border border-white/10 hover:border-white/25 text-xs text-gray-300 rounded-lg px-2 py-1.5 focus:outline-none focus:border-blue-500 cursor-pointer w-full max-w-[140px]"
                          >
                            <option value="">Viewer (No Role)</option>
                            {roles.map((r) => (
                              <option key={r.id} value={r.id}>
                                {r.name}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${admin.status === "ACTIVE" ? "bg-emerald-500" : "bg-red-500"}`} />
                        <span className={`text-sm ${admin.status === "ACTIVE" ? "text-emerald-400" : "text-red-400"}`}>
                          {admin.status === "ACTIVE" ? "Active" : "Suspended"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {selectedRole && (
            <div className="bg-[#1C1F2E] rounded-2xl border border-white/5 overflow-hidden">
              <div className="flex items-center justify-between px-6 py-5 border-b border-white/5">
                <div>
                  <h2 className="text-base font-semibold text-white">Granular Module Permissions</h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Configuring permissions for: <span className="text-blue-400 font-bold">{selectedRole.name}</span>
                  </p>
                </div>
                {selectedRole.name === "SUPER ADMIN" ? (
                  <span className="flex items-center gap-1.5 text-[10px] font-bold px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-400 uppercase tracking-wider">
                    <Lock className="w-3.5 h-3.5" /> Immutable
                  </span>
                ) : (
                  <span className="text-[10px] font-bold px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-gray-300 uppercase tracking-wider">
                    Custom Role
                  </span>
                )}
              </div>

              <div className="divide-y divide-white/5 max-h-[500px] overflow-y-auto">
                {PERMISSIONS_LIST.map((perm) => {
                  const IconComponent = perm.icon;
                  const isChecked = selectedRole.name === "SUPER ADMIN" || rolePermissions.includes(perm.key);
                  const isSuperAdmin = selectedRole.name === "SUPER ADMIN";

                  return (
                    <div key={perm.key} className="flex items-center gap-4 px-6 py-4 hover:bg-white/[0.01] transition-colors">
                      <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center flex-shrink-0 text-gray-400">
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-white flex items-center gap-2">
                          {perm.label}
                          <span className="text-[9px] bg-white/5 text-gray-400 border border-white/10 px-1.5 py-0.5 rounded uppercase">
                            {perm.key.split(":")[1]}
                          </span>
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5 truncate">{perm.description}</div>
                      </div>
                      <Toggle
                        checked={isChecked}
                        disabled={isSuperAdmin}
                        onChange={() => handleTogglePermission(perm.key)}
                      />
                    </div>
                  );
                })}
              </div>

              {selectedRole.name !== "SUPER ADMIN" && (
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/5 bg-white/[0.01]">
                  <button
                    onClick={() => setRolePermissions(selectedRole.permissions || [])}
                    disabled={savingPermissions}
                    className="px-5 py-2.5 text-sm font-semibold text-gray-400 hover:text-white transition-colors disabled:opacity-50"
                  >
                    Reset Changes
                  </button>
                  <button
                    onClick={handleSavePermissions}
                    disabled={savingPermissions}
                    className="px-5 py-2.5 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 text-white text-sm font-semibold rounded-xl transition-colors flex items-center gap-2"
                  >
                    {savingPermissions && <Loader className="w-4 h-4 animate-spin" />}
                    Save Authority Mapping
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Col */}
        <div className="space-y-6">
          <div className="bg-[#1C1F2E] rounded-2xl border border-white/5 p-6">
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4">Authority Overview</div>
            <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-4">
              <span className="text-sm text-gray-300">Total Administrators</span>
              <span className="text-xl font-bold text-white">
                {loadingAdmins ? <Loader className="w-5 h-5 animate-spin inline text-blue-500" /> : admins.length}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Super Admins</div>
                <div className="text-2xl font-bold text-white">
                  {admins.filter((a) => a.adminRole?.name === "SUPER ADMIN").length}
                </div>
              </div>
              <div>
                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Custom Roles</div>
                <div className="text-2xl font-bold text-white">
                  {roles.length}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#1C1F2E] rounded-2xl border border-white/5 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Active Role Types</div>
              <Info className="w-4 h-4 text-gray-500" />
            </div>
            
            {loadingRoles ? (
              <div className="flex items-center justify-center py-6 text-sm text-gray-400 gap-2">
                <Loader className="w-4 h-4 animate-spin text-blue-500" />
                <span>Loading roles...</span>
              </div>
            ) : (
              <div className="space-y-2">
                {roles.map((role) => {
                  const isSelected = selectedRole?.id === role.id;
                  const isSuperAdmin = role.name === "SUPER ADMIN";
                  
                  return (
                    <div
                      key={role.id}
                      className={`flex items-center justify-between px-4 py-3 border rounded-xl transition-all ${
                        isSelected
                          ? "bg-blue-500/10 border-blue-500/30"
                          : "bg-white/[0.02] border-white/5 hover:bg-white/[0.04]"
                      }`}
                    >
                      <button
                        onClick={() => handleSelectRole(role)}
                        className="flex-1 flex items-center gap-3 text-left group min-w-0"
                      >
                        <span className={`w-2 h-2 rounded-full ${isSelected ? "bg-blue-400" : "bg-gray-500"}`} />
                        <div className="min-w-0 flex-1">
                          <span className={`text-sm font-medium transition-colors block truncate ${isSelected ? "text-white font-bold" : "text-gray-300"}`}>
                            {role.name}
                          </span>
                          {role.description && (
                            <p className="text-[10px] text-gray-500 truncate w-full">{role.description}</p>
                          )}
                        </div>
                      </button>

                      <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                        {isSuperAdmin ? (
                          <Lock className="w-3.5 h-3.5 text-gray-600" />
                        ) : (
                          <button
                            onClick={() => handleDeleteRole(role)}
                            className="text-gray-500 hover:text-red-400 transition-colors p-1"
                            title="Delete role"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <ChevronRight className={`w-4 h-4 ${isSelected ? "text-blue-400" : "text-gray-600"}`} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <span className="text-sm font-bold text-red-400">Elevated Privileges</span>
            </div>
            <p className="text-xs text-red-300/80 leading-relaxed">
              Assigning Super Admin roles grants full database modification authority. Use extreme caution when expanding this group.
            </p>
          </div>
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
          <div className="bg-[#1C1F2E] border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
              <h3 className="text-base font-semibold text-white">Create New Administrative Role</h3>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewRolePerms([]);
                }}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRole} className="p-6 space-y-4">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">
                  Role Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Editor, Lead Auditor"
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  className="w-full bg-[#111318] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">
                  Description
                </label>
                <input
                  type="text"
                  placeholder="Role description..."
                  value={newRoleDesc}
                  onChange={(e) => setNewRoleDesc(e.target.value)}
                  className="w-full bg-[#111318] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">
                  Select Initial Permissions ({newRolePerms.length})
                </label>
                <div className="bg-[#111318] border border-white/10 rounded-xl max-h-48 overflow-y-auto divide-y divide-white/5">
                  {PERMISSIONS_LIST.map((p) => {
                    const isSelected = newRolePerms.includes(p.key);
                    return (
                      <button
                        type="button"
                        key={p.key}
                        onClick={() =>
                          setNewRolePerms((prev) =>
                            prev.includes(p.key)
                              ? prev.filter((k) => k !== p.key)
                              : [...prev, p.key]
                          )
                        }
                        className="w-full flex items-center justify-between px-4 py-2.5 text-left text-xs hover:bg-white/[0.02] transition-colors"
                      >
                        <div>
                          <div className="font-semibold text-white">{p.label}</div>
                          <div className="text-[10px] text-gray-500 mt-0.5">{p.description}</div>
                        </div>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          readOnly
                          className="w-4 h-4 accent-blue-500 rounded border-white/10 cursor-pointer pointer-events-none"
                        />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewRolePerms([]);
                  }}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-gray-400 hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingRole || !newRoleName.trim()}
                  className="px-5 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 text-white text-sm font-semibold rounded-xl transition-colors flex items-center gap-2"
                >
                  {creatingRole && <Loader className="w-4 h-4 animate-spin" />}
                  Create Role
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Settings Page ───────────────────────────────────────────
const TABS = [
  { key: "roles", label: "Roles & Permissions" },
  { key: "pillars", label: "Pillar Management" },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("roles");

  return (
    <div className="max-w-[1400px] mx-auto">
      {/* Tab strip */}
      <div className="flex gap-6 border-b border-white/5 mb-8 -mt-2">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`pb-3 text-sm font-semibold transition-colors relative whitespace-nowrap ${
              activeTab === tab.key
                ? "text-white"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            {tab.label}
            {activeTab === tab.key && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-blue-500 rounded-t-full" />
            )}
          </button>
        ))}
      </div>

      {/* Tab headers */}
      {activeTab === "roles" && (
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Roles & Permissions</h1>
            <p className="text-gray-400 text-sm max-w-lg">
              Define structural authority. Manage dynamic roles, modular permissions, and team administrative boundaries.
            </p>
          </div>
          <div className="flex gap-3 flex-shrink-0">
            <button
              onClick={() => {
                const btn = document.getElementById("create-role-btn-trigger");
                if (btn) btn.click();
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              <Plus className="w-4 h-4" /> Create New Role
            </button>
          </div>
        </div>
      )}

      {activeTab === "pillars" && (
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">Pillar & Limits Management</h1>
          <p className="text-gray-400 text-sm">
            Set dynamic question limit scopes for Phase 2A and Phase 2B, and view live database counts.
          </p>
        </div>
      )}

      {/* Tab content */}
      {activeTab === "roles" && (
        <>
          <button
            id="create-role-btn-trigger"
            onClick={() => {
              const modalTrigger = document.getElementById("roles-tab-modal-opener");
              if (modalTrigger) modalTrigger.click();
            }}
            className="hidden"
          />
          <RolesTabWrapper />
        </>
      )}
      {activeTab === "pillars" && <PillarTab />}
    </div>
  );
}

// Wrapper to expose the modal click to the parent SettingsPage
function RolesTabWrapper() {
  return (
    <>
      <button
        id="roles-tab-modal-opener"
        onClick={() => {
          const modalBtn = document.getElementById("roles-tab-modal-actual-btn");
          if (modalBtn) modalBtn.click();
        }}
        className="hidden"
      />
      <div className="relative">
        <button
          id="roles-tab-modal-actual-btn"
          onClick={() => {}}
          className="hidden"
        />
        <RolesTabLocalHelper />
      </div>
    </>
  );
}

// Subcomponent which holds local modal opener trigger
function RolesTabLocalHelper() {
  const [openModalDirectly, setOpenModalDirectly] = useState(false);
  
  useEffect(() => {
    const triggerBtn = document.getElementById("roles-tab-modal-actual-btn");
    if (triggerBtn) {
      const handler = () => setOpenModalDirectly(true);
      triggerBtn.addEventListener("click", handler);
      return () => triggerBtn.removeEventListener("click", handler);
    }
  }, []);

  return (
    <RolesTabWithExternalTrigger
      externalModalOpen={openModalDirectly}
      onModalClose={() => setOpenModalDirectly(false)}
    />
  );
}