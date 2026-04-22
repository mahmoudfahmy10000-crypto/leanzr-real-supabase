
import React, { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import {
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  Building2,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Cloud,
  Database,
  Download,
  Factory,
  FileBarChart,
  FileText,
  Gauge,
  GitBranch,
  Hammer,
  HardDrive,
  Home,
  KanbanSquare,
  Layers3,
  LayoutDashboard,
  LineChart,
  Lock,
  PieChart,
  Plus,
  RefreshCcw,
  Rocket,
  Search,
  Settings2,
  ShieldCheck,
  Target,
  TimerReset,
  UserPlus,
  Users,
  Wand2,
  Workflow,
  Wrench,
} from "lucide-react";
import { hasSupabaseEnv } from "./lib/supabaseClient";
import {
  createProject,
  getCurrentUserProfile,
  getSession,
  listProjectOutputs,
  listProjects,
  signInWithEmail,
  signOut,
  signUpWithEmail,
  addProjectOutput,
} from "./lib/api";

const SECTIONS = [
  { key: "overview", label: "Overview", icon: Home },
  { key: "tools", label: "Tool Library", icon: Hammer },
  { key: "projects", label: "Projects", icon: KanbanSquare },
  { key: "reports", label: "Reports", icon: FileBarChart },
  { key: "production", label: "Production", icon: Factory },
  { key: "quality", label: "Quality", icon: ShieldCheck },
  { key: "maintenance", label: "Maintenance", icon: Wrench },
  { key: "planning", label: "Planning", icon: HardDrive },
  { key: "ehs", label: "EHS", icon: Cloud },
  { key: "engops", label: "Engineering Ops", icon: Building2 },
  { key: "lss", label: "Lean Six Sigma", icon: GitBranch },
  { key: "settings", label: "Settings", icon: Settings2 },
];

const TOOL_LIBRARY = [
  { key: "oee", name: "OEE Studio", category: "Production", icon: Gauge, description: "Track availability, performance, quality, and OEE losses." },
  { key: "downtime", name: "Downtime Tracker", category: "Production", icon: BarChart3, description: "Capture downtime events and rank the biggest losses." },
  { key: "pareto", name: "Pareto Analytics", category: "Quality", icon: PieChart, description: "Prioritize the top quality and defect drivers fast." },
  { key: "controlplan", name: "Control Plan Builder", category: "Quality", icon: ClipboardList, description: "Build CTQ controls, reaction plans, and checkpoints." },
  { key: "fmea", name: "FMEA Workspace", category: "Quality", icon: ShieldCheck, description: "Rank risks and mitigation actions with owner follow-up." },
  { key: "pm", name: "PM Scheduler", category: "Maintenance", icon: RefreshCcw, description: "Preventive maintenance scheduling and overdue risk view." },
  { key: "mtbf", name: "MTBF / MTTR Center", category: "Maintenance", icon: LineChart, description: "Reliability and repair metrics for critical assets." },
  { key: "inventory", name: "WIP & Inventory Monitor", category: "Planning", icon: HardDrive, description: "Watch WIP, shortages, supermarkets, and excess stock." },
  { key: "shortage", name: "Material Shortage Board", category: "Planning", icon: AlertTriangle, description: "See order risk and recovery ownership for missing parts." },
  { key: "doccontrol", name: "Document Control Center", category: "Engineering Ops", icon: FileText, description: "Manage work instructions, revisions, and approvals." },
  { key: "change", name: "ECR / ECO Manager", category: "Engineering Ops", icon: GitBranch, description: "Track engineering changes and affected items." },
  { key: "incident", name: "EHS Incident Manager", category: "EHS", icon: Lock, description: "Log incidents, actions, and closure evidence." },
  { key: "dmaic", name: "DMAIC Project Hub", category: "Lean Six Sigma", icon: Wand2, description: "Run Define, Measure, Analyze, Improve, Control projects." },
  { key: "sipoc", name: "SIPOC Builder", category: "Lean Six Sigma", icon: Workflow, description: "Frame process scope with suppliers, inputs, outputs, customers." },
  { key: "ctq", name: "CTQ Tree Builder", category: "Lean Six Sigma", icon: Target, description: "Translate VOC into measurable CTQs." },
  { key: "pilot", name: "Pilot Run Tracker", category: "Lean Six Sigma", icon: Rocket, description: "Validate changes before full rollout and handover." },
];

const DEPARTMENT_CENTERS = {
  production: {
    title: "Production Center",
    tools: ["oee", "downtime"],
    actions: ["Review plan vs actual", "Escalate top losses", "Prepare shift handover"],
  },
  quality: {
    title: "Quality Center",
    tools: ["pareto", "controlplan", "fmea"],
    actions: ["Prioritize top defects", "Close overdue CAPAs", "Prepare customer pack"],
  },
  maintenance: {
    title: "Maintenance Center",
    tools: ["pm", "mtbf"],
    actions: ["Close overdue PM", "Protect critical spares", "Review chronic failures"],
  },
  planning: {
    title: "Planning Center",
    tools: ["inventory", "shortage"],
    actions: ["Escalate high-risk shortages", "Protect priority orders", "Review supermarket coverage"],
  },
  ehs: {
    title: "EHS Center",
    tools: ["incident"],
    actions: ["Close critical EHS actions", "Review near-miss patterns", "Verify permit validity"],
  },
  engops: {
    title: "Engineering Ops Center",
    tools: ["doccontrol", "change"],
    actions: ["Release pending revisions", "Approve critical changes", "Validate release readiness"],
  },
};

const LSS_PHASE_TOOLS = {
  Define: ["dmaic", "sipoc", "ctq"],
  Measure: ["oee", "pareto"],
  Analyze: ["pareto", "fmea"],
  Improve: ["pilot", "controlplan"],
  Control: ["controlplan", "doccontrol"],
};

function cn(...parts) {
  return parts.filter(Boolean).join(" ");
}

function Card({ children, style }) {
  return <div className="card" style={style}>{children}</div>;
}

function StatCard({ title, value, note, icon: Icon }) {
  return (
    <div className="kpi">
      <div className="between">
        <div className="muted">{title}</div>
        <Icon size={18} />
      </div>
      <div className="kpi-value" style={{ marginTop: 10 }}>{value}</div>
      <div className="subtitle" style={{ marginTop: 8 }}>{note}</div>
    </div>
  );
}

function Badge({ children, color = "cyan" }) {
  return <span className={`badge ${color}`}>{children}</span>;
}

function SetupBlock() {
  return (
    <div className="app-shell">
      <div className="card" style={{ maxWidth: 860, margin: "40px auto" }}>
        <div className="title">Leanzr needs Supabase setup</div>
        <p className="subtitle" style={{ marginTop: 12 }}>
          This version is a real backend-connected site. Add your Supabase keys, run the SQL schema, then restart the app.
        </p>
        <div className="notice" style={{ marginTop: 18 }}>
          <div><strong>Required:</strong></div>
          <div>1. Copy <code>.env.example</code> to <code>.env</code></div>
          <div>2. Fill <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code></div>
          <div>3. Run <code>supabase/schema.sql</code> in Supabase SQL Editor</div>
          <div>4. Restart with <code>npm run dev</code></div>
        </div>
      </div>
    </div>
  );
}

function AuthView({ onSignedIn }) {
  const [mode, setMode] = useState("signin");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("Admin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    try {
      if (mode === "signup") {
        await signUpWithEmail({ email, password, fullName, role });
        setMsg("Account created. Check email confirmation if enabled, then sign in.");
        setMode("signin");
      } else {
        await signInWithEmail({ email, password });
        onSignedIn();
      }
    } catch (err) {
      setMsg(err.message || "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="app-shell">
      <div className="card" style={{ maxWidth: 520, margin: "40px auto" }}>
        <div className="between">
          <div>
            <div className="title">{mode === "signin" ? "Sign in" : "Create account"}</div>
            <div className="subtitle" style={{ marginTop: 8 }}>Real auth and real project storage through Supabase.</div>
          </div>
          <Badge color="green">Backend live</Badge>
        </div>

        <form onSubmit={handleSubmit} style={{ marginTop: 22, display: "grid", gap: 14 }}>
          {mode === "signup" && (
            <>
              <div>
                <div className="label">Full name</div>
                <input className="input" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
              </div>
              <div>
                <div className="label">Role</div>
                <select className="select" value={role} onChange={(e) => setRole(e.target.value)}>
                  {["Admin","Quality Engineer","Production Engineer","Maintenance Engineer","Manager","Customer"].map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          <div>
            <div className="label">Email</div>
            <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>

          <div>
            <div className="label">Password</div>
            <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>

          {msg ? <div className="notice">{msg}</div> : null}

          <div className="row">
            <button className="btn" disabled={busy}>{busy ? "Please wait..." : mode === "signin" ? "Sign in" : "Create account"}</button>
            <button
              type="button"
              className="btn secondary"
              onClick={() => {
                setMode(mode === "signin" ? "signup" : "signin");
                setMsg("");
              }}
            >
              {mode === "signin" ? "Create new account" : "Back to sign in"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Sidebar({ section, setSection, profile, onSignOut }) {
  return (
    <div className="sidebar">
      <Card>
        <div className="between">
          <div>
            <div style={{ fontWeight: 800, fontSize: 24 }}>Leanzr</div>
            <div className="subtitle">Real backend version</div>
          </div>
          <Badge color="green">Live</Badge>
        </div>
        <div style={{ marginTop: 16 }} className="card-tight">
          <div style={{ fontWeight: 700 }}>{profile?.full_name || profile?.email}</div>
          <div className="subtitle" style={{ marginTop: 4 }}>{profile?.role || "User"}</div>
        </div>
        <div style={{ marginTop: 14, display: "grid", gap: 8 }}>
          {SECTIONS.map((item) => {
            const Icon = item.icon;
            return (
              <button key={item.key} className={cn("nav-btn", section === item.key && "active")} onClick={() => setSection(item.key)}>
                <Icon size={16} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
        <button className="btn secondary" style={{ width: "100%", marginTop: 16 }} onClick={onSignOut}>Sign out</button>
      </Card>
    </div>
  );
}

function Overview({ projects }) {
  return (
    <div style={{ display: "grid", gap: 20 }}>
      <div className="grid-4">
        <StatCard title="Projects" value={projects.length} note="saved in database" icon={KanbanSquare} />
        <StatCard title="Active" value={projects.filter((p) => p.status !== "Closed").length} note="in progress and open" icon={CheckCircle2} />
        <StatCard title="High priority" value={projects.filter((p) => p.priority === "High").length} note="needs attention" icon={AlertTriangle} />
        <StatCard title="Backend" value="Supabase" note="auth + database" icon={Database} />
      </div>

      <Card>
        <div className="title" style={{ fontSize: 28 }}>Real website status</div>
        <div className="subtitle" style={{ marginTop: 8 }}>
          This version uses real authentication and real project storage. Refreshing the page keeps your data because it is saved in the database.
        </div>
      </Card>
    </div>
  );
}

function ToolLibrary() {
  const [query, setQuery] = useState("");
  const tools = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q
      ? TOOL_LIBRARY.filter((t) => `${t.name} ${t.category} ${t.description}`.toLowerCase().includes(q))
      : TOOL_LIBRARY;
  }, [query]);

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <div className="between">
        <div>
          <div className="title">Tool Library</div>
          <div className="subtitle" style={{ marginTop: 8 }}>Real project backend with a practical factory tool catalog.</div>
        </div>
        <div style={{ width: 320, maxWidth: "100%" }}>
          <input className="input" placeholder="Search tools..." value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
      </div>

      <div className="grid-auto">
        {tools.map((tool) => {
          const Icon = tool.icon;
          return (
            <Card key={tool.key}>
              <div className="between">
                <Badge>{tool.category}</Badge>
                <Icon size={18} />
              </div>
              <div style={{ marginTop: 14, fontWeight: 800, fontSize: 20 }}>{tool.name}</div>
              <div className="subtitle" style={{ marginTop: 8 }}>{tool.description}</div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function WizardModal({ onClose, onCreate }) {
  const [projectType, setProjectType] = useState("Quality");
  const [phase, setPhase] = useState("Define");
  const [pain, setPain] = useState("High defects and repeated complaints");
  const [objective, setObjective] = useState("Reduce defects and stabilize the process");
  const [saving, setSaving] = useState("TBD");
  const linkedTools = (LSS_PHASE_TOOLS[phase] || []).map(
    (key) => TOOL_LIBRARY.find((tool) => tool.key === key)?.name
  ).filter(Boolean);

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,.55)", backdropFilter: "blur(6px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16, zIndex: 50
    }}>
      <div className="card" style={{ maxWidth: 900, width: "100%" }}>
        <div className="between">
          <div>
            <div className="title" style={{ fontSize: 28 }}>DMAIC Project Wizard</div>
            <div className="subtitle" style={{ marginTop: 8 }}>Create a real project and save it to the database.</div>
          </div>
          <button className="btn secondary" onClick={onClose}>Close</button>
        </div>

        <div className="grid-2" style={{ marginTop: 20 }}>
          <div style={{ display: "grid", gap: 14 }}>
            <div>
              <div className="label">Project type</div>
              <select className="select" value={projectType} onChange={(e) => setProjectType(e.target.value)}>
                {["Quality","Productivity","Maintenance","Cost","Flow"].map((v) => <option key={v}>{v}</option>)}
              </select>
            </div>
            <div>
              <div className="label">DMAIC phase</div>
              <select className="select" value={phase} onChange={(e) => setPhase(e.target.value)}>
                {["Define","Measure","Analyze","Improve","Control"].map((v) => <option key={v}>{v}</option>)}
              </select>
            </div>
            <div>
              <div className="label">Pain statement</div>
              <textarea className="textarea" rows={4} value={pain} onChange={(e) => setPain(e.target.value)} />
            </div>
            <div>
              <div className="label">Goal</div>
              <textarea className="textarea" rows={4} value={objective} onChange={(e) => setObjective(e.target.value)} />
            </div>
            <div>
              <div className="label">Estimated savings</div>
              <input className="input" value={saving} onChange={(e) => setSaving(e.target.value)} />
            </div>
          </div>

          <div style={{ display: "grid", gap: 14 }}>
            <Card>
              <div style={{ fontWeight: 800 }}>Recommended linked tools</div>
              <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
                {linkedTools.map((tool) => <div key={tool} className="card-tight">{tool}</div>)}
              </div>
            </Card>

            <Card>
              <div style={{ fontWeight: 800 }}>Create project now</div>
              <div className="subtitle" style={{ marginTop: 8 }}>
                This creates a real row in the backend database under your account.
              </div>
              <button
                className="btn"
                style={{ marginTop: 14 }}
                onClick={() => onCreate({
                  name: `${projectType} - ${phase}`,
                  projectType,
                  phase,
                  pain,
                  objective,
                  savings: saving,
                  priority: phase === "Improve" ? "High" : "Medium",
                  linkedTools,
                  status: "New",
                })}
              >
                Create project
              </button>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProjectsView({ projects, onOpenProject, onOpenWizard, onExport }) {
  return (
    <div style={{ display: "grid", gap: 20 }}>
      <div className="between">
        <div>
          <div className="title">Projects</div>
          <div className="subtitle" style={{ marginTop: 8 }}>Real projects saved in the database.</div>
        </div>
        <div className="row">
          <button className="btn secondary" onClick={onExport}><Download size={16} />&nbsp;Export Excel</button>
          <button className="btn" onClick={onOpenWizard}><Plus size={16} />&nbsp;New project</button>
        </div>
      </div>

      {!projects.length ? (
        <Card><div className="empty">No projects yet. Create one from the wizard.</div></Card>
      ) : (
        <div className="grid-auto">
          {projects.map((project) => (
            <Card key={project.id}>
              <div className="between">
                <Badge color={project.priority === "High" ? "amber" : "cyan"}>{project.priority}</Badge>
                <Badge color="green">{project.status}</Badge>
              </div>
              <div style={{ marginTop: 14, fontWeight: 800, fontSize: 20 }}>{project.name}</div>
              <div className="subtitle" style={{ marginTop: 8 }}>{project.objective || "No objective yet."}</div>
              <div className="subtitle" style={{ marginTop: 8 }}>Phase: {project.phase} • Type: {project.project_type}</div>
              <button className="btn secondary" style={{ marginTop: 14 }} onClick={() => onOpenProject(project)}>
                Open project
              </button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function ProjectDetail({ project, outputs, onBack, onAddOutput }) {
  const [tab, setTab] = useState("Summary");
  const [title, setTitle] = useState("");
  const [toolName, setToolName] = useState("");
  const [outputType, setOutputType] = useState("Analysis");
  const [content, setContent] = useState("");

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <button className="btn secondary" style={{ width: 180 }} onClick={onBack}><ArrowLeft size={16} />&nbsp;Back to projects</button>

      <Card>
        <div className="between">
          <div>
            <div className="title">{project.name}</div>
            <div className="subtitle" style={{ marginTop: 8 }}>
              Type: {project.project_type} • Phase: {project.phase} • Status: {project.status}
            </div>
          </div>
          <div className="row">
            <Badge color="amber">{project.priority}</Badge>
            <Badge color="green">{project.estimated_savings || "TBD"}</Badge>
          </div>
        </div>

        <div className="tabs" style={{ marginTop: 18 }}>
          {["Summary","Outputs","Reports"].map((item) => (
            <button key={item} className={cn("tab", tab === item && "active")} onClick={() => setTab(item)}>{item}</button>
          ))}
        </div>
      </Card>

      {tab === "Summary" && (
        <div className="grid-2">
          <Card>
            <div style={{ fontWeight: 800, fontSize: 20 }}>Goal</div>
            <div className="subtitle" style={{ marginTop: 12 }}>{project.objective || "No goal yet."}</div>

            <div style={{ fontWeight: 800, fontSize: 20, marginTop: 24 }}>Pain statement</div>
            <div className="subtitle" style={{ marginTop: 12 }}>{project.pain_statement || "No pain statement yet."}</div>
          </Card>

          <Card>
            <div style={{ fontWeight: 800, fontSize: 20 }}>Linked tools</div>
            <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
              {(project.linked_tools || []).length ? (project.linked_tools || []).map((tool) => (
                <div className="card-tight" key={tool}>{tool}</div>
              )) : <div className="empty">No linked tools yet.</div>}
            </div>
          </Card>
        </div>
      )}

      {tab === "Outputs" && (
        <div className="grid-2">
          <Card>
            <div style={{ fontWeight: 800, fontSize: 20 }}>Saved outputs</div>
            <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
              {outputs.length ? outputs.map((output) => (
                <div className="card-tight" key={output.id}>
                  <div className="between">
                    <strong>{output.title}</strong>
                    <Badge color={output.status === "Saved" ? "green" : "cyan"}>{output.status}</Badge>
                  </div>
                  <div className="subtitle" style={{ marginTop: 8 }}>{output.output_type} • {output.tool_name || "General"}</div>
                  {output.content ? <div className="subtitle" style={{ marginTop: 8 }}>{output.content}</div> : null}
                </div>
              )) : <div className="empty">No outputs yet.</div>}
            </div>
          </Card>

          <Card>
            <div style={{ fontWeight: 800, fontSize: 20 }}>Add output</div>
            <div style={{ marginTop: 12, display: "grid", gap: 12 }}>
              <div>
                <div className="label">Title</div>
                <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div>
                <div className="label">Tool</div>
                <input className="input" value={toolName} onChange={(e) => setToolName(e.target.value)} />
              </div>
              <div>
                <div className="label">Output type</div>
                <select className="select" value={outputType} onChange={(e) => setOutputType(e.target.value)}>
                  {["Baseline","Analysis","Root Cause","Action","Control","Report"].map((v) => <option key={v}>{v}</option>)}
                </select>
              </div>
              <div>
                <div className="label">Content</div>
                <textarea className="textarea" rows={5} value={content} onChange={(e) => setContent(e.target.value)} />
              </div>
              <button
                className="btn"
                onClick={() => {
                  if (!title.trim()) return;
                  onAddOutput({
                    title: title.trim(),
                    toolName: toolName.trim(),
                    outputType,
                    content: content.trim(),
                    status: "Saved",
                  });
                  setTitle("");
                  setToolName("");
                  setOutputType("Analysis");
                  setContent("");
                }}
              >
                Save output
              </button>
            </div>
          </Card>
        </div>
      )}

      {tab === "Reports" && (
        <Card>
          <div style={{ fontWeight: 800, fontSize: 20 }}>Reports</div>
          <div className="subtitle" style={{ marginTop: 12 }}>
            Use the Projects page export to download your real backend project list as Excel. This project page already shows real linked outputs from the database.
          </div>
        </Card>
      )}
    </div>
  );
}

function DepartmentCenter({ centerKey }) {
  const center = DEPARTMENT_CENTERS[centerKey];
  if (!center) return null;
  return (
    <div style={{ display: "grid", gap: 20 }}>
      <div className="title">{center.title}</div>
      <div className="grid-2">
        <Card>
          <div style={{ fontWeight: 800, fontSize: 20 }}>Department tools</div>
          <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
            {center.tools.map((key) => {
              const tool = TOOL_LIBRARY.find((t) => t.key === key);
              return <div className="card-tight" key={key}>{tool?.name || key}</div>;
            })}
          </div>
        </Card>
        <Card>
          <div style={{ fontWeight: 800, fontSize: 20 }}>Priority actions</div>
          <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
            {center.actions.map((item) => <div className="card-tight" key={item}>{item}</div>)}
          </div>
        </Card>
      </div>
    </div>
  );
}

function ReportsView({ projects }) {
  function exportExcel() {
    const rows = projects.map((project) => ({
      Project: project.name,
      Type: project.project_type,
      Phase: project.phase,
      Status: project.status,
      Priority: project.priority,
      Objective: project.objective,
      Savings: project.estimated_savings,
      CreatedAt: project.created_at,
    }));
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows.length ? rows : [{ Note: "No projects yet" }]);
    XLSX.utils.book_append_sheet(wb, ws, "Projects");
    XLSX.writeFile(wb, "leanzr-projects.xlsx");
  }

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <div className="between">
        <div>
          <div className="title">Reports</div>
          <div className="subtitle" style={{ marginTop: 8 }}>Export real data from your backend projects.</div>
        </div>
        <button className="btn" onClick={exportExcel}><Download size={16} />&nbsp;Download Excel</button>
      </div>

      <Card>
        <table className="table">
          <thead>
            <tr>
              <th>Project</th>
              <th>Phase</th>
              <th>Status</th>
              <th>Priority</th>
              <th>Savings</th>
            </tr>
          </thead>
          <tbody>
            {projects.length ? projects.map((project) => (
              <tr key={project.id}>
                <td>{project.name}</td>
                <td>{project.phase}</td>
                <td>{project.status}</td>
                <td>{project.priority}</td>
                <td>{project.estimated_savings || "TBD"}</td>
              </tr>
            )) : (
              <tr><td colSpan="5" className="empty">No projects yet.</td></tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function SettingsView({ profile }) {
  return (
    <div className="grid-2">
      <Card>
        <div className="title" style={{ fontSize: 28 }}>Settings</div>
        <div className="subtitle" style={{ marginTop: 12 }}>
          This version is real backend mode. Update profile and role logic directly in Supabase if needed.
        </div>
      </Card>
      <Card>
        <div style={{ fontWeight: 800, fontSize: 20 }}>Current profile</div>
        <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
          <div className="card-tight">Name: {profile?.full_name}</div>
          <div className="card-tight">Email: {profile?.email}</div>
          <div className="card-tight">Role: {profile?.role}</div>
        </div>
      </Card>
    </div>
  );
}

export default function App() {
  const [ready, setReady] = useState(false);
  const [section, setSection] = useState("overview");
  const [profile, setProfile] = useState(null);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedOutputs, setSelectedOutputs] = useState([]);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [error, setError] = useState("");

  const backendReady = hasSupabaseEnv();

  async function refreshAuthAndData() {
    try {
      setError("");
      const session = await getSession();
      if (!session) {
        setProfile(null);
        setProjects([]);
        setSelectedProject(null);
        setSelectedOutputs([]);
        return;
      }
      const currentProfile = await getCurrentUserProfile();
      const currentProjects = await listProjects();
      setProfile(currentProfile);
      setProjects(currentProjects);
    } catch (err) {
      setError(err.message || "Failed to load backend data.");
    } finally {
      setReady(true);
    }
  }

  useEffect(() => {
    if (!backendReady) {
      setReady(true);
      return;
    }
    refreshAuthAndData();
  }, [backendReady]);

  async function handleCreateProject(payload) {
    try {
      const created = await createProject(payload);
      setWizardOpen(false);
      await refreshAuthAndData();
      setSelectedProject(created);
      const outputs = [];
      for (const tool of payload.linkedTools.slice(0, 2)) {
        const createdOutput = await addProjectOutput(created.id, {
          title: `${tool} starter output`,
          toolName: tool,
          outputType: "Baseline",
          content: `Auto-created starter output for ${tool}.`,
          status: "Saved",
        });
        outputs.push(createdOutput);
      }
      setSelectedProject(created);
      setSelectedOutputs(outputs);
      setSection("projects");
    } catch (err) {
      setError(err.message || "Failed to create project.");
    }
  }

  async function openProject(project) {
    setSelectedProject(project);
    setSection("projects");
    try {
      const outputs = await listProjectOutputs(project.id);
      setSelectedOutputs(outputs);
    } catch (err) {
      setError(err.message || "Failed to load project outputs.");
    }
  }

  async function handleAddOutput(output) {
    if (!selectedProject) return;
    try {
      const created = await addProjectOutput(selectedProject.id, output);
      setSelectedOutputs((prev) => [created, ...prev]);
    } catch (err) {
      setError(err.message || "Failed to save output.");
    }
  }

  async function handleSignOut() {
    try {
      await signOut();
      await refreshAuthAndData();
      setSection("overview");
    } catch (err) {
      setError(err.message || "Failed to sign out.");
    }
  }

  function renderContent() {
    if (selectedProject) {
      return (
        <ProjectDetail
          project={selectedProject}
          outputs={selectedOutputs}
          onBack={() => setSelectedProject(null)}
          onAddOutput={handleAddOutput}
        />
      );
    }

    switch (section) {
      case "overview":
        return <Overview projects={projects} />;
      case "tools":
        return <ToolLibrary />;
      case "projects":
        return (
          <ProjectsView
            projects={projects}
            onOpenProject={openProject}
            onOpenWizard={() => setWizardOpen(true)}
            onExport={() => setSection("reports")}
          />
        );
      case "reports":
        return <ReportsView projects={projects} />;
      case "production":
      case "quality":
      case "maintenance":
      case "planning":
      case "ehs":
      case "engops":
        return <DepartmentCenter centerKey={section} />;
      case "lss":
        return (
          <div style={{ display: "grid", gap: 20 }}>
            <Card>
              <div className="between">
                <div>
                  <div className="title">Lean Six Sigma Center</div>
                  <div className="subtitle" style={{ marginTop: 8 }}>Use the wizard to create real DMAIC projects in the backend.</div>
                </div>
                <button className="btn" onClick={() => setWizardOpen(true)}>Start wizard</button>
              </div>
            </Card>
            <div className="grid-auto">
              {["Define","Measure","Analyze","Improve","Control"].map((phase) => (
                <Card key={phase}>
                  <div style={{ fontWeight: 800, fontSize: 20 }}>{phase}</div>
                  <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
                    {(LSS_PHASE_TOOLS[phase] || []).map((key) => {
                      const tool = TOOL_LIBRARY.find((t) => t.key === key);
                      return <div className="card-tight" key={key}>{tool?.name || key}</div>;
                    })}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        );
      case "settings":
        return <SettingsView profile={profile} />;
      default:
        return <Overview projects={projects} />;
    }
  }

  if (!backendReady) return <SetupBlock />;
  if (!ready) return <div className="app-shell"><Card>Loading backend…</Card></div>;
  if (!profile) return <AuthView onSignedIn={refreshAuthAndData} />;

  return (
    <div className="app-shell">
      {wizardOpen ? <WizardModal onClose={() => setWizardOpen(false)} onCreate={handleCreateProject} /> : null}

      <div className="layout">
        <Sidebar section={section} setSection={setSection} profile={profile} onSignOut={handleSignOut} />
        <div style={{ display: "grid", gap: 20 }}>
          {error ? <div className="notice">{error}</div> : null}
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
