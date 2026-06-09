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
  Pencil,
  Mail,
  UserPlus,
} from "lucide-react";
import {
  getAllUsers,
  listAdminRoles,
  createAdminRole,
  updateAdminRole,
  deleteAdminRole,
  assignAdminRole,
  inviteAdmin,
  getMyAdminProfile,
  updateMyAdminProfile,
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

  // Read-only until Edit is clicked — guards against accidental limit changes.
  const [isEditingLimits, setIsEditingLimits] = useState(false);

  // Counts are split per business size; toggle to view the exact number a
  // SMALL- vs MEDIUM-business session would deliver.
  const [bizSize, setBizSize] = useState<"SMALL" | "MEDIUM">("SMALL");

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [pillarsRes, settingsRes] = await Promise.all([
        getAdminPillarsDetailed(),
        getScoringSettings(),
      ]);

      if (pillarsRes.error) {
        setError(pillarsRes.error.message);
        return;
      }
      if (settingsRes.error) {
        setError(settingsRes.error.message);
        return;
      }

      setPillars(pillarsRes.data?.pillars || []);
      setSettings(settingsRes.data?.settings || null);

      if (settingsRes.data?.settings) {
        setP2aLimit(settingsRes.data.settings.phase2aQuestionLimit ?? 40);
        setP2bLimit(settingsRes.data.settings.phase2bQuestionLimit ?? 30);
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

      if (res.error) {
        setError(res.error.message);
        return;
      }

      setSettings(res.data?.settings || null);
      setSuccess(true);
      setIsEditingLimits(false);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to save question limit configurations.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancelLimits = () => {
    if (settings) {
      setP2aLimit(settings.phase2aQuestionLimit ?? 40);
      setP2bLimit(settings.phase2bQuestionLimit ?? 30);
    }
    setError(null);
    setIsEditingLimits(false);
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

  // Per-pillar count of questions actually available for the selected business
  // size, split by phase. This is what a real session delivers (the legacy
  // activeQuestionCount summed across both phases AND both sizes — the source
  // of the "16 per pillar" over-count).
  const phase2aCount = (p: AdminPillarDetailed) => p.counts?.phase2a?.[bizSize] ?? 0;
  const phase2bCount = (p: AdminPillarDetailed) => p.counts?.phase2b?.[bizSize] ?? 0;

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
                disabled={!isEditingLimits}
                onChange={(e) => setP2aLimit(Math.max(1, Number(e.target.value)))}
                className="bg-[#111318] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50 w-32 disabled:opacity-50 disabled:cursor-not-allowed"
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
                disabled={!isEditingLimits}
                onChange={(e) => setP2bLimit(Math.max(1, Number(e.target.value)))}
                className="bg-[#111318] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50 w-32 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <div className="text-xs text-gray-400">
                Users will answer at most <span className="font-bold text-white">{p2bLimit}</span> questions per pillar.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit / Save Button */}
      <div className="flex items-center justify-between bg-[#1C1F2E] rounded-2xl border border-white/5 px-6 py-4">
        <span className="text-xs text-gray-500 flex items-center gap-1.5">
          <Info className="w-4 h-4 text-blue-400" /> Limits apply to newly initialized sessions only.
        </span>
        {!isEditingLimits ? (
          <button
            onClick={() => {
              setSuccess(false);
              setError(null);
              setIsEditingLimits(true);
            }}
            className="px-5 py-2.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold rounded-xl transition-colors flex items-center gap-2"
          >
            <Pencil className="w-4 h-4" /> Edit Limits
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <button
              onClick={handleCancelLimits}
              disabled={saving}
              className="px-5 py-2.5 text-sm font-semibold text-gray-400 hover:text-white transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveConfig}
              disabled={saving}
              className="px-5 py-2.5 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 text-white text-sm font-semibold rounded-xl transition-colors flex items-center gap-2"
            >
              {saving && <Loader className="w-4 h-4 animate-spin" />}
              Save Question Limits
            </button>
          </div>
        )}
      </div>

      {/* Pillars Audit Table */}
      <div className="bg-[#1C1F2E] rounded-2xl border border-white/5 overflow-hidden">
        <div className="px-6 py-5 border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/[0.01]">
          <div>
            <h2 className="text-base font-semibold text-white">Pillar Configuration Audit</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Live checks comparing configured target limits against actual questions available in database for{" "}
              <span className="text-gray-300 font-semibold">{bizSize === "SMALL" ? "Small" : "Medium"}</span> businesses.
            </p>
          </div>
          <div className="flex items-center gap-4">
            {/* Business size toggle — counts differ per size */}
            <div className="inline-flex rounded-lg border border-white/10 bg-[#111318] p-0.5">
              {(["SMALL", "MEDIUM"] as const).map((size) => (
                <button
                  key={size}
                  onClick={() => setBizSize(size)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                    bizSize === size
                      ? "bg-blue-500 text-white"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  {size === "SMALL" ? "Small" : "Medium"}
                </button>
              ))}
            </div>
            <a
              href="/admin/scoring"
              className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-semibold transition-colors"
            >
              Manage Scoring Weights <ArrowUpRight className="w-4 h-4" />
            </a>
          </div>
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
            const p2aAvailable = phase2aCount(pillar);
            const p2bAvailable = phase2bCount(pillar);

            const hasP2aWarning = p2aPerPillarTarget > p2aAvailable;
            const p2aDelivered = Math.min(p2aPerPillarTarget, p2aAvailable);

            const hasP2bWarning = p2bLimit > p2bAvailable;
            const p2bDelivered = Math.min(p2bLimit, p2bAvailable);

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

                {/* Database count for the selected business size (2A + 2B) */}
                <div className="text-center">
                  <span className="inline-block px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-sm font-semibold text-gray-300">
                    {p2aAvailable + p2bAvailable} questions
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
  // Permission grid + role-assignment dropdowns are read-only until Edit clicked.
  const [isEditingPerms, setIsEditingPerms] = useState(false);

  // Invite Admin modal
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRoleId, setInviteRoleId] = useState("");
  const [invitingAdmin, setInvitingAdmin] = useState(false);

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

      if (adminsRes.error) {
        setError(adminsRes.error.message);
        return;
      }
      if (rolesRes.error) {
        setError(rolesRes.error.message);
        return;
      }

      const adminsData = adminsRes.data?.users || [];
      const rolesData = rolesRes.data?.roles || [];

      setAdmins(adminsData);
      setRoles(rolesData);

      if (rolesData.length > 0) {
        const superAdmin = rolesData.find((r: any) => r.name === "SUPER ADMIN");
        const defaultRole = superAdmin || rolesData[0];
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
    setIsEditingPerms(false);
  };

  const handleTogglePermission = (permissionKey: string) => {
    if (!selectedRole || selectedRole.name === "SUPER ADMIN" || !isEditingPerms) return;

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

      if (res.error) {
        setError(res.error.message);
        return;
      }

      if (res.data) {
        const updatedRole = res.data.role;
        setRoles((prev) => prev.map((r) => (r.id === updatedRole.id ? updatedRole : r)));
        setSelectedRole(updatedRole);
        setIsEditingPerms(false);
        setSuccessMessage(`Authority mapping for "${updatedRole.name}" updated successfully.`);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to update role permissions.");
    } finally {
      setSavingPermissions(false);
    }
  };

  const handleInviteAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    try {
      setInvitingAdmin(true);
      setError(null);
      setSuccessMessage(null);

      const res = await inviteAdmin({
        email: inviteEmail.trim(),
        adminRoleId: inviteRoleId || undefined,
      });

      if (res.error) {
        setError(res.error.message);
        return;
      }

      setShowInviteModal(false);
      setInviteEmail("");
      setInviteRoleId("");
      setSuccessMessage(`Invitation sent to ${res.data?.admin.email}. They have 24 hours to activate their account.`);
      // Refresh the admin list so the pending invitee shows up.
      void loadData();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to send admin invitation.");
    } finally {
      setInvitingAdmin(false);
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

      if (res.error) {
        setError(res.error.message);
        return;
      }

      if (res.data) {
        const newRole = res.data.role;
        setRoles((prev) => [...prev, newRole]);
        setShowCreateModal(false);
        setNewRoleName("");
        setNewRoleDesc("");
        setNewRolePerms([]);
        setSuccessMessage(`Role "${newRole.name}" created successfully.`);
        setSelectedRole(newRole);
        setRolePermissions(newRole.permissions);
      }
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
      const res = await deleteAdminRole(role.id);
      
      if (res.error) {
        setError(res.error.message);
        return;
      }

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

      const res = await assignAdminRole(userId, roleId);
      
      if (res.error) {
        setError(res.error.message);
        return;
      }

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
              <div className="flex items-center gap-3">
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
                <button
                  onClick={() => {
                    setError(null);
                    setSuccessMessage(null);
                    setInviteEmail("");
                    setInviteRoleId("");
                    setShowInviteModal(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold rounded-lg transition-colors flex-shrink-0"
                >
                  <UserPlus className="w-4 h-4" /> Invite Admin
                </button>
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
                            disabled={!isEditingPerms}
                            onChange={(e) => handleAssignRole(admin.id, e.target.value || null)}
                            className="bg-[#111318] border border-white/10 hover:border-white/25 text-xs text-gray-300 rounded-lg px-2 py-1.5 focus:outline-none focus:border-blue-500 cursor-pointer w-full max-w-[140px] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-white/10"
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
                ) : !isEditingPerms ? (
                  <button
                    onClick={() => {
                      setError(null);
                      setSuccessMessage(null);
                      setIsEditingPerms(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold rounded-lg transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" /> Edit
                  </button>
                ) : (
                  <span className="text-[10px] font-bold px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-400 uppercase tracking-wider">
                    Editing
                  </span>
                )}
              </div>

              <div className="divide-y divide-white/5 max-h-[500px] overflow-y-auto">
                {PERMISSIONS_LIST.map((perm) => {
                  const IconComponent = perm.icon;
                  const isChecked = selectedRole.name === "SUPER ADMIN" || rolePermissions.includes(perm.key);
                  const isSuperAdmin = selectedRole.name === "SUPER ADMIN";
                  const toggleDisabled = isSuperAdmin || !isEditingPerms;

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
                        disabled={toggleDisabled}
                        onChange={() => handleTogglePermission(perm.key)}
                      />
                    </div>
                  );
                })}
              </div>

              {selectedRole.name !== "SUPER ADMIN" && isEditingPerms && (
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/5 bg-white/[0.01]">
                  <button
                    onClick={() => {
                      setRolePermissions(selectedRole.permissions || []);
                      setIsEditingPerms(false);
                    }}
                    disabled={savingPermissions}
                    className="px-5 py-2.5 text-sm font-semibold text-gray-400 hover:text-white transition-colors disabled:opacity-50"
                  >
                    Cancel
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

      {showInviteModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
          <div className="bg-[#1C1F2E] border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
              <h3 className="text-base font-semibold text-white">Invite a New Administrator</h3>
              <button
                onClick={() => setShowInviteModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleInviteAdmin} className="p-6 space-y-4">
              <p className="text-xs text-gray-400 leading-relaxed">
                We&apos;ll email this person a secure link (valid for 24 hours) to set their own
                password and activate their admin account.
              </p>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="staff@company.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full bg-[#111318] border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">
                  Assign Role
                </label>
                <select
                  value={inviteRoleId}
                  onChange={(e) => setInviteRoleId(e.target.value)}
                  className="w-full bg-[#111318] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50 cursor-pointer"
                >
                  <option value="">Viewer (No Role)</option>
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-gray-500 mt-1.5">
                  Controls which admin modules the new staff member can access. Can be changed later.
                </p>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-gray-400 hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={invitingAdmin || !inviteEmail.trim()}
                  className="px-5 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 text-white text-sm font-semibold rounded-xl transition-colors flex items-center gap-2"
                >
                  {invitingAdmin && <Loader className="w-4 h-4 animate-spin" />}
                  Send Invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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

// ─── TAB 3: Personal Information ──────────────────────────────────
function PersonalInfoTab() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [businessName, setBusinessName] = useState("");

  const hydrate = (p: {
    email: string;
    firstName: string | null;
    lastName: string | null;
    phone: string | null;
    businessName: string | null;
  }) => {
    setEmail(p.email);
    setFirstName(p.firstName ?? "");
    setLastName(p.lastName ?? "");
    setPhone(p.phone ?? "");
    setBusinessName(p.businessName ?? "");
  };

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getMyAdminProfile();
      if (res.error) {
        setError(res.error.message);
        return;
      }
      if (res.data) hydrate(res.data.profile);
    } catch (err: any) {
      console.error(err);
      setError("Failed to load your profile.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(false);

      const res = await updateMyAdminProfile({
        firstName: firstName.trim() || undefined,
        lastName: lastName.trim() || undefined,
        phone: phone.trim() || undefined,
        businessName: businessName.trim() || undefined,
      });

      if (res.error) {
        setError(res.error.message);
        return;
      }

      if (res.data) hydrate(res.data.profile);
      setIsEditing(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to save your profile.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-3">
        <Loader className="w-8 h-8 animate-spin text-blue-500" />
        <span>Loading your profile...</span>
      </div>
    );
  }

  const inputClass =
    "w-full bg-[#111318] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed";
  const labelClass =
    "text-[10px] font-bold text-gray-400 uppercase tracking-widest block";

  return (
    <div className="space-y-6 max-w-2xl">
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
          <div>Profile saved successfully.</div>
        </div>
      )}

      <div className="bg-[#1C1F2E] rounded-2xl border border-white/5 p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-lg">Profile Details</h3>
              <p className="text-xs text-gray-500">Your administrator account information</p>
            </div>
          </div>
          {!isEditing ? (
            <button
              onClick={() => {
                setSuccess(false);
                setError(null);
                setIsEditing(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              <Pencil className="w-4 h-4" /> Edit
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  loadData();
                  setIsEditing(false);
                  setError(null);
                }}
                disabled={saving}
                className="px-4 py-2 text-sm font-semibold text-gray-400 hover:text-white transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 text-white text-sm font-semibold rounded-xl transition-colors"
              >
                {saving && <Loader className="w-4 h-4 animate-spin" />}
                Save
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <label className={labelClass}>First Name</label>
            <input
              type="text"
              value={firstName}
              placeholder="Jane"
              disabled={!isEditing}
              onChange={(e) => setFirstName(e.target.value)}
              className={inputClass}
            />
          </div>
          <div className="space-y-1.5">
            <label className={labelClass}>Last Name</label>
            <input
              type="text"
              value={lastName}
              placeholder="Doe"
              disabled={!isEditing}
              onChange={(e) => setLastName(e.target.value)}
              className={inputClass}
            />
          </div>
          <div className="space-y-1.5">
            <label className={labelClass}>Phone</label>
            <input
              type="text"
              value={phone}
              placeholder="+2348012345678"
              disabled={!isEditing}
              onChange={(e) => setPhone(e.target.value)}
              className={inputClass}
            />
          </div>
          <div className="space-y-1.5">
            <label className={labelClass}>Business Name</label>
            <input
              type="text"
              value={businessName}
              placeholder="Company Ltd"
              disabled={!isEditing}
              onChange={(e) => setBusinessName(e.target.value)}
              className={inputClass}
            />
          </div>
          <div className="sm:col-span-2 space-y-1.5">
            <label className={labelClass}>Email (read-only)</label>
            <input type="email" value={email} disabled className={inputClass} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Settings Page ───────────────────────────────────────────
const TABS = [
  { key: "roles", label: "Roles & Permissions" },
  { key: "pillars", label: "Pillar Management" },
  { key: "personal", label: "Personal Information" },
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

      {activeTab === "personal" && (
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">Personal Information</h1>
          <p className="text-gray-400 text-sm">
            Your administrator profile. Keep your contact details up to date.
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
      {activeTab === "personal" && <PersonalInfoTab />}
    </div>
  );
}