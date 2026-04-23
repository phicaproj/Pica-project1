"use client";

import { useState, useRef, useEffect } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
type User = {
  id: number;
  name: string;
  email: string;
  plan: string;
  status: string;
  dateJoined: string;
};

// ─── Mock Users ───────────────────────────────────────────────────────────────
const ALL_USERS: User[] = [
  { id: 1, name: "John D",    email: "John@email.com",  plan: "Pro",  status: "Active",   dateJoined: "Jan 20" },
  { id: 2, name: "Mary A",    email: "Mary@email.com",  plan: "Free", status: "Inactive", dateJoined: "Feb 10" },
  { id: 3, name: "Ben Davis", email: "Ben@email.com",   plan: "Pro",  status: "Active",   dateJoined: "Mar 05" },
];

// ─── Nav ──────────────────────────────────────────────────────────────────────
const NAV_ITEMS = ["Home","Users","Reports","Subscription","Payments","Analytics","Notifications","Settings"];

// ─── Shared Layout ────────────────────────────────────────────────────────────
function AdminLayout({ children, activeNav, setActiveNav }: {
  children: React.ReactNode;
  activeNav: string;
  setActiveNav: (v: string) => void;
}) {
  return (
    <div className="min-h-screen bg-[#1a2235] text-white flex flex-col">
      <header className="flex items-center justify-between px-6 py-4">
        <span className="text-xl font-bold text-white tracking-tight">Beauvision</span>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#243044] text-gray-300 text-sm hover:bg-[#2d3a52] transition">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z"/></svg>
            Search
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#243044] text-gray-300 text-sm hover:bg-[#2d3a52] transition">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
            <span className="bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">2 New</span>
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#243044] text-gray-300 text-sm hover:bg-[#2d3a52] transition">
            <span className="w-6 h-6 rounded-full bg-teal-600 flex items-center justify-center text-white text-xs font-bold">P</span>
            B. Pica
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
          </button>
        </div>
      </header>

      <div className="flex flex-1">
        <aside className="w-72 flex-shrink-0 flex flex-col justify-between py-4 px-4">
          <nav className="bg-[#243044] rounded-2xl p-4 space-y-1">
            {NAV_ITEMS.map((item) => (
              <button key={item} onClick={() => setActiveNav(item)}
                className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition ${activeNav === item ? "text-orange-400 font-semibold" : "text-gray-300 hover:text-white hover:bg-white/5"}`}>
                {item}
              </button>
            ))}
          </nav>
          <div className="bg-[#243044] rounded-2xl p-4 space-y-1 mt-4">
            <button className="w-full text-left px-4 py-2.5 rounded-xl text-sm text-gray-300 hover:text-white hover:bg-white/5 transition">Delete Account</button>
            <button className="w-full text-left px-4 py-2.5 rounded-xl text-sm text-gray-300 hover:text-white hover:bg-white/5 transition">Log Out</button>
          </div>
        </aside>
        <main className="flex-1 p-6 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-[#243044] rounded-2xl p-4 flex items-center gap-4">
      <div className="w-12 h-12 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0">{icon}</div>
      <div>
        <p className="text-xs text-gray-400">{label}</p>
        <p className="text-xl font-bold text-white">{value}</p>
      </div>
    </div>
  );
}

// ─── Chart ────────────────────────────────────────────────────────────────────
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const DATA_POINTS = [120,200,150,80,300,400,420,0,0,0,0,0];

function LineChart({ hasData }: { hasData: boolean }) {
  const [mode, setMode] = useState<"Sticks"|"Graph">("Graph");
  const W=860,H=160,padL=40,padB=30,padT=10;
  const cW=W-padL-10,cH=H-padB-padT,maxVal=600;
  const yLines=[600,500,400,300,200,100];
  const xPos=(i:number)=>padL+(i/(MONTHS.length-1))*cW;
  const yPos=(v:number)=>padT+cH-(v/maxVal)*cH;
  const points=DATA_POINTS.map((v,i)=>`${xPos(i)},${yPos(v)}`).join(" ");
  const areaPoints=`${xPos(0)},${yPos(0)} ${points} ${xPos(MONTHS.length-1)},${yPos(0)}`;

  return (
    <div className="bg-[#243044] rounded-2xl p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-white">User Growth</h3>
        <div className="flex rounded-lg overflow-hidden border border-[#3a4a64] text-xs">
          {(["Sticks","Graph"] as const).map((m)=>(
            <button key={m} onClick={()=>setMode(m)} className={`px-3 py-1.5 font-medium transition ${mode===m?"bg-orange-500 text-white":"text-gray-400 hover:text-white"}`}>{m}</button>
          ))}
        </div>
      </div>
      {hasData ? (
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
          {yLines.map((v)=>(
            <g key={v}>
              <line x1={padL} y1={yPos(v)} x2={W-10} y2={yPos(v)} stroke="#2d3a52" strokeWidth={1}/>
              <text x={padL-6} y={yPos(v)+4} textAnchor="end" fill="#6b7280" fontSize={10}>{v}</text>
            </g>
          ))}
          <polygon points={areaPoints} fill="url(#og)" opacity={0.3}/>
          <polyline points={points} fill="none" stroke="#f97316" strokeWidth={2} strokeLinejoin="round"/>
          {DATA_POINTS.map((v,i)=>v>0&&<circle key={i} cx={xPos(i)} cy={yPos(v)} r={4} fill="#f97316"/>)}
          {MONTHS.map((m,i)=><text key={m} x={xPos(i)} y={H-8} textAnchor="middle" fill="#6b7280" fontSize={10}>{m}</text>)}
          <defs><linearGradient id="og" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#f97316" stopOpacity={0.6}/><stop offset="100%" stopColor="#f97316" stopOpacity={0}/></linearGradient></defs>
        </svg>
      ) : (
        <div className="relative">
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full opacity-30">
            {yLines.map((v)=>(
              <g key={v}>
                <line x1={padL} y1={yPos(v)} x2={W-10} y2={yPos(v)} stroke="#2d3a52" strokeWidth={1}/>
                <text x={padL-6} y={yPos(v)+4} textAnchor="end" fill="#6b7280" fontSize={10}>{v}</text>
              </g>
            ))}
            {MONTHS.map((m,i)=><text key={m} x={xPos(i)} y={H-8} textAnchor="middle" fill="#6b7280" fontSize={10}>{m}</text>)}
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-2xl font-bold text-white">No Activities</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Recent Activities ────────────────────────────────────────────────────────
const ACTIVITIES = [
  {user:"John D",    activity:"Completed Assessment", date:"Today"      },
  {user:"Mary A",   activity:"Purchased Plan",        date:"11-02-2026" },
  {user:"Ben Davis", activity:"Purchased Plan",       date:"Date"       },
];

function RecentActivities({ hasData }: { hasData: boolean }) {
  return (
    <div className="bg-[#243044] rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-white">Recent Activities</h3>
        <button className="flex items-center gap-1 text-sm text-gray-400 hover:text-white transition">
          See All
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/></svg>
        </button>
      </div>
      <div className="border-t border-[#3a4a64] pt-4">
        <div className="grid grid-cols-3 mb-3">
          {["Users","Activity","Date"].map((h)=><p key={h} className="text-sm font-bold text-white">{h}</p>)}
        </div>
        <div className="border-t border-[#3a4a64]"/>
        {hasData ? ACTIVITIES.map((row,i)=>(
          <div key={i} className={`grid grid-cols-3 py-3 ${i<ACTIVITIES.length-1?"border-b border-[#3a4a64]":""}`}>
            <p className={`text-sm ${i===ACTIVITIES.length-1?"font-bold text-white":"text-gray-300"}`}>{row.user}</p>
            <p className={`text-sm ${i===ACTIVITIES.length-1?"font-bold text-white":"text-gray-300"}`}>{row.activity}</p>
            <p className={`text-sm ${i===ACTIVITIES.length-1?"font-bold text-white":"text-gray-300"}`}>{row.date}</p>
          </div>
        )) : (
          <div className="flex items-center justify-center py-12">
            <p className="text-2xl font-bold text-white">No Activities</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Home Page ────────────────────────────────────────────────────────────────
function HomePage({ hasData }: { hasData: boolean }) {
  const stats = hasData
    ? [{label:"Total Users",value:"1,500"},{label:"Active Subscription",value:"340"},{label:"Pending Reports",value:"8"},{label:"Revenue Generated",value:"NGN1.5m"}]
    : [{label:"Total Users",value:"0"},{label:"Active Subscription",value:"0"},{label:"Pending Reports",value:"0"},{label:"Revenue Generated",value:"NGN 0"}];

  const icons = [
    <svg key="u" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>,
    <svg key="c" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 10l-2 9h18l-2-9-4 4-3-6-3 6-4-4z"/></svg>,
    <svg key="x" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M12 3a9 9 0 110 18A9 9 0 0112 3z"/></svg>,
    <svg key="w" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h.01M11 15h.01M3 6h18a1 1 0 011 1v10a1 1 0 01-1 1H3a1 1 0 01-1-1V7a1 1 0 011-1z"/></svg>,
  ];

  return (
    <div>
      <div className="grid grid-cols-4 gap-4 mb-4">
        {stats.map((s,i)=><StatCard key={s.label} icon={icons[i]} label={s.label} value={s.value}/>)}
      </div>
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard
          icon={<svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>}
          label="Assessments Comp."
          value={hasData?"780":"0"}
        />
      </div>
      <LineChart hasData={hasData}/>
      <RecentActivities hasData={hasData}/>
    </div>
  );
}

// ─── Users Page ───────────────────────────────────────────────────────────────
function UsersPage() {
  const [search, setSearch] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string|null>(null);
  const [openActionId, setOpenActionId] = useState<number|null>(null);
  const filterRef = useRef<HTMLDivElement>(null);
  const actionRef = useRef<HTMLDivElement>(null);

  const FILTER_OPTIONS = ["Active","Inactive","Subscribed","Free Users"];
  const ACTION_OPTIONS = ["View Profile","Suspend","Delete","Upgrade Plan"];

  // Close dropdowns on outside click
  useEffect(()=>{
    const handler=(e:MouseEvent)=>{
      if(filterRef.current && !filterRef.current.contains(e.target as Node)) setFilterOpen(false);
      if(actionRef.current && !actionRef.current.contains(e.target as Node)) setOpenActionId(null);
    };
    document.addEventListener("mousedown",handler);
    return ()=>document.removeEventListener("mousedown",handler);
  },[]);

  const filteredUsers = ALL_USERS.filter((u)=>{
    const matchSearch = search==="" || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchFilter = !activeFilter ||
      (activeFilter==="Active" && u.status==="Active") ||
      (activeFilter==="Inactive" && u.status==="Inactive") ||
      (activeFilter==="Subscribed" && u.plan!=="Free") ||
      (activeFilter==="Free Users" && u.plan==="Free");
    return matchSearch && matchFilter;
  });

  const hasData = filteredUsers.length > 0;

  return (
    <div>
      {/* Header row */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-orange-400">User Management</h2>
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#243044] border border-[#3a4a64] w-72">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z"/></svg>
            <input type="text" placeholder="Search" value={search} onChange={(e)=>setSearch(e.target.value)} className="bg-transparent text-sm text-white placeholder-gray-400 outline-none flex-1"/>
          </div>

          {/* Filter button + dropdown */}
          <div className="relative" ref={filterRef}>
            <button onClick={()=>setFilterOpen(!filterOpen)} className={`p-2.5 rounded-xl border transition ${filterOpen?"bg-orange-500 border-orange-500 text-white":"bg-[#243044] border-[#3a4a64] text-gray-400 hover:text-white"}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z"/></svg>
            </button>
            {filterOpen && (
              <div className="absolute right-0 top-full mt-2 bg-white rounded-xl shadow-xl py-2 w-40 z-50">
                {FILTER_OPTIONS.map((opt)=>(
                  <button key={opt} onClick={()=>{setActiveFilter(activeFilter===opt?null:opt);setFilterOpen(false);}}
                    className={`w-full text-left px-4 py-2.5 text-sm transition ${activeFilter===opt?"text-orange-500 font-semibold":"text-gray-700 hover:bg-gray-50"}`}>
                    {opt}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Active filter badge */}
      {activeFilter && (
        <div className="mb-4 flex items-center gap-2">
          <span className="text-xs text-gray-400">Filtered by:</span>
          <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-orange-500/20 text-orange-400 text-xs font-medium">
            {activeFilter}
            <button onClick={()=>setActiveFilter(null)} className="ml-1 hover:text-white">✕</button>
          </span>
        </div>
      )}

      {/* Table */}
      <div className="bg-[#243044] rounded-2xl overflow-hidden">
        {/* Table header */}
        <div className="grid grid-cols-6 px-6 py-4 border-b border-[#3a4a64]">
          {["Name","Email","Plan","Status","Date Joined","Action"].map((h)=>(
            <p key={h} className="text-sm font-medium text-gray-300">{h}</p>
          ))}
        </div>

        {hasData ? (
          <div className="divide-y divide-[#3a4a64]">
            {filteredUsers.map((user)=>(
              <div key={user.id} className="grid grid-cols-6 items-center px-6 py-4">
                <p className="text-sm text-white">{user.name}</p>
                <p className="text-sm text-gray-300">{user.email}</p>
                <p className="text-sm text-gray-300">{user.plan}</p>
                <p className="text-sm text-gray-300">{user.status}</p>
                <p className="text-sm text-gray-300">{user.dateJoined}</p>

                {/* Action dropdown */}
                <div className="relative" ref={openActionId===user.id?actionRef:undefined}>
                  <button
                    onClick={()=>setOpenActionId(openActionId===user.id?null:user.id)}
                    className="flex items-center gap-1 text-sm text-white hover:text-orange-400 transition"
                  >
                    View
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/></svg>
                  </button>
                  {openActionId===user.id && (
                    <div className="absolute right-0 top-full mt-2 bg-white rounded-xl shadow-xl py-2 w-40 z-50">
                      {ACTION_OPTIONS.map((opt)=>(
                        <button key={opt} onClick={()=>setOpenActionId(null)}
                          className={`w-full text-left px-4 py-2.5 text-sm transition ${opt==="Delete"?"text-red-500 hover:bg-red-50":opt==="Suspend"?"text-yellow-600 hover:bg-yellow-50":"text-gray-700 hover:bg-gray-50"}`}>
                          {opt}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Empty state */
          <div className="relative" style={{minHeight:"400px"}}>
            <div
  className="absolute inset-0 bg-cover bg-center bg-no-repeat"
  style={{ backgroundImage: "url('./images/dashboard img.png')" }}
/>
            {/* Replace with your background image */}
            <div className="relative z-10 flex items-center justify-center h-full py-32">
              <p className="text-2xl font-bold text-white">No Activities</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [activeNav, setActiveNav] = useState("Home");
  const [hasData] = useState(true); // false = empty state

  const renderContent = () => {
    switch(activeNav){
      case "Home":  return <HomePage hasData={hasData}/>;
      case "Users": return <UsersPage/>;
      default:
        return (
          <div className="flex items-center justify-center h-64">
            <p className="text-gray-400 text-lg">{activeNav} — Coming Soon</p>
          </div>
        );
    }
  };

  return (
    <AdminLayout activeNav={activeNav} setActiveNav={setActiveNav}>
      {renderContent()}
    </AdminLayout>
  );
}